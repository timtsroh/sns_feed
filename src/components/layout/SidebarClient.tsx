"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus, Bookmark, LayoutList, ChevronDown, ChevronRight,
  Rss, Trash2, FolderPlus, MoreHorizontal, Star, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddFeedDialog } from "@/components/feeds/AddFeedDialog";
import { RefreshAllButton } from "@/components/feeds/RefreshAllButton";
import type { SidebarData } from "@/types";
import type { Category, Feed } from "@/db/schema";

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto text-xs font-medium bg-brand/10 text-brand rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ── 포털 드롭다운 ── */
interface MenuItem { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }

function FloatingMenu({ anchorRef, onClose, items }: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  items: MenuItem[];
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    function handleDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [anchorRef, onClose]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 text-sm"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors",
            item.danger ? "text-red-500" : "text-gray-700"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

/* ── 피드 아이템 ── */
function FeedItem({
  feed, unreadCount, onDelete, onFavorite, onRename,
  draggable = false, indented = false,
}: {
  feed: Feed;
  unreadCount: number;
  onDelete: (id: number) => void;
  onFavorite: (id: number) => void;
  onRename: (id: number, name: string) => void;
  draggable?: boolean;
  indented?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === `/feed/${feed.id}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(feed.title);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("feedId", String(feed.id));
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleRenameSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (renameValue.trim() && renameValue !== feed.title) onRename(feed.id, renameValue.trim());
    setRenaming(false);
  }

  const menuItems: MenuItem[] = [
    {
      label: feed.isFavorite ? "즐겨찾기 해제" : "즐겨찾기",
      icon: <Star size={13} className={feed.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"} />,
      onClick: () => onFavorite(feed.id),
    },
    {
      label: "이름 변경",
      icon: <Pencil size={13} className="text-gray-400" />,
      onClick: () => { setRenameValue(feed.title); setRenaming(true); },
    },
    {
      label: "삭제",
      icon: <Trash2 size={13} />,
      onClick: () => onDelete(feed.id),
      danger: true,
    },
  ];

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      className={cn(
        "group/feed flex items-center gap-2 py-1.5 rounded-lg text-sm transition-colors",
        indented ? "pl-6 pr-2" : "px-2",
        draggable && "cursor-grab active:cursor-grabbing",
        isActive ? "bg-brand/10 text-brand font-medium" : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {renaming ? (
        <form onSubmit={handleRenameSubmit} className="flex-1 flex gap-1 min-w-0">
          {feed.faviconUrl
            ? <img src={feed.faviconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
            : <Rss size={14} className="flex-shrink-0 text-gray-400" />}
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            className="flex-1 min-w-0 text-sm bg-transparent border-b border-brand outline-none text-gray-700"
          />
        </form>
      ) : (
        <Link href={`/feed/${feed.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          {feed.faviconUrl
            ? <img src={feed.faviconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
            : <Rss size={14} className="flex-shrink-0 text-gray-400" />}
          <span className="truncate">{feed.title}</span>
          {feed.isFavorite && <Star size={10} className="flex-shrink-0 text-yellow-400 fill-yellow-400" />}
        </Link>
      )}

      {!renaming && (
        <>
          <button
            ref={btnRef}
            onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
            className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover/feed:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <FloatingMenu
              anchorRef={btnRef}
              onClose={() => setMenuOpen(false)}
              items={menuItems}
            />
          )}
          <UnreadBadge count={unreadCount} />
        </>
      )}
    </div>
  );
}

