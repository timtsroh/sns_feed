import { ArticleList } from "@/components/articles/ArticleList";
import { queryArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function AllPage() {
  const { items, nextCursor } = await queryArticles({});

  return (
    <ArticleList
      initialItems={items}
      initialCursor={nextCursor}
      queryParams={{}}
      title="All Articles"
    />
  );
}
