"use client";
import { useEffect, useState } from "react";

// Backdrop behind the board when a day is open: daytime sky + photos on the left, night sky + photos on the right.
// The middle third stays clear so the itinerary reads.
const DAY_TERMS: Record<string, string> = { "Food & markets": "market food", Nightlife: "city street", "Nature & hikes": "waterfall hike", "Museums & culture": "temple museum", "Beach & rest": "beach", Shopping: "shopping street", "Adventure sports": "surfing", "Local neighbourhoods": "old town street" };
const NIGHT_TERMS: Record<string, string> = { "Food & markets": "night market", Nightlife: "night bar lights", "Nature & hikes": "sunset mountains", "Museums & culture": "temple night lights", "Beach & rest": "beach sunset", Shopping: "night shopping street", "Adventure sports": "bonfire beach night", "Local neighbourhoods": "street night lanterns" };
const SLOTS = [{ x: 8, y: 16, r: -8, w: 150 }, { x: 22, y: 42, r: 6, w: 170 }, { x: 6, y: 66, r: -4, w: 140 }];

export default function DayScene({ destination, theme, open, onClose }: { destination: string; theme: string | null; open: boolean; onClose: () => void }) {
  const [day, setDay] = useState<string[]>([]);
  const [night, setNight] = useState<string[]>([]);
  useEffect(() => {
    if (!open || !theme) return;
    const get = (q: string) => fetch(`/api/photos?q=${encodeURIComponent(`${destination} ${q}`)}`).then((r) => r.json()).then((j) => (j.photos ?? []).map((p: { url: string }) => p.url).slice(0, 3)).catch(() => []);
    setDay([]); setNight([]);
    get(DAY_TERMS[theme] ?? theme).then(setDay);
    get(NIGHT_TERMS[theme] ?? `${theme} night`).then(setNight);
  }, [open, theme, destination]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  return (
    <div className={`scene ${open ? "on" : ""}`} aria-hidden onClick={onClose}>
      <div className="scene-day">
        <span className="scene-sun" />
        {day.map((u, i) => <img key={u} src={u} alt="" className="scene-photo" style={{ left: `${SLOTS[i].x}%`, top: `${SLOTS[i].y}%`, width: SLOTS[i].w, "--r": `${SLOTS[i].r}deg`, "--d": `${i * 120}ms` } as React.CSSProperties} />)}
      </div>
      <div className="scene-mid" />
      <div className="scene-night">
        <span className="scene-moon" />
        {night.map((u, i) => <img key={u} src={u} alt="" className="scene-photo" style={{ right: `${SLOTS[i].x}%`, top: `${SLOTS[i].y + 4}%`, width: SLOTS[i].w, "--r": `${-SLOTS[i].r}deg`, "--d": `${i * 120 + 60}ms` } as React.CSSProperties} />)}
      </div>
    </div>
  );
}
