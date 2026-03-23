/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

// 主页组件 - 仿 PackyAPI 风格多区块落地页 - mkx 2026-03-22
import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  Button,
  Input,
  ScrollList,
  ScrollItem,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconCopy,
} from '@douyinfe/semi-icons';
import {
  Link2,
  Eye,
  TrendingUp,
  Code2,
  Settings,
  Zap,
  BarChart3,
  Shield,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';

// 特性卡片数据
const FEATURES = [
  {
    icon: Link2,
    titleKey: '统一入口，极速连通',
    descKey: '以单一域名和密钥连接全部大模型供应商，智能容灾切换确保业务不中断。',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    glow: 'blue',
  },
  {
    icon: Eye,
    titleKey: '全栈可观测与风控',
    descKey: '实时监控调用量、错误率与费用，一键配置限流、告警与安全策略。',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    glow: 'emerald',
  },
  {
    icon: TrendingUp,
    titleKey: '按需扩容与成本优化',
    descKey: '多渠道配额、智能路由与批量任务调度，灵活控制成本与并发能力。',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    glow: 'amber',
  },
  {
    icon: Code2,
    titleKey: '开发者友好体验',
    descKey: '兼容 OpenAI 接口协议，提供 SDK、示例与 Web Playground，轻松迭代上线。',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    glow: 'violet',
  },
];

// 工作流步骤数据
const WORKFLOW_STEPS = [
  {
    step: '01',
    icon: Settings,
    titleKey: '接入配置',
    descKey: '在控制台创建渠道、设置密钥与限额，导入模型列表。',
  },
  {
    step: '02',
    icon: Zap,
    titleKey: '智能调度',
    descKey: '根据健康度、延迟与价格自动选择最优模型通道，内置故障切换。',
  },
  {
    step: '03',
    icon: BarChart3,
    titleKey: '持续洞察',
    descKey: '通过仪表盘追踪调用趋势、消耗与失败率，实时告警确保 SLO。',
  },
];

// 浮动特性数据
const FLOATING_FEATURES = [
  {
    icon: Activity,
    titleKey: '实时调度',
    descKey: '健康度与延迟权重动态切换，保证最优响应。',
  },
  {
    icon: BarChart3,
    titleKey: '统一监控',
    descKey: '调用、费用、异常一站式可视化，随时掌握运行状态。',
  },
  {
    icon: Shield,
    titleKey: '智能限流',
    descKey: '多维策略保障核心业务优先级，避免突发拥堵。',
  },
];

// 合作伙伴 Provider 列表
const PARTNERS = [
  'OpenAI', 'Anthropic', 'Google', 'Azure', 'AWS',
  'Meta', 'Mistral', 'Cohere', 'DeepSeek', 'Moonshot',
  'Baidu', 'Alibaba',
];

// useInView hook - 检测元素进入视口
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
};

