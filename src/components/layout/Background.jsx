import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';

/** Subtle animated grid: faint lines plus a few drifting "data pulses" along
 *  the grid lines. Disabled when reduced motion is on or the user turns it off. */
export default function Background() {
  const ref = useRef(null);
  const { state, reducedMotion } = useApp();
  const animate = state.prefs.particles && !reducedMotion;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let w = 0;
    let h = 0;
    const GAP = 48;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const styles = getComputedStyle(document.documentElement);
    const lineColor = styles.getPropertyValue('--grid-line').trim() || 'rgba(120,150,255,0.07)';
    const cyan = styles.getPropertyValue('--cyan').trim() || '#22d3ee';
    const violet = styles.getPropertyValue('--violet').trim() || '#8b5cf6';
    const pulses = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = () => {
      const horizontal = Math.random() < 0.5;
      pulses.push({
        horizontal,
        line: Math.floor(Math.random() * ((horizontal ? h : w) / GAP)) * GAP,
        pos: -60,
        speed: 0.6 + Math.random() * 1.2,
        color: Math.random() < 0.6 ? cyan : violet,
      });
    };
    const drawGrid = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0.5; x < w; x += GAP) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0.5; y < h; y += GAP) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    };
    const frame = () => {
      drawGrid();
      if (pulses.length < 6 && Math.random() < 0.02) spawn();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.pos += p.speed;
        const len = 70;
        const grad = p.horizontal
          ? ctx.createLinearGradient(p.pos - len, 0, p.pos, 0)
          : ctx.createLinearGradient(0, p.pos - len, 0, p.pos);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, p.color);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (p.horizontal) { ctx.moveTo(p.pos - len, p.line + 0.5); ctx.lineTo(p.pos, p.line + 0.5); }
        else { ctx.moveTo(p.line + 0.5, p.pos - len); ctx.lineTo(p.line + 0.5, p.pos); }
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (p.pos - len > (p.horizontal ? w : h)) pulses.splice(i, 1);
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    if (animate) raf = requestAnimationFrame(frame);
    else drawGrid();
    const onResizeStatic = () => { if (!animate) drawGrid(); };
    window.addEventListener('resize', onResizeStatic);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', onResizeStatic);
    };
  }, [animate, state.theme]);

  return (
    <>
      <div className="bg-wash" aria-hidden="true" />
      <canvas ref={ref} className="bg-canvas" aria-hidden="true" />
    </>
  );
}
