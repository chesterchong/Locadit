# Locadit

Group trips without the argument. Everyone answers a private 2-minute quiz (budget, dates, activity swipes); Locadit merges the answers into one budget ceiling, one date window and a day-by-day itinerary that explains its trade-offs, then splits costs.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000, create a room, share the `/t/CODE` link, open `/t/CODE/board` for the live dashboard.

## Landing intro

The home page opens with a staged intro: a faint dot grid, a handwritten wordmark that draws itself in, six typographic styles cycling while a collage builds up layer by layer, a blue sky dropping in, the wordmark tucking into the top edge, then a phone card rising into the cleared centre with its info card and a bottom-right pill button.

- Timeline and stage: `src/app/page.tsx` (`STEPS` holds the beat timings in ms; the 1600×900 stage is scaled to cover the viewport without cropping the cards).
- Collage slots: `src/lib/collage.ts`. Every piece is one entry with a centre position, size, rotation, the layer it appears with, and where it settles at the end. Swap a placeholder for real artwork by setting `kind: "img"` and `src: "/collage/your-file.png"`.
- Styles: the block after `Landing: staged intro` in `src/app/globals.css`.
- Placeholder media: the phone video, app icon and QR code are temporary stand-ins until Locadit's own footage lands. Replace the URLs in `CARDS` in `src/app/page.tsx`.

## Notes

- Storage is in-memory (single server process) for the prototype. Swap `src/lib/store.ts` for Supabase to persist across restarts or serverless instances.
- Itinerary generation is deterministic in `src/lib/engine.ts`; wire Claude in there for richer plans.

---

# 2. Ideation & Process

## 2.1 Ideas We Considered

| # | Idea | Why it was dropped / kept |
|---|------|---------------------------|
| **A (Chosen)** | **Consensus — group preference merging.** Each traveller privately swipes on activities, sets a budget band and blocks out dates. The engine merges everyone's inputs into one itinerary and explains the trade-offs, then splits every cost fairly. | **Kept.** Group coordination is the hardest problem named in the brief, and no mainstream app does it. It is highly demoable (judges scan a QR and swipe), the scoring algorithm is explainable on one slide, and it covers three of the four brief pillars (itinerary, budget split, group sync). |
| **B (Chosen)** | **Replan — the itinerary that fixes itself.** The itinerary is stored as a dependency graph (flight → check-in → dinner → tour). Live flight, weather and opening-hours signals mark broken nodes, and the AI proposes 2–3 repair plans that one tap applies and broadcasts to the group. | **Kept.** "Adjusting when things go wrong" is the pillar most teams will skip, so it is our sharpest differentiator. It composes naturally with A: Consensus builds the plan, Replan keeps it alive. Live flight status has a mock fallback so the demo cannot break on stage. |
| C | **Envelope — budget-first planning.** Enter one total number and the app works backwards, splitting it into envelopes (flights, stay, food, activities, buffer) and pulling live prices to propose destinations that actually fit. | **Dropped as a standalone product, partially absorbed.** Strong angle, but pricing APIs (Amadeus, Skyscanner) are rate-limited and flaky in a hackathon window, and the destination-discovery flow duplicated what A already does with group budget bands. We kept the envelope burn-down widget inside A's cost-split view. |
| D | **Bookings aggregator.** One search across flights, hotels and activities with deep links to checkout. | **Dropped.** Purely a wrapper over APIs we cannot fully access; Google Flights and Kayak already do it better. Adds no new value to the "piecing it together" problem. |
| E | **Group chat with an AI travel agent.** A WhatsApp-style room where a bot reads the conversation and turns it into bookings. | **Dropped.** Chat is where planning already fails (decisions get buried). We wanted structured inputs, not another thread. Kept the idea of a shareable room link with no sign-up. |
| F | **Solo "surprise trip" generator.** Give a budget and a weekend, get a sealed destination revealed at the airport. | **Dropped.** Fun but niche, does nothing for groups or for mid-trip changes, which are two of the four required pillars. |
| G | **Offline-first travel wallet.** Tickets, reservations and maps cached on device for no-signal moments. | **Dropped.** Useful but a utility rather than a planner. Storing confirmations is a feature we may add to Replan's node model later. |
| H | **Trip retrospective / memory book.** Auto-generate a shareable recap from photos, spends and the itinerary. | **Dropped.** Post-trip, so outside the "planning and adjusting" scope. Parked for a v2. |

**Final direction:** A + B merged into one product. Consensus handles the *before* (merge preferences, draft itinerary, split costs). Replan handles the *during* (detect breakage, repair, re-sync the group). Envelope's budget burn-down survives as a component.

---

## 2.2 Ideation Boards

### Board 1 — Problem tree

![Board 1](docs/boards/1-problem-tree.png)

Root problem at the top, causes in the middle, concrete effects at the bottom. The two highlighted branches (group misalignment and mid-trip breakage) became ideas A and B; the left branch is what every existing app already half-solves.

### Board 2 — Idea mind map (Crazy Eights dump)

![Board 2](docs/boards/2-mind-map.png)

Every idea from our eight-minute sketch round, grouped after the fact. The "Group" and "Change" clusters had the most sticky notes and the fewest existing competitors, so we kept digging there.

### Board 3 — 5 Whys on the "plans break" branch

![Board 3](docs/boards/3-five-whys.png)

The chain that produced Replan's core technical insight: model the itinerary as a dependency graph so a single broken node can be traced to everything it affects.

### Board 4 — Merged user flow (A + B)

![Board 4](docs/boards/4-user-flow.png)

The end-to-end flow after merging Consensus (top half) and Replan (bottom loop). The two highlighted nodes are where the AI does real work; everything else is plumbing.

### Board 5 — Keep / drop decision matrix

![Board 5](docs/boards/5-decision-matrix.png)

How we made the final cut. Consensus and Replan sit top-right. Envelope was novel but pulled left by unreliable pricing APIs, so it survives only as a widget.
