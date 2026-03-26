import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feeds, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { probeFeed, fetchAndIngestFeed, normalizeUrl } from "@/lib/rss";

export async function GET() {
  const allFeeds = await db.query.feeds.findMany({
    with: { category: true },
    orderBy: (f, { asc }) => [asc(f.title)],
  });
  return NextResponse.json(allFeeds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, categoryId } = body as { url: string; categoryId?: number };

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Check for duplicate (변환된 URL 기준)
  const normalizedUrl = normalizeUrl(url);
  const existing = await db.query.feeds.findFirst({ where: eq(feeds.url, normalizedUrl) });
  if (existing) {
    return NextResponse.json({ error: "Feed already subscribed" }, { status: 409 });
  }

  // Validate category if provided
  if (categoryId) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) });
    if (!cat) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
  }

  // Probe the feed to get metadata
  let metadata: Awaited<ReturnType<typeof probeFeed>>;
  try {
    metadata = await probeFeed(url);
  } catch {
    return NextResponse.json(
      { error: "Could not fetch or parse the feed URL. Please check it is a valid RSS/Atom feed." },
      { status: 422 }
    );
  }

  const [newFeed] = await db
    .insert(feeds)
    .values({
      url: metadata.rssUrl,   // 변환된 RSS URL로 저장 (네이버 블로그 등)
      categoryId: categoryId ?? null,
      title: metadata.title,
      description: metadata.description,
      siteUrl: metadata.siteUrl,
      faviconUrl: metadata.faviconUrl,
    })
    .returning();

  // Kick off initial article fetch (don't await failure)
  fetchAndIngestFeed(newFeed.id).catch(console.error);

  return NextResponse.json(newFeed, { status: 201 });
}
