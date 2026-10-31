import { test, expect, type Page } from "@playwright/test";

type EditorKind = "full" | "popup";

const initial = {
  title: "11월 사내 기술 공유회 안내",
  body: "다음 주 목요일 오후 3시, 대회의실에서 기술 공유회를 진행합니다.",
};

async function openEditor(page: Page, kind: EditorKind) {
  if (kind === "full") {
    await page.goto("/board/articles/101/edit");
    await page.getByLabel("저장 후 이 화면에서 계속 편집").check();
  } else {
    await page.goto("/board");
    await page.getByRole("button", { name: "빠른 수정", exact: true }).first().click();
  }
}

function saveButton(page: Page, kind: EditorKind) {
  return page.getByRole("button", {
    name: kind === "full" ? "저장" : "저장하고 닫기",
    exact: true,
  });
}

test.beforeEach(async ({ request }) => {
  const response = await request.put("/api/articles/101", { data: initial });
  expect(response.status()).toBe(204);
});

for (const kind of ["full", "popup"] as const) {
  test(`${kind}: 즉시 중복 호출은 무시하고, 500 실패 후 같은 입력으로 재시도한다`, async ({ page, request }) => {
    let requests = 0;
    let releaseFirstRequest!: () => void;
    const firstRequestGate = new Promise<void>((resolve) => {
      releaseFirstRequest = resolve;
    });

    await page.route("**/api/articles/101", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      requests++;
      if (requests === 1) {
        await firstRequestGate;
        await route.fulfill({ status: 500, body: "" });
      } else {
        await route.continue();
      }
    });

    try {
      await openEditor(page, kind);
      await page.getByLabel("제목", { exact: true }).fill(`${kind} 저장 검증 제목`);
      await page.getByLabel("본문", { exact: true }).fill("실패 후에도 유지할 본문");
      // 버튼 비활성화와 무관하게 같은 렌더의 저장 함수를 즉시 두 번 실행합니다.
      const firstRequest = page.waitForRequest((item) => item.method() === "PUT");
      await page.evaluate(() => {
        const form = document.querySelector("form")!;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      await firstRequest;
      await expect.poll(() => requests).toBe(1);
      await expect(page.getByLabel("제목", { exact: true })).toBeDisabled();
      await expect(page.getByLabel("본문", { exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "저장 중…" })).toBeVisible();
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);

      releaseFirstRequest();
      await expect(page.getByText("저장하지 못했습니다.", { exact: true })).toBeVisible();
      await expect(page.getByLabel("제목", { exact: true })).toHaveValue(`${kind} 저장 검증 제목`);
      await expect(page.getByLabel("본문", { exact: true })).toHaveValue("실패 후에도 유지할 본문");
      await expect(saveButton(page, kind)).toBeEnabled();
      expect(requests).toBe(1);
      await expect(page).toHaveURL(kind === "full" ? /\/board\/articles\/101\/edit$/ : /\/board$/);
      if (kind === "popup") await expect(page.getByRole("dialog")).toBeVisible();

      await saveButton(page, kind).click();
      if (kind === "full") {
        await expect(page.getByText("저장했습니다.", { exact: true })).toBeVisible();
        await expect(saveButton(page, kind)).toBeEnabled();
        await expect(page).toHaveURL(/\/board\/articles\/101\/edit$/);
      } else {
        await expect(page.getByRole("dialog")).not.toBeVisible();
        await expect(page.getByRole("link", { name: `${kind} 저장 검증 제목`, exact: true })).toBeVisible();
      }
      expect(requests).toBe(2);
      const stored = await (await request.get("/api/articles/101")).json();
      expect(stored).toMatchObject({ title: `${kind} 저장 검증 제목`, body: "실패 후에도 유지할 본문" });
    } finally {
      releaseFirstRequest();
    }
  });

  test(`${kind}: 공백 제목은 요청 없이 안내하고 입력을 유지한다`, async ({ page }) => {
    let requests = 0;
    page.on("request", (request) => {
      if (request.method() === "PUT") requests++;
    });
    await openEditor(page, kind);
    await page.getByLabel("제목", { exact: true }).fill(" ");
    await page.getByLabel("본문", { exact: true }).fill("검증 실패 후 유지할 본문");
    await saveButton(page, kind).click();
    await expect(page.getByText("제목을 입력해 주세요.", { exact: true })).toBeVisible();
    await expect(page.getByLabel("본문", { exact: true })).toHaveValue("검증 실패 후 유지할 본문");
    await expect(saveButton(page, kind)).toBeEnabled();
    if (kind === "popup") await expect(page.getByRole("dialog")).toBeVisible();
    expect(requests).toBe(0);
  });
}

test("네트워크 실패도 팝업과 입력을 유지하고 다시 저장할 수 있다", async ({ page }) => {
  await openEditor(page, "popup");
  await page.getByLabel("제목", { exact: true }).fill("네트워크 실패 후 재시도");
  await page.route("**/api/articles/101", (route) => route.request().method() === "PUT" ? route.abort("failed") : route.continue());
  await saveButton(page, "popup").click();
  await expect(page.getByText("저장하지 못했습니다.", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue("네트워크 실패 후 재시도");
  await expect(saveButton(page, "popup")).toBeEnabled();
  await page.unroute("**/api/articles/101");
  await saveButton(page, "popup").click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("link", { name: "네트워크 실패 후 재시도", exact: true })).toBeVisible();
});

test("닫힌 팝업의 늦은 실패 응답은 새 팝업에 안내를 표시하지 않는다", async ({ page }) => {
  let releaseRequest!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await page.route("**/api/articles/101", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    await gate;
    await route.fulfill({ status: 500, body: "" });
  });

  try {
    await openEditor(page, "popup");
    const requested = page.waitForRequest((request) => request.method() === "PUT");
    await saveButton(page, "popup").click();
    await requested;
    await expect(page.getByRole("button", { name: "저장 중…" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button", { name: "빠른 수정", exact: true }).first().click();
    await page.getByLabel("제목", { exact: true }).fill("새 팝업에서 작성 중");
    const response = page.waitForResponse((item) => item.request().method() === "PUT");
    releaseRequest();
    await response;
    // 늦은 응답 후 토스트가 비동기로 추가되는 경우까지 확인합니다.
    await page.waitForTimeout(250);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("제목", { exact: true })).toHaveValue("새 팝업에서 작성 중");
    await expect(page.locator("dialog [data-sonner-toast]")).toHaveCount(0);
  } finally {
    releaseRequest();
  }
});
