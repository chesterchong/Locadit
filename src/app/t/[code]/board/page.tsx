"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingView from "@/app/loading-view";
import { useParams } from "next/navigation";
import ShareQr from "@/components/share-qr";
type Signal = { id: string; title: string; level: "calm" | "heads-up" | "caution" | "info"; message: string; advice?: string; source: string; asOf?: string; live?: boolean; links?: { label: string; href: string }[] };
type Radar = { place?: { name: string; country: string }; window?: { label: string }; signals: Signal[]; generatedAt: number; partial?: boolean };
const LEVEL: Record<Signal["level"], string> = { calm: "Clear", "heads-up": "Check", caution: "Act", info: "Live" };
type Data = { trip: { code: string; name: string; destination: string; answers: { name: string }[]; expenses: { id: string; title: string; amount: number; paidBy: string }[] }; result: null | { budget: number; bestDate: { d: string; n: number }; dateVotes: { d: string; n: number }[]; scores: { act: string; score: number }[]; itinerary: { day: number; theme: string; headline?: string; why: string; budget: number; plan: string[] }[]; members: string[]; pace: string; notes: { name: string; mustHave?: string; avoid?: string }[]; realItinerary: boolean; itineraryTitle?: string; itineraryIntro?: string; itineraryPhoto?: string; itineraryGeneratedAt?: number }; balances: Record<string, number> };
export default function Board() {
  const { code } = useParams<{ code: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState(""); const [paidBy, setPaidBy] = useState("");
  const [copied, setCopied] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { try { setMe(localStorage.getItem("locadit:name")); } catch {} }, []);
  const [radar, setRadar] = useState<Radar | null>(null);
  useEffect(() => {
    const go = () => fetch(`/api/trips/${code}/risk`).then((r) => (r.ok ? r.json() : null)).then((j) => j && setRadar(j)).catch(() => {});
    go(); const t = setInterval(go, 600000); return () => clearInterval(t);
  }, [code]);
  const [missing, setMissing] = useState(false);
  const load = () => fetch(`/api/trips/${code}`).then((r) => { if (r.status === 404) { setMissing(true); return null; } return r.json(); }).then((j) => { if (j) setD(j); }).catch(() => {});
  useEffect(() => { load(); const t = setInterval(() => { if (!missing) load(); }, 2500); return () => clearInterval(t); }, [code, missing]); // eslint-disable-line
  if (missing) return <NotFound code={code} />;
  if (!d || !d.trip) return <LoadingView label="Opening the live board" />;
  const { trip, result, balances } = d;
  const link = typeof window !== "undefined" ? `${window.location.origin}/t/${trip.code}` : "";
  async function addExpense() {
    await fetch(`/api/trips/${code}/expenses`, { method: "POST", body: JSON.stringify({ title, amount: +amount, paidBy, splitAmong: result?.members ?? [] }) });
    setTitle(""); setAmount(""); load();
  }
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-10 space-y-6">
      <ShareQr code={trip.code} />
      <Link href="/" className="home-link">Locadit</Link>
      <div className="pill"><span className="dot" />Live · <span className="mono">{trip.code}</span></div>
      <header>
        <p className="text-xs uppercase tracking-widest muted">{trip.destination}</p>
        <h1 className="text-4xl font-extrabold tracking-tight">{trip.name}</h1>
        <div className="people mt-4">
          <div className="flex items-center gap-3">
            <div className="avatars">
              {trip.answers.map((a) => <span key={a.name} className="avatar" style={{ background: tone(a.name) }} data-name={a.name}>{initials(a.name)}</span>)}
              <button type="button" className="avatar add" title={copied ? "Copied" : "Copy invite link"} onClick={() => { navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }); }}>{copied ? "✓" : "+"}</button>
            </div>
            <p className="text-sm muted">{trip.answers.length === 0 ? "No answers yet" : `${trip.answers.length} answered`}</p>
          </div>
          <Link href={`/t/${trip.code}`} className="btn btn-primary !rounded-full !py-2 !px-4 text-sm">{me && trip.answers.some((a) => a.name === me) ? "Edit my answers" : "Join and answer →"}</Link>
        </div>
      </header>
      <section className="glass p-5 space-y-3 pop">
        <div className="radar-head">
          <p className="text-xs uppercase tracking-widest muted">Trip radar{radar?.place ? ` · ${radar.place.name}, ${radar.place.country}` : ""}</p>
          {radar && <p className="text-xs muted">{radar.partial ? "Some sources unavailable" : "Updated now"}{radar.window ? ` · ${radar.window.label}` : ""}</p>}
        </div>
        {!radar ? <p className="radar-loading"><span className="spinner" />Checking live conditions…</p> : (
          <div className="radar-grid">
            {radar.signals.map((s) => (
              <article key={s.id} className={`signal ${s.level}`}>
                <div className="signal-head"><b>{s.title}{s.live && <span className="live-dot" />}</b><span className="lvl">{LEVEL[s.level]}</span></div>
                <p className="signal-value">{s.message}</p>
                {s.advice && <p className="signal-action">{s.advice}</p>}
                {s.links?.[0] && <a className="signal-open" href={s.links[0].href} target="_blank" rel="noreferrer" aria-label={`Open ${s.links[0].label}`} title={s.links[0].label}><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5.2 12.8 12.8 5.2M6.6 5.2h6.2v6.2" /></svg></a>}
              </article>
            ))}
          </div>
        )}
      </section>
      {!result ? <div className="glass p-8 muted text-center">Results appear here live as people finish swiping.</div> : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="glass p-5 pop"><p className="text-xs uppercase tracking-widest muted">Budget ceiling</p><p className="mono text-4xl font-semibold mt-1">${result.budget.toLocaleString()}</p><p className="text-xs muted mt-1">lowest comfortable max · per person</p></div>
            <div className="glass glass-hi p-5 pop"><p className="text-xs uppercase tracking-widest muted">Best dates</p><p className="mono text-3xl font-semibold mt-1">{result.bestDate.d}</p><p className="text-xs muted mt-1"><span className="text-green-600">▲ {result.bestDate.n}/{result.members.length}</span> can make it</p>
              <div className="mt-3 space-y-1">{result.dateVotes.filter((d) => d.d !== result.bestDate.d).map((d) => <p key={d.d} className="flex justify-between text-xs muted"><span className="mono">{d.d}</span><span>{d.n}/{result.members.length}</span></p>)}</div></div>
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
                <div className="flex items-baseline justify-between gap-3"><p className="font-semibold text-lg"><span className="mono muted mr-2">D{day.day}</span>{day.headline ?? day.theme}</p><p className="mono text-sm muted shrink-0">~${day.budget}/pp</p></div>
                {day.headline && <p className="text-xs uppercase tracking-widest mt-1 muted">{day.theme}</p>}
                <p className="text-sm muted mt-1">Why: {day.why}</p>
                <ul className="mt-3 space-y-1 text-sm">{day.plan.map((p, k) => <li key={p} className="flex gap-3"><span className="mono muted">{["AM", "PM", "EVE"][k]}</span>{p}</li>)}</ul>
              </div>
            ))}
          </section>
          <section className="glass p-5 space-y-4 pop">
            <div className="flex items-baseline justify-between"><p className="text-xs uppercase tracking-widest muted">Split costs</p>{trip.expenses.length > 0 && <p className="text-xs muted">Total <span className="mono text-black/80">${trip.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span> · {result.members.length} people</p>}</div>
            <form className="money-form" onSubmit={(e) => { e.preventDefault(); if (title.trim() && +amount > 0 && paidBy) addExpense(); }}>
              <input className="input" placeholder="Villa deposit, flights…" value={title} onChange={(e) => setTitle(e.target.value)} />
              <label className="amount"><span>$</span><input className="input mono" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} /></label>
              <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}><option value="">Who paid?</option>{result.members.map((m) => <option key={m}>{m}</option>)}</select>
              <button type="submit" disabled={!title.trim() || !(+amount > 0) || !paidBy} className="btn btn-primary disabled:opacity-30">Add</button>
            </form>
            {trip.expenses.length === 0 ? (
              <p className="text-sm muted">No expenses yet. Add the deposit, the flights or last night&apos;s dinner and Locadit splits it equally across everyone who answered.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {trip.expenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div><p className="font-medium">{e.title}</p><p className="text-xs muted">paid by {e.paidBy} · split {result.members.length} ways · <span className="mono">${(e.amount / Math.max(1, result.members.length)).toFixed(0)}</span> each</p></div>
                    <span className="mono">${e.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            {trip.expenses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest muted">Settle up</p>
                {result.members.length < 2 ? <p className="text-sm muted">Just you so far. Settling starts when a second person answers.</p> : settle(balances).length === 0 ? <p className="text-sm text-green-700">All square. Nobody owes anything.</p> : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {settle(balances).map((s, k) => <li key={k} className="chip flex items-center justify-between text-sm"><span><b>{s.from}</b> pays <b>{s.to}</b></span><span className="mono">${s.amount.toFixed(0)}</span></li>)}
                  </ul>
                )}
              </div>
            )}
          </section>
        </>
      )}
      <p className="credit-static">Made by Team Odyssey for Codenection 2026 <span aria-hidden>❤️</span></p>
    </main>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <main className="mx-auto max-w-md px-6 py-16 space-y-6">
      <Link href="/" className="home-link">Locadit</Link>
      <div className="glass p-6 space-y-3 pop">
        <p className="text-xs uppercase tracking-widest muted">Room not found</p>
        <h1 className="text-2xl font-extrabold tracking-tight">No room with code <span className="mono">{code}</span></h1>
        <p className="muted text-sm">Check the code with whoever shared it. Rooms in this prototype live in memory and can expire after a while of inactivity.</p>
        <div className="flex gap-2 pt-1">
          <Link href="/start" className="btn btn-primary">Start a new room</Link>
          <Link href="/start" className="btn btn-ghost">Enter another code</Link>
        </div>
      </div>
    </main>
  );
}

// Greedy settlement: turn per-person balances into the fewest "A pays B" transfers.
function settle(balances: Record<string, number>) {
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.5).map(([n, v]) => ({ n, v: -v })).sort((a, b) => b.v - a.v);
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.5).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    out.push({ from: debtors[i].n, to: creditors[j].n, amount: amt });
    debtors[i].v -= amt; creditors[j].v -= amt;
    if (debtors[i].v < 0.5) i++;
    if (creditors[j].v < 0.5) j++;
  }
  return out;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}
// Stable pastel per name.
function tone(name: string) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 86%)`;
}
