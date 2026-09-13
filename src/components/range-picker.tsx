"use client";
import { useState } from "react";

export type Win = { from: string; to: string };
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function label(w: Win) {
  const a = new Date(w.from + "T00:00:00"), b = new Date(w.to + "T00:00:00");
  return a.getMonth() === b.getMonth() ? `${MON3[a.getMonth()]} ${a.getDate()}–${b.getDate()}` : `${MON3[a.getMonth()]} ${a.getDate()} – ${MON3[b.getMonth()]} ${b.getDate()}`;
}

// Tap a start day, then an end day: that becomes a window chip. Up to `max` windows.
export default function RangePicker({ value, onChange, max = 4 }: { value: Win[]; onChange: (w: Win[]) => void; max?: number }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [start, setStart] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const todayIso = iso(today);
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)))];
  const full = value.length >= max;
  const preview = start ? [start, hover ?? start].sort() : null;
  const inWin = (d: string) => value.some((w) => d >= w.from && d <= w.to);
  const pick = (d: string) => {
    if (d < todayIso || full) return;
    if (!start) { setStart(d); return; }
    const [a, b] = [start, d].sort();
    onChange([...value, { from: a, to: b }]);
    setStart(null); setHover(null);
  };
  return (
    <div className="cal" aria-label="Pick date windows">
      <div className="cal-head">
        <button type="button" className="cal-nav" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} disabled={cursor <= new Date(today.getFullYear(), today.getMonth(), 1)}>‹</button>
        <span>{MON[cursor.getMonth()]} {cursor.getFullYear()}</span>
        <button type="button" className="cal-nav" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="cal-grid" onMouseLeave={() => setHover(null)}>
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <span key={i} className="cal-wd">{w}</span>)}
        {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
          <button key={d} type="button" onClick={() => pick(d)} onMouseEnter={() => start && setHover(d)} disabled={d < todayIso || (full && !inWin(d))}
            className={`cal-day ${d < todayIso ? "past" : ""} ${d === todayIso ? "today" : ""} ${inWin(d) ? "win" : ""} ${preview && d > preview[0] && d < preview[1] ? "range" : ""} ${preview && d === preview[0] ? "start" : ""} ${preview && d === preview[1] && preview[1] !== preview[0] ? "end" : ""}`}>
            {parseInt(d.slice(8), 10)}
          </button>
        ))}
      </div>
      <p className="cal-hint">{full ? `${max} windows is the limit. Remove one to add another.` : start ? `Now tap the last day.` : value.length ? "Tap a start day to add another window." : "Tap the first day, then the last day of a window."}</p>
      {value.length > 0 && (
        <div className="win-chips">
          {value.map((w, i) => <span key={i} className="win-chip">{label(w)}<button type="button" aria-label={`Remove ${label(w)}`} onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button></span>)}
        </div>
      )}
    </div>
  );
}
