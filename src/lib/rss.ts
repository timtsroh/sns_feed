import Parser from "rss-parser";
import { db } from "@/db";
import { articles, feeds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFaviconUrl } from "./utils";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["content:encoded", "contentEncoded"],
    ],
  },
  timeout: 15000,
});

type ParsedFeed = Awaited<ReturnType<typeof parser.parseURL>>;
type ParsedItem = ParsedFeed["items"][number] & {
  id?: string;
  author?: string;
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  contentEncoded?: string;
};

/** 네이버 블로그 URL → RSS URL 변환 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // https://blog.naver.com/blogId → https://rss.blog.naver.com/blogId
    if (parsed.hostname === "blog.naver.com") {
      const blogId = parsed.pathname.split("/").filter(Boolean)[0];
      if (blogId) return `https://rss.blog.naver.com/${blogId}`;
    }
    return url;
  } catch {
    return url;
  }
}

export async function probeFeed(url: string) {
  const rssUrl = normalizeUrl(url);
  const feed = await parser.parseURL(rssUrl);
  return {
    title: feed.title || url,
    description: feed.description || null,
    siteUrl: feed.link || null,
    faviconUrl: feed.link ? getFaviconUrl(feed.link) : null,
    rssUrl,
  };
}

function extractImageUrl(item: ParsedItem): string | null {
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }
  // Try to extract first <img> from content
  const content = item.contentEncoded || item.content || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch?.[1] ?? null;
}

function extractGuid(item: ParsedItem, feedId: number): string {
  return item.guid || item.id || item.link || `${feedId}-${item.title}-${item.pubDate}`;
}

export async function fetchAndIngestFeed(feedId: number): Promise<number> {
  const feed = await db.query.feeds.findFirst({ where: eq(feeds.id, feedId) });
  if (!feed) throw new Error(`Feed ${feedId} not found`);

  let parsed: ParsedFeed;
  try {
    parsed = await parser.parseURL(normalizeUrl(feed.url));
  } catch (err) {
    await db
      .update(feeds)
      .set({ fetchError: err instanceof Error ? err.message : String(err) })
      .where(eq(feeds.id, feedId));
    return 0;
  }

  const now = new Date();
  const newArticles = parsed.items.map((rawItem) => {
    const item = rawItem as ParsedItem;
    const content = item.contentEncoded || item.content || null;
    const summary = item.contentSnippet || item.summary || null;
    return {
      feedId,
      guid: extractGuid(item, feedId),
      title: item.title || "Untitled",
      url: item.link || feed.url,
      content,
      summary,
      author: item.creator || item.author || null,
      imageUrl: extractImageUrl(item),
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      fetchedAt: now,
    };
  });

  if (newArticles.length === 0) {
    await db.update(feeds).set({ lastFetchedAt: now, fetchError: null }).where(eq(feeds.id, feedId));
    return 0;
  }

  // Insert in batches of 50 to avoid query size limits
  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < newArticles.length; i += batchSize) {
    const batch = newArticles.slice(i, i + batchSize);
    const result = await db
      .insert(articles)
      .values(batch)
      .onConflictDoNothing()
      .returning({ id: articles.id });
    inserted += result.length;
  }

  await db
    .update(feeds)
    .set({ lastFetchedAt: now, fetchError: null })
    .where(eq(feeds.id, feedId));

  return inserted;
}

export async function fetchAndIngestAllFeeds(): Promise<{
  feedId: number;
  newArticles: number;
  error?: string;
}[]> {
  const allFeeds = await db.query.feeds.findMany();

  const CONCURRENCY = 5;
  const results: { feedId: number; newArticles: number; error?: string }[] = [];

  for (let i = 0; i < allFeeds.length; i += CONCURRENCY) {
    const batch = allFeeds.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((f) => fetchAndIngestFeed(f.id))
    );
    batchResults.forEach((result, idx) => {
      const feedId = batch[idx].id;
      if (result.status === "fulfilled") {
        results.push({ feedId, newArticles: result.value });
      } else {
        results.push({ feedId, newArticles: 0, error: String(result.reason) });
      }
    });
  }

  return results;
}
