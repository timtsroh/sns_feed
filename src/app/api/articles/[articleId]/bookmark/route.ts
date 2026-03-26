import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params;
  const id = parseInt(articleId);

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, id),
    columns: { id: true, isBookmarked: true },
  });
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const [updated] = await db
    .update(articles)
    .set({ isBookmarked: !article.isBookmarked })
    .where(eq(articles.id, id))
    .returning({ id: articles.id, isBookmarked: articles.isBookmarked });

  return NextResponse.json(updated);
}
