import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const { feedId } = await params;
  const id = parseInt(feedId);

  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.id, id),
    columns: { id: true, isFavorite: true },
  });
  if (!feed) return NextResponse.json({ error: "Feed not found" }, { status: 404 });

  const [updated] = await db
    .update(feeds)
    .set({ isFavorite: !feed.isFavorite })
    .where(eq(feeds.id, id))
    .returning({ id: feeds.id, isFavorite: feeds.isFavorite });

  return NextResponse.json(updated);
}
