import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/articles/getArticle";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "사내 전체 게시판 | 한빛 그룹웨어",
  description: "전 직원에게 공유하는 공지와 업무 소식",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body>
        <header className="topbar">
          <Link
            className="brand"
            href="/board"
          >
            한빛 그룹웨어
          </Link>
          <span className="user-name">{user.name} 님</span>
        </header>
        <div className="workspace">
          <aside className="sidebar">
            <p className="menu-label">게시판</p>
            <nav aria-label="그룹웨어 메뉴">
              <Link
                href="/board"
                aria-current="page"
              >
                사내 전체 게시판
              </Link>
            </nav>
          </aside>
          <main>
            {children}
            <Toaster
              id="root"
              position="top-center"
              richColors
            />
          </main>
        </div>
      </body>
    </html>
  );
}
