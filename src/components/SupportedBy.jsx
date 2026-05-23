import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Store, Users, Sparkles } from 'lucide-react';
import './SupportedBy.css';

gsap.registerPlugin(ScrollTrigger);

const SupportedBy = () => {
  const windowRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Draw SVG path line animation on scroll
      gsap.fromTo('.scale-curve-path',
        { strokeDashoffset: 1000 },
        {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: windowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          }
        }
      );

      // 2. Fade in area gradient fill under path curve
      gsap.fromTo('.chart-fill-gradient',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.2,
          delay: 0.8,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: windowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          }
        }
      );

      // 3. Pulse concentric core reveal
      gsap.fromTo('.pulse-wave',
        { scale: 0.5, opacity: 0 },
        {
          scale: 1,
          opacity: 0.6,
          duration: 0.8,
          delay: 1.2,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: windowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          }
        }
      );

      // 4. Stagger reveal anchor dots and network badge — opacity only, no transform
      // IMPORTANT: Never animate scale/transform on SVG <g> milestone-point elements
      // because GSAP inline styles will fight CSS :hover transforms causing erratic jumps.
      gsap.fromTo('.milestone-point',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.7,
          stagger: 0.2,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: windowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
          onComplete: () => {
            // Clear any inline transform GSAP may have set so CSS owns it entirely
            gsap.set('.milestone-point', { clearProps: 'transform' });
          }
        }
      );

      // 5. Stagger reveal milestone capsule tags
      gsap.fromTo('.milestone-tag-wrapper',
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          delay: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: windowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          }
        }
      );
    }, windowRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="supported-section" id="scale-up-diagram">
      <div className="container">
        
        {/* Symmetrical SaaS Grid Title */}
        <h2 className="supported-main-title">
          Bithinks <span>Support UMKM Naik Kelas</span>
        </h2>

        {/* Dynamic Mockup Window */}
        <div className="scale-mockup-window" ref={windowRef}>
          {/* OS Titlebar controls */}
          <div className="window-header">
            <div className="mac-dot red"></div>
            <div className="mac-dot orange"></div>
            <div className="mac-dot green"></div>
          </div>

          {/* Symmetrical Grid canvas body */}
          <div className="window-body">
            {/* Tech Blueprint Grid backdrop */}
            <div className="scale-grid-backdrop"></div>

            <div className="chart-canvas-wrapper">
              
              {/* Y-Axis Label (Operational Complexity) */}
              <div className="y-axis-label">Operational Complexity</div>

              {/* SVG Curve Path Overlay */}
              <svg viewBox="0 0 800 400" className="scale-chart-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="chart-glow-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Dotted helper horizontal grids */}
                <line x1="80" y1="80" x2="760" y2="80" className="dotted-grid-line" />
                <line x1="80" y1="180" x2="760" y2="180" className="dotted-grid-line" />
                <line x1="80" y1="280" x2="760" y2="280" className="dotted-grid-line" />
                
                {/* Symmetrical Grid lines axes */}
                <line x1="80" y1="320" x2="760" y2="320" className="axis-line" />
                <line x1="80" y1="50" x2="80" y2="320" className="axis-line" />

                {/* Gradient area under the curve */}
                <path 
                  d="M 80 300 C 260 290, 480 200, 680 80 L 680 320 L 80 320 Z" 
                  fill="url(#chart-glow-gradient)" 
                  className="chart-fill-gradient"
                />

                {/* Animated Rising Bezier Path Curve */}
                <path 
                  d="M 80 300 C 260 290, 480 200, 680 80" 
                  className="scale-curve-path" 
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                />

                {/* Stage 1 Anchor Dot */}
                <g className="milestone-point pt-pos">
                  <circle cx="180" cy="285" r="9" fill="#0066FF" stroke="#FFFFFF" strokeWidth="2.5" />
                  <circle cx="180" cy="285" r="4.5" fill="#FFFFFF" />
                </g>

                {/* Stage 2 Anchor Dot */}
                <g className="milestone-point pt-team">
                  <circle cx="420" cy="210" r="9" fill="#0066FF" stroke="#FFFFFF" strokeWidth="2.5" />
                  <circle cx="420" cy="210" r="4.5" fill="#FFFFFF" />
                </g>

                {/* Stage 3 High-Fidelity Smart Network Hub Badge */}
                <g className="milestone-point pt-one">
                  <circle cx="680" cy="80" r="28" fill="#0066FF" stroke="#FFFFFF" strokeWidth="2.5" className="stage3-badge-bg" style={{ filter: 'drop-shadow(0 4px 15px rgba(0, 102, 255, 0.45))' }} />
                  <g transform="translate(680, 80) scale(0.9)" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
                    
                    <line x1="0" y1="0" x2="0" y2="-12" />
                    <circle cx="0" cy="-12" r="2" fill="#FFFFFF" />
                    
                    <line x1="0" y1="0" x2="10.4" y2="-6" />
                    <circle cx="10.4" cy="-6" r="2" fill="#FFFFFF" />
                    
                    <line x1="0" y1="0" x2="10.4" y2="6" />
                    <circle cx="10.4" cy="6" r="2" fill="#FFFFFF" />
                    
                    <line x1="0" y1="0" x2="0" y2="12" />
                    <circle cx="0" cy="12" r="2" fill="#FFFFFF" />
                    
                    <line x1="0" y1="0" x2="-10.4" y2="6" />
                    <circle cx="-10.4" cy="6" r="2" fill="#FFFFFF" />
                    
                    <line x1="0" y1="0" x2="-10.4" y2="-6" />
                    <circle cx="-10.4" cy="-6" r="2" fill="#FFFFFF" />
                    
                    <path d="M 0 -12 A 12 12 0 0 1 10.4 -6 L 10.4 6 A 12 12 0 0 1 0 12 A 12 12 0 0 1 -10.4 6 L -10.4 -6 A 12 12 0 0 1 0 -12" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="2 2" />
                  </g>
                </g>
              </svg>

              {/* Stage 3 Pulses concentric circular waves */}
              <div className="pulse-wave-wrapper">
                <div className="pulse-wave wave-1"></div>
                <div className="pulse-wave wave-2"></div>
                <div className="pulse-wave wave-3"></div>
              </div>

              {/* Absolute coordinates tags wrapper */}
              
              {/* Card Stage 1 (BitPos) */}
              <div className="milestone-tag-wrapper tag-pos-wrapper">
                <div className="milestone-tag">
                  <div className="tag-icon-box blue-box">
                    <Store size={14} color="#0066FF" style={{ strokeWidth: 2.5 }} />
                  </div>
                  <span className="tag-label">BitPos</span>
                </div>
              </div>

              {/* Card Stage 2 (+ BitTeam) */}
              <div className="milestone-tag-wrapper tag-team-wrapper">
                <div className="milestone-tag">
                  <div className="tag-icon-box blue-box">
                    <Users size={14} color="#0066FF" style={{ strokeWidth: 2.5 }} />
                  </div>
                  <span className="tag-label">+ BitTeam</span>
                </div>
              </div>

              {/* Card Stage 3 (Upgrade to BitOne) */}
              <div className="milestone-tag-wrapper tag-one-wrapper">
                <div className="milestone-tag highlight-tag">
                  <div className="tag-icon-box active-blue-box">
                    <Sparkles size={14} color="#FFFFFF" style={{ strokeWidth: 2.5 }} />
                  </div>
                  <span className="tag-label">Upgrade to BitOne</span>
                </div>
              </div>

              {/* X-Axis Label (Business Growth) */}
              <div className="x-axis-label">Business Growth</div>

            </div>
          </div>
        </div>

        {/* Bottom capsule subtitle badge bubble */}
        <div className="bottom-capsule-badge">
          <span>Mulai dari apa yang Anda butuhkan hari ini. Skalakan ke seluruh ekosistem besok.</span>
        </div>

      </div>
    </section>
  );
};

export default SupportedBy;
