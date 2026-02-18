import { useState, useEffect } from "react";
import { C, F } from "../constants/design.js";
import { SplitChars, RevealLine } from "./AnimationPrimitives.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// LOADER OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

export function Loader({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(true);
  const [textVis,  setTextVis]  = useState(false);

  useEffect(() => {
    // Small delay so transition is visible
    const showText = setTimeout(() => setTextVis(true), 80);

    let prog = 0;
    const iv = setInterval(() => {
      prog += Math.random() * 10 + 2;
      if (prog >= 100) {
        prog = 100;
        clearInterval(iv);
        setTimeout(() => {
          setVisible(false);
          setTimeout(onDone, 800);
        }, 450);
      }
      setProgress(Math.min(prog, 100));
    }, 90);

    return () => {
      clearInterval(iv);
      clearTimeout(showText);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: C.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity .8s cubic-bezier(.19,1,.22,1)",
        pointerEvents: visible ? "all" : "none",
      }}
    >
      {/* Wordmark */}
      <div style={{ fontSize: "clamp(32px,5vw,56px)", fontFamily: F.display, fontWeight: 300, color: C.text, letterSpacing: ".25em", marginBottom: 40 }}>
        <SplitChars visible={textVis} stagger={0.04} delay={0.1}>ASTRAL</SplitChars>
      </div>

      {/* Sub-tagline */}
      <RevealLine visible={textVis} delay={0.5}>
        <div style={{ fontSize: 9, letterSpacing: ".5em", color: C.textDim, fontFamily: F.mono, marginBottom: 50, textTransform: "uppercase" }}>
          Satellite Collision Prediction
        </div>
      </RevealLine>

      {/* Progress track */}
      <div style={{
        width: "clamp(200px,30vw,300px)", height: 1,
        background: C.dim06, borderRadius: 1, overflow: "hidden",
        opacity: textVis ? 1 : 0,
        transition: "opacity .5s ease .8s",
      }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: `linear-gradient(90deg,${C.blue},${C.cyan})`,
          transition: "width .2s",
          boxShadow: `0 0 10px ${C.blue}66`,
        }} />
      </div>

      {/* Percentage */}
      <div style={{
        marginTop: 16, fontSize: 10,
        fontFamily: F.mono, color: C.textMicro, letterSpacing: ".2em",
        opacity: textVis ? 1 : 0,
        transition: "opacity .5s ease .9s",
      }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDGE VIGNETTES  (top / bottom / sides)
// ═══════════════════════════════════════════════════════════════════════════

export function Vignettes() {
  return (
    <>
      {/* Bottom gradient */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "25vh", background: "linear-gradient(to top,rgba(1,8,18,.72),transparent)", pointerEvents: "none", zIndex: 10 }} />
      {/* Top gradient */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "15vh", background: "linear-gradient(to bottom,rgba(1,8,18,.65),transparent)", pointerEvents: "none", zIndex: 10 }} />
      {/* Left gradient */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "8vw", background: "linear-gradient(to right,rgba(1,8,18,.3),transparent)", pointerEvents: "none", zIndex: 10 }} />
      {/* Right gradient */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "8vw", background: "linear-gradient(to left,rgba(1,8,18,.3),transparent)", pointerEvents: "none", zIndex: 10 }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS GRAIN OVERLAY  (animated noise texture)
// ═══════════════════════════════════════════════════════════════════════════

export function Grain() {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        pointerEvents: "none",
        opacity: 0.028,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px",
      }}
    />
  );
}
