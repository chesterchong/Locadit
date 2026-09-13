"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RangePicker, { label, type Win } from "@/components/range-picker";

const DESTS: [string, string][] = [["Japan", "🇯🇵"], ["Korea", "🇰🇷"], ["Malaysia", "🇲🇾"], ["Indonesia", "🇮🇩"], ["Singapore", "🇸🇬"]];

export default function Home() {
  const r = useRouter();
  const [dest, setDest] = useState("Japan");
  const [name, setName] = useState("Japan with the crew");
  const [nameTouched, setNameTouched] = useState(false);
  const choose = (d: string) => { setDest(d); if (!nameTouched) setName(`${d} with the crew`); };
  const [wins, setWins] = useState<Win[]>([]);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState("");

  const valid = wins;
  const canCreate = name.trim().length > 0 && valid.length > 0 && !creating;

  async function create() {
    if (!canCreate) return;
    setCreating(true);
    const res = await fetch("/api/trips", { method: "POST", body: JSON.stringify({ name: name.trim(), destination: dest, dateOptions: valid.map(label) }) });
    const t = await res.json();
    r.push(`/t/${t.code}?host=1`);
  }
  async function join() {
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return;
    setJoining(true); setJoinErr("");
    const res = await fetch(`/api/trips/${c}`);
    setJoining(false);
    if (res.ok) r.push(`/t/${c}`); else setJoinErr(res.status === 404 ? "No room with that code. Check it with whoever invited you." : "Couldn't reach the room. Try again.");
  }

  return (
    <main className="mx-auto max-w-md px-6 pt-16 pb-14 space-y-8 enter">
      <Link href="/" className="home-link">Locadit</Link>
      <div className="pill"><span className="dot" />Live · no sign-up · 2 min per person</div>
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight">Locadit</h1>
        <p className="muted mt-3 text-lg leading-snug">Group trips without the argument. Everyone swipes privately. One itinerary comes out.</p>
      </div>

      <section className="glass p-5 space-y-4 pop">
        <p className="text-xs uppercase tracking-widest muted">Start a trip</p>
        <input className="input" value={name} onChange={(e) => { setName(e.target.value); setNameTouched(true); }} placeholder="Trip name" aria-label="Trip name" />
        <div className="dest-tiles" role="radiogroup" aria-label="Destination">
          {DESTS.map(([d, flag]) => <button key={d} type="button" role="radio" aria-checked={dest === d} className={`dest-tile ${dest === d ? "on" : ""}`} onClick={() => choose(d)}><span className="flag" aria-hidden>{flag}</span><span>{d}</span></button>)}
        </div>
        <RangePicker value={wins} onChange={setWins} max={4} />
        <button onClick={create} disabled={!canCreate} className="btn btn-primary w-full disabled:opacity-30">{creating ? "Creating…" : "Create room"}</button>
        {!canCreate && !creating && <p className="text-xs muted text-center">{!name.trim() ? "Give the trip a name to continue." : "Add at least one date window on the calendar."}</p>}
      </section>

      <section className="glass p-5 space-y-3 pop">
        <p className="text-xs uppercase tracking-widest muted">Join a trip</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); join(); }}>
          <input className="input mono uppercase tracking-widest" value={code} maxLength={4} onChange={(e) => { setCode(e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase()); setJoinErr(""); }} placeholder="ROOM CODE" aria-label="Room code" aria-invalid={!!joinErr} />
          <button className="btn btn-ghost" disabled={code.length !== 4 || joining}>{joining ? "Checking…" : "Join"}</button>
        </form>
        {joinErr ? <p className="text-xs text-rose-500">{joinErr}</p> : <p className="text-xs muted">4 letters or digits, from the person who invited you.</p>}
      </section>
    </main>
  );
}
