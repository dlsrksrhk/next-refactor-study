import { redirect } from "next/navigation";

// 기존 훅의 고정 경로를 게시판 상세 주소로 연결합니다.
export default async function ArticleRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/board/articles/${encodeURIComponent(id)}`);
}
