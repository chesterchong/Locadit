"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DESTS: [string, string][] = [["Japan", "🇯🇵"], ["Korea", "🇰🇷"], ["Malaysia", "🇲🇾"], ["Indonesia", "🇮🇩"], ["Singapore", "🇸🇬"]];
type Win = { from: string; to: string };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-10-10","2026-10-14" -> "Oct 10–14"; across months -> "Oct 30 – Nov 2"
function label(w: Win) {
  const a = new Date(w.from + "T00:00:00"), b = new Date(w.to + "T00:00:00");
  return a.getMonth() === b.getMonth() ? `${MON[a.getMonth()]} ${a.getDate()}–${b.getDate()}` : `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}`;
}
const today = new Date().toISOString().slice(0, 10);

export default function Home() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [dest, setDest] = useState("Japan");
  const [wins, setWins] = useState<Win[]>([{ from: "", to: "" }]);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState("");

  const valid = wins.filter((w) => w.from && w.to && w.to >= w.from);
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
  const setWin = (i: number, patch: Partial<Win>) => setWins((ws) => ws.map((w, k) => (k === i ? { ...w, ...patch, ...(patch.from && w.to && w.to < patch.from ? { to: patch.from } : {}) } : w)));

  return (
    <main className="mx-auto max-w-md px-6 py-14 space-y-8 enter">
      <Link href="/" className="home-link">Locadit</Link>
      <div className="pill"><span className="dot" />Live · no sign-up · 2 min per person</div>
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight">Locadit</h1>
        <p className="muted mt-3 text-lg leading-snug">Group trips without the argument. Everyone swipes privately. One itinerary comes out.</p>
      </div>

      <section className="glass p-5 space-y-4 pop">
        <p className="text-xs uppercase tracking-widest muted">Start a trip</p>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Trip name" aria-label="Trip name" autoFocus />
        <div className="dest-grid" role="radiogroup" aria-label="Destination">
          {DESTS.map(([d, flag]) => <button key={d} type="button" role="radio" aria-checked={dest === d} className={`chip dest ${dest === d ? "on" : ""}`} onClick={() => setDest(d)}><span aria-hidden>{flag}</span>{d}</button>)}
        </div>
        <div className="space-y-2">
          <p className="text-xs muted">Date windows the group can vote on</p>
          {wins.map((w, i) => (
            <div key={i} className="date-row">
              <input type="date" className="input" min={today} value={w.from} onChange={(e) => setWin(i, { from: e.target.value })} aria-label={`Option ${i + 1} start`} />
              <span className="muted">to</span>
              <input type="date" className="input" min={w.from || today} value={w.to} onChange={(e) => setWin(i, { to: e.target.value })} aria-label={`Option ${i + 1} end`} />
              {wins.length > 1 && <button type="button" className="date-x" aria-label="Remove option" onClick={() => setWins((ws) => ws.filter((_, k) => k !== i))}>×</button>}
            </div>
          ))}
          {wins.length < 3 && <button type="button" className="text-sm underline muted" onClick={() => setWins((ws) => [...ws, { from: "", to: "" }])}>+ another window</button>}
        </div>
        <button onClick={create} disabled={!canCreate} className="btn btn-primary w-full disabled:opacity-30">{creating ? "Creating…" : "Create room"}</button>
        {!canCreate && !creating && <p className="text-xs muted text-center">{!name.trim() ? "Give the trip a name to continue." : "Pick at least one date window."}</p>}
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
