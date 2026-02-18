import { useRef, useState, useEffect, useCallback } from "react";
import { PHASES, SCROLL_IDLE_MS } from "../constants/design.js";
import { clamp } from "../utils/math.js";

// ═══════════════════════════════════════════════════════════════════════════
// LOCOMOTIVE-STYLE SMOOTH SCROLL ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export function useLocoScroll() {
  const raw      = useRef(0);
  const smooth   = useRef(0);
  const velocity = useRef(0);
  const scrolling  = useRef(false);
  const idleTimer  = useRef(null);
  const [chapter, setChapter] = useState(0);

  // Raw scroll listener
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      raw.current = max > 0 ? clamp(window.scrollY / max) : 0;
      scrolling.current = true;
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        scrolling.current = false;
      }, SCROLL_IDLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer.current);
    };
  }, []);

  // Smooth scroll interpolation RAF
  useEffect(() => {
    let raf;
    const tick = () => {
      const delta = raw.current - smooth.current;
      const speed = Math.abs(delta) > 0.06 ? 0.055 : 0.028;
      const prev  = smooth.current;

      smooth.current   += delta * speed;
      velocity.current  = smooth.current - prev;

      if (Math.abs(delta) < 0.00003) smooth.current = raw.current;

      const p = smooth.current;
      setChapter(
        p < PHASES.P1 ? 0
        : p < PHASES.P2 ? 1
        : p < PHASES.P3 ? 2
        : p < PHASES.P4 ? 3
        : 4
      );

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { raw, smooth, velocity, scrolling, chapter };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOUSE + DRAG SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export function useMouseSystem() {
  const pos    = useRef({ x: 0, y: 0, cx: 0, cy: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const down   = useRef(false);
  const prev   = useRef({ x: 0, y: 0 });
  const drag   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = e => {
      pos.current = {
        cx: e.clientX,
        cy: e.clientY,
        x:  (e.clientX / window.innerWidth)  * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
      if (down.current) {
        drag.current.x = e.clientX - prev.current.x;
        drag.current.y = e.clientY - prev.current.y;
        prev.current   = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = e => {
      down.current = true;
      prev.current = { x: e.clientX, y: e.clientY };
      drag.current = { x: 0, y: 0 };
    };

    const onMouseUp = () => {
      down.current = false;
      drag.current = { x: 0, y: 0 };
    };

    window.addEventListener("mousemove",  onMouseMove, { passive: true });
    window.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mouseup",    onMouseUp);
    window.addEventListener("touchstart", e => { if (e.touches[0]) onMouseDown(e.touches[0]); }, { passive: true });
    window.addEventListener("touchmove",  e => { if (e.touches[0]) onMouseMove(e.touches[0]); }, { passive: true });
    window.addEventListener("touchend",   onMouseUp);

    // Smooth-follow RAF
    let raf;
    const tick = () => {
      smooth.current.x += (pos.current.x - smooth.current.x) * 0.05;
      smooth.current.y += (pos.current.y - smooth.current.y) * 0.05;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mouseup",    onMouseUp);
    };
  }, []);

  return { pos, smooth, down, drag };
}
