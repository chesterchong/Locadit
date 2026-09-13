"use client";
import { useEffect, useState } from "react";

// Floating promo flyers: a few UFOs, planes and balloons drift across the page. Tap one for the deal.
// Offers are sample content for the prototype until a deals feed is connected.
const PROMOS = [
  { id: "flight", icon: "✈️", title: "Flights from $189", body: "Return fares to your destination in the autumn sale. Sample offer.", code: "FLY189", top: 18, dur: 26, delay: 0, lane: "l" },
  { id: "hotel", icon: "🎈", title: "20% off villas", body: "Voucher for stays of 3+ nights at partner villas. Sample offer.", code: "STAY20", top: 50, dur: 34, delay: -9, lane: "r" },
  { id: "transfer", icon: "🛸", title: "Free airport pickup", body: "Book 4+ nights and the transfer is on us. Sample offer.", code: "PICKUP", top: 30, dur: 30, delay: -17, lane: "r" },
];

export default function Promos() {
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Click or tap anywhere outside the open card (or press Escape) to close it.
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { const t = e.target as Element; if (!t.closest?.(".promo-card") && !t.closest?.(".promo-pin")) setOpen(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away, true); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="promos" aria-label="Offers">
      {PROMOS.map((p) => (
        <div key={p.id} className={`promo lane-${p.lane}`} style={{ top: `${p.top}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>
          <button type="button" className="promo-pin" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id} aria-label={p.title}>{p.icon}</button>
          {open === p.id && (
            <div className="promo-card pop" role="dialog" style={{ zIndex: 5 }}>
              <b>{p.title}</b>
              <p>{p.body}</p>
              <div className="flex items-center gap-2">
                <span className="mono text-xs">{p.code}</span>
                <button type="button" className="btn btn-primary !py-1 !px-3 text-xs" onClick={() => { navigator.clipboard?.writeText(p.code); setCopied(p.id); setTimeout(() => setCopied(null), 1500); }}>{copied === p.id ? "Copied" : "Copy code"}</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
