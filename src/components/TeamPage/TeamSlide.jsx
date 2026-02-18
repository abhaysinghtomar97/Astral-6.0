import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import PlanetCanvas from './PlanetCanvas';

export default function TeamSlide({ member, isActive, wasActive }) {
  const leftRef   = useRef(null);
  const rightRef  = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const leftEls  = leftRef.current?.querySelectorAll('.anim') ?? [];
    const rightEls = rightRef.current?.querySelectorAll('.anim') ?? [];
    const canvas   = canvasRef.current;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(leftEls,  { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, 0);
    if (canvas) tl.fromTo(canvas, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }, 0.08);
    tl.fromTo(rightEls[0] ?? [], { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.45 }, 0.15);
    tl.fromTo(rightEls[1] ?? [], { opacity: 0, y: 36  }, { opacity: 1, y: 0, duration: 0.65 }, 0.25);
    tl.fromTo(rightEls[2] ?? [], { opacity: 0, y: 22  }, { opacity: 1, y: 0, duration: 0.55 }, 0.40);
    tl.fromTo(rightEls[3] ?? [], { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, transformOrigin: 'left center', duration: 0.4 }, 0.55);
    tl.fromTo(rightEls[4] ?? [], { opacity: 0, y: 16  }, { opacity: 1, y: 0, duration: 0.45 }, 0.62);
    tl.fromTo(rightEls[5] ?? [], { opacity: 0, y: 12  }, { opacity: 1, y: 0, duration: 0.40 }, 0.73);

    return () => {
      tl.kill();
      gsap.set([...leftEls, ...rightEls], { opacity: 0, clearProps: 'transform,x,y,scale,scaleX' });
      if (canvas) gsap.set(canvas, { opacity: 0, clearProps: 'transform,scale' });
    };
  }, [isActive]);

  const m = member;

  return (
    <div
      className="slide"
      style={{
        width: '100vw', height: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex', flexDirection: 'row',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Vertical divider */}
      <div style={{
        position: 'absolute', left: '30%', top: '8%', bottom: '8%', width: 1, zIndex: 2,
        background: 'linear-gradient(to bottom,transparent,rgba(79,143,255,0.1) 25%,rgba(79,143,255,0.1) 75%,transparent)',
      }} />

      {/* ── LEFT ── */}
      <div ref={leftRef} style={{
        width: '30%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 22, padding: '60px 28px',
        position: 'relative', zIndex: 2,
      }}>
        <span className="anim" style={{
          fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(79,143,255,0.28)',
        }}>
          {m.index}
        </span>

        {/* Planet system */}
        <div style={{ position: 'relative', width: 180, height: 180 }}>
          <div ref={canvasRef} style={{ position: 'absolute', inset: 0, opacity: 0 }}>
            <PlanetCanvas def={m.planet} size={180} />
          </div>
          {/* Satellite orbit */}
          <div style={{
            position: 'absolute', width: 250, height: 90,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            border: `1px solid ${m.orbitColor}`,
            borderRadius: '50%',
            animation: `orbitSpin ${m.orbitSpeed} linear infinite`,
          }}>
            <div style={{
              position: 'absolute', top: -6, left: 'calc(50% - 7px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            }}>
              <div style={{
                width: 7, height: 5, borderRadius: 1,
                background: m.satColor,
                boxShadow: `0 0 8px ${m.satGlow}`,
              }} />
              <div style={{ display: 'flex', gap: 2 }}>
                <span style={{ width: 5, height: 2, background: 'rgba(120,200,255,0.7)', borderRadius: 1, display: 'block' }} />
                <span style={{ width: 5, height: 2, background: 'rgba(120,200,255,0.7)', borderRadius: 1, display: 'block' }} />
              </div>
            </div>
          </div>
        </div>

        <h2 className="anim" style={{
          fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800,
          color: 'rgba(232,234,246,0.85)', textAlign: 'center', lineHeight: 1.3,
        }}>
          {m.name}
        </h2>
      </div>

      {/* ── RIGHT ── */}
      <div ref={rightRef} style={{
        width: '70%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 72px 60px 52px', gap: 24,
        position: 'relative', zIndex: 2,
      }}>
        {/* Role label */}
        <div className="anim" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: m.roleDotColor, boxShadow: `0 0 8px ${m.roleDotGlow}`,
          }} />
          <span style={{
            fontFamily: "'Syne',sans-serif", fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: m.roleTextColor,
          }}>{m.role}</span>
        </div>

        {/* Headline */}
        <h1 className="anim" style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 'clamp(28px, 3.6vw, 48px)',
          fontWeight: 800, lineHeight: 1.1,
          color: 'rgba(232,234,246,0.9)',
        }}>
          {m.headline[0]}<br />{m.headline[1]}
        </h1>

        {/* Description */}
        <p className="anim" style={{
          fontSize: 14, lineHeight: 1.85,
          color: 'rgba(157,168,204,0.7)', fontWeight: 300, maxWidth: 540,
        }}>
          {m.description}
        </p>

        {/* Divider */}
        <div className="anim" style={{ width: 44, height: 1, background: 'rgba(79,143,255,0.18)' }} />

        {/* Meta grid */}
        <div className="anim" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px', maxWidth: 460,
        }}>
          {m.meta.map((item) => (
            <div key={item.label}>
              <div style={{
                fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'rgba(79,143,255,0.32)', marginBottom: 4,
              }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'rgba(232,234,246,0.48)', fontWeight: 300 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="anim" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {m.skills.map((skill) => (
            <span key={skill} style={{
              fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 600,
              letterSpacing: '0.04em', padding: '5px 13px', borderRadius: 20,
              background: m.skillStyle.bg,
              border: `1px solid ${m.skillStyle.border}`,
              color: m.skillStyle.color,
            }}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
