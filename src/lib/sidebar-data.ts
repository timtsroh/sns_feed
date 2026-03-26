import { db } from "@/db";
import { articles, categories, feeds } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { SidebarData } from "@/types";

export async function getSidebarData(): Promise<SidebarData> {
  const [allCategories, allFeeds, unreadRows] = await Promise.all([
    db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] }),
    db.query.feeds.findMany({ orderBy: (f, { asc }) => [asc(f.title)] }),
    db
      .select({ feedId: articles.feedId, count: sql<number>`count(*)`.as("count") })
      .from(articles)
      .where(eq(articles.isRead, false))
      .groupBy(articles.feedId),
  ]);

  const unreadCounts: Record<number, number> = {};
  for (const row of unreadRows) {
    unreadCounts[row.feedId] = row.count;
  }

  const categoryMap = new Map(allCategories.map((c) => [c.id, { ...c, feeds: [] as typeof allFeeds }]));
  const uncategorized: typeof allFeeds = [];

  for (const feed of allFeeds) {
    if (feed.categoryId && categoryMap.has(feed.categoryId)) {
      categoryMap.get(feed.categoryId)!.feeds.push(feed);
    } else {
      uncategorized.push(feed);
    }
  }

  return {
    categories: Array.from(categoryMap.values()),
    uncategorized,
    unreadCounts,
  };
}
