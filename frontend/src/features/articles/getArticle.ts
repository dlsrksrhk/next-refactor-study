import type { Article, User } from "./article";

const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:4000";

// Server Component에서 목업 백엔드로 조회합니다.
export async function getArticle(id: string): Promise<Article | null> {
  const response = await fetch(`${backendUrl}/api/articles/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("게시글을 불러오지 못했습니다.");
  return response.json();
}

export async function getArticles(): Promise<Article[]> {
  const response = await fetch(`${backendUrl}/api/articles`, { cache: "no-store" });
  if (!response.ok) throw new Error("게시글 목록을 불러오지 못했습니다.");
  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${backendUrl}/api/me`, { cache: "no-store" });
  if (!response.ok) throw new Error("로그인 사용자를 불러오지 못했습니다.");
  return response.json();
}
