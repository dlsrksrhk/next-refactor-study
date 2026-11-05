import { test, expect } from "@playwright/test";

// 3주차 시작 코드의 결함 재현용입니다. 실습 완료 시 올바른 동작 검증으로 바꾸세요.
test("3주차 시작 상태: 내 글 필터가 행을 줄여도 결과 건수는 바뀌지 않는다", async ({
  page,
  request,
}) => {
  const articles = await (await request.get("/api/articles")).json();
  const user = await (await request.get("/api/me")).json();
  const ownArticles = articles.filter(
    (article: { authorId: string }) => article.authorId === user.id,
  );
  expect(ownArticles.length).toBeLessThan(articles.length);
  await page.goto("/board");
  await page.getByLabel("제목 검색", { exact: true }).fill(" ");
  await page.getByLabel("내 글만 보기", { exact: true }).check();
  await expect(page.locator("tbody tr[data-article-id]")).toHaveCount(ownArticles.length);
  await expect(page.getByRole("caption")).toHaveText(`검색 결과 ${articles.length}건`);
});

test("3주차 시작 상태: 내 글 필터를 해제하면 입력된 검색 조건이 사라진다", async ({
  page,
  request,
}) => {
  const articles = await (await request.get("/api/articles")).json();
  const missing = "일치하지않는검색조건-week3";
  expect(articles.every((article: { title: string }) => !article.title.includes(missing))).toBe(
    true,
  );
  await page.goto("/board");
  const search = page.getByLabel("제목 검색", { exact: true });
  await search.fill(missing);
  await expect(page.getByText("검색 조건에 맞는 게시글이 없습니다.")).toBeVisible();
  await page.getByLabel("내 글만 보기", { exact: true }).check();
  await page.getByLabel("내 글만 보기", { exact: true }).uncheck();
  await expect(search).toHaveValue(missing);
  await expect(page.locator("tbody tr[data-article-id]")).toHaveCount(articles.length);
  await expect(page.getByRole("caption")).toHaveText("검색 결과 0건");
});

test("3주차 시작 상태: 빠른 수정 저장 후에도 검색 결과에 이전 제목이 남는다", async ({
  page,
  request,
}) => {
  const original = await (await request.get("/api/articles/101")).json();
  const title = `검색결과갱신검증-${Date.now()}`;
  try {
    await page.goto("/board");
    await page.getByLabel("제목 검색", { exact: true }).fill(original.title);
    const row = page.locator('tr[data-article-id="101"]');
    await row.getByRole("button", { name: "빠른 수정", exact: true }).click();
    await page.getByLabel("제목", { exact: true }).fill(title);
    const refreshed = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/board") &&
        response.headers()["content-type"]?.includes("text/x-component"),
    );
    await page.getByRole("button", { name: "저장하고 닫기", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await refreshed;
    expect((await (await request.get("/api/articles/101")).json()).title).toBe(title);
    await expect(page.getByLabel("제목 검색", { exact: true })).toHaveValue(original.title);
    await expect(row.getByRole("link")).toHaveText(original.title);
  } finally {
    await request.put("/api/articles/101", {
      data: { title: original.title, body: original.body },
    });
  }
});
