import { ArticleList } from "@/components/articles/ArticleList";
import { queryArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const { items, nextCursor } = await queryArticles({ bookmarked: true });

  return (
    <ArticleList
      initialItems={items}
      initialCursor={nextCursor}
      queryParams={{ bookmarked: "true" }}
      title="Saved Articles"
    />
  );
}
