"use client";

import { useEffect, useState } from "react";
import type { Article } from "./article";
import { getArticle } from "./article-api";
import { QuickEditForm } from "./QuickEditForm";

function showDialog(dialog: HTMLDialogElement | null) {
  if (dialog && !dialog.open) {
    dialog.showModal();
  }
}

type Props = { articleId: string; onClose: () => void; onSaved: () => void };

export function PopupEditor({ articleId, onClose, onSaved }: Props) {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");

  // 2주차 시작 코드: 조회 조건과 입력 초기화는 실습에서 수정합니다.
  const request = { articleId };

  useEffect(() => {
    getArticle(request.articleId)
      .then((data) => {
        setArticle(data);
        setError("");
      })
      .catch(() => {
        setError("게시글을 불러오지 못했습니다.");
      });
  }, [request]);

  return (
    <dialog
      ref={showDialog}
      onClose={onClose}
      aria-labelledby="popup-title"
    >
      <h2 id="popup-title">게시글 빠른 수정</h2>
      {error ? (
        <div>
          <p role="alert">{error}</p>
          <button onClick={onClose}>닫기</button>
        </div>
      ) : !article ? (
        <div>
          <p role="status">게시글을 불러오는 중입니다.</p>
          <button onClick={onClose}>취소</button>
        </div>
      ) : (
        <QuickEditForm
          article={article}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </dialog>
  );
}
