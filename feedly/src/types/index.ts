import type { Article, Category, Feed } from "@/db/schema";

export type FeedWithCategory = Feed & { category: Category | null };
export type ArticleWithFeed = Article & {
  feed: Pick<Feed, "id" | "title" | "faviconUrl">;
};

export type CategoryWithFeeds = Category & {
  feeds: Feed[];
};

export type SidebarData = {
  categories: CategoryWithFeeds[];
  uncategorized: Feed[];
  favorites: Feed[];
  unreadCounts: Record<number, number>;
};
