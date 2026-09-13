import Link from "next/link";

export default function About() {
  return (
    <main className="landing about-page">
      <section className="about mx-auto max-w-2xl px-6 py-16 text-center">
        <h2>Planning a trip together<br />should feel like the trip.</h2>
        <div className="mt-8 space-y-5 text-left text-[17px] leading-relaxed opacity-80">
          <p>Locadit started with a group chat that never decided anything. Five friends, five budgets, three date ranges and a hundred links nobody opened. The trip didn&apos;t happen.</p>
          <p>So we built the thing we wished existed. Everyone answers a private two-minute quiz: what they can spend, when they&apos;re free, what they actually want to do. No one sees anyone else&apos;s answers. Locadit merges them into one budget ceiling, one date window and a day-by-day itinerary that explains why each day is there.</p>
          <p>Quiet voices get a day too. Costs split themselves. And when the plan meets reality, it bends instead of breaking.</p>
        </div>
        <Link href="/start" className="cta mt-12">Start a room</Link>
      </section>
    </main>
  );
}
