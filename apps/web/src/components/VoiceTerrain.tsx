"use client";

import { useEffect, useRef } from "react";
import { getSettleSplit, getVoiceEnergy, onVoicePulse } from "@/lib/terrain-bus";

/**
 * VoiceTerrain — VOISSS signature field ("Licensed Signal")
 *
 * Sylva-lite (MengTo/sylva lineage): procedural, pointer-responsive, sandboxed to hero.
 *  - 12 seeded ribbons (waveforms) + ~700 instanced grains (voice dust)
 *  - Pointer parts the field + releases a short pollen trail on fast strokes
 *  - ONE rAF, DPR capped at 2, seeded PRNG = deterministic landscape per load
 *  - prefers-reduced-motion → paints one static frame, no loop, no listeners
 *  - Canvas2D only (no Three.js), no external requests, no layout reads in the loop
 */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RIBBON_COUNT = 12;
const GRAIN_COUNT = 700;
const MAX_POLLEN = 90;
const MAX_TRAIL = 26;
const MAX_RIPPLES = 4;

export default function VoiceTerrain({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const parentEl = canvasEl.parentElement;
    if (!parentEl) return;

    const ctxMaybe = canvasEl.getContext("2d", { alpha: true });
    if (!ctxMaybe) return;

    // Non-null aliases — keeps TS narrowing inside nested closures
    const canvas: HTMLCanvasElement = canvasEl;
    const g: CanvasRenderingContext2D = ctxMaybe;
    const host: HTMLElement = parentEl;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rand = mulberry32(0x51a5f19c); // VOISSS seed

    const pointer = { x: 0.72, y: 0.48, tx: 0.72, ty: 0.48, vx: 0, vy: 0, active: false };

    const trail: Array<{ x: number; y: number; life: number }> = [];
    const pollen: Array<{ x: number; y: number; vx: number; vy: number; life: number; r: number }> = [];
    // traveling wavefronts — a licensed voice crossing the field
    const ripples: Array<{ x: number; speed: number; life: number }> = [];

    // continuous life: smoothed voice energy + ambient breath + settle pulse
    let energy = 0;
    let ambiance = 0; // smoothed breath, so nothing ever sits perfectly still
    let settle = 0; // 0..1 — decays after an agent pays (70/30 split sweep)
    let nextAmbientRipple = 2.6;

    const ribbons = Array.from({ length: RIBBON_COUNT }, (_, i) => ({
      y: 0.18 + (i / (RIBBON_COUNT - 1)) * 0.64,
      phase: rand() * Math.PI * 2,
      amp: 0.018 + rand() * 0.028,
      freq: 1.6 + rand() * 2.2,
      speed: 0.2 + rand() * 0.35,
      thickness: 0.8 + rand() * 1.1,
      opacity: 0.22 - i * 0.008,
    }));

    const grains = Array.from({ length: GRAIN_COUNT }, () => ({
      bx: rand(),
      by: rand(),
      ox: (rand() - 0.5) * 0.04,
      oy: (rand() - 0.5) * 0.04,
      r: rand() * 1.1 + 0.35,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.9,
      cyan: rand() > 0.62,
    }));

    function resize() {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (w === width && h === height) return;
      width = w;
      height = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prefersReduced) drawStatic();
    }

    function drawStatic() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, height);

      const glow = g.createRadialGradient(
        width * 0.72,
        height * 0.45,
        0,
        width * 0.72,
        height * 0.45,
        Math.max(width, height) * 0.85
      );
      glow.addColorStop(0, "rgba(214,255,42,0.10)");
      glow.addColorStop(0.45, "rgba(34,211,238,0.05)");
      glow.addColorStop(1, "rgba(10,10,10,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, width, height);

      for (let i = 0; i < RIBBON_COUNT; i++) {
        const rb = ribbons[i];
        const baseY = height * rb.y;
        g.strokeStyle = `rgba(214,255,42,${Math.max(0.05, rb.opacity * 0.7)})`;
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const nx = x / width;
          const wy = Math.sin(nx * Math.PI * rb.freq + rb.phase) * rb.amp * height;
          if (x === 0) g.moveTo(x, baseY + wy);
          else g.lineTo(x, baseY + wy);
        }
        g.stroke();
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    if (prefersReduced) {
      return () => ro.disconnect();
    }

    // discrete voice moments: a voice lifts off, or an agent settles 70/30
    const unsubscribe = onVoicePulse((pulse) => {
      if (pulse === "settle") {
        settle = 1;
        ripples.push({ x: 0.72, speed: 0.5, life: 1 });
      } else {
        ripples.push({ x: -0.12, speed: 0.62, life: 1 });
      }
      if (ripples.length > MAX_RIPPLES) ripples.splice(0, ripples.length - MAX_RIPPLES);
    });

    let lastT = performance.now();
    let trailTick = 0;

    // Pause all work when the hero is scrolled away — no point painting a
    // canvas nobody is looking at, and it keeps the field free on long pages.
    let visible = true;
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && rafRef.current === null) {
          lastT = performance.now();
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0 }
    );
    visibility.observe(host);

    function tick(now: number) {
      if (!visible) {
        // stop the chain entirely; the observer restarts it on the way back
        rafRef.current = null;
        lastT = now;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
      const dt = Math.min(0.033, (now - lastT) / 1000);
      lastT = now;
      const t = now * 0.001;

      const lerp = 0.085;
      const dx = pointer.tx - pointer.x;
      const dy = pointer.ty - pointer.y;
      pointer.vx = dx * 0.5;
      pointer.vy = dy * 0.5;
      pointer.x += dx * lerp;
      pointer.y += dy * lerp;

      const speed = Math.hypot(pointer.vx, pointer.vy);

      if (pointer.active && speed > 0.002) {
        const count = speed > 0.008 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          pollen.push({
            x: pointer.x + (rand() - 0.5) * 0.015,
            y: pointer.y + (rand() - 0.5) * 0.015,
            vx: (rand() - 0.5) * 0.012 - pointer.vx * 0.5,
            vy: (rand() - 0.5) * 0.012 - pointer.vy * 0.5,
            life: 1,
            r: rand() * 1.2 + 0.5,
          });
        }
        if (pollen.length > MAX_POLLEN) pollen.splice(0, pollen.length - MAX_POLLEN);
      }

      // trail — at most one node per ~4 frames (never per-grain)
      trailTick += 1;
      if (pointer.active && speed > 0.0035 && trailTick % 4 === 0) {
        trail.push({ x: pointer.x, y: pointer.y, life: 0.85 });
        if (trail.length > MAX_TRAIL) trail.shift();
      }

      // ── life: voice energy + ambient breath ─────────────────────────────
      const targetEnergy = getVoiceEnergy();
      energy += (targetEnergy - energy) * (targetEnergy > energy ? 0.12 : 0.05);
      // always breathing — the field must never look paused
      ambiance = 0.5 + 0.5 * Math.sin(t * 0.34) * Math.sin(t * 0.11 + 1.7);

      if (energy > 0.05) {
        // while a licensed voice speaks, the whole field exhales pollen
        const spawn = energy > 0.6 ? 3 : energy > 0.3 ? 2 : 1;
        for (let i = 0; i < spawn; i++) {
          pollen.push({
            x: 0.06 + rand() * 0.88,
            y: 0.16 + rand() * 0.66,
            vx: (rand() - 0.5) * 0.006,
            vy: -0.002 - rand() * 0.004,
            life: 0.5 + rand() * 0.5,
            r: rand() * 1.1 + 0.45,
          });
        }
        if (pollen.length > MAX_POLLEN) pollen.splice(0, pollen.length - MAX_POLLEN);
      }

      // idle ripple so the field keeps moving even with no pointer and no audio
      nextAmbientRipple -= dt;
      if (nextAmbientRipple <= 0) {
        ripples.push({ x: -0.12, speed: 0.34 + rand() * 0.22, life: 1 });
        if (ripples.length > MAX_RIPPLES) ripples.shift();
        nextAmbientRipple = 4.2 + rand() * 3.4;
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.x += rp.speed * dt;
        rp.life -= dt * 0.32;
        if (rp.life <= 0 || rp.x > 1.25) ripples.splice(i, 1);
      }

      if (settle > 0) settle = Math.max(0, settle - dt * 0.5);

      // amplitude multiplier shared by ribbons + glow
      const swell = 1 + energy * 0.85 + ambiance * 0.07;

      g.clearRect(0, 0, width, height);

      // ambient underglow follows pointer, swells with the voice
      const glow = g.createRadialGradient(
        width * pointer.x,
        height * pointer.y,
        0,
        width * pointer.x,
        height * pointer.y,
        Math.max(width, height) * 0.9
      );
      glow.addColorStop(0, `rgba(214,255,42,${0.10 + energy * 0.07})`);
      glow.addColorStop(0.35, `rgba(214,255,42,${0.04 + energy * 0.03})`);
      glow.addColorStop(0.7, `rgba(34,211,238,${0.03 + energy * 0.05})`);
      glow.addColorStop(1, "rgba(10,10,10,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, width, height);

      // ── settle: the agent paid — sweep the split across the field at the live ratio ──
      // getSettleSplit is live (drag the bar below and the sweep follows) — default 0.7
      const split = getSettleSplit();
      if (settle > 0) {
        const a = Math.sin(settle * Math.PI) * 0.5;
        const band = (x0: number, x1: number, color: string) => {
          const grad = g.createLinearGradient(width * x0, 0, width * x1, 0);
          grad.addColorStop(0, `rgba(${color},0)`);
          grad.addColorStop(0.5, `rgba(${color},${a})`);
          grad.addColorStop(1, `rgba(${color},0)`);
          g.fillStyle = grad;
          g.fillRect(width * x0, 0, width * (x1 - x0), height);
        };
        band(0, split, "214,255,42");
        band(split, 1, "34,211,238");
        g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(width * split, height * 0.12);
        g.lineTo(width * split, height * 0.88);
        g.stroke();
      }

      const aspect = width / height;

      // grains — drift, part around pointer
      for (let i = 0; i < grains.length; i++) {
        const gr = grains[i];
        let gx = gr.bx + Math.sin(t * gr.speed + gr.phase) * 0.006 + gr.ox;
        let gy = gr.by + Math.cos(t * gr.speed * 0.7 + gr.phase) * 0.005 + gr.oy;

        const pdx = gx - pointer.x;
        const pdy = (gy - pointer.y) * aspect;
        const dist = Math.hypot(pdx, pdy);
        const R = 0.14;
        let alpha = 0.55;

        if (dist < R && pointer.active) {
          const f = (1 - dist / R) ** 1.8;
          const push = f * 0.045;
          const ang = Math.atan2(pdy, pdx);
          gx += Math.cos(ang) * push;
          gy += (Math.sin(ang) * push) / aspect;
          alpha *= 0.25 + 0.75 * (dist / R);
        }

        // energy biases the field from lime toward cyan — the voice is present
        const cyanWeight = gr.cyan ? 0.42 + energy * 0.3 : 0.38 - energy * 0.06;
        g.fillStyle = gr.cyan
          ? `rgba(103,232,249,${Math.max(0.04, alpha * cyanWeight)})`
          : `rgba(214,255,42,${Math.max(0.04, alpha * cyanWeight)})`;
        g.beginPath();
        g.arc(gx * width, gy * height, (gr.r + energy * 0.35) * dpr * 0.9, 0, Math.PI * 2);
        g.fill();
      }

      // ribbons — displaced waveforms, brighter near pointer row
      for (let r = 0; r < RIBBON_COUNT; r++) {
        const rb = ribbons[r];
        const baseY = height * rb.y;
        const near = pointer.active ? 1 - Math.min(1, Math.abs(pointer.y - rb.y) / 0.18) : 0;
        g.strokeStyle = `rgba(214,255,42,${Math.max(0.04, rb.opacity + near * 0.08 + energy * 0.16)})`;
        g.lineWidth = rb.thickness + near * 0.9 + energy * 0.5;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const nx = x / width;
          let wy = Math.sin(nx * Math.PI * rb.freq + rb.phase + t * rb.speed) * rb.amp * height * swell;
          wy += Math.sin(nx * Math.PI * 2.2 + r * 0.7 + t * 0.6) * rb.amp * height * 0.35 * swell;

          const pr = 0.11;
          const pdist = Math.abs(nx - pointer.x);
          if (pdist < pr && pointer.active) {
            const f = (1 - pdist / pr) ** 1.6;
            const lift = f * 18 * (pointer.y < rb.y ? -1 : 1) * (0.5 + near);
            wy += lift * (1 + Math.sin(nx * 30) * 0.15);
          }

          // traveling wavefronts (ambient + voice)
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k];
            const d = nx - rp.x;
            if (d > -0.2 && d < 0.2) {
              const envelope = Math.exp(-(d * d) / 0.0022);
              wy += envelope * rp.life * 14 * Math.sin(d * 90 + t * 4) * (0.4 + r);
            }
          }

          const y = baseY + wy;
          if (x === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();

        // specular rim — one extra soft stroke when the pointer row is close
        if (near > 0.45 || energy > 0.25) {
          g.globalAlpha = Math.max(near * 0.16, energy * 0.14);
          g.strokeStyle = energy > 0.25 ? "rgba(103,232,249,0.9)" : "rgba(234,255,106,0.9)";
          g.lineWidth = rb.thickness * 2.4;
          g.stroke();
          g.globalAlpha = 1;
        }
      }

      // trail specks
      for (let i = trail.length - 1; i >= 0; i--) {
        const tr = trail[i];
        tr.life -= dt * 1.6;
        if (tr.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        g.globalAlpha = tr.life * 0.4;
        g.fillStyle = "rgba(255,255,255,0.9)";
        g.beginPath();
        g.arc(tr.x * width, tr.y * height, 1.1, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;

      // pollen
      if (pollen.length) {
        g.shadowColor = "rgba(214,255,42,0.55)";
        g.shadowBlur = 6;
        for (let i = pollen.length - 1; i >= 0; i--) {
          const p = pollen[i];
          p.life -= dt * 0.9;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.0006;
          if (p.life <= 0) {
            pollen.splice(i, 1);
            continue;
          }
          g.globalAlpha = p.life * 0.55;
          g.fillStyle = "rgba(251,207,232,0.9)";
          g.beginPath();
          g.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
          g.fill();
        }
        g.shadowBlur = 0;
        g.globalAlpha = 1;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    function onMove(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      pointer.tx = (clientX - rect.left) / rect.width;
      pointer.ty = (clientY - rect.top) / rect.height;
      pointer.active = true;
    }

    const handlePointerMove = (e: PointerEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const tch = e.touches[0];
      if (tch) onMove(tch.clientX, tch.clientY);
    };
    const handleEnter = () => {
      pointer.active = true;
    };
    const handleLeave = () => {
      pointer.active = false;
    };

    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerenter", handleEnter);
    host.addEventListener("pointerleave", handleLeave);
    host.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      ro.disconnect();
      visibility.disconnect();
      unsubscribe();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerenter", handleEnter);
      host.removeEventListener("pointerleave", handleLeave);
      host.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
