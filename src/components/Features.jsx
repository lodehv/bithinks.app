import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Features.css';
import { CheckCircle2, Database, TrendingUp, Headphones, Sliders, ArrowUpCircle, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const containerRef = useRef(null);
  const { t } = useAppContext();

  const features = [
    {
      id: 'performance',
      module: 'Performance Badge',
      logoIcon: <CheckCircle2 color="#0066FF" />,
      title: t.features.card1Title,
      description: t.features.card1Desc,
      buttonText: t.features.card1Btn,
      buttonColor: '#0066FF',
      tags: t.features.card1Tags,
      mockup: (
        <div className="mock-perf-wrapper">
          <div className="perf-gauge-core">
            <svg viewBox="0 0 100 100" className="perf-gauge-svg">
              <circle cx="50" cy="50" r="40" className="gauge-track"></circle>
              <circle cx="50" cy="50" r="40" className="gauge-fill"></circle>
            </svg>
            <div className="perf-check-icon">
              <CheckCircle2 size={38} color="#0066FF" style={{ strokeWidth: 2.5 }} />
            </div>
          </div>
          <div className="perf-floating-badge">
            <CheckCircle2 size={12} color="#0066FF" style={{ strokeWidth: 3 }} />
            <span>{t.features.card1Badge}</span>
          </div>
        </div>
      )
    },
    {
      id: 'integration',
      module: 'Semua Bisa Jadi Satu',
      logoIcon: <Database color="#0066FF" />,
      title: t.features.card2Title,
      description: t.features.card2Desc,
      buttonText: t.features.card2Btn,
      buttonColor: '#0066FF',
      tags: t.features.card2Tags,
      mockup: (
        <div className="mock-integ-wrapper">
          <div className="integ-single-box-left">
            <div className="integ-single-box"></div>
          </div>
          <div className="integ-flow-lines">
            <svg viewBox="0 0 120 100" className="integ-flow-svg">
              <path d="M10 25 C60 25, 60 50, 110 50" className="flow-path"></path>
              <path d="M10 50 L110 50" className="flow-path"></path>
              <path d="M10 75 C60 75, 60 50, 110 50" className="flow-path"></path>
              <path d="M-25 50 L10 50" className="flow-path-left" style={{ strokeDasharray: '4 4' }}></path>
            </svg>
            <div className="flow-dot flow-dot-1"></div>
            <div className="flow-dot flow-dot-2"></div>
            <div className="flow-dot flow-dot-3"></div>
            <div className="flow-dot-left"></div>
          </div>
          <div className="integ-servers-middle">
            <div className="integ-server-node"></div>
            <div className="integ-server-node"></div>
            <div className="integ-server-node"></div>
          </div>
          <div className="integ-hub-right">
            <div className="integ-hub-circle">
              <Database size={22} color="#FFFFFF" style={{ strokeWidth: 2 }} />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'growth',
      module: 'Membantu Bisnis Bertumbuh',
      logoIcon: <TrendingUp color="#0066FF" />,
      title: t.features.card3Title,
      description: t.features.card3Desc,
      buttonText: t.features.card3Btn,
      buttonColor: '#0066FF',
      tags: t.features.card3Tags,
      mockup: (
        <div className="mock-growth-wrapper">
          <div className="growth-chart-side">
            <div className="growth-chart-box">
              <svg viewBox="0 0 100 60" className="growth-chart-svg">
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0, 102, 255, 0.25)"></stop>
                    <stop offset="100%" stopColor="rgba(0, 102, 255, 0)"></stop>
                  </linearGradient>
                </defs>
                <path d="M0 50 C20 40, 40 45, 60 25 C75 10, 85 15, 100 5 L100 60 L0 60 Z" fill="url(#growthGrad)"></path>
                <path d="M0 50 C20 40, 40 45, 60 25 C75 10, 85 15, 100 5" className="growth-chart-line"></path>
              </svg>
              <div className="growth-chart-arrow">
                <TrendingUp size={14} color="#FFFFFF" style={{ strokeWidth: 3 }} />
              </div>
            </div>
          </div>
          <div className="growth-gauge-side">
            <div className="growth-gauge-core">
              <svg viewBox="0 0 100 100" className="growth-gauge-svg">
                <circle cx="50" cy="50" r="40" className="gauge-track"></circle>
                <circle cx="50" cy="50" r="40" className="gauge-fill-95"></circle>
              </svg>
              <div className="growth-percentage-val">95%</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'support',
      module: 'Support Cepat',
      logoIcon: <Headphones color="#0066FF" />,
      title: t.features.card4Title,
      description: t.features.card4Desc,
      buttonText: t.features.card4Btn,
      buttonColor: '#0066FF',
      tags: t.features.card4Tags,
      mockup: (
        <div className="mock-support-wrapper">
          <div className="support-bubble-box">
            <div className="support-icon-circle">
              <Headphones size={36} color="#0066FF" style={{ strokeWidth: 2 }} />
            </div>
            <div className="support-bubble-tail"></div>
            <div className="support-bubble-offset"></div>
          </div>
          <div className="support-live-badge">
            <div className="live-pulse-dot"></div>
            <span>{t.features.card4Badge}</span>
          </div>
        </div>
      )
    },
    {
      id: 'adjustable',
      module: 'Bisa Disesuaikan',
      logoIcon: <Sliders color="#0066FF" />,
      title: t.features.card5Title,
      description: t.features.card5Desc,
      buttonText: t.features.card5Btn,
      buttonColor: '#0066FF',
      tags: t.features.card5Tags,
      mockup: (
        <div className="mock-adjust-wrapper">
          <div className="adjust-toggle-core">
            <div className="toggle-track-active">
              <div className="toggle-thumb-active"></div>
            </div>
          </div>
          <div className="adjust-gear-core">
            <div className="gear-spinner">
              <svg viewBox="0 0 100 100" className="gear-svg" fill="#0066FF">
                <path d="M50 34c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path>
                <path d="M92.5 45.5h-8.8c-.6-2.6-1.7-5-3.3-7.2l6.2-6.2c1.2-1.2 1.2-3.1 0-4.2l-5-5c-1.2-1.2-3.1-1.2-4.2 0l-6.2 6.2c-2.2-1.6-4.6-2.7-7.2-3.3V17c0-1.7-1.3-3-3-3h-7c-1.7 0-3 1.3-3 3v8.8c-2.6.6-5 1.7-7.2 3.3l-6.2-6.2c-1.2-1.2-3.1-1.2-4.2 0l-5 5c-1.2 1.2-1.2 3.1 0 4.2l6.2 6.2c-1.6 2.2-2.7 4.6-3.3 7.2H7.5c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h8.8c.6 2.6 1.7 5 3.3 7.2l-6.2 6.2c-1.2 1.2-1.2 3.1 0 4.2l5 5c1.2 1.2 3.1 1.2 4.2 0l6.2-6.2c2.2 1.6 4.6 2.7 7.2 3.3V83c0 1.7 1.3 3 3 3h7c1.7 0 3-1.3 3-3v-8.8c2.6-.6 5-1.7 7.2-3.3l6.2 6.2c1.2 1.2 3.1 1.2 4.2 0l5-5c1.2-1.2 1.2-3.1 0-4.2l-6.2-6.2c1.6-2.2 2.7-4.6 3.3-7.2h8.8c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3z"></path>
              </svg>
            </div>
            <div className="gear-wrench-icon">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFFFFF" strokeWidth="3"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
          </div>
          <div className="adjust-floating-badge">
            <span>{t.features.card5Badge}</span>
          </div>
        </div>
      )
    },
    {
      id: 'scale',
      module: 'Siap Berkembang',
      logoIcon: <ArrowUpCircle color="#0066FF" />,
      title: t.features.card6Title,
      description: t.features.card6Desc,
      buttonText: t.features.card6Btn,
      buttonColor: '#0066FF',
      tags: t.features.card6Tags,
      mockup: (
        <div className="mock-scale-wrapper">
          <div className="scale-cloud-core">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="scale-cloud-svg">
              <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.01-1.03-2.01-2-2.5A5.62 5.62 0 0 0 8 10c-3 0-5 2.5-5 5.5A3.5 3.5 0 0 0 6.5 19z"></path>
            </svg>
            <div className="scale-arrow-icon">
              <TrendingUp size={20} color="#FFFFFF" style={{ strokeWidth: 3 }} />
            </div>
          </div>
          <div className="scale-progress-bar">
            <div className="scale-progress-fill"></div>
          </div>
          <div className="scale-floating-badge">
            <span>{t.features.card6Badge}</span>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const ctx = gsap.matchMedia();
    const cards = gsap.utils.toArray('.feature-large-card');

    cards.forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    ctx.add("(min-width: 992px)", () => {
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;

        const nextCard = cards[i + 1];

        gsap.to(card, {
          scale: 0.94,
          '--card-overlay': 0.15,
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 85%',
            end: 'top 120px',
            scrub: true,
          }
        });
      });
    });

    ctx.add("(max-width: 991px)", () => {
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;

        const nextCard = cards[i + 1];

        gsap.to(card, {
          scale: 0.94,
          '--card-overlay': 0.15,
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 85%',
            end: 'top 90px',
            scrub: true,
          }
        });
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="features-header">
          <span className="features-pretitle">{t.features.pretitle}</span>
          <h2 className="features-title">{t.features.title}</h2>
          <p className="features-subtitle">{t.features.subtitle}</p>
        </div>

        <div className="features-stack" ref={containerRef}>
          {features.map((feat, idx) => (
            <div className="feature-large-card" key={idx} style={{ '--i': idx }}>
              <div className="feature-content">
                <div className="feature-badge">
                  {feat.logoIcon}
                  <span>{feat.module}</span>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.description}</p>
                <button className="feature-btn" style={{ backgroundColor: feat.buttonColor }}>
                  {feat.buttonText}
                </button>
                <div className="feature-tags">
                  {feat.tags.map((tag, tIdx) => (
                    <span className="feature-tag" key={tIdx}>
                      <Zap size={14} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="feature-mockup">
                {feat.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
