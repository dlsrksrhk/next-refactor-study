"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useArticleEditor(
  articleId: string,
  initialTitle: string,
  initialBody: string,
  redirectAfterSave = true,
  silent = false,
) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!silent) alert("저장했습니다.");
      if (redirectAfterSave) router.push(`/articles/${articleId}`);
    } catch {
      if (!silent) alert("저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return { title, setTitle, body, setBody, isSaving, save };
}
