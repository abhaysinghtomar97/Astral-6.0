import { useRef, useEffect, memo } from "react";
import { ACCENT, C, F } from "../constants/design.js";
import { spring } from "../utils/math.js";

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM CURSOR  (igloo.inc grade)
// ═══════════════════════════════════════════════════════════════════════════

const Cursor = memo(function Cursor({ chapter, scrolling }) {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const labelRef = useRef(null);

  const pos     = useRef({ x: -100, y: -100 });
  const dotPos  = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const scale   = useRef({ v: 1, vel: 0 });
  const hovering = useRef(false);
  const label    = useRef("");

  useEffect(() => {
    const onMouseMove = e => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = e => {
      const el = e.target.closest("[data-magnetic], a, button, [data-hover]");
      hovering.current = !!el;
      label.current    = el?.getAttribute("data-cursor-label") || "";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });

    let raf;
    const tick = () => {
      // Dot follows fast
      dotPos.current.x  += (pos.current.x - dotPos.current.x)  * 0.2;
      dotPos.current.y  += (pos.current.y - dotPos.current.y)  * 0.2;

      // Ring follows slower — igloo.inc lag effect
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.08;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.08;

      // Spring scale
      const target = hovering.current ? 3.2 : scrolling ? 0.5 : 1;
      const s = spring(scale.current.v, target, scale.current.vel, 0.06, 0.72);
      scale.current = { v: s.value, vel: s.velocity };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotPos.current.x - 4}px,${dotPos.current.y - 4}px) scale(${scale.current.v})`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform    = `translate(${ringPos.current.x - 24}px,${ringPos.current.y - 24}px) scale(${scale.current.v * 0.45 + 0.55})`;
        ringRef.current.style.borderColor  = ACCENT[chapter];
      }

      if (labelRef.current) {
        labelRef.current.textContent = label.current;
        labelRef.current.style.opacity   = label.current ? "1" : "0";
        labelRef.current.style.transform = `translate(${ringPos.current.x + 28}px,${ringPos.current.y - 8}px)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, [chapter, scrolling]);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: 8, height: 8, borderRadius: "50%",
          background: C.text,
          pointerEvents: "none", zIndex: 9999,
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      />

      {/* Outer ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: 48, height: 48, borderRadius: "50%",
          border: `1px solid ${ACCENT[0]}`,
          pointerEvents: "none", zIndex: 9998,
          opacity: 0.4,
          willChange: "transform",
          transition: "border-color 0.5s ease",
        }}
      />

      {/* Context label */}
      <div
        ref={labelRef}
        style={{
          position: "fixed", top: 0, left: 0,
          pointerEvents: "none", zIndex: 9997,
          fontFamily: F.mono, fontSize: 8,
          letterSpacing: "0.2em",
          color: ACCENT[chapter],
          opacity: 0,
          transition: "opacity 0.3s",
          willChange: "transform",
        }}
      />
    </>
  );
});

export default Cursor;
