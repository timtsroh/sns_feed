import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params;
  const body = await req.json();
  const { isRead, articleIds } = body as { isRead: boolean; articleIds?: number[] };

  // Batch update support
  if (articleIds && articleIds.length > 0) {
    await db.update(articles).set({ isRead }).where(inArray(articles.id, articleIds));
    return NextResponse.json({ updated: articleIds.length });
  }

  // Single update
  const id = parseInt(articleId);
  const [updated] = await db
    .update(articles)
    .set({ isRead })
    .where(eq(articles.id, id))
    .returning({ id: articles.id, isRead: articles.isRead });

  if (!updated) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  return NextResponse.json(updated);
}
