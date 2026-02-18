import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import GlobeCanvas from './GlobeCanvas';
import FloatingSatellites from './FloatingSatellites';
import { RESEARCH_LINKS } from './data';

export default function ResearchSlide({ isActive }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    const el = contentRef.current;
    if (!el) return;
    const tl = gsap.timeline();
    tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
    return () => {
      tl.kill();
      gsap.set(el, { opacity: 0, clearProps: 'transform,y' });
    };
  }, [isActive]);

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      scrollSnapAlign: 'start',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #050814 0%, #040610 100%)',
    }}>
      <FloatingSatellites />
      <GlobeCanvas />

      <div ref={contentRef} style={{
        position: 'relative', zIndex: 2,
        marginTop: '40vh', padding: '0 70px',
        opacity: 0,
      }}>
        {/* Hero summary */}
        <div style={{ maxWidth: 680, margin: '0 auto 52px', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(79,143,255,0.5)', marginBottom: 12,
          }}>
            Research & Open Data
          </div>
          <h2 style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(24px, 2.8vw, 38px)',
            fontWeight: 800, lineHeight: 1.15,
            color: 'rgba(232,234,246,0.9)', marginBottom: 16,
          }}>
            Exploring the Universe,<br />One Dataset at a Time.
          </h2>
          <p style={{
            fontSize: 14, lineHeight: 1.85,
            color: 'rgba(157,168,204,0.62)', fontWeight: 300,
          }}>
            Stellar Labs publishes mission telemetry, spectral datasets, and modelling APIs for the broader
            scientific community. Our open research initiatives span exoplanet catalogues, propulsion efficiency
            studies, and real-time orbital mechanics — available freely to researchers, institutions, and developers worldwide.
          </p>
        </div>

        {/* Links grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          border: '1px solid rgba(79,143,255,0.09)',
          borderRadius: 14, overflow: 'hidden',
          maxWidth: 1060, margin: '0 auto',
        }}>
          {RESEARCH_LINKS.map((col, ci) => (
            <div key={col.title} style={{
              padding: '28px 24px',
              borderRight: ci < RESEARCH_LINKS.length - 1 ? '1px solid rgba(79,143,255,0.08)' : 'none',
            }}>
              <div style={{
                fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(232,234,246,0.5)',
                marginBottom: 16, paddingBottom: 12,
                borderBottom: '1px solid rgba(79,143,255,0.08)',
              }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.items.map((item) => (
                  <a key={item.name} href={item.href} style={{
                    display: 'flex', flexDirection: 'column', gap: 2,
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.querySelector('.li-name').style.color = 'rgba(232,234,246,0.85)'; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.li-name').style.color = 'rgba(232,234,246,0.5)'; }}
                  >
                    <span className="li-name" style={{
                      fontSize: 13, fontWeight: 400,
                      color: 'rgba(232,234,246,0.5)', transition: 'color 0.2s',
                    }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(123,130,168,0.4)', fontWeight: 300 }}>{item.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer bar */}
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(79,143,255,0.07)', marginTop: 36,
        }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: 'rgba(232,234,246,0.4)', letterSpacing: '0.06em' }}>
            <span style={{ color: 'rgba(79,143,255,0.55)' }}>Astral</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(123,130,168,0.3)' }}>
            © 2026 Astral. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {['Terms', 'Privacy', 'Contact', 'Status'].map(l => (
              <a key={l} href="#" style={{
                fontSize: 11, color: 'rgba(123,130,168,0.38)', textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(232,234,246,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(123,130,168,0.38)'}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
