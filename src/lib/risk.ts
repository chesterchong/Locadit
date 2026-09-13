import { Trip } from "./store";
import { currencyFor, fxSnapshot, NAMES } from "./fx";

export type Level = "calm" | "heads-up" | "caution" | "info";
export type Signal = { id: string; title: string; level: Level; message: string; advice?: string; source: string; asOf?: string; live?: boolean; links?: { label: string; href: string }[]; data?: { hi: number; lo: number; rain: number } };
export type Radar = { place: Trip["place"]; stay?: Trip["stay"]; window?: { start: string; end: string; label: string }; signals: Signal[]; generatedAt: number };

const cache = new Map<string, { at: number; radar: Radar }>();
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const km = (a: number, b: number, c: number, d: number) => { const R = 6371, dLat = ((c - a) * Math.PI) / 180, dLon = ((d - b) * Math.PI) / 180; const x = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const pct = (sorted: number[], v: number) => sorted.length ? Math.round((sorted.filter((x) => x <= v).length / sorted.length) * 100) : 0;

// "Oct 10–14" -> month/day; the window is the same dates (5 days) in each of the last 10 years.
function parseWindow(label: string, now = new Date()) {
  const m = /([A-Za-z]{3,9})\.?\s*(\d{1,2})/.exec(label);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  if (month < 0) return null;
  const day = Math.min(28, parseInt(m[2], 10));
  let year = now.getUTCFullYear();
  if (new Date(Date.UTC(year, month, day)) < now) year += 1;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(new Date(Date.UTC(year - 1, month, day))), end: iso(new Date(Date.UTC(year - 1, month, day) + 4 * 86400000)), month, day, label };
}

