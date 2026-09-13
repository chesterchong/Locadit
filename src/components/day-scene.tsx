"use client";
import { useEffect, useState } from "react";

// Backdrop behind the board when a day is open: daytime sky + photos on the left, night sky + photos on the right.
// The middle third stays clear so the itinerary reads.
const DAY_TERMS: Record<string, string> = { "Food & markets": "market food", Nightlife: "city street", "Nature & hikes": "waterfall hike", "Museums & culture": "temple museum", "Beach & rest": "beach", Shopping: "shopping street", "Adventure sports": "surfing", "Local neighbourhoods": "old town street" };
const NIGHT_TERMS: Record<string, string> = { "Food & markets": "night market", Nightlife: "night bar lights", "Nature & hikes": "sunset mountains", "Museums & culture": "temple night lights", "Beach & rest": "beach sunset", Shopping: "night shopping street", "Adventure sports": "bonfire beach night", "Local neighbourhoods": "street night lanterns" };
// x is the offset from the inner edge (next to the itinerary column), in % of the panel width.
const SLOTS = [{ x: 6, y: 14, r: -8, w: 160 }, { x: 26, y: 40, r: 6, w: 175 }, { x: 8, y: 64, r: -4, w: 150 }];

export default function DayScene({ destination, theme, open }: { destination: string; theme: string | null; open: boolean }) {
  const [day, setDay] = useState<string[]>([]);
  const [night, setNight] = useState<string[]>([]);
  useEffect(() => {
    if (!open || !theme) return;
    const get = (q: string) => fetch(`/api/photos?q=${encodeURIComponent(`${destination} ${q}`)}`).then((r) => r.json()).then((j) => (j.photos ?? []).map((p: { url: string }) => p.url).slice(0, 3)).catch(() => []);
    setDay([]); setNight([]);
    get(DAY_TERMS[theme] ?? theme).then(setDay);
    get(NIGHT_TERMS[theme] ?? `${theme} night`).then(setNight);
  }, [open, theme, destination]);
  return (
    <div className={`scene ${open ? "on" : ""}`} aria-hidden>
      <div className="scene-day">
        <span className="scene-sun" />
        {day.map((u, i) => <img key={u} src={u} alt="" className="scene-photo" style={{ right: `${SLOTS[i].x}%`, top: `${SLOTS[i].y}%`, width: SLOTS[i].w, "--r": `${SLOTS[i].r}deg`, "--d": `${i * 120}ms` } as React.CSSProperties} />)}
      </div>
      <div className="scene-mid" />
      <div className="scene-night">
        <span className="scene-moon" />
        {night.map((u, i) => <img key={u} src={u} alt="" className="scene-photo" style={{ left: `${SLOTS[i].x}%`, top: `${SLOTS[i].y + 4}%`, width: SLOTS[i].w, "--r": `${-SLOTS[i].r}deg`, "--d": `${i * 120 + 60}ms` } as React.CSSProperties} />)}
      </div>
    </div>
  );
}
