import { getArticles, getCurrentUser } from "@/features/articles/getArticle";
import { BoardList } from "@/features/articles/BoardList";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const articles = await getArticles();
  const user = await getCurrentUser();

  return (
    <>
      <h1>사내 전체 게시판</h1>
      <p className="description">전 직원에게 공유할 공지와 업무 소식을 확인하세요.</p>
      <BoardList
        articles={articles}
        user={user}
      />
    </>
  );
}
