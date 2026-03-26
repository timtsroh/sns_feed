import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const feeds = sqliteTable("feeds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  siteUrl: text("site_url"),
  faviconUrl: text("favicon_url"),
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp_ms" }),
  fetchError: text("fetch_error"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    content: text("content"),
    summary: text("summary"),
    author: text("author"),
    imageUrl: text("image_url"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    isBookmarked: integer("is_bookmarked", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    unique("articles_feed_guid").on(t.feedId, t.guid),
    index("articles_feed_read_published_idx").on(t.feedId, t.isRead, t.publishedAt),
    index("articles_bookmarked_published_idx").on(t.isBookmarked, t.publishedAt),
    index("articles_published_idx").on(t.publishedAt),
  ]
);

export type Category = typeof categories.$inferSelect;
export type Feed = typeof feeds.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type NewArticle = typeof articles.$inferInsert;
