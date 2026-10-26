import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getCurrentUser } from "@/features/articles/getArticle";
import { formatDate } from "@/features/articles/formatDate";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const user = await getCurrentUser();

  return (
    <>
      <article className="panel">
        <h1>{article.title}</h1>
        <p className="metadata">
          작성자 {article.authorName} · 수정일{" "}
          <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
        </p>
        <div className="article-body">{article.body}</div>
      </article>
      <nav
        className="actions"
        aria-label="게시글 작업"
      >
        <Link
          className="button secondary"
          href="/board"
        >
          목록으로
        </Link>
        {article.authorId === user.id && (
          <Link
            className="button"
            href={`/board/articles/${id}/edit`}
          >
            수정
          </Link>
        )}
      </nav>
    </>
  );
}
