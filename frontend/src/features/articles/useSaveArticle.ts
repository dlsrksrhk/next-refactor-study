"use client";

import { useRef, useState } from "react";
import { updateArticle } from "@/features/articles/article-api";
import type { ArticleDraft } from "@/features/articles/article";

type SaveResult =
  | {
      status: "success";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "already-saving";
    };

export function useSaveArticle() {
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  async function save(articleId: string, articleDraft: ArticleDraft): Promise<SaveResult> {
    if (isSavingRef.current) {
      return {
        status: "already-saving",
      };
    }

    setIsSaving(true);

    try {
      isSavingRef.current = true;
      await updateArticle(articleId, articleDraft);

      return {
        status: "success",
      };
    } catch {
      return {
        status: "error",
        message: "저장하지 못했습니다.",
      };
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }

  return { isSaving, save };
}
