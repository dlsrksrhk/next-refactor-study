"use client";

import { useState } from "react";

type SaveResult =
  | {
      isSuccess: true;
    }
  | {
      isSuccess: false;
      message: string;
    };

export function useArticleEditor(articleId: string, initialTitle: string, initialBody: string) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [isSaving, setIsSaving] = useState(false);

  async function save(): Promise<SaveResult> {
    if (!title.trim()) {
      return {
        isSuccess: false,
        message: "제목을 입력해 주세요.",
      };
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });

      if (!response.ok) {
        throw new Error();
      }

      return {
        isSuccess: true,
      };
    } catch {
      return {
        isSuccess: false,
        message: "저장하지 못했습니다.",
      };
    } finally {
      setIsSaving(false);
    }
  }

  return { title, setTitle, body, setBody, isSaving, save };
}
