import { NextRequest, NextResponse } from "next/server";
import { queryArticles } from "@/lib/articles";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const result = await queryArticles({
    feedId: searchParams.get("feedId") ? parseInt(searchParams.get("feedId")!) : undefined,
    categoryId: searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!) : undefined,
    bookmarked: searchParams.get("bookmarked") === "true",
    unreadOnly: searchParams.get("unreadOnly") === "true",
    cursor: searchParams.get("cursor") ?? undefined,
  });
  return NextResponse.json(result);
}
