"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "./article";
import { PopupEditor } from "./PopupEditor";

export function QuickEditButton({ article }: { article: Article }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        className="secondary compact"
        onClick={() => setIsOpen(true)}
      >
        빠른 수정
      </button>
      {isOpen && (
        <PopupEditor
          article={article}
          onClose={() => setIsOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
