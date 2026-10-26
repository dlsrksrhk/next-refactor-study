import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultFile = fileURLToPath(new URL("./articles.json", import.meta.url));
const seedFile = fileURLToPath(new URL("./articles.seed.json", import.meta.url));
const storageFile = process.env.ARTICLE_STORE_FILE
  ? resolve(process.env.ARTICLE_STORE_FILE)
  : defaultFile;

// 저장 파일이 없을 때만 초기 샘플을 복사합니다. 기존 데이터는 유지합니다.
if (!existsSync(storageFile)) {
  mkdirSync(dirname(storageFile), { recursive: true });
  copyFileSync(seedFile, storageFile);
}

const articles = JSON.parse(readFileSync(storageFile, "utf8"));

// 로그인 연동 대신 고정한 목업 사용자입니다.
export const currentUser = { id: "employee-001", name: "김동현" };

export function findAllArticles() {
  return articles;
}

export function findArticle(id) {
  return articles.find((article) => article.id === id);
}

export function updateArticle(article, draft) {
  const updated = {
    ...article,
    title: draft.title,
    body: draft.body,
    updatedAt: new Date().toISOString(),
  };
  const nextArticles = articles.map((item) =>
    item.id === article.id ? updated : item,
  );

  persistArticles(nextArticles);
  // 파일 저장이 성공한 뒤에만 조회용 메모리도 갱신합니다.
  Object.assign(article, updated);
}

function persistArticles(nextArticles) {
  const temporaryFile = `${storageFile}.${randomUUID()}.tmp`;
  try {
    // 완성된 JSON 파일로 교체하여 기록 도중 원본이 손상되지 않도록 합니다.
    writeFileSync(temporaryFile, `${JSON.stringify(nextArticles, null, 2)}\n`, "utf8");
    renameSync(temporaryFile, storageFile);
  } catch (error) {
    rmSync(temporaryFile, { force: true });
    throw error;
  }
}
