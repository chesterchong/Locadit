"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ACTIVITIES } from "@/lib/store";
const EMOJI: Record<string, string> = { "Food & markets": "🍜", Nightlife: "🪩", "Nature & hikes": "🏔️", "Museums & culture": "🏛️", "Beach & rest": "🏝️", Shopping: "🛍️", "Adventure sports": "🪂", "Local neighbourhoods": "🚲" };
const HUE: Record<string, string> = { "Food & markets": "#f97316", Nightlife: "#a855f7", "Nature & hikes": "#22c55e", "Museums & culture": "#eab308", "Beach & rest": "#06b6d4", Shopping: "#ec4899", "Adventure sports": "#ef4444", "Local neighbourhoods": "#3b82f6" };
export default function Quiz() {
  const { code } = useParams<{ code: string }>();
  const r = useRouter();
  const [trip, setTrip] = useState<{ name: string; destination: string; dateOptions: string[] } | null>(null);
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState(800);
  const [dates, setDates] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [fly, setFly] = useState<null | number>(null);
  const start = useRef(0);
  useEffect(() => { fetch(`/api/trips/${code}`).then((r) => r.json()).then((d) => setTrip(d.trip)); }, [code]);
  async function submit(final: Record<string, number>) {
    await fetch(`/api/trips/${code}/answers`, { method: "POST", body: JSON.stringify({ name, budget, dates, interests: final }) });
    r.push(`/t/${code}/board`);
  }
  function vote(v: number) {
    setFly(v === 0 ? -1 : v === 3 ? 1 : 0);
    setTimeout(() => {
      const next = { ...interests, [ACTIVITIES[i]]: v };
      setInterests(next); setFly(null); setDx(0);
      if (i + 1 < ACTIVITIES.length) setI(i + 1); else submit(next);
    }, 260);
  }
  const onDown = (e: React.PointerEvent) => { start.current = e.clientX; setDrag(true); (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (drag) setDx(e.clientX - start.current); };
  const onUp = () => { setDrag(false); if (dx > 110) vote(3); else if (dx < -110) vote(0); else setDx(0); };
  if (!trip) return <main className="p-6 muted">Loading…</main>;
  const act = ACTIVITIES[i];
  const x = fly === null ? dx : fly * 600;
  const rot = x / 18;
  const love = Math.min(1, Math.max(0, x / 110)), pass = Math.min(1, Math.max(0, -x / 110));
  return (
    <main className="mx-auto max-w-md px-6 py-10 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest muted">{trip.destination} · private quiz</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{trip.name}</h1>
      </header>
      {step === 0 && (
        <section className="glass p-5 space-y-5 pop">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <div>
            <div className="flex justify-between text-sm"><span className="muted">Max I&apos;m comfortable spending</span><span className="mono font-semibold">${budget}</span></div>
            <input type="range" min={200} max={3000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="mt-2 w-full" />
          </div>
          <div className="space-y-2">
            <p className="text-sm muted">Dates I can do</p>
            <div className="grid gap-2">{trip.dateOptions.map((d) => (
              <button key={d} onClick={() => setDates(dates.includes(d) ? dates.filter((x) => x !== d) : [...dates, d])} className={`chip text-left mono text-sm ${dates.includes(d) ? "on" : ""}`}>{d}</button>
            ))}</div>
          </div>
          <button disabled={!name || !dates.length} onClick={() => setStep(1)} className="btn btn-primary w-full disabled:opacity-30">Start swiping →</button>
          <p className="text-xs muted text-center">Nobody sees your answers, only the merged result.</p>
        </section>
      )}
      {step === 1 && (
        <section className="space-y-5 select-none">
          <div className="flex items-center justify-between text-xs muted"><span className="mono">{i + 1} / {ACTIVITIES.length}</span><span>← pass · love →</span></div>
          <div className="relative h-[460px]" style={{ perspective: 1000 }}>
            {ACTIVITIES[i + 1] && <div className="glass absolute inset-0 scale-[.95] translate-y-3 opacity-60" />}
            <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              className="glass absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden touch-none"
              style={{ transform: `translateX(${x}px) rotate(${rot}deg)`, transition: drag ? "none" : "transform .26s ease-out", background: `radial-gradient(80% 60% at 50% 0%, ${HUE[act]}33, #fff 70%)` }}>
              <div className="absolute left-5 top-5 rounded-lg border-2 border-green-600 px-3 py-1 text-lg font-extrabold text-green-600 -rotate-12" style={{ opacity: love }}>LOVE</div>
              <div className="absolute right-5 top-5 rounded-lg border-2 border-rose-500 px-3 py-1 text-lg font-extrabold text-rose-500 rotate-12" style={{ opacity: pass }}>PASS</div>
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="text-7xl drop-shadow-[0_10px_30px_rgba(0,0,0,.2)]">{EMOJI[act]}</div>
                <h2 className="text-3xl font-extrabold tracking-tight">{act}</h2>
                <p className="muted text-sm">in {trip.destination}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-6 py-4 text-xs mono muted border-t border-black/10">
                <span>BUDGET ${budget}</span><span>{dates.length} DATE{dates.length > 1 ? "S" : ""}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => vote(0)} className="btn btn-ghost text-rose-500">✕ Pass</button>
            <button onClick={() => vote(1)} className="btn btn-ghost">~ Maybe</button>
            <button onClick={() => vote(3)} className="btn btn-primary">♥ Love</button>
          </div>
        </section>
      )}
    </main>
  );
}
