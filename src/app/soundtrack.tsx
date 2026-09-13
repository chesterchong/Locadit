"use client";
import { useEffect, useRef } from "react";

// Site-wide soundtrack. Tries to autoplay on load; browsers that block unmuted autoplay
// get the track started by the first click, tap or key press anywhere on the page.
export default function Soundtrack() {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = 0.7;
    const start = () => {
      el.play().then(() => stop()).catch(() => {});
    };
    const stop = () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    start();
    return stop;
  }, []);
  return <audio ref={ref} src="/audio/intro.mp3" loop preload="auto" aria-hidden />;
}
