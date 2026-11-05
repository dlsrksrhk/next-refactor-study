import { test, expect, type Request } from "@playwright/test";

test("빠른 수정은 입력 중 재조회하지 않고 작성 중인 본문을 유지한다", async ({ page }) => {
  let reads = 0;
  page.on("request", (request) => {
    if (request.method() === "GET" && request.url().endsWith("/api/articles/101")) reads++;
  });
  await page.goto("/board");
  await page.getByRole("button", { name: "빠른 수정", exact: true }).first().click();
  await expect(page.getByText("게시글을 불러오는 중입니다.")).toBeVisible();
  const body = page.getByLabel("본문", { exact: true });
  await expect(body).toBeVisible();
  const readsAfterLoad = reads;
  await body.fill("저장하지 않은 실습 입력");
  // 기본 조회 지연(1초)보다 오래 기다려 반복 조회와 입력 덮어쓰기를 검증합니다.
  await page.waitForTimeout(1500);
  await expect(body).toHaveValue("저장하지 않은 실습 입력");
  expect(reads).toBe(readsAfterLoad);
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("조회 실패 후 재시도는 로딩을 표시하고 다시 실패하거나 입력 폼을 연다", async ({ page }) => {
  let shouldFail = true;
  let holdResponse = false;
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("**/api/articles/101", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    if (holdResponse) await responseGate;
    if (shouldFail) return route.fulfill({ status: 500, body: "" });
    return route.continue();
  });
  try {
    await page.goto("/board");
    await page.getByRole("button", { name: "빠른 수정", exact: true }).first().click();
    const error = page.getByText("게시글을 불러오지 못했습니다.", { exact: true });
    const loading = page.getByText("게시글을 불러오는 중입니다.", { exact: true });
    await expect(error).toBeVisible();
    holdResponse = true;
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(loading).toBeVisible();
    await expect(error).toHaveCount(0);
    await expect(page.getByLabel("본문", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "다시 시도", exact: true })).toHaveCount(0);
    releaseResponse();
    await expect(error).toBeVisible();
    holdResponse = false;
    shouldFail = false;
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(loading).toBeVisible();
    await expect(page.getByLabel("본문", { exact: true })).toBeVisible();
    await expect(error).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
  } finally {
    releaseResponse();
  }
});

test("조회 중 Esc로 닫으면 요청을 취소하고 다시 열 때 새로 조회한다", async ({ page }) => {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (request.method() === "GET" && request.url().endsWith("/api/articles/101"))
      requests.push(request);
  });
  await page.goto("/board");
  const open = page.getByRole("button", { name: "빠른 수정", exact: true }).first();
  await open.click();
  await expect(page.getByText("게시글을 불러오는 중입니다.")).toBeVisible();
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => requests.every((request) => request.failure() !== null)).toBe(true);
  const cancelledReads = requests.length;
  await open.click();
  await expect(page.getByLabel("본문", { exact: true })).toBeVisible();
  expect(requests.length).toBeGreaterThan(cancelledReads);
  await expect(page.getByText("게시글을 불러오지 못했습니다.")).toHaveCount(0);
});

test("101번의 입력을 취소하고 102번을 열면 해당 글의 서버 내용으로 시작한다", async ({
  page,
  request,
}) => {
  const article = await (await request.get("/api/articles/102")).json();
  await page.goto("/board");
  const buttons = page.getByRole("button", { name: "빠른 수정", exact: true });
  await buttons.first().click();
  await page.getByLabel("본문", { exact: true }).fill("101번에서 저장하지 않은 내용");
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await buttons.nth(1).click();
  await expect(page.getByLabel("본문", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(article.title);
  await expect(page.getByLabel("본문", { exact: true })).toHaveValue(article.body);
});
