import { useEffect, useRef } from "react";
import { useInView } from "../lib/hooks";

// ————————————————————————————————————————————————————————————————
// CanvasVideo — procedural "broadcast" renderers, one per category.
// Stands in for the LL-HLS player (hls.js) in the real pipeline; the
// player chrome, ABR quality switching and overlays are identical.
// ————————————————————————————————————————————————————————————————

type Props = {
  category: string;
  seed: number;
  playing?: boolean;
  quality?: "1080p60" | "720p" | "480p";
  className?: string;
};

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CanvasVideo({ category, seed, playing = true, quality = "1080p60", className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const playingRef = useRef(playing);
  playingRef.current = playing && inView && !document.hidden;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = quality === "480p" ? 0.35 : quality === "720p" ? 0.6 : 0.85;
    let raf = 0;
    let W = 0, H = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(2, Math.round(r.width * scale));
      H = Math.max(2, Math.round(r.height * scale));
      canvas.width = W; canvas.height = H;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const rnd = mulberry(seed * 7919 + 17);
    const stars = Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), z: rnd() * 0.9 + 0.1, s: rnd() }));
    const bars = Array.from({ length: 48 }, () => ({ p: rnd() * Math.PI * 2, f: 0.6 + rnd() * 1.8 }));
    const glyphs = Array.from({ length: 60 }, () => ({ x: rnd(), y: rnd(), v: 0.4 + rnd(), c: String.fromCharCode(33 + Math.floor(rnd() * 93)) }));
    const blobs = Array.from({ length: 5 }, () => ({ x: rnd(), y: rnd(), r: 0.25 + rnd() * 0.35, h: rnd() * 60 - 30, v: 0.2 + rnd() * 0.5 }));
    const ribbons = Array.from({ length: 6 }, (_, i) => ({ off: rnd() * 10, amp: 0.1 + rnd() * 0.2, hue: i * 22 }));
    const hueBase = (seed * 47) % 360;

    const t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!playingRef.current) return;
      const t = (now - t0) / 1000;

      // base wash
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, `hsl(${hueBase}, 45%, 7%)`);
      g.addColorStop(1, `hsl(${(hueBase + 60) % 360}, 50%, 11%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (category === "gaming") {
        // starfield + perspective floor grid + speed streaks
        ctx.save();
        for (const s of stars) {
          const z = (s.z + t * 0.05 * s.s) % 1;
          const x = (s.x - 0.5) / (z + 0.12) * W * 0.5 + W / 2;
          const y = (s.y - 0.5) / (z + 0.12) * H * 0.35 + H * 0.42;
          const r = (1 - z) * 2.2;
          ctx.fillStyle = `hsla(${hueBase + 140}, 90%, ${60 + z * 30}%, ${0.15 + (1 - z) * 0.6})`;
          ctx.fillRect(x, y, r, r);
        }
        const horizon = H * 0.52;
        const gg = ctx.createLinearGradient(0, horizon, 0, H);
        gg.addColorStop(0, `hsla(${hueBase}, 90%, 55%, 0.25)`);
        gg.addColorStop(1, `hsla(${hueBase}, 90%, 45%, 0.02)`);
        ctx.fillStyle = gg;
        ctx.fillRect(0, horizon, W, H - horizon);
        ctx.strokeStyle = `hsla(${hueBase}, 95%, 62%, 0.5)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
          const z = ((i / 14 + t * 0.35) % 1);
          const y = horizon + z * z * (H - horizon);
          ctx.globalAlpha = 0.12 + z * 0.5;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.globalAlpha = 0.35;
        for (let i = -10; i <= 10; i++) {
          ctx.beginPath();
          ctx.moveTo(W / 2 + i * W * 0.012, horizon);
          ctx.lineTo(W / 2 + i * W * 0.14, H);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = `hsla(${(hueBase + 140) % 360}, 100%, 70%, 0.9)`;
        ctx.beginPath(); ctx.arc(W / 2, horizon, 3 + Math.sin(t * 3) * 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (category === "music") {
        const n = bars.length;
        const bw = W / n;
        for (let i = 0; i < n; i++) {
          const v = (Math.sin(t * bars[i].f + bars[i].p) + 1) / 2;
          const h = v * H * 0.62 + H * 0.04;
          const hue = hueBase + (i / n) * 90;
          const grd = ctx.createLinearGradient(0, H, 0, H - h);
          grd.addColorStop(0, `hsla(${hue}, 90%, 55%, 0.95)`);
          grd.addColorStop(1, `hsla(${hue + 40}, 90%, 65%, 0.25)`);
          ctx.fillStyle = grd;
          ctx.fillRect(i * bw + 1, H - h, bw - 2, h);
          ctx.fillStyle = `hsla(${hue}, 95%, 75%, ${0.5 + v * 0.5})`;
          ctx.fillRect(i * bw + 1, H - h - 3, bw - 2, 3);
        }
        ctx.strokeStyle = `hsla(${hueBase + 60}, 90%, 70%, 0.25)`;
        for (let r = 0; r < 3; r++) {
          const rad = ((t * 0.22 + r / 3) % 1) * Math.min(W, H) * 0.55;
          ctx.globalAlpha = 1 - rad / (Math.min(W, H) * 0.55);
          ctx.beginPath(); ctx.arc(W / 2, H * 0.42, rad, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (category === "code") {
        ctx.font = `${Math.max(9, H * 0.035)}px JetBrains Mono, monospace`;
        for (const gl of glyphs) {
          gl.y = (gl.y + gl.v * 0.004) % 1.1;
          const a = gl.y < 0.9 ? 0.12 + gl.v * 0.5 : (1.1 - gl.y) * 3;
          ctx.fillStyle = `hsla(${150 + gl.v * 40}, 85%, ${50 + gl.v * 25}%, ${Math.min(0.85, a)})`;
          ctx.fillText(gl.c, gl.x * W, gl.y * H);
        }
        const caret = Math.floor(t * 2) % 2 === 0;
        if (caret) { ctx.fillStyle = "hsla(165, 95%, 65%, 0.9)"; ctx.fillRect(W * 0.12, H * 0.82, W * 0.018, H * 0.035); }
        ctx.fillStyle = "hsla(165, 40%, 75%, 0.25)";
        for (let i = 0; i < 8; i++) ctx.fillRect(W * 0.12, H * (0.14 + i * 0.075), W * (0.2 + ((Math.sin(i * 3.7) + 1) / 2) * 0.45), H * 0.022);
      } else if (category === "art") {
        for (const rb of ribbons) {
          ctx.beginPath();
          for (let x = 0; x <= W; x += 6) {
            const y = H / 2 + Math.sin(x * 0.012 + t * 0.7 + rb.off) * H * rb.amp + Math.sin(x * 0.004 - t * 0.3) * H * 0.12;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `hsla(${(hueBase + rb.hue + t * 6) % 360}, 80%, 62%, 0.5)`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      } else if (category === "sports") {
        // floodlit court + ball with motion trail
        ctx.strokeStyle = "hsla(0, 0%, 100%, 0.28)";
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.08, H * 0.2, W * 0.84, H * 0.62);
        ctx.beginPath(); ctx.arc(W / 2, H * 0.51, H * 0.16, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, H * 0.2); ctx.lineTo(W / 2, H * 0.82); ctx.stroke();
        for (let i = 0; i < 18; i++) {
          const tt = t - i * 0.035;
          const bx = W / 2 + Math.sin(tt * 1.7) * W * 0.32;
          const by = H * 0.51 + Math.sin(tt * 3.1) * H * 0.22;
          ctx.fillStyle = `hsla(${hueBase + 40}, 95%, 62%, ${0.5 - i * 0.026})`;
          ctx.beginPath(); ctx.arc(bx, by, Math.max(2, H * 0.03 - i * 0.4), 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // IRL — drifting practical lights, golden-hour bokeh + grain
        for (const b of blobs) {
          const x = (b.x + Math.sin(t * 0.11 * b.v) * 0.2) * W;
          const y = (b.y + Math.cos(t * 0.09 * b.v) * 0.14) * H;
          const r = b.r * Math.min(W, H) * (1 + Math.sin(t * 0.5 + b.h) * 0.06);
          const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
          rg.addColorStop(0, `hsla(${hueBase + b.h}, 70%, 60%, 0.5)`);
          rg.addColorStop(1, "hsla(0, 0%, 0%, 0)");
          ctx.fillStyle = rg;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        ctx.fillStyle = "rgba(255,255,255,0.028)";
        for (let i = 0; i < 90; i++) ctx.fillRect(((i * 97 + t * 40) % W), ((i * 173) % H), 1.4, 1.4);
      }

      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [category, seed, quality]);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-ink-950 ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ imageRendering: quality === "480p" ? "pixelated" : "auto" }}
        role="img"
        aria-label={`Live broadcast preview — ${category}`}
      />
      <div className="scanlines absolute inset-0" aria-hidden="true" />
    </div>
  );
}
