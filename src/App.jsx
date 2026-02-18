import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Constants
import { GLOBAL_CSS } from "./constants/design.js";

// Hooks
import { useLocoScroll, useMouseSystem } from "./hooks/useScroll.js";

// Three.js canvas
import ThreeCanvas from "./components/ThreeCanvas.jsx";

// HUD
import Header from "./components/Header.jsx";
import {
  ChapterOverlay,
  ProgressBar,
  MetricsTicker,
  ScrollHint,
  CameraMode,
  Corners,
} from "./components/HUD.jsx";

// UI Overlays
import Cursor from "./components/Cursor.jsx";
import { Loader, Vignettes, Grain } from "./components/Overlays.jsx";

// Pages
import TeamPage from "./components/TeamPage/index.js";
import NotFound from "./components/NotFound.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCENE (extracted so Router can wrap it)
// ═══════════════════════════════════════════════════════════════════════════

function AstralScene() {
  const { raw, smooth, velocity, scrolling, chapter } = useLocoScroll();
  const mouse = useMouseSystem();

  const [loaded,     setLoaded]     = useState(false);
  const [isScrolling, setIsScrolling] = useState(true);

  // Mirror scrolling ref into state for components that need to re-render
  useEffect(() => {
    let raf;
    const tick = () => {
      setIsScrolling(scrolling.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrolling]);

  const onLoaderDone = useCallback(() => setLoaded(true), []);

  return (
    <>
      {/* ── Global CSS injection ── */}
      <style>{GLOBAL_CSS}</style>

      {/* ── Loading screen ── */}
      {!loaded && <Loader onDone={onLoaderDone} />}

      {/* ── Custom cursor ── */}
      <Cursor chapter={chapter} scrolling={isScrolling} />

      {/* ── Three.js scene (fixed, full-screen) ── */}
      <ThreeCanvas
        progressRef={smooth}
        mouseRef={mouse.smooth}
        scrollingRef={scrolling}
        dragRef={mouse.drag}
        isDownRef={mouse.down}
        velocityRef={velocity}
      />

      {/* ── Scroll space (500 vh) ── */}
      <div id="astral-scroll-space" />

      {/* ── HUD (only after load) ── */}
      {loaded && (
        <>
          <Header chapter={chapter} />
          <ChapterOverlay chapter={chapter} />
          <ProgressBar progress={raw.current} chapter={chapter} />
          <MetricsTicker chapter={chapter} />
          <ScrollHint progress={raw.current} />
          <CameraMode scrolling={isScrolling} />
          <Corners chapter={chapter} />
        </>
      )}

      {/* ── Always-on overlays ── */}
      <Vignettes />
      <Grain />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP — Router wrapper
// ═══════════════════════════════════════════════════════════════════════════

export default function Astral() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AstralScene />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/ml-model" element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  );
}