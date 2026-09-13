import { ACTIVITIES, Trip } from "./store";
export function merge(trip: Trip) {
  const a = trip.answers;
  if (!a.length) return null;
  const budget = Math.min(...a.map((x) => x.budget));
  const dateVotes = trip.dateOptions.map((d) => ({ d, n: a.filter((x) => x.dates.includes(d)).length }));
  const bestDate = [...dateVotes].sort((x, y) => y.n - x.n)[0];
  const scores = ACTIVITIES.map((act) => {
    const s = a.reduce((sum, x) => sum + (x.interests[act] ?? 0), 0);
    const fans = a.filter((x) => (x.interests[act] ?? 0) >= 2).map((x) => x.name);
    return { act, score: s, fans };
  }).sort((x, y) => y.score - x.score);
  // fairness: every member gets at least one of their top picks
  const picked = new Set(scores.slice(0, 4).map((s) => s.act));
  for (const m of a) {
    const top = Object.entries(m.interests).sort((x, y) => y[1] - x[1])[0]?.[0];
    if (top && ![...picked].some((p) => (m.interests[p] ?? 0) >= 2)) picked.add(top);
  }
  const ranked = scores.filter((s) => picked.has(s.act));
  const days = 4;
  // Pace: majority vote decides how full each day is.
  const paceVotes = { chill: 0, balanced: 0, packed: 0 } as Record<string, number>;
  for (const m of a) paceVotes[m.pace ?? "balanced"]++;
  const pace = (Object.entries(paceVotes).sort((x, y) => y[1] - x[1])[0][0]) as "chill" | "balanced" | "packed";
  const perDayItems = pace === "chill" ? 2 : pace === "packed" ? 4 : 3;
  const notes = a.filter((m) => m.mustHave || m.avoid).map((m) => ({ name: m.name, mustHave: m.mustHave, avoid: m.avoid }));
  const itinerary = Array.from({ length: days }, (_, i) => {
    const s = ranked[i % ranked.length];
    const perDay = Math.round((budget * 0.6) / days);
    const why = s.fans.length === a.length ? "everyone wanted this" : s.fans.length > a.length / 2 ? `${s.fans.length} of ${a.length} rated it highly` : `${s.fans.join(" & ")}'s pick, kept for fairness`;
    const full = planFor(s.act, trip.destination);
    const plan = perDayItems >= 4 ? [...full, "Sunset spot, then a late bite"] : full.slice(0, perDayItems);
    return { day: i + 1, theme: s.act, why, budget: perDay, plan };
  });
  return { budget, bestDate, dateVotes, scores, itinerary, members: a.map((x) => x.name), pace, notes };
}
function planFor(act: string, dest: string) {
  const p: Record<string, string[]> = {
    "Food & markets": [`Morning market crawl in ${dest}`, "Street-food lunch tour", "Chef's table dinner"],
    Nightlife: ["Late start, brunch", "Rooftop sunset drinks", "Bar hop in the old town"],
    "Nature & hikes": ["Sunrise trailhead", "Picnic at the viewpoint", "Recovery dinner"],
    "Museums & culture": ["National museum", "Historic quarter walking tour", "Local theatre night"],
    "Beach & rest": ["Beach club morning", "Long seafood lunch", "Free evening"],
    Shopping: ["Design district", "Vintage arcade", "Night market"],
    "Adventure sports": ["Kayak or surf lesson", "Zipline / climbing", "Early night"],
    "Local neighbourhoods": ["Coffee in a residential quarter", "Cycle tour", "Neighbourhood izakaya-style dinner"],
  };
  return p[act] ?? ["Explore", "Lunch", "Dinner"];
}
export function balances(trip: Trip) {
  const bal: Record<string, number> = {};
  for (const m of trip.answers) bal[m.name] = 0;
  for (const e of trip.expenses) {
    const share = e.amount / Math.max(1, e.splitAmong.length);
    bal[e.paidBy] = (bal[e.paidBy] ?? 0) + e.amount;
    for (const p of e.splitAmong) bal[p] = (bal[p] ?? 0) - share;
  }
  return bal;
}
