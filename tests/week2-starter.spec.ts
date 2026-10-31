import { test, expect } from "@playwright/test";

// 2주차 시작 상태 확인용입니다. 리팩터링 후에는 입력 유지 검증으로 바꾸세요.
test("2주차 시작 코드: 반복 조회가 편집 중인 본문을 덮어쓴다", async ({ page }) => {
  let reads = 0;
  page.on("request", (request) => {
    if (request.method() === "GET" && request.url().endsWith("/api/articles/101")) reads++;
  });
  await page.goto("/board");
  await page.getByRole("button", { name: "빠른 수정", exact: true }).first().click();
  await expect(page.getByText("게시글을 불러오는 중입니다.")).toBeVisible();
  const body = page.getByLabel("본문", { exact: true });
  await expect(body).toBeVisible();
  const original = await body.inputValue();
  await body.fill("저장하지 않은 실습 입력");
  await expect(body).toHaveValue(original);
  await expect.poll(() => reads).toBeGreaterThanOrEqual(3);
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
