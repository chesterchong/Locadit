"use client";
import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { PIECES, Piece } from "@/lib/collage";

// Intro timeline in ms. Step N+1 reveals collage layer N; the wordmark draws in at step 1, changes style at
// steps 2–6, leaves at step 7, the phone rises at step 8 and its info card lands at step 9.
const STEPS = [0, 500, 1500, 2200, 2900, 3600, 4300, 5400, 6000, 6600];
const END = STEPS.length - 1;
const WM = ["wm-hand", "wm-serif", "wm-black", "wm-round", "wm-pixel", "wm-geo"];

// Placeholder media until Locadit's own footage lands. One card, centred.
const CARDS = [
  { x: 800, icon: "https://static.amo.co/shared/images/app-icons/location/20250123-167x167.png", video: "https://static.amo.co/website/videos/location/20250915.mp4#t=9", qr: "https://amo.co/qrcode-location.png", name: "Locadit", tag: "Group trips without the argument", href: "/about" },
];

// Stagger index of each piece within its layer (drives pop-in delay).
const ORDER = PIECES.map((p, i) => PIECES.slice(0, i).filter((q) => q.layer === p.layer).length);

export default function Landing() {
  const [step, setStep] = useState(0);
  const [fit, setFit] = useState<{ s: number; wm: number } | null>(null);
  const timers = useRef<number[]>([]);
  const reduced = useRef(false);
  const heroRef = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const el = heroRef.current!;
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      // Cover the hero, but never crop the phone card (460px wide incl. margins) or the card column (780px tall).
      const s = Math.min(Math.max(w / 1600, h / 900), h / 780, w / 460);
      // Shrink the wordmark when fewer than 900 stage px are visible across (phones), so no style is cut off.
      setFit({ s, wm: Math.min(1, w / s / 900) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setStep(END);
    else timers.current = STEPS.map((t, i) => window.setTimeout(() => setStep(i), t));
    return () => { ro.disconnect(); timers.current.forEach(clearTimeout); };
  }, []);

  // Chrome pauses muted video that starts off-screen, so start playback when the phone rises.
  useEffect(() => {
    if (step >= 8 && !reduced.current) videos.current.forEach((v) => v && v.play().catch(() => {}));
  }, [step]);

  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setStep(END);
    requestAnimationFrame(() => heroRef.current?.querySelector<HTMLElement>(".phone-wrap")?.focus({ preventScroll: true }));
  }, []);

  // Keyboard skip while the intro runs: Escape, Enter or Space.
  useEffect(() => {
    if (step >= END) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, skip]);

  const leaving = step >= 7;
  const font = leaving ? "wm-hand" : WM[Math.min(Math.max(step - 1, 0), 5)];
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="landing">
      <section ref={heroRef} className="hero" onClick={() => { if (step < END) skip(); }} aria-label="Locadit intro">
        <div className="stage" style={{ "--s": fit?.s ?? 1, "--wm": fit?.wm ?? 1, visibility: fit ? "visible" : "hidden" } as CSSProperties}>
          <div className="dots on" />
          <div className={`sky ${step >= 5 ? "on" : ""}`} />
          {PIECES.map((p, i) => <PieceEl key={p.id} p={p} step={step} delay={ORDER[i] * 70} />)}
          <h1 className={`wm ${leaving ? "leave" : ""}`}>
            {/* Mounted only from step 1 so the handwriting draw-in starts when the viewer can see it. */}
            {step >= 1 && <span key={`${font}-${step < 2 ? "draw" : leaving ? "leave" : "blip"}`} className={`${font} ${step < 2 ? "wm-draw" : "wm-blip"}`}>Locadit</span>}
          </h1>
          {CARDS.map((c, i) => (
            <Link key={c.name} href={c.href} className={`phone-wrap ${step >= 8 ? "on" : ""}`} style={{ left: c.x, transitionDelay: `${i * 120}ms` }} onClick={stop} aria-label={`${c.name}: ${c.tag}`}>
              {/* The clipped, rounded element must carry no transform of its own, or Chrome paints the video black. */}
              <div className="phone">
                <video ref={(el) => { videos.current[i] = el; }} src={c.video} muted loop playsInline preload="auto" />
                <img className="qr" src={c.qr} alt="" />
              </div>
            </Link>
          ))}
          {CARDS.map((c, i) => (
            <Link key={`${c.name}-info`} href={c.href} className={`info ${step >= 9 ? "on" : ""}`} style={{ left: c.x, transitionDelay: `${i * 120}ms` }} onClick={stop}>
              <img src={c.icon} alt="" />
              <span className="info-text"><b>{c.name}</b><small>{c.tag}</small></span>
              <span className="info-cta">Start a room</span>
            </Link>
          ))}
        </div>
        {step < END && <button type="button" className="skip" onClick={(e) => { stop(e); skip(); }}>Skip intro</button>}
      </section>

    </div>
  );
}

function PieceEl({ p, step, delay }: { p: Piece; step: number; delay: number }) {
  const shown = step >= p.layer + 1;
  const settled = step >= 7 && p.to;
  const gone = p.hideAtEnd && step >= 8;
  const t = settled ? { ...p, ...p.to } : p;
  const textual = p.kind === "emoji" || p.kind === "text";
  const style = {
    left: t.x, top: t.y, zIndex: p.z ?? p.layer * 10,
    fontSize: textual ? t.size : undefined,
    width: textual ? undefined : t.size,
    height: textual ? undefined : p.h,
    color: p.kind === "text" ? p.color : undefined,
    "--r": `${t.rot ?? 0}deg`, "--d": `${delay}ms`,
  } as CSSProperties;
  const cls = `piece ${p.kind} ${p.font ? "f-" + p.font : ""} ${p.underline ? "underline-blue" : ""} ${gone ? "off" : shown ? "on" : ""}`;
  if (p.kind === "img") return <img className={cls} style={style} src={p.src} alt="" />;
  if (p.kind === "polaroid") return <div className={cls} style={style}><i style={{ background: p.color }} /></div>;
  if (p.kind === "checker" || p.kind === "cloud") return <div className={cls} style={style} />;
  return <div className={cls} style={style} aria-hidden>{p.content}</div>;
}
