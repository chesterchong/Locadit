// Country -> currency for the visitor (home) and destination. Frankfurter (ECB) covers these currencies.
const EUR = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];
const MAP: Record<string, string> = { MY: "MYR", SG: "SGD", ID: "IDR", JP: "JPY", KR: "KRW", TH: "THB", PH: "PHP", CN: "CNY", HK: "HKD", IN: "INR", AU: "AUD", NZ: "NZD", US: "USD", GB: "GBP", CA: "CAD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", IS: "ISK", TR: "TRY", IL: "ILS", ZA: "ZAR", BR: "BRL", MX: "MXN" };
export const SUPPORTED = new Set(Object.values(MAP).concat("EUR"));
export function currencyFor(country?: string | null): string | null {
  if (!country) return null;
  const c = country.toUpperCase();
  if (EUR.includes(c)) return "EUR";
  return MAP[c] ?? null;
}
export const NAMES: Record<string, string> = { MYR: "ringgit", SGD: "Singapore dollars", IDR: "rupiah", JPY: "yen", KRW: "won", THB: "baht", PHP: "pesos", CNY: "yuan", HKD: "Hong Kong dollars", INR: "rupees", AUD: "Australian dollars", NZD: "NZ dollars", USD: "US dollars", GBP: "pounds", EUR: "euros", CAD: "Canadian dollars", CHF: "francs" };

export type Fx = { home: string; dest: string; rate: number; change: number; date: string };

// Today's rate and movement over the latest month.
export async function fxSnapshot(home: string, dest: string, signal?: AbortSignal): Promise<Fx | null> {
  if (home === dest || !SUPPORTED.has(home) || !SUPPORTED.has(dest)) return null;
  const end = new Date(), start = new Date(end.getTime() - 32 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/${iso(start)}..${iso(end)}?base=${home}&symbols=${dest}`, { next: { revalidate: 43200 }, signal });
    if (!r.ok) return null;
    const j = await r.json();
    const days = Object.keys(j.rates).sort();
    if (days.length < 20) return null;
    const series = days.map((d) => j.rates[d][dest] as number);
    const first = series[0], last = series[series.length - 1];
    return { home, dest, rate: last, change: (last / first - 1) * 100, date: days[days.length - 1] };
  } catch {
    return null;
  }
}
