"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
type Data = { trip: { code: string; name: string; destination: string; answers: { name: string }[]; expenses: { id: string; title: string; amount: number; paidBy: string }[] }; result: null | { budget: number; bestDate: { d: string; n: number }; dateVotes: { d: string; n: number }[]; scores: { act: string; score: number }[]; itinerary: { day: number; theme: string; why: string; budget: number; plan: string[] }[]; members: string[]; pace: string; notes: { name: string; mustHave?: string; avoid?: string }[] }; balances: Record<string, number> };
export default function Board() {
  const { code } = useParams<{ code: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState(""); const [paidBy, setPaidBy] = useState("");
  const load = () => fetch(`/api/trips/${code}`).then((r) => r.json()).then(setD);
  useEffect(() => { load(); const t = setInterval(load, 2500); return () => clearInterval(t); }, [code]); // eslint-disable-line
  if (!d || !d.trip) return <main className="p-6 muted">Loading…</main>;
  const { trip, result, balances } = d;
  const link = typeof window !== "undefined" ? `${window.location.origin}/t/${trip.code}` : "";
  async function addExpense() {
    await fetch(`/api/trips/${code}/expenses`, { method: "POST", body: JSON.stringify({ title, amount: +amount, paidBy, splitAmong: result?.members ?? [] }) });
    setTitle(""); setAmount(""); load();
  }
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div className="pill"><span className="dot" />Room is live · <span className="mono">{trip.code}</span> · {trip.answers.length} joined · {trip.expenses.length} expenses</div>
      <header>
        <p className="text-xs uppercase tracking-widest muted">{trip.destination}</p>
        <h1 className="text-4xl font-extrabold tracking-tight">{trip.name}</h1>
        <p className="muted mt-1 text-sm">Share <span className="mono text-black/80">{link}</span></p>
        <p className="text-sm mt-1">{trip.answers.map((a) => a.name).join(" · ") || <span className="muted">waiting for the first swipe…</span>}</p>
        <Link href={`/t/${trip.code}`} className="btn btn-primary inline-block mt-3">Add my answers</Link>
      </header>
      {!result ? <div className="glass p-8 muted text-center">Results appear here live as people finish swiping.</div> : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="glass p-5 pop"><p className="text-xs uppercase tracking-widest muted">Budget ceiling</p><p className="mono text-4xl font-semibold mt-1">${result.budget.toLocaleString()}</p><p className="text-xs muted mt-1">lowest comfortable max · per person</p></div>
            <div className="glass glass-hi p-5 pop"><p className="text-xs uppercase tracking-widest muted">Best dates</p><p className="mono text-3xl font-semibold mt-1">{result.bestDate.d}</p><p className="text-xs muted mt-1"><span className="text-green-600">▲ {result.bestDate.n}/{result.members.length}</span> can make it</p></div>
          </section>
          <section className="glass p-5 space-y-3 pop">
            <p className="text-xs uppercase tracking-widest muted">What the group wants</p>
            {result.scores.map((s) => { const pct = Math.round((s.score / (3 * result.members.length)) * 100); return (
              <div key={s.act} className="flex items-center gap-3 text-sm"><span className="w-44 truncate">{s.act}</span><div className="bar flex-1"><div style={{ width: `${pct}%` }} /></div><span className="mono w-10 text-right muted">{pct}%</span></div>
            ); })}
          </section>
          {result.notes.length > 0 && (
            <section className="glass p-5 space-y-2 pop">
              <p className="text-xs uppercase tracking-widest muted">What people need</p>
              {result.notes.map((n) => (
                <p key={n.name} className="text-sm"><b>{n.name}</b>{n.mustHave && <span> · must have <span className="text-green-600">{n.mustHave}</span></span>}{n.avoid && <span> · avoid <span className="text-rose-500">{n.avoid}</span></span>}</p>
              ))}
            </section>
          )}
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-widest muted">Itinerary · {result.pace === "chill" ? "slow pace" : result.pace === "packed" ? "packed days" : "balanced pace"}</p>
            {result.itinerary.map((day) => (
              <div key={day.day} className="glass p-5 pop">
                <div className="flex items-baseline justify-between"><p className="font-semibold text-lg"><span className="mono muted mr-2">D{day.day}</span>{day.theme}</p><p className="mono text-sm muted">~${day.budget}/pp</p></div>
                <p className="text-sm muted mt-1">Why: {day.why}</p>
                <ul className="mt-3 space-y-1 text-sm">{day.plan.map((p, k) => <li key={p} className="flex gap-3"><span className="mono muted">{["AM", "PM", "EVE"][k]}</span>{p}</li>)}</ul>
              </div>
            ))}
          </section>
          <section className="glass p-5 space-y-3 pop">
            <p className="text-xs uppercase tracking-widest muted">Split costs</p>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Villa deposit" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="input mono w-24" placeholder="$" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <select className="input w-32" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}><option value="">Paid by</option>{result.members.map((m) => <option key={m}>{m}</option>)}</select>
              <button onClick={addExpense} disabled={!title || !amount || !paidBy} className="btn btn-primary disabled:opacity-30">Add</button>
            </div>
            {trip.expenses.map((e) => <p key={e.id} className="text-sm flex justify-between"><span>{e.title} <span className="muted">· {e.paidBy}</span></span><span className="mono">${e.amount}</span></p>)}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {Object.entries(balances).map(([n, b]) => <div key={n} className="chip flex justify-between text-sm"><span>{n}</span><span className={`mono ${b >= 0 ? "text-green-600" : "text-rose-500"}`}>{b >= 0 ? "▲" : "▼"} ${Math.abs(b).toFixed(0)}</span></div>)}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
