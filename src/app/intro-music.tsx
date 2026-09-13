"use client";
import { useEffect } from "react";

// The landing intro's own track: plays once, fades in to 55%, no controls.
export default function IntroMusic() {
  useEffect(() => {
    type Ctx = typeof AudioContext;
    const AC: Ctx | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    let source: AudioBufferSourceNode | null = null, started = false, cancelled = false;
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const unbind = () => events.forEach((e) => window.removeEventListener(e, tryStart));
    const tryStart = () => {
      if (started || !source) return;
      ctx.resume().then(() => {
        if (started || cancelled || ctx.state !== "running") return;
        started = true; unbind();
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.55, now + 4);
      }).catch(() => {});
    };
    events.forEach((e) => window.addEventListener(e, tryStart));
    fetch("/audio/intro.mp3").then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => {
      if (cancelled) return;
      source = ctx.createBufferSource(); source.buffer = buf; source.connect(gain); source.start(); tryStart();
    }).catch(() => {});
    return () => { cancelled = true; unbind(); try { source?.stop(); } catch {} ctx.close().catch(() => {}); };
  }, []);
  return null;
}
