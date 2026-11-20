import { useEffect, useRef } from 'preact/hooks';
import type { Background as Bg } from '../lib/prefs';

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Paisagem sorteada (opção "Trocar por outro"), desenhada uma vez em canvas. */
function paint(c: HTMLCanvasElement, seed: number) {
  const x = c.getContext('2d');
  if (!x) return;
  const W = c.width;
  const H = c.height;
  const r = rng(seed);
  const h = Math.floor(r() * 360);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `hsl(${h},45%,${18 + r() * 14}%)`);
  g.addColorStop(0.6, `hsl(${(h + 40) % 360},55%,${40 + r() * 20}%)`);
  g.addColorStop(1, `hsl(${(h + 70) % 360},60%,${55 + r() * 15}%)`);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,240,210,.85)';
  x.beginPath();
  x.arc(W * (0.45 + r() * 0.45), H * (0.25 + r() * 0.25), 18 + r() * 40, 0, 7);
  x.fill();
  for (let L = 0; L < 5; L++) {
    const base = H * (0.45 + L * 0.11);
    const amp = 30 + r() * 70;
    const f = 0.004 + r() * 0.01;
    const ph = r() * 9;
    x.fillStyle = `hsl(${(h + 200 + L * 8) % 360},35%,${30 - L * 5}%)`;
    x.beginPath();
    x.moveTo(0, H);
    for (let X = 0; X <= W; X += 8) x.lineTo(X, base - Math.sin(X * f + ph) * amp - Math.sin(X * f * 2.7 + ph) * amp * 0.35);
    x.lineTo(W, H);
    x.fill();
  }
}

export function Background({ mode, seed }: { mode: Bg; seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (mode === 'rand' && ref.current) paint(ref.current, seed);
  }, [mode, seed]);
  return (
    <>
      {mode === 'img' ? <img class="fill bg-img" src="./bg.jpg" alt="" /> : null}
      {mode === 'rand' ? <canvas ref={ref} class="fill bg-canvas" width={960} height={540} /> : null}
      {mode === 'off' ? <div class="fill bg-plain" /> : null}
      <div class="fill scrim" />
    </>
  );
}
