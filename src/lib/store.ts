export type Answer = { name: string; budget: number; dates: string[]; interests: Record<string, number> };
export type Expense = { id: string; title: string; amount: number; paidBy: string; splitAmong: string[] };
export type Trip = { code: string; name: string; destination: string; dateOptions: string[]; answers: Answer[]; expenses: Expense[]; createdAt: number };
export const ACTIVITIES = ["Food & markets", "Nightlife", "Nature & hikes", "Museums & culture", "Beach & rest", "Shopping", "Adventure sports", "Local neighbourhoods"];
const g = globalThis as unknown as { __trips?: Map<string, Trip> };
const trips = (g.__trips ??= new Map<string, Trip>());
export const getTrip = (code: string) => trips.get(code.toUpperCase());
export function createTrip(name: string, destination: string, dateOptions: string[]): Trip {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  const t: Trip = { code, name, destination, dateOptions, answers: [], expenses: [], createdAt: Date.now() };
  trips.set(code, t);
  return t;
}