/* ── 카테고리 섹션 ── */
function CategorySection({
  category, feeds, unreadCounts,
  onDeleteFeed, onDropFeed, onRenameCategory, onFavoriteFeed, onRenameFeed,
}: {
  category: Category;
  feeds: Feed[];
  unreadCounts: Record<number, number>;
  onDeleteFeed: (id: number) => void;
  onDropFeed: (feedId: number, categoryId: number) => void;
  onRenameCategory: (id: number, name: string) => void;
  onFavoriteFeed: (id: number) => void;
  onRenameFeed: (id: number, name: string) => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(category.name);
  const btnRef = useRef<HTMLButtonElement>(null);
  const totalUnread = feeds.reduce((sum, f) => sum + (unreadCounts[f.id] || 0), 0);
  const isActive = pathname === `/category/${category.id}`;

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const feedId = parseInt(e.dataTransfer.getData("feedId"));
    if (feedId) onDropFeed(feedId, category.id);
  }
  async function handleRenameSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (renameValue.trim() && renameValue !== category.name) onRenameCategory(category.id, renameValue.trim());
    setRenaming(false);
  }

  const menuItems: MenuItem[] = [
    {
      label: "이름 변경",
      icon: <Pencil size={13} className="text-gray-400" />,
      onClick: () => { setRenameValue(category.name); setRenaming(true); },
    },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn("rounded-lg transition-colors", dragOver && "bg-brand/5 ring-1 ring-brand/30")}
    >
      <div className="group/cat flex items-center gap-1 px-1">
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>

        {renaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              className="w-full text-xs font-semibold uppercase tracking-wider bg-transparent border-b border-brand outline-none text-gray-700"
            />
          </form>
        ) : (
          <Link
            href={`/category/${category.id}`}
            className={cn(
              "flex-1 text-xs font-semibold uppercase tracking-wider py-1 transition-colors",
              isActive ? "text-brand" : "text-gray-400 hover:text-gray-700"
            )}
          >
            {category.name}
          </Link>
        )}

        {!renaming && (
          <>
            <button
              ref={btnRef}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover/cat:opacity-100 transition-opacity flex-shrink-0"
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <FloatingMenu anchorRef={btnRef} onClose={() => setMenuOpen(false)} items={menuItems} />
            )}
            {totalUnread > 0 && <UnreadBadge count={totalUnread} />}
          </>
        )}
      </div>

      {!collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {feeds.map((feed) => (
            <FeedItem
              key={feed.id}
              feed={feed}
              unreadCount={unreadCounts[feed.id] || 0}
              onDelete={onDeleteFeed}
              onFavorite={onFavoriteFeed}
              onRename={onRenameFeed}
              indented
            />
          ))}
          {feeds.length === 0 && (
            <p className="pl-6 py-1 text-xs text-gray-300 italic">Drop feeds here</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 메인 사이드바 ── */
export function SidebarClient({ data, categories }: { data: SidebarData; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  async function handleDeleteFeed(id: number) {
    if (!confirm("이 피드와 모든 글을 삭제할까요?")) return;
    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function handleFavoriteFeed(id: number) {
    await fetch(`/api/feeds/${id}/favorite`, { method: "POST" });
    router.refresh();
  }
  async function handleRenameFeed(id: number, title: string) {
    await fetch(`/api/feeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    router.refresh();
  }
  async function handleDropFeed(feedId: number, categoryId: number) {
    await fetch(`/api/feeds/${feedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    router.refresh();
  }
  async function handleRenameCategory(id: number, name: string) {
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    setNewCategoryName("");
    setShowAddCategory(false);
    router.refresh();
  }

  const navLinkClass = (path: string) =>
    cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
      pathname === path ? "bg-brand/10 text-brand font-medium" : "text-gray-600 hover:bg-gray-100"
    );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-base tracking-tight">Feedly</span>
          <div className="flex items-center gap-1">
            <RefreshAllButton />
            <button
              onClick={() => setShowAddFeed(true)}
              title="피드 추가"
              className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 space-y-1 px-2">
          <Link href="/all" className={navLinkClass("/all")}>
            <LayoutList size={16} />All Articles
          </Link>
          <Link href="/bookmarks" className={navLinkClass("/bookmarks")}>
            <Bookmark size={16} />Saved
          </Link>

          {/* 즐겨찾기 */}
          {data.favorites.length > 0 && (
            <div className="pt-3 space-y-0.5">
              <p className="px-2 py-1 text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />즐겨찾기
              </p>
              {data.favorites.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  unreadCount={data.unreadCounts[feed.id] || 0}
                  onDelete={handleDeleteFeed}
                  onFavorite={handleFavoriteFeed}
                  onRename={handleRenameFeed}
                />
              ))}
            </div>
          )}

          {/* 카테고리 */}
          <div className="pt-3 space-y-3">
            {data.categories.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                feeds={cat.feeds}
                unreadCounts={data.unreadCounts}
                onDeleteFeed={handleDeleteFeed}
                onDropFeed={handleDropFeed}
                onRenameCategory={handleRenameCategory}
                onFavoriteFeed={handleFavoriteFeed}
                onRenameFeed={handleRenameFeed}
              />
            ))}

            {/* 미분류 */}
            {data.uncategorized.length > 0 && (
              <div className="space-y-0.5">
                <p className="px-2 py-1 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Uncategorized
                </p>
                {data.uncategorized.map((feed) => (
                  <FeedItem
                    key={feed.id}
                    feed={feed}
                    unreadCount={data.unreadCounts[feed.id] || 0}
                    onDelete={handleDeleteFeed}
                    onFavorite={handleFavoriteFeed}
                    onRename={handleRenameFeed}
                    draggable
                  />
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-3 py-2">
          {showAddCategory ? (
            <form onSubmit={handleAddCategory} className="flex gap-1">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button type="submit" className="text-xs px-2 py-1 bg-brand text-white rounded">Add</button>
              <button type="button" onClick={() => setShowAddCategory(false)} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              <FolderPlus size={14} />New category
            </button>
          )}
        </div>
      </div>

      <AddFeedDialog open={showAddFeed} onClose={() => setShowAddFeed(false)} categories={categories} />
    </>
  );
}
