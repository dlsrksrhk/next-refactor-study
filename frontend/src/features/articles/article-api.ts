import type { Article, ArticleDraft } from "@/features/articles/article";

export async function getArticle(articleId: string, signal?: AbortSignal): Promise<Article> {
  const response = await fetch(`/api/articles/${encodeURIComponent(articleId)}`, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Article fetch failed: ${response.status}`);
  }

  return (await response.json()) as Article;
}

export async function updateArticle(articleId: string, articleDraft: ArticleDraft) {
  const response = await fetch(`/api/articles/${articleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(articleDraft),
  });

  if (!response.ok) {
    throw new Error();
  }
}
