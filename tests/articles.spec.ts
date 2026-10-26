import { test, expect } from "@playwright/test";

const initial = {
  title: "11월 사내 기술 공유회 안내",
  body: "다음 주 목요일 오후 3시, 대회의실에서 기술 공유회를 진행합니다.",
};

test.beforeEach(async ({ request }) => {
  await request.put("/api/articles/101", { data: initial });
});

test("API는 게시글 목록과 작성자 정보를 제공하고 내 글만 수정한다", async ({ request }) => {
  const list = await request.get("/api/articles");
  expect(list.status()).toBe(200);
  expect(await list.json()).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: "101", authorName: "김동현" }),
    expect.objectContaining({ id: "102", authorName: "박지민" }),
    expect.objectContaining({ id: "103", authorName: "이서연" }),
  ]));
  expect((await request.put("/api/articles/102", { data: initial })).status()).toBe(403);
  expect((await request.put("/api/articles/101", { data: { title: " ", body: "본문" } })).status()).toBe(400);
  expect((await request.get("/api/articles/missing")).status()).toBe(404);
  const saved = await request.put("/api/articles/101", { data: { title: "변경된 제목", body: "변경된 장소" } });
  expect(saved.status()).toBe(204);
  expect(await saved.text()).toBe("");
  const article = await (await request.get("/api/articles/101")).json();
  expect(article).toMatchObject({ id: "101", title: "변경된 제목", body: "변경된 장소", authorName: "김동현" });
  expect(Number.isNaN(Date.parse(article.updatedAt))).toBe(false);
});

test("목록에는 내 글만 빠른 수정이 보이고 타인의 상세에서는 수정할 수 없다", async ({ page }) => {
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "사내 전체 게시판" })).toBeVisible();
  await expect(page.getByRole("button", { name: "빠른 수정", exact: true })).toHaveCount(1);
  const other = page.getByRole("row").filter({ hasText: "사무실 네트워크 점검 안내" });
  await expect(other.getByRole("button")).toHaveCount(0);
  await other.getByRole("link").click();
  await expect(page).toHaveURL(/\/board\/articles\/102$/);
  await expect(page.getByRole("link", { name: "수정", exact: true })).toHaveCount(0);
  await page.goto("/board/articles/102/edit");
  await expect(page.getByText("자신이 작성한 게시글만 수정할 수 있습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "저장", exact: true })).toHaveCount(0);
});

test("전체 편집은 기본적으로 저장 후 게시판 상세로 이동한다", async ({ page }) => {
  await page.goto("/board/articles/101/edit");
  await expect(page.getByLabel("저장 후 이 화면에서 계속 편집")).not.toBeChecked();
  await page.getByLabel("제목", { exact: true }).fill("기술 공유회 장소 변경");
  await page.getByLabel("본문", { exact: true }).fill("장소가 소회의실로 변경되었습니다.");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page).toHaveURL(/\/board\/articles\/101$/);
  await expect(page.getByRole("heading", { name: "기술 공유회 장소 변경" })).toBeVisible();
  await expect(page.getByRole("article")).toContainText("소회의실");
  await page.reload();
  await expect(page.getByRole("heading", { name: "기술 공유회 장소 변경" })).toBeVisible();
  await expect(page.getByRole("article")).toContainText("소회의실");
});

test("계속 편집을 선택하면 화면에 머무르며 실제 게시글을 수정한다", async ({ page, request }) => {
  await page.goto("/board/articles/101/edit");
  await page.getByLabel("저장 후 이 화면에서 계속 편집").check();
  await page.getByLabel("제목", { exact: true }).fill("계속 편집한 제목");
  const saved = page.waitForResponse((response) => response.request().method() === "PUT");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "저장", exact: true }).click();
  expect((await saved).status()).toBe(204);
  await expect(page).toHaveURL(/\/board\/articles\/101\/edit$/);
  await expect(page.getByRole("button", { name: "저장", exact: true })).toBeEnabled();
  expect((await (await request.get("/api/articles/101")).json()).title).toBe("계속 편집한 제목");
});

test("빠른 수정은 URL을 유지하며 저장 후 목록을 갱신하고 취소한 입력을 버린다", async ({ page }) => {
  await page.goto("/board");
  await page.getByRole("button", { name: "빠른 수정", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "게시글 빠른 수정" })).toBeVisible();
  await page.getByLabel("제목", { exact: true }).fill("취소할 제목");
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await page.getByRole("button", { name: "빠른 수정", exact: true }).click();
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(initial.title);
  await page.getByLabel("제목", { exact: true }).fill("빠르게 수정한 제목");
  await page.getByRole("button", { name: "저장하고 닫기" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/\/board$/);
  await expect(page.getByRole("link", { name: "빠르게 수정한 제목", exact: true })).toBeVisible();
});
