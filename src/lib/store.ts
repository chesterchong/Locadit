export type Pace = "chill" | "balanced" | "packed";
export type Answer = { name: string; budget: number; dates: string[]; interests: Record<string, number>; pace?: Pace; mustHave?: string; avoid?: string };
export type Expense = { id: string; title: string; amount: number; paidBy: string; splitAmong: string[] };
export type Place = { name: string; country: string; countryCode: string; lat: number; lon: number };
export type Trip = { code: string; name: string; destination: string; dateOptions: string[]; answers: Answer[]; expenses: Expense[]; createdAt: number; place?: Place };
export const ACTIVITIES = ["Food & markets", "Nightlife", "Nature & hikes", "Museums & culture", "Beach & rest", "Shopping", "Adventure sports", "Local neighbourhoods"];
const g = globalThis as unknown as { __trips?: Map<string, Trip> };
const trips = (g.__trips ??= new Map<string, Trip>());
export const getTrip = (code: string) => trips.get(code.toUpperCase());
export function createTrip(name: string, destination: string, dateOptions: string[], place?: Place): Trip {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  const t: Trip = { code, name, destination, dateOptions, answers: [], expenses: [], createdAt: Date.now(), place };
  trips.set(code, t);
  return t;
}
