"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { PIECES, Piece } from "@/lib/collage";
import { treeQrUrl } from "@/lib/tree";

// Intro timeline in ms. Step N+1 reveals collage layer N; the wordmark draws in at step 1, changes style at
// steps 2–6, leaves at step 7, the phone rises at step 8 and its info card lands at step 9.
const STEPS = [0, 500, 1500, 2200, 2900, 3600, 4300, 5400, 6000, 6600];
const END = STEPS.length - 1;
const WM = ["wm-hand", "wm-serif", "wm-black", "wm-round", "wm-pixel", "wm-geo"];
const SHARE_URL = "https://locadit.vercel.app/start";

// Placeholder media until Locadit's own footage lands. One card, centred.
const CARDS = [
  { x: 800, video: "/video/intro.mp4", name: "Locadit", tag: "Group trips without the argument", href: "/start" },
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
    const play = () => { if (step >= 8 && !reduced.current && !document.hidden) videos.current.forEach((v) => v && v.play().catch(() => {})); };
    play();
    document.addEventListener("visibilitychange", play);
    return () => document.removeEventListener("visibilitychange", play);
  }, [step]);

  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setStep(END);
    requestAnimationFrame(() => heroRef.current?.querySelector<HTMLElement>(".phone-link")?.focus({ preventScroll: true }));
  }, []);

  // After the wordmark parks at the top it keeps cycling through the drawn styles.
  const [loop, setLoop] = useState(0);
  const [hot, setHot] = useState(false); // hovering the phone or its card grows both together
  const [shareOpen, setShareOpen] = useState(false);
  // Boarding transition: scatter the collage, zoom the phone, iris to cream, then route.
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault(); e.stopPropagation();
    if (exiting) return;
    setExiting(true);
    router.prefetch(href);
    window.setTimeout(() => router.push(href), 760);
  };
  useEffect(() => {
    if (step < 7 || reduced.current) return;
    const id = window.setInterval(() => setLoop((l) => l + 1), 1800);
    return () => window.clearInterval(id);
  }, [step]);

  const leaving = step >= 7;
  const font = leaving ? WM[loop % WM.length] : WM[Math.min(Math.max(step - 1, 0), 5)];
  const prevFont = leaving ? WM[(loop + WM.length - 1) % WM.length] : step >= 2 ? WM[step - 2] : null;
  const changeStep = leaving ? `L${loop}` : String(step);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="landing">
      <section ref={heroRef} className="hero" aria-label="Locadit intro">
        <div className={`stage ${step >= 6 ? "night" : ""} ${exiting ? "exit" : ""}`} style={{ "--s": fit?.s ?? 1, "--wm": fit?.wm ?? 1, visibility: fit ? "visible" : "hidden" } as CSSProperties}>
          <div className="dots on" />
          <div className={`sky ${step >= 5 ? "on" : ""}`} />
          {PIECES.map((p, i) => <PieceEl key={p.id} p={p} step={step} delay={ORDER[i] * 70} seed={i} />)}
          <h1 className={`wm ${leaving ? "leave" : ""}`} aria-label="Locadit">
            {/* Each style change is drawn: the previous face is erased left to right while the new one traces in. */}
            {prevFont && <WordSvg key={`out-${changeStep}`} font={prevFont} mode="erase" />}
            {step >= 1 && <WordSvg key={`in-${changeStep}`} font={font} mode="draw" />}
          </h1>
          {CARDS.map((c, i) => (
            <div key={c.name} className={`phone-wrap ${step >= 8 ? "on" : ""} ${hot ? "hot" : ""} ${shareOpen ? "sharing" : ""}`} style={{ left: c.x, transitionDelay: exiting ? "0ms" : `${i * 120}ms` }} onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)}>
              <Link href={c.href} className="phone-link" onClick={(e) => go(e, c.href)} aria-label={`${c.name}: ${c.tag}`}>
                {/* The clipped, rounded element must carry no transform of its own, or Chrome paints the video black. */}
                <div className="phone">
                  <video ref={(el) => { videos.current[i] = el; }} src={c.video} muted loop playsInline preload="auto" />
                </div>
              </Link>
              <div className={`tree-share ${shareOpen ? "open" : ""}`} onClick={stop}>
                <button type="button" className="tree-share-toggle" aria-expanded={shareOpen} aria-controls="landing-tree-share" aria-label={shareOpen ? "Close share QR" : "Show share QR as a tree"} onClick={() => setShareOpen((open) => !open)}>
                  <span className="tree-share-label"><TreeMark />Share QR</span>
                  <span className="tree-share-close" aria-hidden>×</span>
                </button>
                <a id="landing-tree-share" className="tree-share-card" href={treeQrUrl(SHARE_URL)} target="_blank" rel="noreferrer" aria-label="Open the interactive Locadit tree QR in a new tab" tabIndex={shareOpen ? 0 : -1}>
                  <TreeMark large />
                  <span className="tree-qr-frame"><img src="/tree-qr.svg" alt="QR code to start a Locadit trip" /></span>
                  <span className="tree-share-caption"><b>Scan to start</b><small>Tap for the full tree ↗</small></span>
                </a>
              </div>
            </div>
          ))}
          {CARDS.map((c, i) => (
            <Link key={`${c.name}-info`} href={c.href} className={`info ${step >= 9 ? "on" : ""} ${hot ? "hot" : ""}`} style={{ left: c.x, transitionDelay: exiting ? "0ms" : `${i * 120}ms` }} onClick={(e) => go(e, c.href)} onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)}>
              <span className="info-text"><b>{c.name}</b><small>{c.tag}</small></span>
              <span className="info-cta">Start a room</span>
            </Link>
          ))}
        </div>
        {step < END && <button type="button" className="skip" onClick={skip}>Skip intro</button>}
        <div className={`exit-wipe ${exiting ? "on" : ""}`} aria-hidden />
      </section>

    </div>
  );
}

