import { useRef, useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { CHAPTERS, STATUS_LABEL, F, C } from "../constants/design.js";
import { RevealLine } from "./AnimationPrimitives.jsx";
import { Magnetic } from "./AnimationPrimitives.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// CURVED SVG STRING  (igloo.inc interactive line)
// ═══════════════════════════════════════════════════════════════════════════

function CurvedString({ accent, mounted }) {
  const pathRef      = useRef(null);
  const glowPathRef  = useRef(null);
  const containerRef = useRef(null);
  const animRaf      = useRef(null);
  const state        = useRef({ cx: 50, cy: 10, vx: 0, vy: 0 });

  const applyPath = () => {
    if (!pathRef.current) return;
    const d = `M 0 10 Q ${state.current.cx} ${state.current.cy} 100 10`;
    pathRef.current.setAttribute("d", d);
    glowPathRef.current?.setAttribute("d", d);
  };

  const snapBack = () => {
    if (animRaf.current) cancelAnimationFrame(animRaf.current);
    const tick = () => {
      const s  = state.current;
      s.vx = (s.vx + (50 - s.cx) * 0.06) * 0.52;
      s.vy = (s.vy + (10 - s.cy) * 0.06) * 0.52;
      s.cx += s.vx;
      s.cy += s.vy;
      applyPath();
      const moving =
        Math.abs(s.vx) > 0.02 || Math.abs(s.vy) > 0.02 ||
        Math.abs(s.cx - 50) > 0.02 || Math.abs(s.cy - 10) > 0.02;
      if (moving) {
        animRaf.current = requestAnimationFrame(tick);
      } else {
        s.cx = 50; s.cy = 10; s.vx = 0; s.vy = 0;
        applyPath();
      }
    };
    animRaf.current = requestAnimationFrame(tick);
  };

  const onMouseMove = e => {
    if (animRaf.current) { cancelAnimationFrame(animRaf.current); animRaf.current = null; }
    const b = containerRef.current.getBoundingClientRect();
    state.current = {
      cx: ((e.clientX - b.left)  / b.width)  * 100,
      cy: ((e.clientY - b.top)   / b.height) * 20,
      vx: 0, vy: 0,
    };
    applyPath();
  };

  useEffect(() => () => {
    if (animRaf.current) cancelAnimationFrame(animRaf.current);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={snapBack}
      style={{
        width: "100%", marginTop: 10,
        cursor: "crosshair", pointerEvents: "auto",
        opacity: mounted ? 1 : 0,
        transition: "opacity .8s ease .6s",
      }}
    >
      <svg
        width="100%" height="20" viewBox="0 0 100 20"
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Glow copy */}
        <path
          ref={glowPathRef}
          d="M 0 10 Q 50 10 100 10"
          stroke={accent} strokeWidth="6" fill="transparent" opacity=".08"
          style={{ filter: "blur(3px)", transition: "stroke .6s" }}
        />
        {/* Crisp line */}
        <path
          ref={pathRef}
          d="M 0 10 Q 50 10 100 10"
          stroke={accent} strokeWidth=".7" fill="transparent" opacity=".55"
          style={{ transition: "stroke .6s" }}
        />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════

const Header = memo(function Header({ chapter }) {
  const ch = CHAPTERS[chapter];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        padding: "clamp(20px,3vw,40px) clamp(24px,4vw,60px)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        zIndex: 20, pointerEvents: "none",
        background: "linear-gradient(to bottom,rgba(1,8,18,.82),rgba(1,8,18,.3) 55%,transparent)",
      }}
    >
      {/* ── Left: Wordmark ── */}
      <div style={{ pointerEvents: "auto" }}>
        <Magnetic strength={0.15}>
          <div data-hover data-cursor-label="HOME">
            <RevealLine visible={mounted} delay={0.2}>
              <div style={{ fontSize: "clamp(18px,2vw,24px)", fontFamily: F.display, fontWeight: 300, color: C.text, letterSpacing: ".2em" }}>
                ASTRAL
              </div>
            </RevealLine>
            <RevealLine visible={mounted} delay={0.35}>
              <div style={{ fontSize: "clamp(7px,.7vw,9px)", letterSpacing: ".45em", color: C.textDim, fontFamily: F.mono, textTransform: "uppercase", marginTop: 2 }}>
                Orbital Risk Intelligence
              </div>
            </RevealLine>
            <CurvedString accent={ch.accent} mounted={mounted} />
          </div>
        </Magnetic>
      </div>

      {/* ── Center: Nav Links ── */}
      <nav style={{
        display: "flex", alignItems: "center", gap: "clamp(16px,2vw,32px)",
        pointerEvents: "auto", alignSelf: "center",
      }}>
        {[{ label: "Team", to: "/team" }, { label: "ML Model", to: "/ml-model" }].map(({ label, to }) => (
          <RevealLine key={to} visible={mounted} delay={0.45}>
            <Link
              to={to}
              data-hover
              style={{
                color: C.text,
                fontFamily: F.mono,
                fontSize: "clamp(8px,.8vw,11px)",
                letterSpacing: ".35em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "6px 0",
                position: "relative",
                transition: "color .35s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textDim; }}
            >
              {label}
              {/* underline rule — same accent-line style as the rest of the UI */}
              <span style={{
                position: "absolute", bottom: 0, left: 0,
                width: "100%", height: "1px",
                background: ch.accent,
                transform: "scaleX(0)",
                transformOrigin: "left center",
                transition: "transform .35s cubic-bezier(.19,1,.22,1), background .5s",
              }}
              ref={el => {
                if (!el) return;
                const parent = el.parentElement;
                parent.addEventListener("mouseenter", () => { el.style.transform = "scaleX(1)"; });
                parent.addEventListener("mouseleave", () => { el.style.transform = "scaleX(0)"; });
              }}
              />
            </Link>
          </RevealLine>
        ))}
      </nav>

      {/* ── Right: Status ── */}
      <div style={{ textAlign: "right", fontFamily: F.mono, pointerEvents: "auto" }}>
        <Magnetic strength={0.1}>
          <div data-hover>
            <RevealLine visible={mounted} delay={0.4}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", marginBottom: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: ch.accent,
                  boxShadow: `0 0 10px ${ch.accent}`,
                  animation: "statusPulse 2s ease-in-out infinite",
                }} />
                <span style={{ color: ch.accent, fontSize: "clamp(8px,.8vw,11px)", letterSpacing: ".3em", transition: "color .6s" }}>
                  {STATUS_LABEL[chapter]}
                </span>
              </div>
            </RevealLine>
            <RevealLine visible={mounted} delay={0.55}>
              <div style={{ color: C.textMicro, fontSize: "clamp(7px,.65vw,9px)", letterSpacing: ".25em" }}>
                LEO TRACKING ACTIVE
              </div>
            </RevealLine>
          </div>
        </Magnetic>
      </div>
    </header>
  );
});

export default Header;