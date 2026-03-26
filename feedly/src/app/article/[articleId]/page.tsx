import { notFound } from "next/navigation";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import { ArticleReader } from "@/components/articles/ArticleReader";
import type { ArticleWithFeed } from "@/types";

export const dynamic = "force-dynamic";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "strong", "em", "del", "ins",
    "a", "img",
    "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy" },
    }),
  },
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const id = parseInt(articleId);

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, id),
    with: { feed: { columns: { id: true, title: true, faviconUrl: true } } },
  });

  if (!article) notFound();

  const sanitizedContent = sanitizeHtml(
    article.content || article.summary || "",
    SANITIZE_OPTIONS
  );

  return (
    <ArticleReader
      article={article as ArticleWithFeed}
      sanitizedContent={sanitizedContent}
    />
  );
}