async function json(url: string, revalidate = 3600, timeoutMs = 20000) {
  const r = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": "Locadit/0.1 (hackathon prototype)" } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
async function worldBank(country: string, indicator: string) {
  const j = await json(`https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&mrv=1`, 86400);
  const row = j?.[1]?.[0];
  return row && row.value != null ? { value: row.value as number, year: row.date as string } : null;
}

function stormSeason(lat: number, lon: number, month: number): Signal {
  const inN = (m: number, a: number, b: number) => m >= a && m <= b;
  let basin = "", peak = false, on = false;
  if (lat > 5 && lat < 35 && lon > 100 && lon <= 180) { basin = "Western Pacific typhoon"; on = inN(month, 5, 11); peak = inN(month, 7, 9); }
  else if (lat > 5 && lat < 25 && lon > 60 && lon <= 100) { basin = "North Indian Ocean cyclone"; on = inN(month, 3, 5) || inN(month, 9, 11); peak = month === 4 || month === 10; }
  else if (lat > 10 && lat < 35 && lon > -100 && lon < -20) { basin = "Atlantic hurricane"; on = inN(month, 5, 10); peak = inN(month, 7, 9); }
  else if (lat < -5 && lat > -30 && lon > 100 && lon <= 180) { basin = "South Pacific cyclone"; on = month >= 10 || month <= 3; peak = month <= 2; }
  else if (lat < -5 && lat > -30 && lon > 30 && lon <= 100) { basin = "South-West Indian Ocean cyclone"; on = month >= 10 || month <= 3; peak = month <= 2; }
  if (!basin) return { id: "storm", title: "Tropical storms", level: "calm", message: "Outside the major tropical storm belts for these dates.", source: "Seasonal climatology" };
  if (!on) return { id: "storm", title: "Tropical storms", level: "calm", message: `${basin} season is closed for these dates. Flooding is covered separately below.`, source: "Seasonal climatology" };
  return { id: "storm", title: "Tropical storms", level: peak ? "caution" : "heads-up", message: `${basin} season is ${peak ? "at its peak" : "open"} for these dates.`, advice: "Book flexible fares, keep a spare day, and watch the forecast the week before.", source: "Seasonal climatology" };
}

export async function assessRisk(trip: Trip, homeCountry?: string | null): Promise<Radar> {
  const home = currencyFor(homeCountry);
  const cacheKey = `${trip.code}:${home ?? "-"}:${trip.stay?.name ?? "-"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < 1800000) return hit.radar;
  const place = trip.place;
  const point = trip.stay ?? place; // score around where the group actually sleeps when known
  const signals: Signal[] = [];
  const win = parseWindow(trip.dateOptions[0] ?? "");
  if (!place || !point) {
    const radar: Radar = { place, signals: [{ id: "place", title: "Location", level: "info", message: `Couldn't place "${trip.destination}" on the map, so the radar is off.`, source: "Open-Meteo geocoder" }], generatedAt: Date.now() };
    cache.set(cacheKey, { at: Date.now(), radar });
    return radar;
  }
  const { lat, lon } = point;
  const tasks: Promise<void>[] = [];

  // 1. Rain extremes for the dates: 10 years of daily totals, not last year's average.
  if (win) tasks.push((async () => {
    try {
      const y = new Date().getUTCFullYear();
      const j = await json(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${y - 10}-01-01&end_date=${y - 1}-12-31&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto`, 86400, 30000);
      const t: string[] = j.daily.time, p: (number | null)[] = j.daily.precipitation_sum, hiA: (number | null)[] = j.daily.temperature_2m_max, loA: (number | null)[] = j.daily.temperature_2m_min;
      const mm = String(win.month + 1).padStart(2, "0");
      const inWin = (d: string) => d.slice(5, 7) === mm && Math.abs(parseInt(d.slice(8, 10), 10) - win.day) <= 3;
      const rain = t.map((d, i) => (inWin(d) && p[i] != null ? (p[i] as number) : null)).filter((x): x is number => x != null);
      const his = t.map((d, i) => (inWin(d) ? hiA[i] : null)).filter((x): x is number => x != null);
      const los = t.map((d, i) => (inWin(d) ? loA[i] : null)).filter((x): x is number => x != null);
      const monthly: Record<string, number[]> = {};
      t.forEach((d, i) => { if (p[i] != null) (monthly[d.slice(5, 7)] ??= []).push(p[i] as number); });
      const monthTotal = Object.fromEntries(Object.entries(monthly).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / 10]));
      const wet = (monthTotal[mm] ?? 0) >= 200;
      const maxDay = Math.max(...rain), p50 = rain.filter((x) => x > 50).length / rain.length;
      const hi = his.length ? Math.round(his.reduce((a, b) => a + b, 0) / his.length) : 0, lo = los.length ? Math.round(los.reduce((a, b) => a + b, 0) / los.length) : 0;
      const level: Level = maxDay >= 100 || p50 >= 0.1 ? "caution" : maxDay >= 50 || wet ? "heads-up" : "calm";
      signals.push({ id: "weather", title: "Rain extremes for your dates", level, message: `${wet ? "Wet season. " : ""}Over the last 10 years the heaviest single day in this window brought ${Math.round(maxDay)} mm; ${Math.round(p50 * 100)}% of days topped 50 mm. Typical range ${lo}–${hi}°C, about ${Math.round(monthTotal[mm] ?? 0)} mm for the month.`, advice: level === "calm" ? undefined : "Flash floods and landslides follow days like that. Avoid riverbeds and steep roads after heavy rain, and keep one indoor day in reserve.", source: "Open-Meteo archive, 10 years", asOf: `${y - 10}–${y - 1}`, data: { hi, lo, rain: Math.round(rain.reduce((a, b) => a + b, 0) / 10) } });
    } catch { /* skip */ }
  })());

  // 2. Flood: GloFAS river discharge forecast vs. the last five years at this point.
  tasks.push((async () => {
    try {
      const y = new Date();
      const hist = await json(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&start_date=${y.getUTCFullYear() - 5}-01-01&end_date=${y.toISOString().slice(0, 10)}`, 86400, 30000);
      const fc = await json(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&forecast_days=10`, 3600, 20000);
      const h: number[] = (hist.daily.river_discharge as (number | null)[]).filter((x): x is number => x != null).sort((a, b) => a - b);
      const f: number[] = (fc.daily.river_discharge as (number | null)[]).filter((x): x is number => x != null);
      if (!h.length || !f.length) return;
      const peak = Math.max(...f), pc = pct(h, peak);
      const level: Level = pc >= 98 ? "caution" : pc >= 90 ? "heads-up" : "calm";
      signals.push({ id: "flood", title: "Flood outlook", level, live: true, message: `River discharge near ${point.name} is forecast to peak at ${peak.toFixed(1)} m³/s in the next 10 days, around the ${pc}th percentile of the last five years${level === "calm" ? ": nothing unusual" : ""}.`, advice: level === "calm" ? "Re-check the week you travel; this updates daily." : "Rivers are running high. Skip canyon walks, river crossings and low-lying roads, and sleep above the ground floor near water.", source: "Copernicus GloFAS via Open-Meteo", asOf: fc.daily.time?.[0] });
    } catch { /* skip */ }
  })());

  // 3. Live alerts: GDACS events within 300 km in the last 30 days.
  tasks.push((async () => {
    try {
      const to = new Date(), from = new Date(to.getTime() - 30 * 86400000);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const j = await json(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=${iso(from)}&toDate=${iso(to)}&alertlevel=Green;Orange;Red&eventlist=EQ,TC,FL,VO,DR,WF&country=${encodeURIComponent(place.country)}`, 1800, 25000);
      type F = { properties: { eventtype: string; alertlevel: string; name: string; fromdate: string; url?: { report?: string } }; geometry: { coordinates: [number, number] } };
      const names: Record<string, string> = { EQ: "Earthquake", TC: "Tropical cyclone", FL: "Flood", VO: "Volcano", DR: "Drought", WF: "Wildfire" };
      const near = ((j.features ?? []) as F[]).map((x) => ({ ...x, d: km(lat, lon, x.geometry.coordinates[1], x.geometry.coordinates[0]) })).filter((x) => x.d <= 300).sort((a, b) => (a.properties.alertlevel === "Red" ? -1 : b.properties.alertlevel === "Red" ? 1 : a.properties.alertlevel === "Orange" ? -1 : b.properties.alertlevel === "Orange" ? 1 : a.d - b.d));
      const worst = near.find((x) => x.properties.alertlevel === "Red") ? "caution" : near.find((x) => x.properties.alertlevel === "Orange") ? "heads-up" : "calm";
      const top = near.slice(0, 3).map((x) => `${names[x.properties.eventtype] ?? x.properties.eventtype} (${x.properties.alertlevel.toLowerCase()}) ${Math.round(x.d)} km away, ${x.properties.fromdate.slice(0, 10)}`);
      signals.push({ id: "live", title: "Live alerts", level: worst as Level, live: true, message: near.length ? `${near.length} GDACS event${near.length > 1 ? "s" : ""} within 300 km in the last 30 days: ${top.join("; ")}.` : "No GDACS disaster alerts within 300 km in the last 30 days.", advice: worst === "calm" ? "Checked on every visit. Ask everyone in the room to open the board the morning you fly." : "Open the GDACS report before you travel and tell the room.", source: "GDACS (EU/UN Global Disaster Alert and Coordination System)", asOf: "last 30 days", links: near[0]?.properties.url?.report ? [{ label: "GDACS report", href: near[0].properties.url.report }] : undefined });
    } catch { /* skip */ }
  })());

  // 4. Volcanoes within 100 km (Smithsonian Holocene inventory).
  tasks.push((async () => {
    try {
      const d = 1; // ~100 km box
      const j = await json(`https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes&outputFormat=json&bbox=${lon - d},${lat - d},${lon + d},${lat + d},EPSG:4326`, 86400, 25000);
      type V = { properties: { Volcano_Name: string; Last_Eruption_Year: number | null }; geometry: { coordinates: [number, number] } };
      const vs = ((j.features ?? []) as V[]).map((v) => ({ name: v.properties.Volcano_Name, year: v.properties.Last_Eruption_Year, d: km(lat, lon, v.geometry.coordinates[1], v.geometry.coordinates[0]) })).filter((v) => v.d <= 100).sort((a, b) => a.d - b.d);
      if (!vs.length) { signals.push({ id: "volcano", title: "Volcanoes", level: "calm", message: "No Holocene volcanoes within 100 km.", source: "Smithsonian Global Volcanism Program" }); return; }
      const recent = vs.filter((v) => v.year && v.year >= new Date().getUTCFullYear() - 10);
      const level: Level = recent.some((v) => v.d <= 40) ? "caution" : recent.length ? "heads-up" : "calm";
      const nearest = vs[0];
      signals.push({ id: "volcano", title: "Volcanoes", level, message: `${vs.length} volcano${vs.length > 1 ? "es" : ""} within 100 km; nearest is ${nearest.name} at ${Math.round(nearest.d)} km${nearest.year ? `, last erupted ${nearest.year}` : ""}.${recent.length ? ` Active in the last decade: ${recent.map((v) => v.name).join(", ")}.` : ""}`, advice: level === "calm" ? undefined : "Check the national volcano agency the week before (Indonesia: MAGMA). Ash closes airports: keep a spare day at the end.", source: "Smithsonian Global Volcanism Program" });
    } catch { /* skip */ }
  })());

  // 5. Seismic activity (USGS).
  tasks.push((async () => {
    try {
      const since = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
      const j = await json(`https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=300&starttime=${since}&minmagnitude=4.5`, 86400);
      const n = j.count as number;
      const level: Level = n >= 30 ? "caution" : n >= 8 ? "heads-up" : "calm";
      signals.push({ id: "seismic", title: "Seismic activity", level, message: n === 0 ? "No magnitude 4.5+ earthquakes within 300 km in the past year." : `${n} earthquakes of magnitude 4.5+ within 300 km in the past year.`, advice: level === "calm" ? undefined : "Active region. If you stay near the coast, learn the tsunami evacuation route on day one.", source: "USGS earthquake catalog", asOf: "past 12 months" });
    } catch { /* skip */ }
  })());

  if (win) signals.push(stormSeason(lat, lon, win.month));

  // 6. Government advisories, fetched rather than just linked.
  tasks.push((async () => {
    const slug = place.country.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let fcdo: { status: string[]; updated?: string } | null = null, us: string | null = null;
    try { const j = await json(`https://www.gov.uk/api/content/foreign-travel-advice/${slug}`, 21600); fcdo = { status: j.details?.alert_status ?? [], updated: j.public_updated_at }; } catch { /* skip */ }
    try {
      const r = await fetch("https://travel.state.gov/_res/rss/TAsTWs.xml", { next: { revalidate: 21600 }, signal: AbortSignal.timeout(15000) });
      const x = await r.text();
      const m = new RegExp(`<title>\\s*${place.country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^<]*?Level (\\d)[^<]*</title>`, "i").exec(x);
      if (m) us = m[1];
    } catch { /* skip */ }
    const whole = fcdo?.status.some((s) => s.includes("whole_country")) ?? false, parts = fcdo?.status.some((s) => s.includes("parts")) ?? false;
    const level: Level = whole || us === "4" || us === "3" ? "caution" : parts || us === "2" ? "heads-up" : fcdo || us ? "calm" : "info";
    const bits: string[] = [];
    if (fcdo) bits.push(whole ? "UK advises against travel to the whole country" : parts ? "UK advises against travel to some parts of the country" : "UK has no travel restrictions in place");
    if (us) bits.push(`US State Department Level ${us}${us === "1" ? " (exercise normal precautions)" : us === "2" ? " (exercise increased caution)" : us === "3" ? " (reconsider travel)" : " (do not travel)"}`);
    signals.push({ id: "advisory", title: "Government advice", level, live: true, message: bits.length ? `${bits.join(". ")}.` : `Check the official advisories for ${place.country}.`, advice: parts ? "Open the UK page to see which regions, and whether your route touches them." : undefined, source: "UK FCDO · US State Department", asOf: fcdo?.updated?.slice(0, 10), links: [
      { label: "UK FCDO", href: `https://www.gov.uk/foreign-travel-advice/${slug}` },
      { label: "US State Dept", href: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html" },
      { label: "Smartraveller (AU)", href: "https://www.smartraveller.gov.au/destinations" },
    ] });
  })());

  // 7. Getting out: nearest hospitals (OpenStreetMap), best-effort.
  tasks.push((async () => {
    try {
      const q = `[out:json][timeout:20];nwr[amenity=hospital][name](around:40000,${lat},${lon});out center 8;`;
      let j: { elements?: unknown[] } | null = null;
      for (const base of ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"]) {
        try {
          const r = await fetch(`${base}?data=${encodeURIComponent(q)}`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Locadit/0.1" } });
          if (r.ok) { j = await r.json(); break; }
        } catch { /* try next mirror */ }
      }
      if (!j) throw new Error("overpass");
      type E = { tags: { name: string }; lat?: number; lon?: number; center?: { lat: number; lon: number } };
      const hs = ((j.elements ?? []) as E[]).map((e) => { const la = e.lat ?? e.center?.lat ?? lat, lo = e.lon ?? e.center?.lon ?? lon; return { name: e.tags.name, d: km(lat, lon, la, lo) }; }).sort((a, b) => a.d - b.d);
      signals.push({ id: "exit", title: "Getting out", level: hs.length && hs[0].d <= 15 ? "calm" : "heads-up", message: hs.length ? `Nearest hospitals to ${point.name}: ${hs.slice(0, 3).map((h) => `${h.name} (${Math.round(h.d)} km)`).join(", ")}.` : `No hospital mapped within 40 km of ${point.name}.`, advice: "Save the embassy number from the advisory page, download offline maps, and agree a meeting point and a check-in time each evening. Helicopters can't fly in heavy weather; a car and a known road matter more.", source: "OpenStreetMap" });
    } catch { signals.push({ id: "exit", title: "Getting out", level: "info", message: "Hospital lookup unavailable right now.", advice: "Save the embassy number from the advisory page, download offline maps, and agree a meeting point and a check-in time each evening.", source: "OpenStreetMap" }); }
  })());

  // 8. Money: crime, prices, exchange rate.
  const cc = place.countryCode;
  tasks.push((async () => {
    const r = await worldBank(cc, "VC.IHR.PSRC.P5").catch(() => null);
    if (!r) return;
    const level: Level = r.value > 8 ? "caution" : r.value > 2 ? "heads-up" : "calm";
    signals.push({ id: "crime", title: "Violent crime", level, message: `${r.value.toFixed(1)} intentional homicides per 100,000 people (${r.year}).${r.value <= 2 ? " Among the lower rates worldwide." : ""}`, advice: level === "calm" ? undefined : "Usual city sense: licensed taxis at night, nothing valuable on display.", source: "World Bank / UNODC", asOf: r.year });
  })());
  tasks.push((async () => {
    const r = await worldBank(cc, "FP.CPI.TOTL.ZG").catch(() => null);
    if (!r) return;
    const level: Level = r.value > 15 ? "caution" : r.value > 6 ? "heads-up" : "calm";
    signals.push({ id: "economy", title: "Prices", level, message: `Inflation ${r.value.toFixed(1)}% (${r.year}).${level === "calm" ? " Prices should be stable while you plan." : ""}`, advice: level === "calm" ? undefined : "Budget with a buffer and pay by card where you can.", source: "World Bank", asOf: r.year });
  })());
  const dest = currencyFor(cc);
  if (home && dest && home !== dest) tasks.push((async () => {
    const fx = await fxSnapshot(home, dest);
    if (!fx) return;
    const abs = Math.abs(fx.change);
    const level: Level = abs > 12 || fx.vol > 12 ? "caution" : abs > 5 || fx.vol > 7 ? "heads-up" : "calm";
    const rate = fx.rate >= 100 ? Math.round(fx.rate).toLocaleString() : fx.rate.toFixed(fx.rate >= 10 ? 2 : 3);
    const homeName = NAMES[home] ?? home, destName = NAMES[dest] ?? dest;
    signals.push({ id: "fx", title: "Exchange rate", level, message: `1 ${home} ≈ ${rate} ${dest} today. Your ${homeName} buys ${abs.toFixed(1)}% ${fx.change >= 0 ? "more" : "less"} ${destName} than a year ago; the rate has been ${fx.vol > 12 ? "volatile" : fx.vol > 7 ? "moving" : "steady"} (${fx.vol.toFixed(0)}% annualised).`, advice: level === "calm" ? undefined : fx.change >= 0 ? `Your ${homeName} is stronger; budget in ${home} and exchange in a couple of batches rather than all at once.` : `Your ${homeName} is weaker; lock in the big costs early and keep a 10% buffer.`, source: "European Central Bank via Frankfurter", asOf: fx.date });
  })());

  await Promise.all(tasks);
  const order: Record<Level, number> = { caution: 0, "heads-up": 1, calm: 2, info: 3 };
  signals.sort((a, b) => order[a.level] - order[b.level]);
  const radar: Radar = { place, stay: trip.stay, window: win ? { start: win.start, end: win.end, label: win.label } : undefined, signals, generatedAt: Date.now() };
  cache.set(cacheKey, { at: Date.now(), radar });
  return radar;
}
