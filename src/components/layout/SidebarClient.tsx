"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Bookmark, LayoutList, ChevronDown, ChevronRight, Rss, Trash2, FolderPlus, MoreHorizontal, Star, Pencil } from "lucide-react";
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

function CategoryMenu({
  onRename,
  onFavorite,
}: {
  onRename: () => void;
  onFavorite: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover/cat:opacity-100 transition-opacity"
      >
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm">
          <button
            onClick={() => { setOpen(false); onFavorite(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            <Star size={13} className="text-gray-400" />
            즐겨찾기
          </button>
          <button
            onClick={() => { setOpen(false); onRename(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={13} className="text-gray-400" />
            이름 변경
          </button>
        </div>
      )}
    </div>
  );
}

function FeedItem({
  feed,
  unreadCount,
  onDelete,
  draggable = false,
  indented = false,
}: {
  feed: Feed;
  unreadCount: number;
  onDelete: (id: number) => void;
  draggable?: boolean;
  indented?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === `/feed/${feed.id}`;
  const [showDelete, setShowDelete] = useState(false);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("feedId", String(feed.id));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      className={cn(
        "group flex items-center gap-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors",
        indented ? "pl-6 pr-3" : "px-3",
        draggable && "cursor-grab active:cursor-grabbing",
        isActive ? "bg-brand/10 text-brand font-medium" : "text-gray-600 hover:bg-gray-100"
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Link href={`/feed/${feed.id}`} className="flex items-center gap-2 flex-1 min-w-0">
        {feed.faviconUrl ? (
          <img src={feed.faviconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
        ) : (
          <Rss size={14} className="flex-shrink-0 text-gray-400" />
        )}
        <span className="truncate">{feed.title}</span>
      </Link>
      {showDelete ? (
        <button
          onClick={(e) => { e.preventDefault(); onDelete(feed.id); }}
          className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-red-500"
        >
          <Trash2 size={12} />
        </button>
      ) : (
        <UnreadBadge count={unreadCount} />
      )}
    </div>
  );
}

function CategorySection({
  category,
  feeds,
  unreadCounts,
  onDeleteFeed,
  onDropFeed,
  onRenameCategory,
}: {
  category: Category;
  feeds: Feed[];
  unreadCounts: Record<number, number>;
  onDeleteFeed: (id: number) => void;
  onDropFeed: (feedId: number, categoryId: number) => void;
  onRenameCategory: (id: number, name: string) => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(category.name);
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

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renameValue.trim() || renameValue === category.name) { setRenaming(false); return; }
    onRenameCategory(category.id, renameValue.trim());
    setRenaming(false);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn("rounded-lg transition-colors", dragOver && "bg-brand/5 ring-1 ring-brand/30")}
    >
      <div className="group/cat flex items-center gap-1 px-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>

        {renaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 flex gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              className="flex-1 text-xs font-semibold uppercase tracking-wider bg-transparent border-b border-brand outline-none text-gray-700"
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

        <CategoryMenu
          onRename={() => { setRenameValue(category.name); setRenaming(true); }}
          onFavorite={() => {}}
        />

        {totalUnread > 0 && !renaming && <UnreadBadge count={totalUnread} />}
      </div>

      {!collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {feeds.map((feed) => (
            <FeedItem
              key={feed.id}
              feed={feed}
              unreadCount={unreadCounts[feed.id] || 0}
              onDelete={onDeleteFeed}
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

export function SidebarClient({
  data,
  categories,
}: {
  data: SidebarData;
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  async function handleDeleteFeed(id: number) {
    if (!confirm("Remove this feed and all its articles?")) return;
    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
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
      pathname === path
        ? "bg-brand/10 text-brand font-medium"
        : "text-gray-600 hover:bg-gray-100"
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
              title="Add feed"
              className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 space-y-1 px-2">
          <Link href="/all" className={navLinkClass("/all")}>
            <LayoutList size={16} />
            All Articles
          </Link>
          <Link href="/bookmarks" className={navLinkClass("/bookmarks")}>
            <Bookmark size={16} />
            Saved
          </Link>

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
              />
            ))}

            {/* Uncategorized - draggable */}
            {data.uncategorized.length > 0 && (
              <div className="space-y-0.5">
                <p className="px-3 py-1 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Uncategorized
                </p>
                {data.uncategorized.map((feed) => (
                  <FeedItem
                    key={feed.id}
                    feed={feed}
                    unreadCount={data.unreadCounts[feed.id] || 0}
                    onDelete={handleDeleteFeed}
                    draggable={true}
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
              <button type="submit" className="text-xs px-2 py-1 bg-brand text-white rounded">
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              <FolderPlus size={14} />
              New category
            </button>
          )}
        </div>
      </div>

      <AddFeedDialog
        open={showAddFeed}
        onClose={() => setShowAddFeed(false)}
        categories={categories}
      />
    </>
  );
}
