"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Home() {
  const r = useRouter();
  const [name, setName] = useState("Trip with the crew");
  const [dest, setDest] = useState("Japan");
  const DESTS = [["Japan", "🇯🇵"], ["Korea", "🇰🇷"], ["Malaysia", "🇲🇾"], ["Indonesia", "🇮🇩"], ["Singapore", "🇸🇬"]];
  const [dates, setDates] = useState("Oct 10–14, Oct 17–21, Nov 7–11");
  const [code, setCode] = useState("");
  async function create() {
    const res = await fetch("/api/trips", { method: "POST", body: JSON.stringify({ name, destination: dest, dateOptions: dates.split(",").map((s) => s.trim()).filter(Boolean) }) });
    const t = await res.json();
    r.push(`/t/${t.code}?host=1`);
  }
  return (
    <main className="mx-auto max-w-md px-6 py-14 space-y-8 enter">
      <Link href="/" className="home-link">Locadit</Link>
      <div className="pill"><span className="dot" />Rooms are live · no sign‑up · 2 min per person</div>
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight">Locadit</h1>
        <p className="muted mt-3 text-lg leading-snug">Group trips without the argument. Everyone swipes privately. One itinerary comes out.</p>
      </div>
      <section className="glass p-5 space-y-3 pop">
        <p className="text-xs uppercase tracking-widest muted">Start a trip</p>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Trip name" />
        <div className="dest-grid" role="radiogroup" aria-label="Destination">
          {DESTS.map(([d, flag]) => <button key={d} type="button" role="radio" aria-checked={dest === d} className={`chip dest ${dest === d ? "on" : ""}`} onClick={() => setDest(d)}><span aria-hidden>{flag}</span>{d}</button>)}
        </div>
        <input className="input" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Date options, comma separated" />
        <button onClick={create} className="btn btn-primary w-full">Create room</button>
      </section>
      <section className="glass p-5 space-y-3 pop">
        <p className="text-xs uppercase tracking-widest muted">Join a trip</p>
        <input className="input mono uppercase tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ROOM CODE" />
        <button onClick={() => r.push(`/t/${code.toUpperCase()}`)} className="btn btn-ghost w-full">Join</button>
      </section>
    </main>
  );
}
