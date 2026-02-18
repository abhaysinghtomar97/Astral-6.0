import { useRef, useState, useEffect, useCallback } from "react";
import { clamp, outExpo } from "../utils/math.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEXT ANIMATION PRIMITIVES  (anime.js grade)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Character-level staggered text reveal with spring physics.
 */
export function SplitChars({ children, visible = true, delay = 0, stagger = 0.022, style = {} }) {
  const text = String(children);
  return (
    <span style={{ display: "inline-block", ...style }} aria-label={text}>
      {text.split("").map((c, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: "inline-block",
            transform: visible ? "translateY(0) rotateX(0)" : "translateY(120%) rotateX(-80deg)",
            opacity: visible ? 1 : 0,
            transition: `transform 0.9s cubic-bezier(0.19,1,0.22,1) ${delay + i * stagger}s, opacity 0.5s ease ${delay + i * stagger}s`,
            transformOrigin: "bottom center",
            whiteSpace: c === " " ? "pre" : "normal",
            willChange: "transform, opacity",
          }}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
}

/**
 * Single line that slides up / fades into view.
 */
export function RevealLine({ children, delay = 0, visible = true, style = {} }) {
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div
        style={{
          transform: visible ? "translateY(0)" : "translateY(105%)",
          opacity: visible ? 1 : 0,
          transition: `transform 1.1s cubic-bezier(0.19,1,0.22,1) ${delay}s, opacity 0.7s ease ${delay}s`,
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Animated number counter — anime.js signature effect.
 * Counts from 0 to `value` with outExpo easing.
 */
export function AnimatedNumber({ value, duration = 1200, visible = true }) {
  const [display, setDisplay] = useState("0");
  const rafRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setDisplay("0");
      return;
    }

    const numericVal = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(numericVal)) {
      setDisplay(value);
      return;
    }

    const suffix = value.replace(/[0-9,]/g, "");
    const start  = performance.now();

    const tick = now => {
      const t       = clamp((now - start) / duration);
      const eased   = outExpo(t);
      const current = Math.round(numericVal * eased);
      setDisplay(current.toLocaleString() + suffix);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, visible, duration]);

  return <span>{display}</span>;
}

/**
 * Magnetic hover element — cursor is attracted toward the element center.
 */
export function Magnetic({ children, strength = 0.3, style = {} }) {
  const ref = useRef(null);
  const [off, setOff] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback(e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setOff({
      x: (e.clientX - r.left - r.width  / 2) * strength,
      y: (e.clientY - r.top  - r.height / 2) * strength,
    });
  }, [strength]);

  const onMouseLeave = useCallback(() => setOff({ x: 0, y: 0 }), []);

  return (
    <div
      ref={ref}
      data-magnetic
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        ...style,
        transform: `translate(${off.x}px,${off.y}px)`,
        transition: "transform 0.4s cubic-bezier(0.19,1,0.22,1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
