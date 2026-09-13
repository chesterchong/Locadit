"use client";
import { useEffect, useState } from "react";

// Backdrop behind the board when a day is open: daytime sky + photos on the left, night sky + photos on the right.
// The middle third stays clear so the itinerary reads.
const DAY_TERMS: Record<string, string> = { "Food & markets": "market food", Nightlife: "city street", "Nature & hikes": "waterfall hike", "Museums & culture": "temple museum", "Beach & rest": "beach", Shopping: "shopping street", "Adventure sports": "surfing", "Local neighbourhoods": "old town street" };
const NIGHT_TERMS: Record<string, string> = { "Food & markets": "night market", Nightlife: "night bar lights", "Nature & hikes": "sunset mountains", "Museums & culture": "temple night lights", "Beach & rest": "beach sunset", Shopping: "night shopping street", "Adventure sports": "bonfire beach night", "Local neighbourhoods": "street night lanterns" };
// x is the offset from the inner edge (next to the itinerary column), in % of the panel width.
const SLOTS = [{ x: 6, y: 14, r: -8, w: 160 }, { x: 26, y: 40, r: 6, w: 175 }, { x: 8, y: 64, r: -4, w: 150 }];

const cache = new Map<string, Promise<string[]>>();
function fetchPhotos(destination: string, term: string) {
  const key = `${destination}|${term}`;
  if (!cache.has(key)) {
    cache.set(key, fetch(`/api/photos?q=${encodeURIComponent(`${destination} ${term}`)}&w=520`).then((r) => r.json())
      .then((j) => { const urls: string[] = (j.photos ?? []).map((p: { url: string }) => p.url).slice(0, 3); urls.forEach((u) => { const im = new Image(); im.src = u; }); return urls; })
      .catch(() => { cache.delete(key); return []; }));
  }
  return cache.get(key)!;
}

export default function DayScene({ destination, theme, themes = [], open }: { destination: string; theme: string | null; themes?: string[]; open: boolean }) {
  const [day, setDay] = useState<string[]>([]);
  const [night, setNight] = useState<string[]>([]);
  // Warm every day's photos as soon as the board is up, so the first click is instant.
  useEffect(() => { themes.forEach((th) => { fetchPhotos(destination, DAY_TERMS[th] ?? th); fetchPhotos(destination, NIGHT_TERMS[th] ?? `${th} night`); }); }, [destination, themes.join("|")]); // eslint-disable-line
  useEffect(() => {
    if (!open || !theme) return;
    let live = true;
    fetchPhotos(destination, DAY_TERMS[theme] ?? theme).then((u) => live && setDay(u));
    fetchPhotos(destination, NIGHT_TERMS[theme] ?? `${theme} night`).then((u) => live && setNight(u));
    return () => { live = false; };
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
