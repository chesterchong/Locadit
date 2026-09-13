import { NextResponse } from "next/server";

type Photo = { url: string; title: string; page: string };
const cache = new Map<string, { at: number; photos: Photo[] }>();

// Real photos from Wikimedia Commons (free to reuse, no API key). Cached in memory for an hour.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const w = Math.min(1200, Math.max(200, parseInt(url.searchParams.get("w") ?? "900", 10) || 900));
  if (!q) return NextResponse.json({ photos: [] });
  const key = `${q}@${w}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 3600000) return NextResponse.json({ photos: hit.photos });
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size&iiurlwidth=${w}&format=json`, { headers: { "User-Agent": "Locadit/0.1 (hackathon prototype)" }, next: { revalidate: 3600 } });
    const j = await r.json();
    const photos: Photo[] = Object.values(j.query?.pages ?? {})
      .map((p) => p as { title: string; imageinfo?: { thumburl: string; width: number; height: number; descriptionurl: string }[] })
      .filter((p) => p.imageinfo?.[0] && /\.(jpe?g|png)$/i.test(p.title) && p.imageinfo[0].width >= 600)
      .map((p) => ({ url: p.imageinfo![0].thumburl.replace(/\?.*$/, ""), title: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""), page: p.imageinfo![0].descriptionurl }))
      .slice(0, 5);
    cache.set(key, { at: Date.now(), photos });
    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
