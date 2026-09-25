"use client";

import { useEffect, useRef } from "react";

const CHARSET = " ·`'^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const CHARS = CHARSET.split("");

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function AsciiField({
  className = "",
  word = "VOISSS",
  density = 0.42,
  lime = true,
}: {
  className?: string;
  word?: string;
  density?: number;
  lime?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const hostEl = canvasEl.parentElement as HTMLElement | null;
    if (!hostEl) return;
    const ctxMaybe = canvasEl.getContext("2d", { alpha: true });
    if (!ctxMaybe) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const host: HTMLElement = hostEl;
    const g: CanvasRenderingContext2D = ctxMaybe;

    const m = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (m) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, rect.width, rect.height);
      g.fillStyle = "rgba(214,255,42,0.035)";
      g.font = `600 11px var(--font-mono), ui-monospace, monospace`;
      g.fillText(word, 24, 36);
      return;
    }

    let w = 0,
      h = 0,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf: number | null = null;
    let visible = true;

    const rand = mulberry32(0x9e3779b9);
    const jitter: number[] = [];
    const cellW = 9;
    const cellH = 14;

    const pointer = { x: 0.5, y: 0.35, active: false, vx: 0, vy: 0 };
    let lastPx = 0.5,
      lastPy = 0.35;

    function resize() {
      const rect = host.getBoundingClientRect();
      const nw = Math.max(1, Math.floor(rect.width));
      const nh = Math.max(1, Math.floor(rect.height));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.ceil(w / cellW) + 1;
      const rows = Math.ceil(h / cellH) + 1;
      jitter.length = cols * rows;
      for (let i = 0; i < jitter.length; i++) jitter[i] = (rand() - 0.5) * 0.18;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && raf === null) {
          lastT = performance.now();
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0 }
    );
    io.observe(host);

    let lastT = performance.now();

    function tick(now: number) {
      if (!visible) {
        raf = null;
        lastT = now;
        return;
      }
      raf = requestAnimationFrame(tick);
      const _dt = Math.min(0.033, (now - lastT) / 1000);
      lastT = now;
      const t = now * 0.001;

      const dx = pointer.x - lastPx;
      const dy = pointer.y - lastPy;
      pointer.vx += (dx - pointer.vx) * 0.18;
      pointer.vy += (dy - pointer.vy) * 0.18;
      lastPx = pointer.x;
      lastPy = pointer.y;
      const speed = Math.hypot(pointer.vx, pointer.vy) * 60;

      g.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / cellW);
      const rows = Math.ceil(h / cellH);

      const wordScale = Math.min(w * 0.28, 520) / 520;
      const wordW = 520 * wordScale;
      const wordH = 96 * wordScale;
      const wordX = w * 0.5 - wordW * 0.5;
      const wordY = h * 0.42 - wordH * 0.5;

      const tw = Math.sin(t * 0.5) * 0.06 + Math.cos(t * 0.23) * 0.04;

      g.textBaseline = "middle";
      g.textAlign = "center";
      g.font = `11px var(--font-mono), ui-monospace, monospace`;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const x = col * cellW + cellW * 0.5;
          const y = row * cellH + cellH * 0.5;
          const nx = x / w;
          const ny = y / h;

          let lum =
            0.18 +
            0.12 * Math.sin(nx * 18 + t * 0.9 + jitter[idx % jitter.length] * 6) +
            0.1 * Math.cos(ny * 14 - t * 0.6) +
            0.08 * Math.sin((nx + ny) * 10 + t * 0.4) * (0.7 + density * 0.6) +
            tw;

          if (x > wordX && x < wordX + wordW && y > wordY && y < wordY + wordH) {
            const wx = (x - wordX) / wordW;
            const wy = (y - wordY) / wordH;
            const edgeX = Math.min(wx, 1 - wx) * 2.2;
            const edgeY = Math.min(wy, 1 - wy) * 2.2;
            const inside = Math.min(edgeX, edgeY);
            const letterGaps = Math.sin(wx * 24) * 0.04;
            lum += (0.42 + density * 0.22) * Math.max(0, inside) - letterGaps;
            lum += Math.sin(wx * 6 + t * 0.3) * 0.03;
          }

          if (pointer.active) {
            const dxc = nx - pointer.x;
            const dyc = (ny - pointer.y) * (w / h);
            const dist = Math.hypot(dxc, dyc);
            const R = 0.22;
            if (dist < R) {
              const fall = (1 - dist / R) ** 1.6;
              lum += fall * (0.55 + speed * 0.12);
              lum += fall * (pointer.vx * Math.cos(nx * 10) + pointer.vy * Math.sin(ny * 10)) * 0.15;
            }
          }

          const band = Math.sin(ny * (h / 56) * Math.PI * 2) * 0.035;
          lum += band;
          lum = Math.max(0, Math.min(1, lum));
          if (lum < 0.28) continue;

          const glyphIdx = Math.min(CHARS.length - 1, Math.floor(lum * (CHARS.length - 1)));
          const ch = CHARS[glyphIdx];

          let alpha = 0.18 + lum * 0.62;
          if (x > wordX && x < wordX + wordW && y > wordY && y < wordY + wordH) alpha = Math.min(1, alpha * 1.18);

          if (lum > 0.86) {
            g.fillStyle = `rgba(255,255,255,${alpha * 0.95})`;
          } else if (lum > 0.68) {
            g.fillStyle = lime ? `rgba(214,255,42,${alpha * 0.92})` : `rgba(255,255,255,${alpha * 0.88})`;
          } else if (lum > 0.5) {
            g.fillStyle = `rgba(202,220,255,${alpha * 0.55})`;
          } else {
            g.fillStyle = `rgba(255,255,255,${alpha * 0.32})`;
          }

          const shear = lum > 0.7 ? Math.sin(t * 0.4 + idx * 0.01) * 0.6 : 0;
          g.fillText(ch, x + shear, y);
        }
      }
    }

    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    host.addEventListener("pointermove", onMove as unknown as EventListener, { passive: true } as AddEventListenerOptions);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove as unknown as EventListener);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [word, density, lime]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`absolute inset-0 h-full w-full pointer-events-none ${className}`}
      style={{ opacity: 0.95 }}
    />
  );
}
