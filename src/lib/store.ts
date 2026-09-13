import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Pace = "chill" | "balanced" | "packed";
export type Answer = { name: string; budget: number; dates: string[]; interests: Record<string, number>; pace?: Pace; mustHave?: string; avoid?: string };
export type Expense = { id: string; title: string; amount: number; paidBy: string; splitAmong: string[] };
export type Place = { name: string; country: string; countryCode: string; lat: number; lon: number };
export type Trip = { code: string; name: string; destination: string; dateOptions: string[]; answers: Answer[]; expenses: Expense[]; createdAt: number; place?: Place };
export const ACTIVITIES = ["Food & markets", "Nightlife", "Nature & hikes", "Museums & culture", "Beach & rest", "Shopping", "Adventure sports", "Local neighbourhoods"];

// Storage: Supabase when SUPABASE_URL + SUPABASE_ANON_KEY are set (one `locadit_trips` row per room, the trip as jsonb),
// otherwise an in-memory map for local development.
const g = globalThis as unknown as { __trips?: Map<string, Trip>; __sb?: SupabaseClient | null };
const memory = (g.__trips ??= new Map<string, Trip>());
function db(): SupabaseClient | null {
  if (g.__sb !== undefined) return g.__sb;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  g.__sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return g.__sb;
}

export async function getTrip(code: string): Promise<Trip | null> {
  const c = code.toUpperCase();
  const sb = db();
  if (!sb) return memory.get(c) ?? null;
  const { data } = await sb.from("locadit_trips").select("data").eq("code", c).maybeSingle();
  return (data?.data as Trip) ?? null;
}

export async function saveTrip(t: Trip): Promise<void> {
  const sb = db();
  if (!sb) { memory.set(t.code, t); return; }
  const { error } = await sb.from("locadit_trips").upsert({ code: t.code, data: t, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function createTrip(name: string, destination: string, dateOptions: string[], place?: Place): Promise<Trip> {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  const t: Trip = { code, name, destination, dateOptions, answers: [], expenses: [], createdAt: Date.now(), place };
  await saveTrip(t);
  return t;
}
