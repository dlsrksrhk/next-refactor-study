"use client";

import { useState } from "react";
import { updateArticle } from "@/features/articles/article-api";
import type { ArticleDraft } from "@/features/articles/article";

type SaveResult =
  | {
      isSuccess: true;
    }
  | {
      isSuccess: false;
      message: string;
    };

export function useSaveArticle() {
  const [isSaving, setIsSaving] = useState(false);

  async function save(articleId: string, articleDraft: ArticleDraft): Promise<SaveResult> {
    setIsSaving(true);
    try {
      await updateArticle(articleId, articleDraft);

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

  return { isSaving, save };
}
