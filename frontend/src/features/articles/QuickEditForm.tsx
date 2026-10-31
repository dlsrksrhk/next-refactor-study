"use client";

import { FormEvent, useRef, useEffect, useState } from "react";
import type { Article } from "./article";
import { useSaveArticle } from "./useSaveArticle";
import { toast, Toaster } from "sonner";

function focusTitle(input: HTMLInputElement | null) {
  input?.focus();
}

type Props = { article: Article; onClose: () => void; onSaved: () => void };

export function QuickEditForm({ article, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);

  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;

    return () => {
      isActiveRef.current = false;
      toast.dismiss("popup");
    };
  }, []);

  const editor = useSaveArticle();

  async function handleSaveAndClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.", { id: "popup", toasterId: "popup" });
      return;
    }

    const saveResult = await editor.save(article.id, { title, body });

    if (!isActiveRef.current) {
      return;
    }

    if (saveResult.status === "success") {
      onClose();
      onSaved();
      return;
    }

    if (saveResult.status === "error") {
      toast.error(saveResult.message, { id: "popup", toasterId: "popup" });
    }
  }

  return (
    <form
      onSubmit={handleSaveAndClose}
      aria-busy={editor.isSaving}
    >
      <Toaster
        id="popup"
        position="top-center"
        richColors
      />
      <fieldset disabled={editor.isSaving}>
        <legend className="visually-hidden">게시글 내용</legend>
        <label htmlFor="quick-title">제목</label>
        <input
          id="quick-title"
          ref={focusTitle}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label htmlFor="quick-body">본문</label>
        <textarea
          id="quick-body"
          rows={6}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button type="submit">{editor.isSaving ? "저장 중…" : "저장하고 닫기"}</button>
        </div>
      </fieldset>
    </form>
  );
}
