#!/usr/bin/env bash
# deploy.sh — 本地构建 + 远程原子替换部署脚本
# 作者: mkx
# 日期: 2026-03-12
#
# 用法:
#   ./deploy.sh                    # 使用默认配置部署
#   ./deploy.sh user@host:port     # 指定目标服务器
#   ./deploy.sh --skip-build       # 跳过构建，仅部署已有镜像

set -euo pipefail

# ============================================================
# 加载 .env 配置
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck source=.env
    source "$ENV_FILE"
    set +a
fi

# ============================================================
# 配置区（从 .env 读取，未设置则使用默认值）
# ============================================================
DEFAULT_SERVER="${DEPLOY_SERVER:-root@216.40.86.130}"
DEFAULT_PORT="${DEPLOY_PORT:-22}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/root/workspace/new-api}"
IMAGE_NAME="${DEPLOY_IMAGE_NAME:-new-api}"
IMAGE_TAG="${DEPLOY_IMAGE_TAG:-local}"
RUNTIME_IMAGE="${DEPLOY_RUNTIME_IMAGE:-calciumion/new-api:latest}"
PLATFORM="${DEPLOY_PLATFORM:-linux/amd64}"
CONTAINER_NAME="${DEPLOY_CONTAINER:-new-api}"
REMOTE_PORT="${DEPLOY_REMOTE_PORT:-3000}"
TMP_FILE="/tmp/${IMAGE_NAME}-${IMAGE_TAG}.tar.gz"

# ============================================================
# 颜色输出
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ============================================================
# 参数解析
# ============================================================
SKIP_BUILD=false
SERVER="$DEFAULT_SERVER"
PORT="$DEFAULT_PORT"

for arg in "$@"; do
    case "$arg" in
        --skip-build) SKIP_BUILD=true ;;
        --help|-h)
            echo "用法: $0 [--skip-build] [user@host[:port]]"
            echo ""
            echo "选项:"
            echo "  --skip-build    跳过本地构建，直接部署已有镜像"
            echo "  user@host:port  指定目标服务器（默认: ${DEFAULT_SERVER}:${DEFAULT_PORT}）"
            exit 0
            ;;
        *@*)
            if [[ "$arg" == *:* ]]; then
                SERVER="${arg%%:*}"
                PORT="${arg##*:}"
            else
                SERVER="$arg"
            fi
            ;;
    esac
done

SSH_CMD="ssh -p $PORT $SERVER"
SCP_CMD="scp -P $PORT"

log "目标服务器: ${SERVER}:${PORT}"
log "远程目录:   ${REMOTE_DIR}"

# ============================================================
# 阶段1: 本地构建
# ============================================================
if [ "$SKIP_BUILD" = false ]; then
    log "开始构建 Docker 镜像 (${PLATFORM})..."

    cd "$SCRIPT_DIR"

    # 检查 VERSION 文件
    if [ ! -s "$SCRIPT_DIR/VERSION" ]; then
        warn "VERSION 文件为空或不存在，使用 git 描述生成版本号"
        git describe --tags --always --dirty 2>/dev/null > "$SCRIPT_DIR/VERSION" \
            || echo "unknown" > "$SCRIPT_DIR/VERSION"
        log "版本号: $(cat "$SCRIPT_DIR/VERSION")"
    fi

    BUILD_START=$(date +%s)
    docker buildx build \
        --platform "$PLATFORM" \
        -t "${IMAGE_NAME}:${IMAGE_TAG}" \
        --load \
        -f Dockerfile . \
        || die "Docker 镜像构建失败"
    BUILD_END=$(date +%s)
    ok "镜像构建完成 (耗时 $((BUILD_END - BUILD_START))s)"
else
    # 验证本地镜像存在
    docker image inspect "${IMAGE_NAME}:${IMAGE_TAG}" > /dev/null 2>&1 \
        || die "本地镜像 ${IMAGE_NAME}:${IMAGE_TAG} 不存在，请先构建"
    ok "跳过构建，使用已有镜像"
fi

# ============================================================
# 阶段2: 导出 & 传输
# ============================================================
log "导出镜像到 ${TMP_FILE}..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "$TMP_FILE" \
    || die "镜像导出失败"
IMAGE_SIZE=$(du -h "$TMP_FILE" | cut -f1)
ok "镜像导出完成 (${IMAGE_SIZE})"

log "传输镜像到服务器..."
TRANSFER_START=$(date +%s)
$SCP_CMD "$TMP_FILE" "${SERVER}:${TMP_FILE}" \
    || die "镜像传输失败"
TRANSFER_END=$(date +%s)
ok "传输完成 (耗时 $((TRANSFER_END - TRANSFER_START))s)"

# 清理本地临时文件
rm -f "$TMP_FILE"

# ============================================================
# 阶段3: 远程原子替换
# ============================================================
log "执行远程原子替换..."

$SSH_CMD bash -s -- "$IMAGE_NAME" "$IMAGE_TAG" "$RUNTIME_IMAGE" "$REMOTE_DIR" "$CONTAINER_NAME" <<'REMOTE_SCRIPT' \
    || die "远程部署脚本执行失败"
set -euo pipefail

IMAGE_NAME="$1"
IMAGE_TAG="$2"
RUNTIME_IMAGE="$3"
REMOTE_DIR="$4"
CONTAINER_NAME="$5"
TMP_FILE="/tmp/${IMAGE_NAME}-${IMAGE_TAG}.tar.gz"

echo "[1/4] 加载新镜像..."
docker load < "$TMP_FILE" || { echo "镜像加载失败"; exit 1; }

echo "[2/4] 同步 compose 使用的镜像标签..."
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "$RUNTIME_IMAGE" || { echo "镜像重标记失败"; exit 1; }

echo "[3/4] 重建服务容器..."
cd "$REMOTE_DIR"
docker compose up -d --force-recreate --no-deps "$CONTAINER_NAME" || { echo "容器启动失败"; exit 1; }

echo "[4/4] 清理..."
rm -f "$TMP_FILE"
# 清理悬空镜像（旧版本）
docker image prune -f > /dev/null 2>&1 || true

# 等待健康检查
echo "等待健康检查..."
for i in $(seq 1 10); do
    sleep 3
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "healthy" ]; then
        echo "容器健康检查通过"
        break
    fi
    if [ "$i" -eq 10 ]; then
        echo "警告: 健康检查超时（30s），请手动检查"
    fi
done
REMOTE_SCRIPT

# ============================================================
# 阶段4: 验证
# ============================================================
log "验证部署..."
RESPONSE=$($SSH_CMD "curl -sf http://localhost:${REMOTE_PORT}/api/status 2>/dev/null" || echo "")

if echo "$RESPONSE" | grep -q '"success":true'; then
    ok "部署成功! API 响应正常"
else
    warn "API 响应异常，请手动检查"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成!${NC}"
echo -e "${GREEN}========================================${NC}"
