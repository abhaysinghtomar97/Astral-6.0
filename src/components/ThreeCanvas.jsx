import { useRef, useEffect } from "react";
import { AstralEngine } from "../engine/AstralEngine.js";

// ═══════════════════════════════════════════════════════════════════════════
// THREE.JS CANVAS
// Mounts the AstralEngine and feeds it reactive data each frame via refs.
// ═══════════════════════════════════════════════════════════════════════════

export default function ThreeCanvas({
  progressRef,
  mouseRef,
  scrollingRef,
  dragRef,
  isDownRef,
  velocityRef,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Create engine on mount, dispose on unmount
  useEffect(() => {
    if (!canvasRef.current) return;
    engineRef.current = new AstralEngine(canvasRef.current);
    return () => engineRef.current?.dispose();
  }, []);

  // Feed engine refs each animation frame
  useEffect(() => {
    let raf;
    const tick = () => {
      if (engineRef.current) {
        engineRef.current.setProgress(progressRef.current);
        engineRef.current.setMouse(mouseRef.current.x, mouseRef.current.y);
        engineRef.current.setScrolling(scrollingRef.current);
        engineRef.current.setDragging(isDownRef.current);
        engineRef.current.setDragDelta(dragRef.current.x, dragRef.current.y);
        engineRef.current.setScrollVelocity(velocityRef.current);

        // Consume drag delta — engine applies it then it resets
        dragRef.current.x = 0;
        dragRef.current.y = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, mouseRef, scrollingRef, dragRef, isDownRef, velocityRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
}
