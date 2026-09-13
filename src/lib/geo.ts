import { Place } from "./store";

const cache = new Map<string, Place | null>();

// Open-Meteo geocoder (no key). Picks the most populous match so "Bali" means the island, not a town.
export async function geocode(name: string): Promise<Place | null> {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`, { next: { revalidate: 86400 } });
    const j = await r.json();
    const best = (j.results ?? []).sort((a: { population?: number }, b: { population?: number }) => (b.population ?? 0) - (a.population ?? 0))[0];
    const place: Place | null = best ? { name: best.name, country: best.country ?? "", countryCode: best.country_code ?? "", lat: best.latitude, lon: best.longitude } : null;
    cache.set(key, place);
    return place;
  } catch {
    return null;
  }
}
