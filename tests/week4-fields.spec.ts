import { test, expect } from "@playwright/test";

for (const kind of ["full", "popup"] as const) {
  test(`${kind}: 글자 수가 입력과 함께 갱신되고 포커스·커서 위치를 유지한다`, async ({
    page,
    request,
  }) => {
    const article = await (await request.get("/api/articles/101")).json();
    if (kind === "full") {
      await page.goto("/board/articles/101/edit");
    } else {
      await page.goto("/board");
      await page.locator('tr[data-article-id="101"]')
        .getByRole("button", { name: "빠른 수정", exact: true }).click();
      await expect(page.getByText("게시글을 불러오는 중입니다.")).toBeVisible();
    }

    const title = page.getByLabel("제목", { exact: true });
    const body = page.getByLabel("본문", { exact: true });
    const count = page.getByText(/^본문 \d+자$/);
    await expect(title).toHaveValue(article.title);
    await expect(body).toHaveValue(article.body);
    await expect(count).toHaveText(`본문 ${article.body.length}자`);
    await expect(body).toHaveAttribute("rows", kind === "full" ? "10" : "6");
    await expect(body).toHaveAccessibleDescription(`본문 ${article.body.length}자`);
    if (kind === "popup") {
      await expect(title).toBeFocused();
    } else {
      await expect(title).not.toBeFocused();
    }

    await title.fill("제목만 변경");
    await expect(title).toBeFocused();
    await expect(count).toHaveText(`본문 ${article.body.length}자`);

    // 공백·줄바꿈을 포함하고, 이모지는 문자열 length 기준으로 2를 셉니다.
    await body.fill("가 A\n😀");
    await expect(count).toHaveText("본문 6자");
    await expect(body).toBeFocused();
    await expect(body).toHaveAccessibleDescription("본문 6자");

    // 중간에 입력해도 재렌더링으로 제목에 포커스가 가거나 커서가 끝으로 튀지 않습니다.
    await body.press("Control+Home");
    await body.press("ArrowRight");
    await body.pressSequentially("x");
    await expect(body).toHaveValue("가x A\n😀");
    await expect(count).toHaveText("본문 7자");
    await expect(body).toBeFocused();
    expect(await body.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(2);

    await body.press("Backspace");
    await expect(body).toHaveValue("가 A\n😀");
    await expect(count).toHaveText("본문 6자");
    await expect(body).toBeFocused();
    expect(await body.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(1);

    await body.fill("");
    await expect(count).toHaveText("본문 0자");
    await expect(body).toBeFocused();
    if (kind === "popup") {
      await page.getByRole("button", { name: "취소", exact: true }).click();
    }
  });
}
