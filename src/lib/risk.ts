import { currencyFor, fxSnapshot, NAMES } from "./fx";
import { Trip } from "./store";

export type Level = "calm" | "heads-up" | "caution" | "info";
export type Signal = {
  id: string;
  title: string;
  level: Level;
  message: string;
  advice?: string;
  source: string;
  asOf?: string;
  live?: boolean;
  links?: { label: string; href: string }[];
};
export type Radar = {
  place: Trip["place"];
  window?: { label: string };
  signals: Signal[];
  generatedAt: number;
  partial?: boolean;
};

const cache = new Map<string, { at: number; radar: Radar }>();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const km = (a: number, b: number, c: number, d: number) => {
  const R = 6371, dLat = ((c - a) * Math.PI) / 180, dLon = ((d - b) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

function requestSignal(timeoutMs: number, deadline?: AbortSignal) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return deadline ? AbortSignal.any([deadline, timeout]) : timeout;
}

async function json(url: string, revalidate: number, deadline: AbortSignal) {
  const r = await fetch(url, {
    next: { revalidate },
    signal: requestSignal(6500, deadline),
    headers: { "User-Agent": "Locadit/0.1 (travel radar)" },
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

export async function assessRisk(trip: Trip, homeCountry?: string | null): Promise<Radar> {
  const home = currencyFor(homeCountry);
  const cacheKey = `${trip.code}:${home ?? "-"}`;
  const hit = cache.get(cacheKey);
  if (hit && !hit.radar.partial && Date.now() - hit.at < 900000) return hit.radar;

  const place = trip.place;
  if (!place) return {
    place,
    signals: [{ id: "place", title: "Live outlook", level: "info", message: "Location unavailable", source: "Locadit" }],
    generatedAt: Date.now(),
  };

  const point = trip.stay ?? place;
  const { lat, lon } = point;
  const deadline = AbortSignal.timeout(7000);
  const signals: Signal[] = [];
  const tasks: Promise<void>[] = [];
  const now = new Date();
  const today = iso(now);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  tasks.push((async () => {
    try {
      const j = await json(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`, 1800, deadline);
      const d = j.daily;
      const avg = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
      const hi = avg(d.temperature_2m_max); // typical daytime high
      const lo = avg(d.temperature_2m_min); // typical night low
      const rain = Math.round(d.precipitation_sum.reduce((a: number, b: number) => a + (b ?? 0), 0));
      const chance = Math.round(Math.max(...d.precipitation_probability_max));
      const severe = d.weather_code.some((code: number) => code >= 95);
      const level: Level = severe || hi >= 36 || rain >= 70 ? "caution" : hi >= 33 || rain >= 25 || chance >= 75 ? "heads-up" : "calm";
      const advice = severe ? "Keep plans flexible during storms." : hi >= 33 ? "Plan outdoor time before noon." : rain >= 25 ? "Keep one indoor backup." : undefined;
      signals.push({ id: "weather", title: "Next 7 days", level, message: `Day ${hi}°C · Night ${lo}°C · ${chance}% rain · ${rain} mm`, advice, source: "Open-Meteo", asOf: d.time[0], live: true });
    } catch { /* shown as partial */ }
  })());

  tasks.push((async () => {
    try {
      const j = await json(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&past_days=30&forecast_days=10`, 1800, deadline);
      const times: string[] = j.daily.time;
      const values: (number | null)[] = j.daily.river_discharge;
      const recent = values.filter((v, i): v is number => times[i] < today && v != null);
      const future = values.filter((v, i): v is number => times[i] >= today && v != null);
      if (!recent.length || !future.length) return;
      const recentHigh = Math.max(...recent);
      const peak = Math.max(...future);
      const ratio = recentHigh > 0 ? peak / recentHigh : peak > 0 ? 2 : 1;
      const level: Level = ratio >= 1.5 ? "caution" : ratio >= 1.15 ? "heads-up" : "calm";
      const trend = ratio >= 1.15 ? `${Math.round((ratio - 1) * 100)}% above the recent peak` : "within the 30-day range";
      signals.push({ id: "flood", title: "Flood outlook", level, message: `${peak.toFixed(1)} m³/s · ${trend}`, advice: level === "calm" ? undefined : "Avoid low roads and river crossings.", source: "Copernicus GloFAS", asOf: today, live: true });
    } catch { /* shown as partial */ }
  })());

  tasks.push((async () => {
    try {
      const j = await json(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=${iso(monthAgo)}&toDate=${today}&alertlevel=Orange;Red&eventlist=EQ,TC,FL,VO,DR,WF&country=${encodeURIComponent(place.country)}`, 1800, deadline);
      type Event = { properties: { eventtype: string; alertlevel: string; url?: { report?: string } }; geometry: { coordinates: [number, number] } };
      const names: Record<string, string> = { EQ: "Earthquake", TC: "Cyclone", FL: "Flood", VO: "Volcano", DR: "Drought", WF: "Wildfire" };
      const nearby = ((j.features ?? []) as Event[]).map((event) => ({ event, distance: km(lat, lon, event.geometry.coordinates[1], event.geometry.coordinates[0]) })).filter(({ distance }) => distance <= 300);
      const red = nearby.some(({ event }) => event.properties.alertlevel.toLowerCase() === "red");
      const level: Level = red ? "caution" : nearby.length ? "heads-up" : "calm";
      const first = nearby[0];
      const message = first ? `${names[first.event.properties.eventtype] ?? "Event"} alert · ${Math.round(first.distance)} km away` : "No major alerts within 300 km";
      signals.push({ id: "alerts", title: "Live alerts", level, message, advice: first ? "Open the official alert before travel." : undefined, source: "GDACS", asOf: "last 30 days", live: true, links: first?.event.properties.url?.report ? [{ label: "View alert", href: first.event.properties.url.report }] : undefined });
    } catch { /* shown as partial */ }
  })());

  tasks.push((async () => {
    try {
      const j = await json(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=300&starttime=${iso(monthAgo)}&minmagnitude=4.5&orderby=magnitude&limit=100`, 1800, deadline);
      const features = (j.features ?? []) as { properties: { mag: number } }[];
      const count = j.metadata?.count ?? features.length;
      const strongest = features.length ? Math.max(...features.map((f) => f.properties.mag)) : 0;
      const level: Level = strongest >= 6 || count >= 5 ? "caution" : count ? "heads-up" : "calm";
      const message = count ? `${count} nearby · strongest M${strongest.toFixed(1)}` : "No M4.5+ earthquakes nearby";
      signals.push({ id: "seismic", title: "Earthquakes", level, message, advice: level === "calm" ? undefined : "Know the nearest evacuation route.", source: "USGS", asOf: "last 30 days", live: true });
    } catch { /* shown as partial */ }
  })());

  tasks.push((async () => {
    const slug = place.country.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [uk, us] = await Promise.all([
      json(`https://www.gov.uk/api/content/foreign-travel-advice/${slug}`, 21600, deadline).catch(() => null),
      fetch("https://travel.state.gov/_res/rss/TAsTWs.xml", { next: { revalidate: 21600 }, signal: requestSignal(6500, deadline) }).then((r) => r.ok ? r.text() : "").catch(() => ""),
    ]);
    const status: string[] = uk?.details?.alert_status ?? [];
    const whole = status.some((s) => s.includes("whole_country"));
    const parts = status.some((s) => s.includes("parts"));
    const escaped = place.country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const usLevel = new RegExp(`<title>\\s*${escaped}[^<]*?Level (\\d)[^<]*</title>`, "i").exec(us)?.[1] ?? null;
    const level: Level = whole || usLevel === "4" || usLevel === "3" ? "caution" : parts || usLevel === "2" ? "heads-up" : uk || usLevel ? "calm" : "info";
    const message = whole ? "Avoid travel: official warning" : parts ? "Restrictions apply in some regions" : usLevel ? `US advisory level ${usLevel}` : "No avoid-travel notice found";
    signals.push({ id: "advisory", title: "Official advice", level, message, advice: parts ? "Check whether your route is affected." : undefined, source: "UK FCDO · US State Dept", asOf: uk?.public_updated_at?.slice(0, 10) ?? today, live: true, links: [{ label: "Check advice", href: `https://www.gov.uk/foreign-travel-advice/${slug}` }] });
  })());

  const dest = currencyFor(place.countryCode);
  if (home && dest && home !== dest) tasks.push((async () => {
    const fx = await fxSnapshot(home, dest, deadline);
    if (!fx) return;
    const rate = fx.rate >= 100 ? Math.round(fx.rate).toLocaleString() : fx.rate.toFixed(fx.rate >= 10 ? 2 : 3);
    const direction = fx.change === 0 ? "flat this month" : `${fx.change > 0 ? "+" : ""}${fx.change.toFixed(1)}% this month`;
    signals.push({ id: "fx", title: "Exchange rate", level: "info", message: `1 ${home} = ${rate} ${dest} · ${direction}`, source: "ECB via Frankfurter", asOf: fx.date, live: true, advice: Math.abs(fx.change) >= 5 ? `${NAMES[home] ?? home} moved quickly; keep a small buffer.` : undefined });
  })());

  await Promise.all(tasks);
  const partial = deadline.aborted;
  const order: Record<Level, number> = { caution: 0, "heads-up": 1, calm: 2, info: 3 };
  signals.sort((a, b) => order[a.level] - order[b.level]);
  const radar: Radar = { place, window: trip.dateOptions[0] ? { label: trip.dateOptions[0] } : undefined, signals: signals.slice(0, 6), generatedAt: Date.now(), partial };
  if (!partial) cache.set(cacheKey, { at: Date.now(), radar });
  return radar;
}