function TreeMark({ large = false }: { large?: boolean }) {
  return (
    <svg className={`tree-mark ${large ? "large" : ""}`} viewBox="0 0 96 92" aria-hidden>
      <path className="tree-trunk" d="M48 84V43m0 18-15-14m15 4 17-17m-17 1-9-10m9 27 9-8" />
      <g className="tree-leaves">
        <circle cx="48" cy="23" r="18" /><circle cx="31" cy="33" r="15" /><circle cx="65" cy="34" r="17" />
        <circle cx="42" cy="42" r="17" /><circle cx="59" cy="18" r="13" /><circle cx="24" cy="22" r="11" />
      </g>
      <path className="tree-ground" d="M29 85c10-5 29-5 39 0" />
    </svg>
  );
}

function PieceEl({ p, step, delay, seed }: { p: Piece; step: number; delay: number; seed: number }) {
  const shown = step >= p.layer + 1;
  // Rotating caption lines (text pieces with `cycle`).
  const [ci, setCi] = useState(0);
  useEffect(() => {
    if (!p.cycle || !shown) return;
    const id = window.setInterval(() => setCi((c) => c + 1), 3600);
    return () => window.clearInterval(id);
  }, [p.cycle, shown]);
  const content = p.cycle ? p.cycle[ci % p.cycle.length] : p.content;
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
    "--fx": `${Math.round((t.x - 800) * 1.7)}px`, "--fy": `${Math.round((t.y - 450) * 1.7)}px`, "--fd": `${Math.round(Math.min(220, Math.hypot(t.x - 800, t.y - 450) / 4))}ms`,
    "--wa": `${p.wind ?? 2.5}deg`, "--wd": `${(2.1 + (seed % 5) * 0.35).toFixed(2)}s`, "--wdel": `${(-(seed % 7) * 0.4).toFixed(1)}s`,
  } as CSSProperties;
  const cls = `piece ${p.kind} ${p.font ? "f-" + p.font : ""} ${p.underline ? "underline-blue" : ""} ${p.hover ? "hoverable" : ""} ${gone ? "off" : shown ? "on" : ""}`;
  if (p.kind === "img") return <div className={cls} style={style}><span className="in"><img src={p.src} alt="" draggable={false} /></span></div>;
  if (p.kind === "polaroid") return <div className={cls} style={style}><span className="in"><i style={{ background: p.color }} /></span></div>;
  if (p.kind === "checker" || p.kind === "cloud") return <div className={cls} style={style} />;
  return <div className={cls} style={style} aria-hidden><span className="in"><span key={ci} className={p.cycle ? "fade-in" : undefined}>{content}</span></span></div>;
}

function WordSvg({ font, mode }: { font: string; mode: "draw" | "erase" }) {
  return (
    <svg className={`wm-svg ${mode}`} viewBox="0 0 1000 300" width="1000" height="300" aria-hidden>
      <text x="500" y="150" textAnchor="middle" dominantBaseline="central" className={font}>Locadit</text>
    </svg>
  );
}
