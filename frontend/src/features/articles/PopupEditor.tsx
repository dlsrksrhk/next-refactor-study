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
  const [retryFlag, setRetryFlag] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getArticle(articleId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }
        setArticle(data);
        setError("");
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setError("게시글을 불러오지 못했습니다.");
      });

    return () => {
      controller.abort();
    };
  }, [articleId, retryFlag]);

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
          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => {
                setRetryFlag((prev) => !prev);
                setError("");
              }}
            >
              다시 시도
            </button>
          </div>
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
