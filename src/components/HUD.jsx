import { useState, useEffect, memo } from "react";
import { CHAPTERS, METRICS, F, C, ACCENT } from "../constants/design.js";
import { RevealLine, AnimatedNumber } from "./AnimationPrimitives.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// CHAPTER OVERLAY  (bottom-left narrative panel)
// ═══════════════════════════════════════════════════════════════════════════

export function ChapterOverlay({ chapter }) {
  const [displayed, setDisplayed]  = useState(chapter);
  const [visible,   setVisible]    = useState(true);
  const [mounted,   setMounted]    = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Cross-fade when chapter changes
  useEffect(() => {
    if (chapter !== displayed) {
      setVisible(false);
      const t = setTimeout(() => {
        setDisplayed(chapter);
        setVisible(true);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [chapter, displayed]);

  const ch = CHAPTERS[displayed];

  return (
    <div
      style={{
        position: "fixed",
        left: "clamp(24px,4vw,60px)",
        bottom: "clamp(60px,8vh,100px)",
        maxWidth: "clamp(280px,30vw,420px)",
        zIndex: 20,
        fontFamily: F.mono,
        opacity: mounted ? 1 : 0,
        transition: "opacity .8s ease .5s",
      }}
    >
      {/* Phase tag */}
      <RevealLine visible={visible}>
        <div style={{
          color: ch.accent,
          fontSize: "clamp(9px,.8vw,11px)",
          fontWeight: 700,
          letterSpacing: ".35em",
          marginBottom: 16,
          textShadow: `0 0 25px ${ch.accent}`,
          transition: "color .5s, text-shadow .5s",
        }}>
          {ch.tag}
          <span style={{ color: C.textMicro, fontWeight: 400 }}> ── ASTRAL</span>
        </div>
      </RevealLine>

      {/* Title (split by \n for multi-line) */}
      <div style={{ marginBottom: 24 }}>
        {ch.title.split("\n").map((line, i) => (
          <RevealLine key={`${displayed}-${i}`} visible={visible} delay={0.08 + i * 0.08}>
            <div style={{
              color: C.text,
              fontSize: "clamp(28px,3.5vw,52px)",
              fontFamily: F.display,
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-.01em",
              textShadow: "0 2px 40px rgba(0,0,0,.8)",
            }}>
              {line}
            </div>
          </RevealLine>
        ))}
      </div>

      {/* Body copy */}
      <RevealLine visible={visible} delay={0.25}>
        <div style={{
          color: "rgba(200,220,255,.58)",
          fontSize: "clamp(11px,1vw,13px)",
          lineHeight: 1.85,
          fontFamily: F.sans,
          fontWeight: 300,
          maxWidth: 340,
          textShadow: "0 1px 12px rgba(0,0,0,.9)",
        }}>
          {ch.body}
        </div>
      </RevealLine>

      {/* Accent rule */}
      <div style={{
        marginTop: 28,
        width: visible ? 40 : 0,
        height: 1.5,
        background: ch.accent,
        boxShadow: `0 0 15px ${ch.accent}88`,
        transition: "width .8s cubic-bezier(.19,1,.22,1) .35s, background .5s, box-shadow .5s",
      }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR  (right edge, vertical)
// ═══════════════════════════════════════════════════════════════════════════

export const ProgressBar = memo(function ProgressBar({ progress, chapter }) {
  const ch  = CHAPTERS[chapter];
  const pct = (progress * 100).toFixed(2);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: "clamp(20px,3vw,40px)",
        top: "50%",
        transform: `translateY(-50%) translateX(${mounted ? 0 : 20}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        zIndex: 20,
        opacity: mounted ? 1 : 0,
        transition: "opacity 1s ease .8s, transform 1s cubic-bezier(.19,1,.22,1) .8s",
      }}
    >
      {/* Rotated phase tag */}
      <div style={{
        color: ch.accent,
        fontSize: 7,
        letterSpacing: ".25em",
        fontFamily: F.mono,
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        transform: "rotate(180deg)",
        marginBottom: 8,
        textShadow: `0 0 12px ${ch.accent}`,
        transition: "color .5s, text-shadow .5s",
        opacity: .75,
      }}>
        {ch.tag}
      </div>

      {/* Track + fill */}
      <div style={{ width: 1.5, height: 160, background: C.dim06, borderRadius: 2, position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: `${pct}%`,
          background: `linear-gradient(to bottom,${ch.accent}88,${ch.accent})`,
          borderRadius: 2,
          boxShadow: `0 0 8px ${ch.accent}66`,
          transition: "background .5s, box-shadow .5s",
        }} />
        {/* Thumb dot */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: `calc(${pct}% - 3.5px)`,
          width: 7, height: 7,
          borderRadius: "50%",
          background: ch.accent,
          boxShadow: `0 0 12px 4px ${ch.accent}88`,
          transition: "background .5s",
        }} />
      </div>

      {/* Percentage */}
      <div style={{ color: C.textMicro, fontSize: 7, fontFamily: F.mono, letterSpacing: ".15em", marginTop: 4 }}>
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// METRICS TICKER  (bottom-right)
// ═══════════════════════════════════════════════════════════════════════════

export const MetricsTicker = memo(function MetricsTicker({ chapter }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: "clamp(24px,4vw,60px)",
        bottom: "clamp(60px,8vh,100px)",
        fontFamily: F.mono,
        textAlign: "right",
        zIndex: 20,
        opacity: mounted ? 1 : 0,
        transform: `translateY(${mounted ? 0 : 10}px)`,
        transition: "opacity .8s ease 1s, transform .8s ease 1s",
      }}
    >
      {METRICS.map((metric, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <div style={{ color: C.textMicro, fontSize: "clamp(7px,.6vw,8px)", letterSpacing: ".4em", marginBottom: 3 }}>
            {metric.label}
          </div>
          <div style={{
            color: CHAPTERS[chapter].accent,
            fontSize: "clamp(12px,1.2vw,16px)",
            fontWeight: 600,
            letterSpacing: ".05em",
            textShadow: `0 0 18px ${CHAPTERS[chapter].accent}33`,
            transition: "color .5s",
          }}>
            <AnimatedNumber value={metric.vals[chapter]} visible={mounted} />
          </div>
        </div>
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL HINT  (centered, bottom)
// ═══════════════════════════════════════════════════════════════════════════

export function ScrollHint({ progress }) {
  const opacity = progress < 0.02 ? 1 : Math.max(0, 1 - progress / 0.06);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(24px,3vh,40px)",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        zIndex: 20,
        opacity: mounted ? opacity : 0,
        transition: "opacity .8s",
        fontFamily: F.mono,
      }}
    >
      <div style={{ color: C.textDim, fontSize: 8, letterSpacing: ".5em" }}>SCROLL TO EXPLORE</div>
      {/* Mouse icon */}
      <div style={{
        width: 18, height: 30,
        border: `1px solid ${C.textDim}`,
        borderRadius: 10,
        display: "flex",
        justifyContent: "center",
        paddingTop: 5,
      }}>
        <div style={{
          width: 2.5, height: 6, borderRadius: 2,
          background: C.textDim,
          animation: "scrollDot 2s cubic-bezier(.19,1,.22,1) infinite",
        }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMERA MODE INDICATOR  (left center, vertical text)
// ═══════════════════════════════════════════════════════════════════════════

export function CameraMode({ scrolling }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "clamp(24px,4vw,60px)",
        transform: "translateY(-50%)",
        zIndex: 20,
        fontFamily: F.mono,
        pointerEvents: "none",
        opacity: scrolling ? 0 : 0.45,
        transition: "opacity .8s ease",
      }}
    >
      <div style={{
        fontSize: 7,
        letterSpacing: ".3em",
        color: C.textDim,
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        transform: "rotate(180deg)",
      }}>
        FREE CAMERA ── DRAG TO ORBIT
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FRAME CORNER MARKERS  (four corners, phase-reactive)
// ═══════════════════════════════════════════════════════════════════════════

export function Corners({ chapter }) {
  const ac = CHAPTERS[chapter].accent;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const cornerBase = {
    position: "fixed",
    width: 14, height: 14,
    zIndex: 15,
    pointerEvents: "none",
    opacity: mounted ? 0.22 : 0,
    transition: "opacity 1s ease 1.2s, border-color .5s",
  };

  return <>
    {/* Top-left */}
    <div style={{ ...cornerBase, top: "clamp(20px,3vw,40px)", left: "clamp(24px,4vw,60px)", borderTop: `1px solid ${ac}`, borderLeft: `1px solid ${ac}` }} />
    {/* Top-right */}
    <div style={{ ...cornerBase, top: "clamp(20px,3vw,40px)", right: "clamp(20px,3vw,40px)",  borderTop: `1px solid ${ac}`, borderRight: `1px solid ${ac}` }} />
    {/* Bottom-left */}
    <div style={{ ...cornerBase, bottom: "clamp(20px,3vw,40px)", left: "clamp(24px,4vw,60px)", borderBottom: `1px solid ${ac}`, borderLeft: `1px solid ${ac}` }} />
    {/* Bottom-right */}
    <div style={{ ...cornerBase, bottom: "clamp(20px,3vw,40px)", right: "clamp(20px,3vw,40px)", borderBottom: `1px solid ${ac}`, borderRight: `1px solid ${ac}` }} />
  </>;
}
