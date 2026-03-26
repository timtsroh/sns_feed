import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const { feedId } = await params;
  const id = parseInt(feedId);
  const body = await req.json();
  const { categoryId, title } = body as { categoryId?: number | null; title?: string };

  const updates: Partial<typeof feeds.$inferInsert> = {};
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (title) updates.title = title;

  const [updated] = await db.update(feeds).set(updates).where(eq(feeds.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Feed not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const { feedId } = await params;
  const id = parseInt(feedId);
  await db.delete(feeds).where(eq(feeds.id, id));
  return new NextResponse(null, { status: 204 });
}
