import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArticleList } from "@/components/articles/ArticleList";
import { queryArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const id = parseInt(categoryId);

  const category = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  if (!category) notFound();

  const { items, nextCursor } = await queryArticles({ categoryId: id });

  return (
    <ArticleList
      initialItems={items}
      initialCursor={nextCursor}
      queryParams={{ categoryId }}
      title={category.name}
    />
  );
}
