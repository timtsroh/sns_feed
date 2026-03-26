"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { ArticleCard } from "./ArticleCard";
import type { ArticleWithFeed } from "@/types";

interface ArticleListProps {
  initialItems: ArticleWithFeed[];
  initialCursor: string | null;
  queryParams: Record<string, string>;
  title: string;
}

export function ArticleList({
  initialItems,
  initialCursor,
  queryParams,
  title,
}: ArticleListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when props change (navigating between feeds)
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
  }, [initialItems, initialCursor]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...queryParams, cursor });
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, queryParams]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  async function handleMarkRead(id: number) {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
    await fetch(`/api/articles/${id}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
  }

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    const unreadIds = items.filter((a) => !a.isRead).map((a) => a.id);
    if (unreadIds.length === 0) { setMarkingAllRead(false); return; }

    setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
    await fetch("/api/articles/0/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true, articleIds: unreadIds }),
    });
    setMarkingAllRead(false);
    router.refresh();
  }

  async function handleBookmark(id: number) {
    const res = await fetch(`/api/articles/${id}/bookmark`, { method: "POST" });
    const data = await res.json();
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isBookmarked: data.isBookmarked } : a))
    );
  }

  const unreadCount = items.filter((a) => !a.isRead).length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <p className="text-lg font-medium">No articles yet</p>
        <p className="text-sm">Add a feed or refresh to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div>
          <h1 className="font-semibold text-gray-900">{title}</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-400">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand disabled:opacity-50 transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onMarkRead={handleMarkRead}
            onBookmark={handleBookmark}
          />
        ))}
        <div ref={sentinelRef} className="h-4" />
        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Loading…</div>
        )}
        {!cursor && items.length > 0 && (
          <div className="text-center py-4 text-xs text-gray-300">All caught up</div>
        )}
      </div>
    </div>
  );
}
