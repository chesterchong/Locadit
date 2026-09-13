"use client";
import { useEffect } from "react";

const MAX_VOLUME = 0.7;
const FADE_SECONDS = 4;

// Site-wide soundtrack via Web Audio: the file is decoded once and played through a single time,
// with the volume ramping from silence to MAX_VOLUME.
// Autoplay is attempted on load; if the browser blocks it, the first click, tap or key press starts it.
export default function Soundtrack() {
  useEffect(() => {
    type Ctx = typeof AudioContext;
    const AC: Ctx | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    let source: AudioBufferSourceNode | null = null;
    let started = false;
    let cancelled = false;

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
        source.loop = false; // play once
        source.connect(gain);
        source.start();
        tryStart();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unbind();
      try { source?.stop(); } catch {}
      ctx.close().catch(() => {});
    };
  }, []);
  return null;
}
