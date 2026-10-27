"use client";

import { useState } from "react";
import { updateArticle } from "@/features/articles/article-api";

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
      await updateArticle(articleId, { title, body });

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
