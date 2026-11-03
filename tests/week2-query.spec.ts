import { test, expect } from "@playwright/test";

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
