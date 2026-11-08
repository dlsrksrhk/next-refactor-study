import { test, expect } from "@playwright/test";

// 3주차 검색·필터 리팩터링의 정상 동작을 검증합니다.
test("내 글 필터의 결과 건수가 표시된 행 수와 일치한다", async ({
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
  await expect(page.locator("tbody tr[data-article-id]")).toHaveCount(articles.length);
  await expect(page.getByRole("caption")).toHaveText(`검색 결과 ${articles.length}건`);
  await page.getByLabel("제목 검색", { exact: true }).fill(" ");
  await page.getByLabel("내 글만 보기", { exact: true }).check();
  await expect(page.locator("tbody tr[data-article-id]")).toHaveCount(ownArticles.length);
  await expect(page.getByRole("caption")).toHaveText(`검색 결과 ${ownArticles.length}건`);
  for (const article of ownArticles) {
    await expect(page.locator(`tr[data-article-id="${article.id}"]`)).toBeVisible();
  }
});

test("내 글 필터를 해제해도 검색 조건과 빈 결과를 유지한다", async ({
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
  await expect(page.locator("tbody tr[data-article-id]")).toHaveCount(0);
  await expect(page.getByRole("caption")).toHaveText("검색 결과 0건");
  await expect(page.getByText("검색 조건에 맞는 게시글이 없습니다.")).toBeVisible();
});

test("빠른 수정 후 검색 조건을 유지하고 조건에서 벗어난 글과 건수를 갱신한다", async ({
  page,
  request,
}) => {
  const original = await (await request.get("/api/articles/101")).json();
  const searchTitle = `Week3Before-${Date.now()}`;
  const title = `검색결과갱신검증-${Date.now()}`;
  try {
    expect((await request.put("/api/articles/101", {
      data: { title: searchTitle, body: original.body },
    })).status()).toBe(204);
    await page.goto("/board");
    await page.getByLabel("제목 검색", { exact: true }).fill(searchTitle);
    await page.getByLabel("내 글만 보기", { exact: true }).check();
    await expect(page.getByRole("caption")).toHaveText("검색 결과 1건");
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
    await expect(page.getByLabel("제목 검색", { exact: true })).toHaveValue(searchTitle);
    await expect(page.getByLabel("내 글만 보기", { exact: true })).toBeChecked();
    await expect(row).toHaveCount(0);
    await expect(page.getByRole("caption")).toHaveText("검색 결과 0건");
    await expect(page.getByText("검색 조건에 맞는 게시글이 없습니다.")).toBeVisible();
    await page.getByLabel("제목 검색", { exact: true }).fill("");
    await expect(row.getByRole("link")).toHaveText(title);
  } finally {
    await request.put("/api/articles/101", {
      data: { title: original.title, body: original.body },
    });
  }
});

test("검색은 공백·대소문자를 무시하고 조작 순서와 관계없이 내 글 조건과 함께 적용한다", async ({
  page,
  request,
}) => {
  const original = await (await request.get("/api/articles/101")).json();
  const articles = await (await request.get("/api/articles")).json();
  const user = await (await request.get("/api/me")).json();
  const other = articles.find((article: { authorId: string }) => article.authorId !== user.id);
  expect(other).toBeDefined();
  const token = `Week3Case-${Date.now()}`;
  try {
    expect((await request.put("/api/articles/101", {
      data: { title: `안내 ${token} 공지`, body: original.body },
    })).status()).toBe(204);
    await page.goto("/board");
    const reads: string[] = [];
    page.on("request", (item) => {
      if (item.method() === "GET" && new URL(item.url()).pathname.startsWith("/api/")) {
        reads.push(item.url());
      }
    });
    const search = page.getByLabel("제목 검색", { exact: true });
    const mine = page.getByLabel("내 글만 보기", { exact: true });
    const rows = page.locator("tbody tr[data-article-id]");
    const query = `  ${token.toUpperCase()}  `;

    await search.fill(query);
    await mine.check();
    await expect(rows).toHaveCount(1);
    await expect(rows).toHaveAttribute("data-article-id", "101");
    await expect(page.getByRole("caption")).toHaveText("검색 결과 1건");

    await mine.uncheck();
    await expect(search).toHaveValue(query);
    await expect(rows).toHaveCount(1);
    await search.fill("");
    await mine.check();
    const ownCount = articles.filter((article: { authorId: string }) => article.authorId === user.id).length;
    await expect(rows).toHaveCount(ownCount);
    await expect(page.getByRole("caption")).toHaveText(`검색 결과 ${ownCount}건`);
    await search.fill(query);
    await expect(rows).toHaveCount(1);
    await expect(rows).toHaveAttribute("data-article-id", "101");
    await expect(page.getByRole("caption")).toHaveText("검색 결과 1건");

    // 내 글 체크 후 검색해도 다른 작성자의 글이 결과에 섞이지 않습니다.
    await search.fill(other.title);
    await expect(page.locator(`tr[data-article-id="${other.id}"]`)).toHaveCount(0);
    await mine.uncheck();
    await expect(page.locator(`tr[data-article-id="${other.id}"]`)).toBeVisible();
    expect(reads).toEqual([]);
  } finally {
    await request.put("/api/articles/101", {
      data: { title: original.title, body: original.body },
    });
  }
});
