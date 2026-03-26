import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  });
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [category] = await db
    .insert(categories)
    .values({ name: name.trim() })
    .returning();

  return NextResponse.json(category, { status: 201 });
}
