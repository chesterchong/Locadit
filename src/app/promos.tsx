"use client";
import { useState } from "react";

// Floating promo flyers: a few UFOs, planes and balloons drift across the page. Tap one for the deal.
// Offers are sample content for the prototype until a deals feed is connected.
const PROMOS = [
  { id: "flight", icon: "✈️", title: "Flights from $189", body: "Return fares to your destination in the autumn sale. Sample offer.", code: "FLY189", top: 18, dur: 58, delay: 0 },
  { id: "hotel", icon: "🎈", title: "20% off villas", body: "Voucher for stays of 3+ nights at partner villas. Sample offer.", code: "STAY20", top: 62, dur: 74, delay: -25 },
  { id: "transfer", icon: "🛸", title: "Free airport pickup", body: "Book 4+ nights and the transfer is on us. Sample offer.", code: "PICKUP", top: 38, dur: 66, delay: -48 },
];

export default function Promos() {
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="promos" aria-label="Offers">
      {PROMOS.map((p) => (
        <div key={p.id} className="promo" style={{ top: `${p.top}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>
          <button type="button" className="promo-pin" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id} aria-label={p.title}>{p.icon}</button>
          {open === p.id && (
            <div className="promo-card pop" role="dialog">
              <b>{p.title}</b>
              <p>{p.body}</p>
              <div className="flex items-center gap-2">
                <span className="mono text-xs">{p.code}</span>
                <button type="button" className="btn btn-primary !py-1 !px-3 text-xs" onClick={() => { navigator.clipboard?.writeText(p.code); setCopied(p.id); setTimeout(() => setCopied(null), 1500); }}>{copied === p.id ? "Copied" : "Copy code"}</button>
                <button type="button" className="ml-auto text-xs muted" onClick={() => setOpen(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
