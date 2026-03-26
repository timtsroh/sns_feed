"use client";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { ArticleWithFeed } from "@/types";

interface ArticleCardProps {
  article: ArticleWithFeed;
  onMarkRead: (id: number) => void;
  onBookmark: (id: number) => void;
}

export function ArticleCard({ article, onMarkRead, onBookmark }: ArticleCardProps) {
  const summary = article.summary
    ? article.summary.replace(/<[^>]*>/g, "").trim()
    : null;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onMarkRead(article.id)}
      className="flex items-center gap-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors group min-w-0"
    >
      {/* 미읽음 */}
      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", article.isRead ? "bg-transparent" : "bg-brand")} />

      {/* 출처 */}
      <div className="flex items-center gap-1 w-28 flex-shrink-0">
        {article.feed.faviconUrl && (
          <img src={article.feed.faviconUrl} alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
        )}
        <span className="text-xs text-gray-500 truncate">{article.feed.title}</span>
      </div>

      {/* 제목 + 미리보기 (한 줄) */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1 overflow-hidden">
        <span className={cn("text-sm flex-shrink-0 max-w-[50%] truncate", article.isRead ? "text-gray-400" : "text-gray-900 font-medium")}>
          {article.title}
        </span>
        {summary && (
          <span className="text-xs text-gray-400 truncate">{summary}</span>
        )}
      </div>

      {/* 날짜 + 북마크 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-300">{formatRelativeDate(article.publishedAt)}</span>
        <button
          onClick={(e) => { e.preventDefault(); onBookmark(article.id); }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded",
            article.isBookmarked ? "opacity-100 text-brand" : "text-gray-300 hover:text-brand"
          )}
        >
          <Bookmark size={13} fill={article.isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>
    </a>
  );
}
