import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtemp, readFile, rename, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";

async function withBackend(settings, run) {
  const directory = await mkdtemp(join(tmpdir(), "article-backend-test-"));
  const storageFile = settings.ARTICLE_STORE_FILE ?? join(directory, "articles.json");
  const child = spawn(process.execPath, [fileURLToPath(new URL("./server.mjs", import.meta.url))], {
    env: { ...process.env, PORT: "0", READ_DELAY_MS: "0", SAVE_DELAY_MS: "0", SAVE_STATUS: "204", ARTICLE_STORE_FILE: storageFile, ...settings },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const baseUrl = await new Promise((resolve, reject) => {
      let output = "";
      child.stdout.on("data", (chunk) => {
        output += chunk.toString();
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) resolve(match[0]);
      });
      child.once("error", reject);
      child.once("exit", (code) => reject(new Error(`목업 서버 종료: ${code}`)));
    });
    await run(baseUrl, storageFile);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  }
}

test("지연된 500 저장 응답은 게시글을 변경하지 않는다", { timeout: 10_000 }, async () => {
  await withBackend({ SAVE_DELAY_MS: "150", SAVE_STATUS: "500" }, async (baseUrl) => {
    const url = `${baseUrl}/api/articles/101`;
    const original = await (await fetch(url)).json();
    const startedAt = performance.now();
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "반영되면 안 되는 제목", body: "반영되면 안 되는 본문" }),
    });
    assert.equal(response.status, 500);
    assert.ok(performance.now() - startedAt >= 140, "지연 설정이 적용되어야 합니다.");
    assert.deepEqual(await (await fetch(url)).json(), original);
  });
});

test("요청 분리 후에도 메서드·본문·작성자 오류 응답을 유지한다", { timeout: 10_000 }, async () => {
  await withBackend({}, async (baseUrl) => {
    const url = `${baseUrl}/api/articles/101`;
    const original = await (await fetch(url)).json();
    assert.deepEqual(await (await fetch(`${baseUrl}/api/me`)).json(), { id: "employee-001", name: "김동현" });
    const invalidMethod = await fetch(url, { method: "POST" });
    assert.equal(invalidMethod.status, 405);
    assert.equal(invalidMethod.headers.get("Allow"), "GET, PUT");
    assert.equal((await fetch(`${baseUrl}/api/articles/missing`, { method: "PUT" })).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/unknown`)).status, 404);
    const malformed = await fetch(url, { method: "PUT", body: "{invalid" });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { message: "올바른 JSON을 보내 주세요." });
    assert.equal((await fetch(url, { method: "PUT", body: "x".repeat(65537) })).status, 413);
    assert.equal((await fetch(url, { method: "PUT", body: JSON.stringify({ title: " ", body: "본문" }) })).status, 400);
    assert.equal((await fetch(`${baseUrl}/api/articles/103`, { method: "PUT", body: "{invalid" })).status, 403);
    assert.deepEqual(await (await fetch(url)).json(), original);
  });
});

test("저장 내용이 JSON 파일과 서버 재시작 후에도 유지된다", { timeout: 10_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "article-persistence-test-"));
  const storageFile = join(directory, "articles.json");
  const draft = { title: "재시작 후에도 남을 제목", body: "영구 저장한 본문" };

  try {
    await withBackend({ ARTICLE_STORE_FILE: storageFile }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/articles/101`, {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      assert.equal(response.status, 204);
      const stored = JSON.parse(await readFile(storageFile, "utf8"));
      assert.equal(stored.find((article) => article.id === "101").title, draft.title);
      assert.equal(stored.find((article) => article.id === "101").body, draft.body);
    });
    await withBackend({ ARTICLE_STORE_FILE: storageFile }, async (baseUrl) => {
      const article = await (await fetch(`${baseUrl}/api/articles/101`)).json();
      assert.equal(article.title, draft.title);
      assert.equal(article.body, draft.body);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("파일 저장 실패는 500을 반환하고 메모리 데이터도 유지한다", { timeout: 10_000 }, async () => {
  await withBackend({}, async (baseUrl, storageFile) => {
    const url = `${baseUrl}/api/articles/101`;
    const original = await (await fetch(url)).json();
    await rename(storageFile, `${storageFile}.backup`);
    await mkdir(storageFile);
    const response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({ title: "저장되면 안 되는 제목", body: "본문" }),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await (await fetch(url)).json(), original);
    assert.deepEqual(JSON.parse(await readFile(`${storageFile}.backup`, "utf8")).find((article) => article.id === "101"), original);
  });
});

test("저장 파일이 없으면 로컬 수정 데이터 대신 초기 샘플로 생성한다", { timeout: 10_000 }, async () => {
  await withBackend({}, async (baseUrl, storageFile) => {
    const response = await fetch(`${baseUrl}/api/articles/101`);
    const article = await response.json();
    assert.equal(article.title, "11월 사내 기술 공유회 안내");
    const seed = JSON.parse(await readFile(new URL("./articles.seed.json", import.meta.url), "utf8"));
    assert.deepEqual(JSON.parse(await readFile(storageFile, "utf8")), seed);
  });
});
