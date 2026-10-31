import { currentUser, findAllArticles, updateArticle } from "./article-store.mjs";
import { readJsonBody, sendJson } from "./http.mjs";

const saveDelay = Number(process.env.SAVE_DELAY_MS ?? 0);
const saveStatus = Number(process.env.SAVE_STATUS ?? 204);
const readDelay = Number(process.env.READ_DELAY_MS ?? 1000);
if (!Number.isFinite(readDelay) || readDelay < 0 || readDelay > 30_000) {
  throw new Error("READ_DELAY_MS는 0~30000으로 설정하세요.");
}
if (
  !Number.isFinite(saveDelay) ||
  saveDelay < 0 ||
  saveDelay > 30_000 ||
  ![204, 500].includes(saveStatus)
) {
  throw new Error(
    "SAVE_DELAY_MS는 0~30000, SAVE_STATUS는 204 또는 500으로 설정하세요.",
  );
}

export function handleGetArticles(request, response) {
  return sendJson(response, 200, findAllArticles());
}

export async function handleGetArticle(request, response, article) {
  if (readDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, readDelay));
  }
  return sendJson(response, 200, article);
}

export async function handleUpdateArticle(request, response, article) {
  if (article.authorId !== currentUser.id) {
    return sendJson(response, 403, {
      message: "자신이 작성한 게시글만 수정할 수 있습니다.",
    });
  }

  let draft;
  try {
    draft = await readJsonBody(request);
  } catch (error) {
    return sendJson(response, error.status, { message: error.message });
  }

  if (!isValidDraft(draft)) {
    return sendJson(response, 400, {
      message: "제목은 필수이며 제목과 본문은 문자열이어야 합니다.",
    });
  }

  if (!(await applyMockSaveSettings(response))) return;

  try {
    updateArticle(article, draft);
  } catch (error) {
    console.error("게시글 파일 저장 실패:", error);
    return sendJson(response, 500, { message: "게시글을 저장하지 못했습니다." });
  }
  response.writeHead(204);
  response.end();
}

function isValidDraft(draft) {
  return (
    typeof draft?.title === "string" &&
    draft.title.trim().length > 0 &&
    typeof draft.body === "string"
  );
}

async function applyMockSaveSettings(response) {
  if (saveDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, saveDelay));
  }
  if (saveStatus === 500) {
    sendJson(response, 500, { message: "게시글을 저장하지 못했습니다." });
    return false;
  }
  return true;
}
