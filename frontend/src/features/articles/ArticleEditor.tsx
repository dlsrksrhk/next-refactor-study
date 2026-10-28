"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import type { Article } from "./article";
import { useSaveArticle } from "./useSaveArticle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ArticleEditor({ article }: { article: Article }) {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);
  const [stayAfterSave, setStayAfterSave] = useState(false);
  const editor = useSaveArticle();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.dismiss();

    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.", { toasterId: "root" });
      return;
    }

    const saveResult = await editor.save(article.id, { title, body });
    if (saveResult.status === "success") {
      toast.success("저장했습니다.", { toasterId: "root" });

      if (!stayAfterSave) {
        router.push(`/board/articles/${article.id}`);
      }
      return;
    }

    if (saveResult.status === "error") {
      toast.error(saveResult.message, { toasterId: "root" });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={editor.isSaving}
    >
      <fieldset disabled={editor.isSaving}>
        <legend>게시글 내용</legend>
        <label htmlFor="title">제목</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label htmlFor="body">본문</label>
        <textarea
          id="body"
          rows={10}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={stayAfterSave}
            onChange={(event) => setStayAfterSave(event.target.checked)}
          />
          저장 후 이 화면에서 계속 편집
        </label>
        <p className="description">저장하면 전 직원이 보는 게시글에 바로 반영됩니다.</p>
        <div className="actions">
          <Link
            className="button secondary"
            href={`/board/articles/${article.id}`}
          >
            취소
          </Link>
          <button type="submit">{editor.isSaving ? "저장 중…" : "저장"}</button>
        </div>
      </fieldset>
    </form>
  );
}
