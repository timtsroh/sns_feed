"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, ExternalLink, MailOpen } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { ArticleWithFeed } from "@/types";

interface ArticleReaderProps {
  article: ArticleWithFeed;
  sanitizedContent: string;
}

export function ArticleReader({ article, sanitizedContent }: ArticleReaderProps) {
  const [bookmarked, setBookmarked] = useState(article.isBookmarked);
  const [isRead, setIsRead] = useState(article.isRead);

  // Mark as read on mount
  useEffect(() => {
    if (!isRead) {
      fetch(`/api/articles/${article.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setIsRead(true);
    }
  }, [article.id, isRead]);

  async function toggleBookmark() {
    const res = await fetch(`/api/articles/${article.id}/bookmark`, { method: "POST" });
    const data = await res.json();
    setBookmarked(data.isBookmarked);
  }

  async function markUnread() {
    await fetch(`/api/articles/${article.id}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: false }),
    });
    setIsRead(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <Link
          href={`/feed/${article.feedId}`}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex-1" />

        <button
          onClick={markUnread}
          title="Mark as unread"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            !isRead
              ? "text-brand bg-brand/10"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          )}
        >
          <MailOpen size={16} />
        </button>

        <button
          onClick={toggleBookmark}
          title="Bookmark"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            bookmarked
              ? "text-brand bg-brand/10"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          )}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        </button>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open original"
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <article className="max-w-2xl mx-auto px-6 py-8">
          {/* Feed source */}
          <div className="flex items-center gap-2 mb-4">
            {article.feed.faviconUrl && (
              <img src={article.feed.faviconUrl} alt="" className="w-4 h-4 rounded-sm" />
            )}
            <span className="text-sm text-gray-400">{article.feed.title}</span>
            {article.publishedAt && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-400">
                  {formatRelativeDate(article.publishedAt)}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>

          {article.author && (
            <p className="text-sm text-gray-500 mb-6">By {article.author}</p>
          )}

          {sanitizedContent ? (
            <div
              className="prose prose-sm prose-gray max-w-none prose-a:text-brand prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No content available in feed.</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand hover:underline"
              >
                Read on original site <ExternalLink size={14} />
              </a>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors"
            >
              View original article <ExternalLink size={14} />
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
