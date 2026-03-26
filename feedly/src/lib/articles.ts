import { db } from "@/db";
import { articles, feeds } from "@/db/schema";
import { and, desc, eq, lt, or } from "drizzle-orm";
import type { ArticleWithFeed } from "@/types";

export const PAGE_SIZE = 30;

export interface ArticleQuery {
  feedId?: number;
  categoryId?: number;
  bookmarked?: boolean;
  unreadOnly?: boolean;
  cursor?: string; // base64 encoded {publishedAt, id}
}

export async function queryArticles(query: ArticleQuery): Promise<{
  items: ArticleWithFeed[];
  nextCursor: string | null;
}> {
  const conditions = [];

  if (query.feedId) {
    conditions.push(eq(articles.feedId, query.feedId));
  } else if (query.categoryId) {
    const categoryFeeds = await db.query.feeds.findMany({
      where: eq(feeds.categoryId, query.categoryId),
      columns: { id: true },
    });
    const feedIds = categoryFeeds.map((f) => f.id);
    if (feedIds.length === 0) return { items: [], nextCursor: null };
    conditions.push(or(...feedIds.map((id) => eq(articles.feedId, id))));
  }

  if (query.bookmarked) conditions.push(eq(articles.isBookmarked, true));
  if (query.unreadOnly) conditions.push(eq(articles.isRead, false));

  if (query.cursor) {
    const { publishedAt, id } = JSON.parse(Buffer.from(query.cursor, "base64").toString());
    conditions.push(
      or(
        lt(articles.publishedAt, new Date(publishedAt)),
        and(eq(articles.publishedAt, new Date(publishedAt)), lt(articles.id, id))
      )
    );
  }

  const rows = await db.query.articles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(articles.publishedAt), desc(articles.id)],
    limit: PAGE_SIZE + 1,
    with: { feed: { columns: { id: true, title: true, faviconUrl: true } } },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows) as ArticleWithFeed[];

  let nextCursor: string | null = null;
  if (hasMore) {
    const last = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ publishedAt: last.publishedAt?.getTime?.() ?? last.publishedAt, id: last.id })
    ).toString("base64");
  }

  return { items, nextCursor };
}
