import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  const { name } = await req.json();

  const [updated] = await db
    .update(categories)
    .set({ name: name.trim() })
    .where(eq(categories.id, parseInt(categoryId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  await db.delete(categories).where(eq(categories.id, parseInt(categoryId)));
  return new NextResponse(null, { status: 204 });
}
