import { notFound } from "next/navigation";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArticleList } from "@/components/articles/ArticleList";
import { queryArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  params,
}: {
  params: Promise<{ feedId: string }>;
}) {
  const { feedId } = await params;
  const id = parseInt(feedId);

  const feed = await db.query.feeds.findFirst({ where: eq(feeds.id, id) });
  if (!feed) notFound();

  const { items, nextCursor } = await queryArticles({ feedId: id });

  return (
    <ArticleList
      initialItems={items}
      initialCursor={nextCursor}
      queryParams={{ feedId }}
      title={feed.title}
    />
  );
}
