import { useEffect, useRef } from 'react';

function lighten(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amt) { return lighten(hex, -amt); }

export default function PlanetCanvas({ def, size = 180 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = size, H = size, cx = W / 2, cy = H / 2, R = W * 0.422;

    function draw(t) {
      ctx.clearRect(0, 0, W, H);

      // Outer glow
      const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.5);
      glowGrad.addColorStop(0, def.glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad; ctx.fill();

      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

      // Base radial gradient
      const baseGrad = ctx.createRadialGradient(cx - 22, cy - 22, 4, cx, cy, R);
      baseGrad.addColorStop(0, lighten(def.baseColor, 40));
      baseGrad.addColorStop(0.5, def.baseColor);
      baseGrad.addColorStop(1, darken(def.baseColor, 40));
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, W, H);

      // Rotating wavy bands
      const bandH = (R * 2) / def.bands.length;
      const scrollX = (t * 18) % W;
      def.bands.forEach((color, i) => {
        const y = (cy - R) + i * bandH;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(scrollX * 0.04 + i) * 4);
        for (let x = 0; x <= W; x += 6) {
          ctx.lineTo(x, y + bandH * 0.5 + Math.sin((x + scrollX) * 0.04 + i * 1.3) * 5);
        }
        ctx.lineTo(W, y + bandH); ctx.lineTo(0, y + bandH); ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Storm spot
      const spotX = cx + Math.cos(t * 0.4) * 20;
      const spotGrad = ctx.createRadialGradient(spotX, cy + 10, 2, spotX, cy + 10, 16);
      spotGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad; ctx.fillRect(0, 0, W, H);

      // Atmosphere rim
      const atmGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R);
      atmGrad.addColorStop(0, 'transparent');
      atmGrad.addColorStop(1, def.atmosColor);
      ctx.fillStyle = atmGrad; ctx.fillRect(0, 0, W, H);

      // Specular highlight
      const specGrad = ctx.createRadialGradient(cx - 28, cy - 28, 2, cx - 28, cy - 28, 40);
      specGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
      specGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = specGrad; ctx.fillRect(0, 0, W, H);

      ctx.restore();

      // Saturn-style rings
      if (def.rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.28);
        for (let ri = 0; ri < 3; ri++) {
          const ir = R + 8 + ri * 9;
          const or = ir + 5;
          const rg = ctx.createRadialGradient(0, 0, ir, 0, 0, or);
          rg.addColorStop(0, 'rgba(56,217,169,0.0)');
          rg.addColorStop(0.3, 'rgba(56,217,169,0.22)');
          rg.addColorStop(1, 'rgba(56,217,169,0.0)');
          ctx.beginPath();
          ctx.arc(0, 0, or, 0, Math.PI * 2);
          ctx.arc(0, 0, ir, Math.PI * 2, 0, true);
          ctx.fillStyle = rg; ctx.fill();
        }
        ctx.restore();
      }
    }

    function loop() {
      tRef.current += 0.012;
      draw(tRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => cancelAnimationFrame(rafRef.current);
  }, [def, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '50%', position: 'absolute', inset: 0 }}
    />
  );
}
