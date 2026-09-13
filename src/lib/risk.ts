import { Trip } from "./store";
import { currencyFor, fxSnapshot, NAMES } from "./fx";

export type Level = "calm" | "heads-up" | "caution" | "info";
export type Signal = { id: string; title: string; level: Level; message: string; advice?: string; source: string; asOf?: string; links?: { label: string; href: string }[]; data?: { hi: number; lo: number; rain: number } };
export type Radar = { place: Trip["place"]; window?: { start: string; end: string; label: string }; signals: Signal[]; generatedAt: number };

const cache = new Map<string, { at: number; radar: Radar }>();
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// "Oct 10–14" -> the same window last year (we only have history, not a forecast, that far out).
function parseWindow(label: string, now = new Date()) {
  const m = /([A-Za-z]{3,9})\.?\s*(\d{1,2})/.exec(label);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  if (month < 0) return null;
  const day = Math.min(28, parseInt(m[2], 10));
  let year = now.getUTCFullYear();
  if (new Date(Date.UTC(year, month, day)) < now) year += 1;
  const start = new Date(Date.UTC(year - 1, month, day));
  const end = new Date(start.getTime() + 4 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end), month, label };
}

async function json(url: string, revalidate = 3600) {
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function worldBank(country: string, indicator: string, source?: number) {
  const j = await json(`https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&mrv=1${source ? `&source=${source}` : ""}`, 86400);
  const row = j?.[1]?.[0];
  return row && row.value != null ? { value: row.value as number, year: row.date as string } : null;
}

function stormSeason(lat: number, lon: number, month: number): Signal {
  const inN = (m: number, a: number, b: number) => m >= a && m <= b;
  let basin = "", peak = false, on = false;
  if (lat > 5 && lat < 35 && lon > 100 && lon <= 180) { basin = "Western Pacific typhoon"; on = inN(month, 5, 11); peak = inN(month, 7, 9); }
  else if (lat > 5 && lat < 25 && lon > 60 && lon <= 100) { basin = "North Indian Ocean cyclone"; on = inN(month, 3, 5) || inN(month, 9, 11); peak = month === 4 || month === 10; }
  else if (lat > 10 && lat < 35 && lon > -100 && lon < -20) { basin = "Atlantic hurricane"; on = inN(month, 5, 10); peak = inN(month, 7, 9); }
  else if (lat < -5 && lat > -30 && lon > 100 && lon <= 180) { basin = "South Pacific cyclone"; on = month >= 10 || month <= 3; peak = month >= 0 && month <= 2; }
  else if (lat < -5 && lat > -30 && lon > 30 && lon <= 100) { basin = "South-West Indian Ocean cyclone"; on = month >= 10 || month <= 3; peak = month >= 0 && month <= 2; }
  if (!basin) return { id: "storm", title: "Storm season", level: "calm", message: "Outside the major tropical storm belts for these dates.", source: "Seasonal climatology" };
  if (!on) return { id: "storm", title: "Storm season", level: "calm", message: `${basin} season is closed for these dates.`, source: "Seasonal climatology" };
  return { id: "storm", title: "Storm season", level: peak ? "caution" : "heads-up", message: `${basin} season is ${peak ? "at its peak" : "open"} for these dates.`, advice: "Book flexible fares, keep a spare day, and watch the forecast the week before.", source: "Seasonal climatology" };
}

export async function assessRisk(trip: Trip, homeCountry?: string | null): Promise<Radar> {
  const home = currencyFor(homeCountry);
  const cacheKey = `${trip.code}:${home ?? "-"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < 3600000) return hit.radar;
  const place = trip.place;
  const signals: Signal[] = [];
  const win = parseWindow(trip.dateOptions[0] ?? "");
  if (!place) {
    const radar = { place, signals: [{ id: "place", title: "Location", level: "info" as Level, message: `Couldn't place "${trip.destination}" on the map, so the radar is off.`, source: "Open-Meteo geocoder" }], generatedAt: Date.now() };
    cache.set(cacheKey, { at: Date.now(), radar });
    return radar;
  }
  const tasks: Promise<void>[] = [];

  if (win) tasks.push((async () => {
    try {
      const j = await json(`https://archive-api.open-meteo.com/v1/archive?latitude=${place.lat}&longitude=${place.lon}&start_date=${win.start}&end_date=${win.end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`, 86400);
      const d = j.daily;
      const hi = Math.max(...d.temperature_2m_max), lo = Math.min(...d.temperature_2m_min);
      const rain = d.precipitation_sum.reduce((a: number, b: number) => a + b, 0);
      const level: Level = hi >= 36 || rain >= 60 || lo <= 0 ? "caution" : hi >= 33 || rain >= 30 || lo <= 5 ? "heads-up" : "calm";
      const feel = hi >= 36 ? "very hot" : hi >= 33 ? "hot" : lo <= 0 ? "freezing" : lo <= 5 ? "cold" : "comfortable";
      const wet = rain >= 60 ? "heavy rain" : rain >= 30 ? "regular showers" : rain >= 5 ? "light rain" : "mostly dry";
      signals.push({ id: "weather", title: "Weather for your dates", level, message: `Typically ${feel}: ${Math.round(lo)}–${Math.round(hi)}°C with ${wet} (${Math.round(rain)} mm over 5 days) around ${win.label}.`, advice: level === "calm" ? undefined : hi >= 33 ? "Plan outdoor time for mornings; shade and water at midday." : rain >= 30 ? "Pack a light rain layer and keep indoor backups for one afternoon." : "Pack proper layers.", source: "Open-Meteo, same week last year", asOf: win.start.slice(0, 4), data: { hi: Math.round(hi), lo: Math.round(lo), rain: Math.round(rain) } });
    } catch { /* skip */ }
  })());

  if (win) signals.push(stormSeason(place.lat, place.lon, win.month));

  tasks.push((async () => {
    try {
      const since = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
      const j = await json(`https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&latitude=${place.lat}&longitude=${place.lon}&maxradiuskm=300&starttime=${since}&minmagnitude=4.5`, 86400);
      const n = j.count as number;
      const level: Level = n >= 30 ? "caution" : n >= 8 ? "heads-up" : "calm";
      signals.push({ id: "seismic", title: "Seismic activity", level, message: n === 0 ? "No magnitude 4.5+ earthquakes within 300 km in the past year." : `${n} earthquakes of magnitude 4.5+ within 300 km in the past year.`, advice: level === "calm" ? undefined : "Active region. If you stay near the coast, learn the tsunami evacuation route on day one.", source: "USGS earthquake catalog", asOf: "past 12 months" });
    } catch { /* skip */ }
  })());

  const cc = place.countryCode;
  tasks.push((async () => {
    const r = await worldBank(cc, "VC.IHR.PSRC.P5").catch(() => null);
    if (!r) return;
    const level: Level = r.value > 8 ? "caution" : r.value > 2 ? "heads-up" : "calm";
    signals.push({ id: "crime", title: "Violent crime", level, message: `${r.value.toFixed(1)} intentional homicides per 100,000 people (${r.year}).${r.value <= 2 ? " Among the lower rates worldwide." : ""}`, advice: level === "calm" ? undefined : "Usual city sense: licensed taxis at night, nothing valuable on display.", source: "World Bank / UNODC", asOf: r.year });
  })());
  tasks.push((async () => {
    const r = await worldBank(cc, "PV.EST", 3).catch(() => null);
    if (!r) return;
    const level: Level = r.value < -0.5 ? "caution" : r.value < 0.5 ? "heads-up" : "calm";
    signals.push({ id: "stability", title: "Political stability", level, message: `Governance index ${r.value.toFixed(2)} on a -2.5 to +2.5 scale (${r.year}).`, advice: level === "calm" ? undefined : "Check the official advisory before booking and avoid demonstrations.", source: "World Bank Worldwide Governance Indicators", asOf: r.year });
  })());
  tasks.push((async () => {
    const r = await worldBank(cc, "FP.CPI.TOTL.ZG").catch(() => null);
    if (!r) return;
    const level: Level = r.value > 15 ? "caution" : r.value > 6 ? "heads-up" : "calm";
    signals.push({ id: "economy", title: "Prices", level, message: `Inflation ${r.value.toFixed(1)}% (${r.year}).${level === "calm" ? " Prices should be stable while you plan." : ""}`, advice: level === "calm" ? undefined : "Budget with a buffer and pay by card where you can.", source: "World Bank", asOf: r.year });
  })());

  const dest = currencyFor(place.countryCode);
  if (home && dest && home !== dest) tasks.push((async () => {
    const fx = await fxSnapshot(home, dest);
    if (!fx) return;
    const abs = Math.abs(fx.change);
    const level: Level = abs > 12 || fx.vol > 12 ? "caution" : abs > 5 || fx.vol > 7 ? "heads-up" : "calm";
    const rate = fx.rate >= 100 ? Math.round(fx.rate).toLocaleString() : fx.rate.toFixed(fx.rate >= 10 ? 2 : 3);
    const dir = fx.change >= 0 ? "stronger" : "weaker";
    const homeName = NAMES[home] ?? home, destName = NAMES[dest] ?? dest;
    signals.push({ id: "fx", title: "Exchange rate", level, message: `1 ${home} ≈ ${rate} ${dest} today. Your ${homeName} buys ${abs.toFixed(1)}% ${fx.change >= 0 ? "more" : "less"} ${destName} than a year ago; the rate has been ${fx.vol > 12 ? "volatile" : fx.vol > 7 ? "moving" : "steady"} (${fx.vol.toFixed(0)}% annualised).`, advice: level === "calm" ? undefined : fx.change >= 0 ? `Your ${homeName} is ${dir}; budget in ${home} and exchange in a couple of batches rather than all at once.` : `Your ${homeName} is ${dir}; lock in the big costs early and keep a 10% buffer.`, source: "European Central Bank via Frankfurter", asOf: fx.date });
  })());
  await Promise.all(tasks);
  const slug = place.country.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  signals.push({ id: "advisory", title: "Official travel advice", level: "info", message: `Government advisories for ${place.country} cover security, health and entry rules better than any score.`, source: "Official sources", links: [
    { label: "UK FCDO", href: `https://www.gov.uk/foreign-travel-advice/${slug}` },
    { label: "US State Dept", href: `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html` },
    { label: "Smartraveller (AU)", href: `https://www.smartraveller.gov.au/destinations` },
  ] });
  const order: Record<Level, number> = { caution: 0, "heads-up": 1, calm: 2, info: 3 };
  signals.sort((a, b) => order[a.level] - order[b.level]);
  const radar: Radar = { place, window: win ? { start: win.start, end: win.end, label: win.label } : undefined, signals, generatedAt: Date.now() };
  cache.set(cacheKey, { at: Date.now(), radar });
  return radar;
}
