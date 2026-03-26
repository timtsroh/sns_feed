import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";
import { getSidebarData } from "@/lib/sidebar-data";
import { db } from "@/db";
import { SidebarClient } from "@/components/layout/SidebarClient";

export const metadata: Metadata = {
  title: "Feedly",
  description: "Personal RSS Reader",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarData, categories] = await Promise.all([
    getSidebarData(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] }),
  ]);

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[260px] flex-shrink-0 border-r border-gray-100 bg-white overflow-hidden">
            <SidebarClient data={sidebarData} categories={categories} />
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
