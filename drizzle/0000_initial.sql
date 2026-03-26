CREATE TABLE IF NOT EXISTS `categories` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `feeds` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `category_id` integer,
  `url` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `site_url` text,
  `favicon_url` text,
  `last_fetched_at` integer,
  `fetch_error` text,
  `created_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(`url`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `articles` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `feed_id` integer NOT NULL,
  `guid` text NOT NULL,
  `title` text NOT NULL,
  `url` text NOT NULL,
  `content` text,
  `summary` text,
  `author` text,
  `image_url` text,
  `published_at` integer,
  `fetched_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
  `is_read` integer NOT NULL DEFAULT 0,
  `is_bookmarked` integer NOT NULL DEFAULT 0,
  UNIQUE(`feed_id`, `guid`),
  FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `articles_feed_read_published_idx` ON `articles` (`feed_id`, `is_read`, `published_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `articles_bookmarked_published_idx` ON `articles` (`is_bookmarked`, `published_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `articles_published_idx` ON `articles` (`published_at`);
