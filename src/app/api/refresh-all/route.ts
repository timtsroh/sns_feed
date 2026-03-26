import { NextRequest, NextResponse } from "next/server";
import { fetchAndIngestAllFeeds } from "@/lib/rss";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await fetchAndIngestAllFeeds();
  const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);

  return NextResponse.json({ results, totalNew });
}
