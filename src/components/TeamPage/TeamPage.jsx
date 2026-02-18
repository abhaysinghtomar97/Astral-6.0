import { useRef, useState, useEffect, useCallback } from 'react';
import TeamSlide from './TeamSlide';
import ResearchSlide from './ResearchSlide';
import { TEAM_MEMBERS } from './data';

// Global styles injected once — scroll-snap, font imports, keyframes
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .stellar-root {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #050814;
    position: relative;
    font-family: 'DM Sans', sans-serif;
    color: #e8eaf6;
  }

  .stellar-scroll {
    position: fixed; inset: 0; z-index: 1;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
  }
  .stellar-scroll::-webkit-scrollbar { display: none; }

  /* Stars fixed background */
  .stellar-stars {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      radial-gradient(1px 1px at 7% 12%, rgba(255,255,255,.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 19% 67%, rgba(255,255,255,.4) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 34% 8%, rgba(255,255,255,.65) 0%, transparent 100%),
      radial-gradient(1px 1px at 52% 83%, rgba(255,255,255,.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 68% 31%, rgba(255,255,255,.5) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 81% 58%, rgba(255,255,255,.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 91% 14%, rgba(255,255,255,.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 13% 49%, rgba(255,255,255,.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 44% 39%, rgba(255,255,255,.45) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 61% 76%, rgba(255,255,255,.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 27% 27%, rgba(255,255,255,.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 89%, rgba(255,255,255,.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 4% 93%, rgba(255,255,255,.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 88% 44%, rgba(255,255,255,.55) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 49% 58%, rgba(255,255,255,.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 31% 85%, rgba(255,255,255,.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 65% 19%, rgba(255,255,255,.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 95% 72%, rgba(255,255,255,.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 56% 3%, rgba(255,255,255,.6) 0%, transparent 100%);
  }

  /* Orbit spin for planet satellites */
  @keyframes orbitSpin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* Floating satellites in research slide */
  .fsat {
    position: absolute;
    pointer-events: none;
    z-index: 3;
    animation: fsatFloat var(--fdur, 7s) ease-in-out infinite alternate;
  }
  @keyframes fsatFloat {
    from { transform: translateY(0) rotate(var(--fr, 0deg)) scale(var(--fscale, 1)); }
    to   { transform: translateY(-22px) rotate(var(--frt, 8deg)) scale(var(--fscale, 1)); }
  }
  .fsat svg {
    display: block;
    filter:
      drop-shadow(0 0 16px var(--fglow, rgba(79,143,255,.9)))
      drop-shadow(0 0 36px var(--fglow, rgba(79,143,255,.5)))
      brightness(1.4);
  }

  /* Scroll hint arrow pulse */
  @keyframes arrowPulse {
    0%, 100% { opacity: 0.3; }
    50%       { opacity: 1; }
  }

  /* All animatable elements start hidden */
  .anim { opacity: 0; }
`;


function StyleInjector() {
  useEffect(() => {
    const id = 'stellar-global-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { /* keep styles alive */ };
  }, []);
  return null;
}

export default function TeamPage() {
  const scrollRef   = useRef(null);
  const [current, setCurrent] = useState(0);
  const [hintHidden, setHintHidden] = useState(false);
  const totalSlides = TEAM_MEMBERS.length + 1; // +1 for research slide

  const goTo = useCallback((index) => {
    scrollRef.current?.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const ni = Math.round(el.scrollTop / window.innerHeight);
      setCurrent(ni);
      if (ni > 0) setHintHidden(true);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="stellar-root">
      <StyleInjector />

      {/* Background layers */}
      <div className="stellar-stars" />
      <div style={{
        position: 'fixed', zIndex: 0, pointerEvents: 'none', borderRadius: '50%',
        filter: 'blur(90px)', width: '55vw', height: '55vw', top: '-20%', right: '-12%',
        background: 'radial-gradient(ellipse, rgba(78, 96, 126, 0.09) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', zIndex: 0, pointerEvents: 'none', borderRadius: '50%',
        filter: 'blur(90px)', width: '45vw', height: '45vw', bottom: '-12%', left: '-12%',
        background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 70%)',
      }} />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '22px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,234,246,0.35)' }}>
          ASTRAL
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(123,130,168,0.35)' }}>
          Meet the Crew
        </div>
      </header>

      {/* Nav dots */}
      <nav style={{
        position: 'fixed', right: 26, top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: 5, height: 5, borderRadius: '50%', cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: current === i ? 'rgba(79,143,255,0.65)' : 'rgba(79,143,255,0.18)',
              border: '1px solid rgba(79,143,255,0.22)',
              boxShadow: current === i ? '0 0 8px rgba(79,143,255,0.45)' : 'none',
              transform: current === i ? 'scale(1.5)' : 'scale(1)',
            }}
          />
        ))}
      </nav>

      {/* Scroll hint */}
      <div style={{
        position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transition: 'opacity 0.5s ease', opacity: hintHidden ? 0 : 1, pointerEvents: 'none',
      }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(123,130,168,0.28)' }}>
          Scroll
        </span>
        <div style={{
          width: 1, height: 28,
          background: 'linear-gradient(to bottom, rgba(79,143,255,0.35), transparent)',
          animation: 'arrowPulse 2s ease-in-out infinite',
        }} />
      </div>

      {/* Scroll container */}
      <div ref={scrollRef} className="stellar-scroll">
        {TEAM_MEMBERS.map((member, i) => (
          <TeamSlide
            key={member.id}
            member={member}
            isActive={current === i}
          />
        ))}
        <ResearchSlide isActive={current === TEAM_MEMBERS.length} />
      </div>
    </div>
  );
}
