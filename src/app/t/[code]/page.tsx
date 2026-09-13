"use client";
import Link from "next/link";
import LoadingView from "@/app/loading-view";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ACTIVITIES, Pace } from "@/lib/store";
import Promos from "@/app/promos";

type Trip = { code: string; name: string; destination: string; dateOptions: string[]; place?: { name: string; country: string; lat: number; lon: number } };
// Search terms per activity for real photos (Wikimedia Commons via /api/photos).
const TERMS: Record<string, string> = { "Food & markets": "street food market", Nightlife: "night lights bar", "Nature & hikes": "waterfall hike nature", "Museums & culture": "temple museum culture", "Beach & rest": "beach", Shopping: "shopping street market", "Adventure sports": "surfing diving adventure", "Local neighbourhoods": "street neighbourhood" };
type Q = "name" | "budget" | "dates" | "pace" | "must" | "avoid";
const FLOW: Q[] = ["name", "budget", "dates", "pace", "must", "avoid"];
const SUGGEST: Record<string, string> = { must: "one proper beach day", avoid: "early mornings" };
const EMOJI: Record<string, string> = { "Food & markets": "🍜", Nightlife: "🪩", "Nature & hikes": "🏔️", "Museums & culture": "🏛️", "Beach & rest": "🏝️", Shopping: "🛍️", "Adventure sports": "🪂", "Local neighbourhoods": "🚲" };
const HUE: Record<string, string> = { "Food & markets": "#f97316", Nightlife: "#a855f7", "Nature & hikes": "#22c55e", "Museums & culture": "#eab308", "Beach & rest": "#06b6d4", Shopping: "#ec4899", "Adventure sports": "#ef4444", "Local neighbourhoods": "#3b82f6" };

