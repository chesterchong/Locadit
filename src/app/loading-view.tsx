import Link from "next/link";

// Skeleton screen shown while a room loads: same layout as the page, so nothing jumps when data arrives.
export default function LoadingView({ label = "Opening your room" }: { label?: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6" aria-busy="true" aria-live="polite">
      <Link href="/" className="home-link">Locadit</Link>
      <div className="skel h-9 w-64 rounded-full" />
      <div className="space-y-3">
        <div className="skel h-3 w-16" />
        <div className="skel h-10 w-2/3" />
        <div className="skel h-4 w-1/2" />
      </div>
      <div className="skel h-40 w-full rounded-[22px]" />
      <div className="grid grid-cols-2 gap-3"><div className="skel h-28 rounded-[22px]" /><div className="skel h-28 rounded-[22px]" /></div>
      <p className="flex items-center gap-2 text-sm muted"><span className="spinner" aria-hidden />{label}</p>
    </main>
  );
}
