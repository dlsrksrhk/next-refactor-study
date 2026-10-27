import type { ArticleDraft } from "@/features/articles/article";

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