export default function Quiz() {
  const { code } = useParams<{ code: string }>();
  const r = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [host, setHost] = useState(false);

  // Intake conversation
  const [q, setQ] = useState(0);                       // index into FLOW; FLOW.length = swiping
  const [log, setLog] = useState<{ from: "ai" | "me"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState(800);
  const [dates, setDates] = useState<string[]>([]);
  const [pace, setPace] = useState<Pace>("balanced");
  const [mustHave, setMustHave] = useState("");
  const [avoid, setAvoid] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Swiping
  const [i, setI] = useState(0);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [fly, setFly] = useState<null | number>(null);
  const start = useRef(0);
  const [photos, setPhotos] = useState<Record<string, string | null>>({});

  // Fetch a real photo for the current and next card; preload so the swap is instant.
  useEffect(() => {
    if (!trip || q < FLOW.length) return;
    [ACTIVITIES[i], ACTIVITIES[i + 1]].filter(Boolean).forEach((a) => {
      if (photos[a] !== undefined) return;
      setPhotos((ph) => ({ ...ph, [a]: null }));
      fetch(`/api/photos?q=${encodeURIComponent(`${trip.destination} ${TERMS[a]}`)}`).then((r) => r.json()).then((j) => {
        const url: string | null = j.photos?.[0]?.url ?? null;
        if (url) { const im = new Image(); im.src = url; }
        setPhotos((ph) => ({ ...ph, [a]: url }));
      }).catch(() => {});
    });
  }, [trip, q, i]); // eslint-disable-line

  const [missing, setMissing] = useState(false);
  useEffect(() => {
    const isHost = new URLSearchParams(window.location.search).get("host") === "1";
    fetch(`/api/trips/${code}`).then((r) => (r.status === 404 ? null : r.json())).then((d) => {
      if (!d) { setMissing(true); return; }
      setHost(isHost);
      setTrip(d.trip);
    }).catch(() => setMissing(true));
  }, [code]);

  // Locadit asks the next question whenever the conversation advances.
  useEffect(() => {
    if (!trip || q >= FLOW.length) return;
    const first = trip.dateOptions[0] ?? "";
    const prompts: Record<Q, string> = {
      name: `Hey! I'm Locadit. I'm helping plan ${trip.name}. What should I call you?`,
      budget: `Nice to meet you, ${name}. What's the most you'd be happy spending on this trip, all in?`,
      dates: `Got it. Which of these dates work for you? Pick every one that does${first ? `, even if ${first} is your favourite` : ""}.`,
      pace: `How do you like to travel: slow mornings, a balanced mix, or every hour planned?`,
      must: `One thing this ${trip.destination} trip must include for you?`,
      avoid: `And one thing you'd rather avoid? (Skip if nothing comes to mind.)`,
    };
    const start = window.setTimeout(() => setTyping(true), 0);
    const finish = window.setTimeout(() => { setTyping(false); setLog((l) => [...l, { from: "ai", text: prompts[FLOW[q]] }]); }, 550);
    return () => { window.clearTimeout(start); window.clearTimeout(finish); };
  }, [trip, q, name]);

  // Pin the newest question to the top of the panel: earlier messages scroll up out of view.
  // A spacer under the messages gives the list enough room to place the last question at the top.
  const spacerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current, sp = spacerRef.current;
    if (!el || !sp) return;
    const ai = el.querySelectorAll<HTMLElement>(".bubble.ai");
    const last = ai[ai.length - 1];
    if (!last) return;
    sp.style.height = `${Math.max(0, el.clientHeight - last.offsetHeight - 12)}px`;
    if (log[log.length - 1]?.from === "ai") el.scrollTo({ top: last.offsetTop, behavior: "smooth" });
  }, [log, typing]);

  function answer(text: string) {
    setLog((l) => [...l, { from: "me", text }]);
    setDraft("");
    setQ((n) => n + 1);
  }

  async function submit(final: Record<string, number>) {
    await fetch(`/api/trips/${code}/answers`, { method: "POST", body: JSON.stringify({ name, budget, dates, interests: final, pace, mustHave: mustHave || undefined, avoid: avoid || undefined }) });
    r.push(`/t/${code}/board`);
  }
  function vote(v: number) {
    if (fly !== null) return; // ignore taps while a card is still flying off
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

  if (missing) return (
    <main className="mx-auto max-w-md px-6 py-16 space-y-6">
      <Link href="/" className="home-link">Locadit</Link>
      <div className="glass p-6 space-y-3 pop">
        <p className="text-xs uppercase tracking-widest muted">Room not found</p>
        <h1 className="text-2xl font-extrabold tracking-tight">No room with code <span className="mono">{code}</span></h1>
        <p className="muted text-sm">Check the code with whoever shared it. Rooms in this prototype live in memory and can expire after a while of inactivity.</p>
        <div className="flex gap-2 pt-1"><Link href="/start" className="btn btn-primary">Start a new room</Link><Link href="/start" className="btn btn-ghost">Enter another code</Link></div>
      </div>
    </main>
  );
  if (!trip) return <LoadingView label="Opening your room" />;
  const current = FLOW[q];
  const act = ACTIVITIES[i];
  const x = fly === null ? dx : fly * 600;
  const rot = x / 18;
  const love = Math.min(1, Math.max(0, x / 110)), pass = Math.min(1, Math.max(0, -x / 110));
  const photo = photos[act] || null;
  // Fade the card as it travels: gradually while dragging, fully once it flies off.
  const fade = fly !== null ? 0 : 1 - Math.min(0.75, Math.abs(dx) / 320);

  return (
    <main className={`mx-auto max-w-md px-6 py-10 flex flex-col gap-6 ${q < FLOW.length ? "h-[100svh] overflow-hidden" : "min-h-[100svh] justify-center"}`}>
      <Link href="/" className="home-link">Locadit</Link>
      <Promos />
      {host && (
        <div className="pill w-full justify-between shrink-0">
          <span><span className="dot" /> You started this room · code <b className="mono">{trip.code}</b></span>
          <Link href={`/t/${trip.code}/board`} className="underline">Live board →</Link>
        </div>
      )}
      <header className="shrink-0">
        <p className="text-xs uppercase tracking-widest muted">{trip.destination} · private</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{trip.name}</h1>
      </header>

      {q < FLOW.length && (
        <section className="glass p-5 flex flex-col gap-4 flex-1 min-h-0 pop">
          <div ref={listRef} className="chat-list relative flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
            {log.map((m, k) => <div key={k} className={`bubble ${m.from}`}>{m.text}</div>)}
            {typing && <div className="typing self-start"><i /><i /><i /></div>}
            <div ref={spacerRef} aria-hidden className="shrink-0" />
          </div>
          {!typing && current === "name" && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setName(draft.trim()); answer(draft.trim()); } }}>
              <input autoFocus className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your name" />
              <button className="btn btn-primary" disabled={!draft.trim()}>Next</button>
            </form>
          )}
          {!typing && current === "budget" && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="muted">All in, per person</span><span className="mono font-semibold">${budget}</span></div>
              <input type="range" min={200} max={3000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full" />
              <button className="btn btn-primary w-full" onClick={() => answer(`Up to $${budget}`)}>That&apos;s my max</button>
            </div>
          )}
          {!typing && current === "dates" && (
            <div className="space-y-3">
              <div className="grid gap-2">{trip.dateOptions.map((d) => (
                <button key={d} onClick={() => setDates(dates.includes(d) ? dates.filter((x) => x !== d) : [...dates, d])} className={`chip text-left mono text-sm ${dates.includes(d) ? "on" : ""}`}>{d}</button>
              ))}</div>
              <button className="btn btn-primary w-full" disabled={!dates.length} onClick={() => answer(dates.join(", "))}>These work</button>
            </div>
          )}
          {!typing && current === "pace" && (
            <div className="grid grid-cols-3 gap-2">
              {([["chill", "Slow mornings"], ["balanced", "Balanced mix"], ["packed", "Every hour planned"]] as [Pace, string][]).map(([v, label]) => (
                <button key={v} className="chip text-sm" onClick={() => { setPace(v); answer(label); }}>{label}</button>
              ))}
            </div>
          )}
          {!typing && (current === "must" || current === "avoid") && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = draft.trim(); if (current === "must") setMustHave(v); else setAvoid(v); answer(v || (current === "must" ? "Nothing specific" : "Nothing, I'm easy")); }}>
              <input autoFocus className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`e.g. ${SUGGEST[current]}`}
                onKeyDown={(e) => { if (e.key === "Tab" && !draft.trim()) { e.preventDefault(); setDraft(SUGGEST[current]); } }} />
              <button className="btn btn-primary" type="submit">{draft.trim() ? "Next" : "Skip"}</button>
            </form>
          )}
          <p className="text-xs muted text-center shrink-0">Nobody sees your answers, only the merged result.</p>
        </section>
      )}

      {q >= FLOW.length && (
        <section className="space-y-4 select-none pop w-full">
          <div className="flex items-center justify-end text-xs muted"><span className="mono">{i + 1} / {ACTIVITIES.length}</span></div>
          <div className="relative h-[460px]" style={{ perspective: 1000 }}>
            {ACTIVITIES[i + 1] && <div className="glass absolute inset-0 z-10 scale-[.95] translate-y-3 opacity-60" style={photos[ACTIVITIES[i + 1]] ? { backgroundImage: `linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.55)), url(${photos[ACTIVITIES[i + 1]]})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />}
            <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              className={`glass absolute inset-0 z-10 cursor-grab active:cursor-grabbing overflow-hidden touch-none ${photo ? "swipe-photo" : ""}`}
              style={{ transform: `translateX(${x}px) rotate(${rot}deg)`, opacity: fade, transition: drag ? "none" : "transform .26s ease-out, opacity .26s ease-out", background: photo ? `linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.25) 50%, rgba(0,0,0,.05)), url(${photo}) center/cover` : `radial-gradient(80% 60% at 50% 0%, ${HUE[act]}33, #fff 70%)` }}>
              <div className="absolute left-5 top-5 rounded-lg border-2 border-green-600 px-3 py-1 text-lg font-extrabold text-green-600 -rotate-12" style={{ opacity: love }}>LOVE</div>
              <div className="absolute right-5 top-5 rounded-lg border-2 border-rose-500 px-3 py-1 text-lg font-extrabold text-rose-500 rotate-12" style={{ opacity: pass }}>PASS</div>
              <div className={`flex h-full flex-col ${photo ? "items-start justify-end p-7 pb-16 text-left" : "items-center justify-center p-8 text-center"} gap-3`}>
                <div className={photo ? "text-4xl" : "text-7xl drop-shadow-[0_10px_30px_rgba(0,0,0,.2)]"}>{EMOJI[act]}</div>
                <h2 className="text-3xl font-extrabold tracking-tight">{act}</h2>
                <p className="muted text-sm">in {trip.destination}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-6 py-4 text-xs mono muted border-t border-black/10">
                <span>BUDGET ${budget}</span><span>{photo ? "PHOTO · WIKIMEDIA COMMONS" : `${dates.length} DATE${dates.length > 1 ? "S" : ""}`}</span>
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
