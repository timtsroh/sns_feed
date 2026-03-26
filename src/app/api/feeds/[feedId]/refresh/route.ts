import { NextRequest, NextResponse } from "next/server";
import { fetchAndIngestFeed } from "@/lib/rss";

export const maxDuration = 30;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const { feedId } = await params;
  const id = parseInt(feedId);

  try {
    const newArticles = await fetchAndIngestFeed(id);
    return NextResponse.json({ newArticles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to refresh feed" },
      { status: 500 }
    );
  }
}
