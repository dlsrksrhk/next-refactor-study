"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Article, User } from "./article";
import { formatDate } from "./formatDate";
import { QuickEditButton } from "./QuickEditButton";

type Props = { articles: Article[]; user: User };

export function BoardList({ articles, user }: Props) {
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
  }

  function handleOnlyMineChange(event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    setOnlyMine(checked);
  }

  const filteredArticles = articles
    .filter((article) => (onlyMine ? article.authorId === user.id : true))
    .filter((article) => article.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <div className="board-controls">
        <div className="board-search">
          <label htmlFor="board-query">제목 검색</label>
          <input
            id="board-query"
            type="search"
            placeholder="찾으려는 제목을 입력하세요"
            value={query}
            onChange={handleQueryChange}
          />
        </div>
        <label className="checkbox-label board-own-filter">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={handleOnlyMineChange}
          />
          내 글만 보기
        </label>
      </div>
      <div className="table-container">
        <table>
          <caption>검색 결과 {filteredArticles.length}건</caption>
          <thead>
            <tr>
              <th scope="col">제목</th>
              <th scope="col">작성자</th>
              <th scope="col">수정일</th>
              <th scope="col">작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="board-empty"
                >
                  검색 조건에 맞는 게시글이 없습니다.
                </td>
              </tr>
            ) : (
              filteredArticles.map((article) => (
                <tr
                  key={article.id}
                  data-article-id={article.id}
                >
                  <td>
                    <Link href={`/board/articles/${article.id}`}>{article.title}</Link>
                  </td>
                  <td>{article.authorName}</td>
                  <td>
                    <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
                  </td>
                  <td>{article.authorId === user.id && <QuickEditButton article={article} />}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
