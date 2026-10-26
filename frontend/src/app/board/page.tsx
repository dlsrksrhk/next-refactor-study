import Link from "next/link";
import { getArticles, getCurrentUser } from "@/features/articles/getArticle";
import { formatDate } from "@/features/articles/formatDate";
import { QuickEditButton } from "@/features/articles/QuickEditButton";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const articles = await getArticles();
  const user = await getCurrentUser();

  return (
    <>
      <h1>사내 전체 게시판</h1>
      <p className="description">전 직원에게 공유할 공지와 업무 소식을 확인하세요.</p>
      <div className="table-container">
        <table>
          <caption>전체 게시글 {articles.length}건</caption>
          <thead>
            <tr>
              <th scope="col">제목</th>
              <th scope="col">작성자</th>
              <th scope="col">수정일</th>
              <th scope="col">작업</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>
                  <Link href={`/board/articles/${article.id}`}>{article.title}</Link>
                </td>
                <td>{article.authorName}</td>
                <td>
                  <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
                </td>
                <td>{article.authorId === user.id && <QuickEditButton article={article} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
