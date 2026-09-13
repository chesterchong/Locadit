import { Place } from "./store";

const cache = new Map<string, Place | null>();

// Open-Meteo geocoder (no key). Picks the most populous match so "Bali" means the island, not a town.
// Fixed hubs for the supported destinations, so "Korea" never resolves to a village elsewhere.
const HUBS: Record<string, Place> = {
  japan: { name: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lon: 139.6503 },
  korea: { name: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lon: 126.978 },
  "south korea": { name: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lon: 126.978 },
  malaysia: { name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 3.139, lon: 101.6869 },
  indonesia: { name: "Bali", country: "Indonesia", countryCode: "ID", lat: -8.4095, lon: 115.1889 },
  singapore: { name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198 },
};
export async function geocode(name: string): Promise<Place | null> {
  const key = name.trim().toLowerCase();
  if (HUBS[key]) return HUBS[key];
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
