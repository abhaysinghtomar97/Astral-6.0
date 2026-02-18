import { useEffect, useRef } from 'react';

export default function GlobeCanvas() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const tRef      = useRef(0);

  useEffect(() => {
    const gc = canvasRef.current;
    if (!gc) return;
    const gx = gc.getContext('2d');
    const GW = 680, GH = 680, GCX = GW / 2, GCY = GH / 2, GR = 260;

    const nodes = [
      {la:0.5,lo:0.3},{la:-0.3,lo:0.8},{la:0.7,lo:-0.5},{la:-0.6,lo:0.1},
      {la:0.2,lo:0.9},{la:0.8,lo:0.6},{la:-0.4,lo:-0.7},{la:0.1,lo:-0.3},
      {la:0.6,lo:-0.1},{la:-0.1,lo:0.55},{la:0.4,lo:0.2},{la:-0.5,lo:-0.4},
    ];

    function draw(t) {
      gx.clearRect(0, 0, GW, GH);

      // Outer glow
      const og = gx.createRadialGradient(GCX, GCY, GR * 0.85, GCX, GCY, GR * 1.4);
      og.addColorStop(0, 'rgba(60,100,220,0.12)'); og.addColorStop(1, 'transparent');
      gx.beginPath(); gx.arc(GCX, GCY, GR * 1.4, 0, Math.PI * 2);
      gx.fillStyle = og; gx.fill();

      gx.save();
      gx.beginPath(); gx.arc(GCX, GCY, GR, 0, Math.PI * 2); gx.clip();

      // Base
      const bg = gx.createRadialGradient(GCX - 60, GCY - 60, 20, GCX, GCY, GR);
      bg.addColorStop(0, '#1a2a6e'); bg.addColorStop(0.6, '#0c1540'); bg.addColorStop(1, '#050c28');
      gx.fillStyle = bg; gx.fillRect(0, 0, GW, GH);

      // Longitude lines
      gx.strokeStyle = 'rgba(79,143,255,0.07)'; gx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.08;
        const x1 = GCX + GR * Math.cos(a);
        gx.beginPath();
        gx.moveTo(GCX, GCY - GR);
        gx.bezierCurveTo(x1, GCY - GR / 2, x1, GCY + GR / 2, GCX, GCY + GR);
        gx.stroke();
      }
      // Latitude lines
      for (let i = 1; i < 6; i++) {
        const y = GCY - GR + i * (GR * 2 / 6);
        const hw = Math.sqrt(Math.max(0, GR * GR - (y - GCY) * (y - GCY)));
        gx.beginPath(); gx.ellipse(GCX, y, hw, hw * 0.2, 0, 0, Math.PI * 2); gx.stroke();
      }

      // Data nodes
      nodes.forEach((n, i) => {
        const angle = n.lo * Math.PI + t * 0.08;
        const px = GCX + GR * n.la * Math.cos(angle);
        const py = GCY + GR * 0.9 * n.la * Math.sin(angle) * 0.5 + GR * (1 - Math.abs(n.la)) * n.lo * 0.3;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i * 0.8);
        gx.beginPath(); gx.arc(px, py, 2, 0, Math.PI * 2);
        gx.fillStyle = `rgba(79,143,255,${0.4 + pulse * 0.5})`; gx.fill();
        if (pulse > 0.7) {
          gx.beginPath(); gx.arc(px, py, 5 + pulse * 4, 0, Math.PI * 2);
          gx.strokeStyle = `rgba(79,143,255,${0.15 * pulse})`; gx.lineWidth = 1; gx.stroke();
        }
      });

      // Light beams
      for (let i = 0; i < 5; i++) {
        const bx = GCX + (Math.sin(t * 0.3 + i * 1.2) * 0.7) * GR;
        const by = GCY + (Math.cos(t * 0.2 + i * 0.9) * 0.3) * GR * 0.5;
        const blen = 60 + Math.sin(t + i) * 30;
        const bg2 = gx.createLinearGradient(bx, by, bx + 10, by - blen);
        bg2.addColorStop(0, 'rgba(100,160,255,0.35)'); bg2.addColorStop(1, 'transparent');
        gx.beginPath();
        gx.moveTo(bx - 2, by); gx.lineTo(bx + 2, by);
        gx.lineTo(bx + 4, by - blen); gx.lineTo(bx - 4, by - blen);
        gx.closePath(); gx.fillStyle = bg2; gx.fill();
      }

      // Atmosphere
      const ar = gx.createRadialGradient(GCX, GCY, GR * 0.8, GCX, GCY, GR);
      ar.addColorStop(0, 'transparent'); ar.addColorStop(1, 'rgba(60,100,255,0.2)');
      gx.fillStyle = ar; gx.fillRect(0, 0, GW, GH);

      gx.restore();

      // Orbit rings + satellites
      gx.save(); gx.translate(GCX, GCY);
      const rings = [{ rx: GR + 30, ry: 22, a: 0.06 }, { rx: GR + 55, ry: 36, a: -0.04 }];
      rings.forEach((r, ri) => {
        gx.save();
        gx.rotate(t * r.a);
        gx.scale(1, r.ry / r.rx);
        gx.beginPath(); gx.arc(0, 0, r.rx, 0, Math.PI * 2);
        gx.strokeStyle = 'rgba(79,143,255,0.1)'; gx.lineWidth = 1; gx.stroke();
        const sx = r.rx * Math.cos(t * (ri ? 1.1 : 0.7));
        const sy = r.rx * Math.sin(t * (ri ? 1.1 : 0.7));
        gx.beginPath(); gx.arc(sx, sy, 3, 0, Math.PI * 2);
        gx.fillStyle = 'rgba(120,180,255,0.7)'; gx.fill();
        gx.restore();
      });
      gx.restore();
    }

    function loop() { tRef.current += 0.016; draw(tRef.current); rafRef.current = requestAnimationFrame(loop); }
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={680}
      height={680}
      style={{
        position: 'absolute',
        top: '-5%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(65vw, 680px)',
        height: 'min(65vw, 680px)',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.9,
      }}
    />
  );
}