// 统计数据组件
const StatsBar = ({ t }) => {
  const [ref, inView] = useInView();
  const stats = [
    { value: '200+', labelKey: '可覆盖模型' },
    { value: '99.9%', labelKey: 'SLA 可用性' },
    { value: '5+', labelKey: '多区域节点' },
  ];
  return (
    <div
      ref={ref}
      className={`w-full py-12 md:py-16 border-b border-semi-color-border transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className='max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-around gap-8'>
        {stats.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className='hidden md:block w-px h-10 bg-semi-color-border' />
            )}
            <div className='flex flex-col items-center gap-1'>
              <span
                className={`text-3xl md:text-4xl font-bold text-semi-color-primary ${inView ? 'stat-number-resolve' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {s.value}
              </span>
              <span className='text-sm text-semi-color-text-2'>
                {t(s.labelKey)}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// 特性卡片区
const FeaturesSection = ({ t }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className='w-full py-16 md:py-24 border-b border-semi-color-border'
    >
      <div className='max-w-6xl mx-auto px-4'>
        <div
          className={`text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-semi-color-primary-light-default text-semi-color-primary mb-4'>
            {t('核心价值')}
          </span>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0'>
            {t('让团队稳定使用大模型，更快落地 AI 创新')}
          </h2>
          <p className='mt-4 text-semi-color-text-2 max-w-2xl mx-auto'>
            {t('从访问控制、成本可视化到全局调度，为企业提供端到端的 AI 基础设施能力。')}
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                data-glow={f.glow}
                className={`group p-6 rounded-2xl feature-card-glass transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 feature-icon`}
                >
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className='text-lg font-semibold text-semi-color-text-0 mb-2'>
                  {t(f.titleKey)}
                </h3>
                <p className='text-sm text-semi-color-text-2 leading-relaxed'>
                  {t(f.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 工作流区
const WorkflowSection = ({ t }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className='w-full py-16 md:py-24 border-b border-semi-color-border relative overflow-hidden'
    >
      {/* 背景装饰 */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='blur-ball blur-ball-teal !top-[50%] !left-[70%] !opacity-15' />
      </div>
      <div className='max-w-6xl mx-auto px-4 relative'>
        <div
          className={`text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-semi-color-primary-light-default text-semi-color-primary mb-4'>
            {t('工作流')}
          </span>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0'>
            {t('用 3 个步骤构建你的 AI 控制平面')}
          </h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {WORKFLOW_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`relative flex flex-col items-center text-center transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* 步骤编号 */}
                <span
                  className={`text-6xl font-black text-semi-color-primary/10 absolute -top-8 left-1/2 -translate-x-1/2 select-none leading-none ${inView ? 'step-number-animate' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {s.step}
                </span>
                <div className='w-14 h-14 rounded-2xl bg-semi-color-primary-light-default flex items-center justify-center mb-4 mt-6 relative z-10'>
                  <Icon className='w-6 h-6 text-semi-color-primary' />
                </div>
                <h3 className='text-lg font-semibold text-semi-color-text-0 mb-2'>
                  {t(s.titleKey)}
                </h3>
                <p className='text-sm text-semi-color-text-2 leading-relaxed max-w-xs'>
                  {t(s.descKey)}
                </p>
                {/* 连接线 */}
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-7 left-[60%] w-[80%] workflow-line ${inView ? 'workflow-line-animate' : ''}`}
                    style={{ animationDelay: `${i * 300 + 200}ms` }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* 浮动特性卡 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-16'>
          {FLOATING_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl bg-semi-color-fill-0 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${450 + i * 100}ms` }}
              >
                <Icon className='w-5 h-5 text-semi-color-primary mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='text-sm font-semibold text-semi-color-text-0'>
                    {t(f.titleKey)}
                  </h4>
                  <p className='text-xs text-semi-color-text-2 mt-1'>
                    {t(f.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 生态伙伴区 - 双行跑马灯
const PartnerChip = ({ name }) => (
  <div className='px-6 py-3 rounded-xl border border-semi-color-border bg-semi-color-bg-0 text-semi-color-text-1 text-sm font-medium hover:border-semi-color-primary hover:text-semi-color-primary transition-colors duration-200 flex-shrink-0'>
    {name}
  </div>
);

const PartnersSection = ({ t }) => {
  const [ref, inView] = useInView();
  // 拆分为两行
  const row1 = PARTNERS.slice(0, Math.ceil(PARTNERS.length / 2));
  const row2 = PARTNERS.slice(Math.ceil(PARTNERS.length / 2));
  return (
    <div
      ref={ref}
      className='w-full py-16 md:py-24 border-b border-semi-color-border'
    >
      <div className='max-w-6xl mx-auto px-4'>
        <div
          className={`text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-semi-color-primary-light-default text-semi-color-primary mb-4'>
            {t('生态伙伴')}
          </span>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0'>
            {t('与主流模型供应商深度对接')}
          </h2>
          <p className='mt-4 text-semi-color-text-2 max-w-2xl mx-auto'>
            {t('保持统一协议，快速切换与扩展模型能力，随时接入最新生态。')}
          </p>
        </div>
        <div
          className={`flex flex-col gap-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* 第一行 - 正向滚动 */}
          <div className='marquee-container'>
            <div className='marquee-track'>
              {/* 内容翻倍实现无缝循环 */}
              {[...row1, ...row1].map((name, i) => (
                <PartnerChip key={i} name={name} />
              ))}
            </div>
          </div>
          {/* 第二行 - 反向滚动 */}
          <div className='marquee-container'>
            <div className='marquee-track-reverse'>
              {[...row2, ...row2].map((name, i) => (
                <PartnerChip key={i} name={name} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CTA 区
const CTASection = ({ t, isMobile, docsLink }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className='w-full py-20 md:py-28 relative overflow-hidden cta-mesh-bg'
    >
      <div className='absolute inset-0 pointer-events-none'>
        <div className='blur-ball blur-ball-indigo !top-[20%] !left-[20%] !opacity-20' />
        <div className='blur-ball blur-ball-teal !top-[60%] !left-[70%] !opacity-15' />
      </div>
      <div
        className={`max-w-3xl mx-auto px-4 text-center relative transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0 mb-4'>
          {t('将大模型能力真正落地到业务流程')}
        </h2>
        <p className='text-semi-color-text-2 mb-8 max-w-xl mx-auto'>
          {t('统一控制访问策略与调用成本，为产品带来稳定、可扩展的智能体验。')}
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
          <Link to='/console'>
            <Button
              theme='solid'
              type='primary'
              size={isMobile ? 'default' : 'large'}
              className='!rounded-3xl px-8 py-2 cta-pulse-button'
              icon={<Sparkles className='w-4 h-4' />}
            >
              {t('立即开始')}
            </Button>
          </Link>
          {docsLink && (
            <Button
              size={isMobile ? 'default' : 'large'}
              className='!rounded-3xl px-6 py-2'
              icon={<IconFile />}
              onClick={() => window.open(docsLink, '_blank')}
            >
              {t('查看文档')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent(t('加载首页内容失败...'));
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>
          {/* ============ Hero 区域 ============ */}
          <div className='w-full border-b border-semi-color-border min-h-[500px] md:min-h-[600px] lg:min-h-[700px] relative overflow-hidden'>
            {/* 背景模糊晕染球 */}
            <div className='blur-ball blur-ball-indigo' />
            <div className='blur-ball blur-ball-teal' />
            <div className='flex items-center justify-center h-full px-4 py-20 md:py-24 lg:py-32 mt-10'>
              <div className='flex flex-col items-center justify-center text-center max-w-4xl mx-auto'>
                {/* Badge 标签 */}
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-semi-color-primary-light-default text-semi-color-primary mb-6 hero-badge-animate hero-stagger-1'>
                  <Sparkles className='w-3 h-3' />
                  {t('面向企业的 AI 生产力基座')}
                </span>

                <div className='flex flex-col items-center justify-center mb-6 md:mb-8'>
                  <h1
                    className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-semi-color-text-0 leading-tight hero-stagger-2 ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}
                  >
                    {t('统一的')}
                    <br />
                    <span className='shine-text'>
                      {t('大模型接口网关')}
                    </span>
                  </h1>
                  <p className='text-base md:text-lg lg:text-xl text-semi-color-text-1 mt-4 md:mt-6 max-w-xl hero-stagger-3'>
                    {t('以一套域名、密钥与风控策略连接全球大模型资源，保障可观测、可拓展、可控。')}
                  </p>
                  {/* 提示文字 */}
                  <p className='text-sm text-semi-color-text-2 mt-3 hero-stagger-3'>
                    {t('替换基础 URL 即可接入')}
                  </p>
                  {/* BASE URL 与端点选择 */}
                  <div className='flex flex-col md:flex-row items-center justify-center gap-4 w-full mt-4 max-w-md hero-stagger-4'>
                    <Input
                      readonly
                      value={serverAddress}
                      className='flex-1 !rounded-full'
                      size={isMobile ? 'default' : 'large'}
                      suffix={
                        <div className='flex items-center gap-2'>
                          <ScrollList
                            bodyHeight={32}
                            style={{ border: 'unset', boxShadow: 'unset' }}
                          >
                            <ScrollItem
                              mode='wheel'
                              cycled={true}
                              list={endpointItems}
                              selectedIndex={endpointIndex}
                              onSelect={({ index }) =>
                                setEndpointIndex(index)
                              }
                            />
                          </ScrollList>
                          <Button
                            type='primary'
                            onClick={handleCopyBaseURL}
                            icon={<IconCopy />}
                            className='!rounded-full'
                          />
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex flex-row gap-4 justify-center items-center hero-stagger-5'>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size={isMobile ? 'default' : 'large'}
                      className='!rounded-3xl px-8 py-2'
                      icon={<IconPlay />}
                    >
                      {t('获取密钥')}
                    </Button>
                  </Link>
                  {isDemoSiteMode && statusState?.status?.version ? (
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      className='flex items-center !rounded-3xl px-6 py-2'
                      icon={<IconGithubLogo />}
                      onClick={() =>
                        window.open(
                          'https://github.com/makaixindalao/zhima-api.git',
                          '_blank',
                        )
                      }
                    >
                      {statusState.status.version}
                    </Button>
                  ) : (
                    docsLink && (
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        className='flex items-center !rounded-3xl px-6 py-2'
                        icon={<IconFile />}
                        onClick={() => window.open(docsLink, '_blank')}
                      >
                        {t('文档')}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============ 统计数据条 ============ */}
          <StatsBar t={t} />

          {/* ============ 核心特性 ============ */}
          <FeaturesSection t={t} />

          {/* ============ 工作流 ============ */}
          <WorkflowSection t={t} />

          {/* ============ 生态伙伴 ============ */}
          <PartnersSection t={t} />

          {/* ============ CTA ============ */}
          <CTASection t={t} isMobile={isMobile} docsLink={docsLink} />
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
