"use client";
import { useEffect, useRef } from "react";

const MAX_VOLUME = 0.7;
const FADE_SECONDS = 4;

// Site-wide soundtrack via Web Audio: the file is decoded once and looped seamlessly in memory
// (no dependence on server range requests), with the volume ramping from silence to MAX_VOLUME.
// Autoplay is attempted on load; if the browser blocks it, the first click, tap or key press starts it.
// A fixed white frame around the page pulses with the track's bass energy and rests when the music is silent.
export default function Soundtrack() {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    type Ctx = typeof AudioContext;
    const AC: Ctx | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.5;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    let source: AudioBufferSourceNode | null = null;
    let started = false;
    let cancelled = false;
    let raf = 0;
    let peak = 0;     // slow-decaying peak of bass energy (normaliser)
    let level = 0;    // displayed beat level with fast attack, slow decay
    // Debug handle for verifying playback state from devtools.
    (window as unknown as { __soundtrack?: unknown }).__soundtrack = { ctx, gain, get source() { return source; }, get started() { return started; }, get level() { return level; }, get peak() { return peak; } };

    const setBeat = (v: number) => frame.current?.style.setProperty("--beat", v.toFixed(3));
    const tick = () => {
      if (cancelled) return;
      if (ctx.state !== "running") { level = 0; setBeat(0); raf = 0; return; }
      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = 1; i <= 8; i++) sum += bins[i]; // ~43–350 Hz: kick and bass
      const energy = sum / (8 * 255);
      peak = Math.max(peak * 0.995, energy);
      const n = energy / Math.max(0.05, peak);          // 0..1 relative to recent loudest bass
      const target = Math.max(0, (n - 0.55) / 0.45);    // only the top of each hit registers
      level = target > level ? target : level * 0.85;
      setBeat(level * Math.min(1, gain.gain.value / MAX_VOLUME));
      raf = requestAnimationFrame(tick);
    };
    const onState = () => { if (ctx.state === "running" && started && !raf) raf = requestAnimationFrame(tick); if (ctx.state !== "running") setBeat(0); };
    ctx.addEventListener("statechange", onState);

    const events = ["pointerdown", "keydown", "touchend", "click"] as const;
    const unbind = () => events.forEach((e) => window.removeEventListener(e, tryStart));
    const tryStart = () => {
      if (started || !source) return;
      ctx.resume().then(() => {
        if (started || cancelled || ctx.state !== "running") return;
        started = true;
        unbind();
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(MAX_VOLUME, now + FADE_SECONDS);
        if (!raf) raf = requestAnimationFrame(tick);
      }).catch(() => {});
    };
    events.forEach((e) => window.addEventListener(e, tryStart));

    fetch("/audio/intro.mp3")
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((audio) => {
        if (cancelled) return;
        source = ctx.createBufferSource();
        source.buffer = audio;
        source.loop = true;
        source.connect(gain);
        source.connect(analyser); // pre-gain, so the beat reads cleanly even while the volume fades in
        source.start();
        tryStart();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unbind();
      cancelAnimationFrame(raf);
      ctx.removeEventListener("statechange", onState);
      try { source?.stop(); } catch {}
      ctx.close().catch(() => {});
    };
  }, []);
  return <div ref={frame} className="beat-frame" aria-hidden />;
}
