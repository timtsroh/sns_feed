import { relations } from "drizzle-orm";
import { articles, categories, feeds } from "./schema";

export const categoriesRelations = relations(categories, ({ many }) => ({
  feeds: many(feeds),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  category: one(categories, {
    fields: [feeds.categoryId],
    references: [categories.id],
  }),
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
  }),
}));
