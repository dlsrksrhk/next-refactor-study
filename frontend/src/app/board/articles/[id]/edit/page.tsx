import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getCurrentUser } from "@/features/articles/getArticle";
import { ArticleEditor } from "@/features/articles/ArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const user = await getCurrentUser();

  if (article.authorId !== user.id) {
    return (
      <>
        <h1>수정 권한이 없습니다.</h1>
        <p>자신이 작성한 게시글만 수정할 수 있습니다.</p>
        <Link href="/board">목록으로</Link>
      </>
    );
  }

  return (
    <>
      <h1>게시글 수정</h1>
      <ArticleEditor
        key={article.id}
        article={article}
      />
    </>
  );
}
