import { expect, test } from "@playwright/test";

test("Candidate dùng AI theo từng section và duyệt trước khi chèn", async ({ page }) => {
  const runId = Date.now().toString(36);
  const email = `cv-ai-ui-${runId}@example.com`;
  const password = "Test@123456";

  await page.route("**/api/ai/cv/suggest-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ suggestion: "Backend Developer tập trung vào API ổn định và hiệu năng.", rationale: "Bám sát vị trí mục tiêu." }),
    });
  });
  await page.route("**/api/ai/cv/suggest-skills", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ skills: ["Python", "FastAPI", "PostgreSQL", "Docker"], rationale: "Nhóm kỹ năng backend cốt lõi." }),
    });
  });
  await page.route("**/api/ai/cv/rewrite-experience", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ bullets: ["Xây dựng REST API bằng FastAPI và PostgreSQL.", "Chuẩn hóa quy trình triển khai với Docker."], rationale: "Dùng động từ mạnh và nội dung có thể kiểm chứng." }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("CV AI Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: /đăng ký tài khoản/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  await page.goto("/cv/new");
  await expect(page.getByText("Chọn mẫu")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Tiêu đề nghề nghiệp").fill("Senior Backend Developer");

  await page.getByRole("button", { name: "Gợi ý AI", exact: true }).click();
  const summaryDraft = page.getByText("Backend Developer tập trung vào API ổn định và hiệu năng.");
  await expect(summaryDraft).toBeVisible();
  await summaryDraft.locator("..", { hasText: "Bản nháp từ AI" }).getByRole("button", { name: "Chèn vào CV" }).click();
  await expect(page.getByLabel("Tóm tắt nghề nghiệp")).toHaveValue("Backend Developer tập trung vào API ổn định và hiệu năng.");

  await page.getByRole("button", { name: "Gợi ý kỹ năng bằng AI" }).click();
  await expect(page.getByText("Python, FastAPI, PostgreSQL, Docker")).toBeVisible();
  await page.getByText("Python, FastAPI, PostgreSQL, Docker").locator("..").getByRole("button", { name: "Bỏ qua" }).click();
  await expect(page.getByLabel("Kỹ năng (cách nhau bằng dấu phẩy)")).toHaveValue("");

  await page.getByRole("button", { name: "Thêm", exact: true }).first().click();
  await page.getByLabel("Vị trí").fill("Backend Developer");
  await page.getByLabel("Công ty").fill("Product Company");
  await page.getByLabel("Thành tựu (mỗi dòng một bullet)").fill("Xây dựng API FastAPI");
  await page.getByRole("button", { name: "Viết lại bằng AI" }).click();
  const experienceDraft = page.getByText("Xây dựng REST API bằng FastAPI và PostgreSQL.");
  await expect(experienceDraft).toBeVisible();
  await experienceDraft.locator("..").getByRole("button", { name: "Chèn vào CV" }).click();
  await expect(page.getByLabel("Thành tựu (mỗi dòng một bullet)")).toHaveValue(
    "Xây dựng REST API bằng FastAPI và PostgreSQL.\nChuẩn hóa quy trình triển khai với Docker.",
  );
});
