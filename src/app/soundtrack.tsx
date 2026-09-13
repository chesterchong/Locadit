"use client";
import { useEffect, useRef, useState } from "react";

const MAX_VOLUME = 0.7;
const FADE_SECONDS = 4;
// The disc's playlist. The landing intro plays its own track once first, then hands over to this list, which loops.
const PLAYLIST = ["/audio/melodic-minor.mp3", "/audio/nightcall.mp3"];
const INTRO = "/audio/intro.mp3";
const NOTES = ["🎵", "🎶", "♪", "♫"];

// Site-wide soundtrack via Web Audio, controlled by the spinning disc in the top-right corner.
// Autoplay is attempted on load; if the browser blocks it, the first click, tap or key press starts it.
export default function Soundtrack() {
  const [playing, setPlaying] = useState(false);
  const [notes, setNotes] = useState<{ id: number; x: number; glyph: string }[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const buffers = useRef<Record<string, Promise<AudioBuffer>>>({});
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const startedRef = useRef(false);
  const queueRef = useRef<string[]>([]);   // tracks still to play in this pass
  const readyRef = useRef(false);

  const load = (url: string) => {
    if (!buffers.current[url]) {
      const ctx = ctxRef.current!;
      buffers.current[url] = fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).catch((e) => { delete buffers.current[url]; throw e; });
    }
    return buffers.current[url];
  };
  const nextUrl = () => {
    if (!queueRef.current.length) queueRef.current = [...PLAYLIST]; // loop the disc playlist
    return queueRef.current.shift()!;
  };
  const startSource = async (fadeSeconds = 1.5) => {
    const ctx = ctxRef.current, gain = gainRef.current;
    if (!ctx || !gain) return;
    const url = nextUrl();
    const buf = await load(url).catch(() => null);
    if (!buf) return;
    try { srcRef.current?.stop(); } catch {}
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = false; src.connect(gain);
    src.onended = () => { if (srcRef.current === src) { srcRef.current = null; startSource(1.5); } }; // auto-advance
    src.start(); srcRef.current = src;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(MAX_VOLUME, now + fadeSeconds);
    void load(queueRef.current[0] ?? PLAYLIST[0]); // prefetch what comes next
  };

  const play = async () => {
    const ctx = ctxRef.current; if (!ctx || !readyRef.current) return;
    await ctx.resume().catch(() => {});
    if (ctx.state !== "running") return;
    if (!srcRef.current) await startSource(startedRef.current ? 1.5 : FADE_SECONDS);
    startedRef.current = true; setPlaying(true);
  };
  const pause = async () => { await ctxRef.current?.suspend().catch(() => {}); setPlaying(false); };
  const toggle = () => (playing ? pause() : play());

  useEffect(() => {
    type Ctx = typeof AudioContext;
    const AC: Ctx | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC(); ctxRef.current = ctx;
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination); gainRef.current = gain;
    let cancelled = false;
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const tryStart = () => { if (startedRef.current) { unbind(); return; } play().then(() => { if (startedRef.current) unbind(); }); };
    const unbind = () => events.forEach((e) => window.removeEventListener(e, tryStart));
    events.forEach((e) => window.addEventListener(e, tryStart));
    // Landing plays the intro track once before the playlist; other pages go straight to the playlist.
    queueRef.current = window.location.pathname === "/" ? [INTRO, ...PLAYLIST] : [...PLAYLIST];
    load(queueRef.current[0]).then(() => { if (cancelled) return; readyRef.current = true; tryStart(); }).catch(() => {});
    return () => { cancelled = true; unbind(); try { srcRef.current?.stop(); } catch {} ctx.close().catch(() => {}); };
  }, []); // eslint-disable-line

  // Floating notes while playing.
  useEffect(() => {
    if (!playing) return;
    let n = 0;
    const id = window.setInterval(() => {
      const note = { id: Date.now() + n++, x: Math.round(Math.random() * 30 - 15), glyph: NOTES[n % NOTES.length] };
      setNotes((ns) => [...ns.slice(-5), note]);
      window.setTimeout(() => setNotes((ns) => ns.filter((x) => x.id !== note.id)), 2200);
    }, 900);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <button type="button" className={`disc ${playing ? "spinning" : ""}`} onClick={(e) => { e.stopPropagation(); toggle(); }} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"} title={playing ? "Pause music" : "Play music"}>
      <span className="disc-face" aria-hidden />
      {notes.map((nt) => <span key={nt.id} className="disc-note" style={{ "--nx": `${nt.x}px` } as React.CSSProperties} aria-hidden>{nt.glyph}</span>)}
    </button>
  );
}
