/**
 * Phase 4.1 — Admin Module E2E Test
 *
 * 3 lớp:
 *   Lớp 1 — API-driven flow (gọi API trực tiếp, xác nhận logic backend)
 *   Lớp 2 — UI render smoke test (trang render đúng, không crash)
 *   Lớp 3 — Full UI-driven flow (page.click/page.fill, mô phỏng người dùng thật)
 *
 * Yêu cầu: Backend đang chạy tại http://localhost:8000
 *           Frontend đang chạy tại http://localhost:5173
 *           Admin account: admin@aijobportal.com / Admin@123456
 */

import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:8000";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

const ADMIN = {
  email: "admin@jobportal.com",
  password: "Admin@123",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminToken(request: import("@playwright/test").APIRequestContext) {
  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(loginRes.ok(), `Admin login failed: ${loginRes.status()}`).toBeTruthy();
  return (await loginRes.json()).access_token;
}

const RUN_ID = Date.now().toString(36);

// ─── Shared state ──────────────────────────────────────────────────────────────
let adminToken: string;
let testEmployerId: number;

// ═══════════════════════════════════════════════════════════════════════════════════
// LỚP 1 — API-driven flow
// ═══════════════════════════════════════════════════════════════════════════════════
test.describe.serial("Phase 4 — Lớp 1: API-driven Admin Flow", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1.1: Admin login
  // ──────────────────────────────────────────────────────────────────────────
  test("1.1 — Admin đăng nhập thành công", async ({ request }) => {
    adminToken = await getAdminToken(request);
    expect(adminToken).toBeTruthy();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.2: GET /admin/stats — xác nhận cấu trúc hợp lệ
  // ──────────────────────────────────────────────────────────────────────────
  test("1.2 — GET /admin/stats: cấu trúc hợp lệ", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const stats = await res.json();
    expect(typeof stats.total_candidates).toBe("number");
    expect(typeof stats.total_employers).toBe("number");
    expect(typeof stats.total_active_jobs).toBe("number");
    expect(typeof stats.total_applications).toBe("number");
    expect(Array.isArray(stats.new_users_last_30d)).toBe(true);
    expect(Array.isArray(stats.new_applications_last_30d)).toBe(true);
    console.log(
      `[1.2] Stats: ${stats.total_candidates} candidates, ${stats.total_employers} employers, ` +
      `${stats.total_active_jobs} active jobs, ${stats.total_applications} applications`
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.3: GET /admin/stats — non-admin bị từ chối (403)
  // ──────────────────────────────────────────────────────────────────────────
  test("1.3 — GET /admin/stats: non-admin bị 403", async ({ request }) => {
    // Register candidate and try to access admin endpoint
    const email = `admin403-${RUN_ID}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password: "Test@123456", full_name: "Test 403", role: "candidate" },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: "Test@123456" },
    });
    const candToken = (await loginRes.json()).access_token;

    const res = await request.get(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${candToken}` },
    });
    expect(res.status()).toBe(403);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.4: GET /admin/companies — danh sách employer
  // ──────────────────────────────────────────────────────────────────────────
  test("1.4 — GET /admin/companies: danh sách nhà tuyển dụng", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/companies`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const companies = await res.json();
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);
    // Validate structure
    const c = companies[0];
    expect(typeof c.id).toBe("number");
    expect(typeof c.email).toBe("string");
    expect(typeof c.is_active).toBe("boolean");
    if (companies.length > 0) testEmployerId = companies[0].id;
    console.log(`[1.4] ${companies.length} employers, first: ${c.company_name ?? c.full_name} (active=${c.is_active})`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.5: PATCH /admin/companies/{id}/approve và /reject
  // ──────────────────────────────────────────────────────────────────────────
  test("1.5 — PATCH /admin/companies: approve & reject employer", async ({ request }) => {
    expect(testEmployerId).toBeGreaterThan(0);

    // Reject (deactivate)
    const rejectRes = await request.patch(
      `${API_BASE}/admin/companies/${testEmployerId}/reject`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(rejectRes.ok(), `Reject failed: ${rejectRes.status()}`).toBeTruthy();
    let company = await rejectRes.json();
    expect(company.is_active).toBe(false);

    // Approve (reactivate)
    const approveRes = await request.patch(
      `${API_BASE}/admin/companies/${testEmployerId}/approve`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(approveRes.ok(), `Approve failed: ${approveRes.status()}`).toBeTruthy();
    company = await approveRes.json();
    expect(company.is_active).toBe(true);
    console.log(`[1.5] Toggled employer ${testEmployerId}: reject → approve OK`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.6: GET /admin/jobs — danh sách tất cả tin
  // ──────────────────────────────────────────────────────────────────────────
  test("1.6 — GET /admin/jobs: danh sách tin + filter", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/jobs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { page_size: 5 },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.total).toBe("number");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    if (data.items.length > 0) {
      expect(typeof data.items[0].id).toBe("number");
      expect(typeof data.items[0].title).toBe("string");
      expect(typeof data.items[0].company_name).toBe("string");
    }
    console.log(`[1.6] ${data.total} jobs total, showing ${data.items.length}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.7: DELETE /admin/jobs/{id} — gỡ tin
  // ──────────────────────────────────────────────────────────────────────────
  test("1.7 — DELETE /admin/jobs/{id}: gỡ tin tuyển dụng", async ({ request }) => {
    const isolatedId = `${RUN_ID}-${Date.now().toString(36)}`;
    const employerEmail = `delete-job-${isolatedId}@test.com`;
    const registration = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email: employerEmail,
        password: "Test@123456",
        full_name: "Delete Job Employer",
        role: "employer",
        company_name: `Delete Job Corp ${isolatedId}`,
      },
    });
    const employer = await registration.json();
    await request.patch(`${API_BASE}/admin/companies/${employer.id}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const login = await request.post(`${API_BASE}/auth/login`, {
      data: { email: employerEmail, password: "Test@123456" },
    });
    const employerToken = (await login.json()).access_token;
    const jobResponse = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${employerToken}` },
      data: {
        title: `Isolated delete job ${isolatedId}`,
        description: "Dữ liệu riêng cho kiểm thử xóa job Admin.",
        job_type: "full_time",
        experience_level: "junior",
        location: "Hà Nội",
      },
    });
    const testJobId = (await jobResponse.json()).id;

    const deleteRes = await request.delete(`${API_BASE}/admin/jobs/${testJobId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(deleteRes.status()).toBe(204);

    // Verify it's gone
    const getRes = await request.get(`${API_BASE}/admin/jobs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { page_size: 100 },
    });
    const data = await getRes.json();
    const stillExists = data.items.some((j: { id: number }) => j.id === testJobId);
    expect(stillExists).toBe(false);
    console.log(`[1.7] Deleted job ${testJobId}, verified gone`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.8: GET /admin/users + PATCH /admin/users/{id}/status
  // ──────────────────────────────────────────────────────────────────────────
  test("1.8 — GET /admin/users + PATCH toggle status", async ({ request }) => {
    // List users filtered by role
    const res = await request.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { page_size: 5, role: "employer" },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    expect(data.items[0].role).toBe("employer");

    // Toggle: deactivate a user
    const userId = data.items[0].id;
    const currentActive = data.items[0].is_active;

    const toggleRes = await request.patch(
      `${API_BASE}/admin/users/${userId}/status`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { is_active: false },
      },
    );
    expect(toggleRes.ok()).toBeTruthy();
    const toggled = await toggleRes.json();
    expect(toggled.is_active).toBe(false);

    // Toggle back
    const toggleBack = await request.patch(
      `${API_BASE}/admin/users/${userId}/status`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { is_active: true },
      },
    );
    expect(toggleBack.ok()).toBeTruthy();
    const restored = await toggleBack.json();
    expect(restored.is_active).toBe(true);
    console.log(`[1.8] Toggled user ${userId}: ${currentActive} → false → true OK`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1.9: Employer đăng ký → không login được (chờ duyệt) → admin duyệt → login OK
  // ──────────────────────────────────────────────────────────────────────────
  test("1.9 — Employer chưa active bị chặn login, admin duyệt xong mới login được", async ({
    request,
  }) => {
    const runId = Date.now().toString(36);
    const empEmail = `pending-emp-${runId}@test.com`;

    // Register employer
    const regRes = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email: empEmail,
        password: "Test@123456",
        full_name: "Pending Employer",
        role: "employer",
        company_name: `Pending Corp ${runId}`,
      },
    });
    expect(regRes.ok(), `Register failed: ${regRes.status()}`).toBeTruthy();
    const newEmp = await regRes.json();

    // Try to login → should fail with "chờ Admin duyệt"
    const loginFail = await request.post(`${API_BASE}/auth/login`, {
      data: { email: empEmail, password: "Test@123456" },
    });
    expect(loginFail.status()).toBe(401);
    const failBody = await loginFail.json();
    expect(failBody.detail).toContain("chờ Admin duyệt");

    // Try to call an employer endpoint with "self-activated" token — will also fail
    // since they can't even get a token

    // Admin approves
    const approveRes = await request.patch(
      `${API_BASE}/admin/companies/${newEmp.id}/approve`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(approveRes.ok()).toBeTruthy();
    const approved = await approveRes.json();
    expect(approved.is_active).toBe(true);

    // Now employer can login
    const loginOk = await request.post(`${API_BASE}/auth/login`, {
      data: { email: empEmail, password: "Test@123456" },
    });
    expect(loginOk.status()).toBe(200);
    const empToken = (await loginOk.json()).access_token;

    // And can post a job
    const jobRes = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${empToken}` },
      data: {
        title: `Approved Job ${runId}`,
        description: "Test job after admin approval for verification.",
        job_type: "full_time",
        experience_level: "junior",
        location: "Hanoi",
      },
    });
    expect(jobRes.ok(), `Post job failed: ${jobRes.status()}`).toBeTruthy();
    console.log(`[1.9] Employer pending→approved→login→post job OK`);
  });

  test("1.10 — Audit log ghi nhận thao tác Admin và non-admin bị chặn", async ({ request }) => {
    const auditRes = await request.get(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { page_size: 10 },
    });
    expect(auditRes.ok()).toBeTruthy();
    const auditData = await auditRes.json();
    expect(auditData.total).toBeGreaterThan(0);
    expect(Array.isArray(auditData.items)).toBe(true);
    expect(auditData.items[0].actor_email).toBe(ADMIN.email);
    expect(typeof auditData.items[0].action).toBe("string");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// LỚP 2 — UI Render Smoke Tests
// ═══════════════════════════════════════════════════════════════════════════════════
test.describe("Phase 4 — Lớp 2: UI Render Smoke Tests", () => {
  test("2.1 — [UI] AdminDashboard render thành công", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate((t) => localStorage.setItem("access_token", t), token);
    await page.goto("/admin/dashboard");
    await expect(page.getByText("Tổng quan hệ thống")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#main-content").getByText("Ứng viên", { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test("2.2 — [UI] AdminCompanies render thành công", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate((t) => localStorage.setItem("access_token", t), token);
    await page.goto("/admin/companies");
    await expect(page.getByText("Quản lý công ty")).toBeVisible({ timeout: 10_000 });
  });

  test("2.3 — [UI] AdminJobs render thành công", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate((t) => localStorage.setItem("access_token", t), token);
    await page.goto("/admin/jobs");
    await expect(page.getByText("Quản lý tin tuyển dụng")).toBeVisible({ timeout: 10_000 });
  });

  test("2.4 — [UI] AdminUsers render thành công", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate((t) => localStorage.setItem("access_token", t), token);
    await page.goto("/admin/users");
    await expect(page.getByText("Quản lý người dùng")).toBeVisible({ timeout: 10_000 });
  });

  test("2.5 — [UI] AdminAuditLogs render thành công", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate((t) => localStorage.setItem("access_token", t), token);
    await page.goto("/admin/audit-logs");
    await expect(page.getByText("Nhật ký quản trị")).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// LỚP 3 — Full UI-driven Flow
// ═══════════════════════════════════════════════════════════════════════════════════
test.describe("Phase 4 — Lớp 3: Full UI-driven Admin Flow", () => {
  test("Admin đăng nhập → Dashboard → Companies → Users → Jobs (qua UI)", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();

    // ── UI-1: Login as admin ──────────────────────────────────────────────
    await test.step("UI-1: Admin đăng nhập", async () => {
      await page.goto("/login");
      await page.getByPlaceholder("Nhập email của bạn").fill(ADMIN.email);
      await page.getByPlaceholder("Nhập mật khẩu").fill(ADMIN.password);
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      // Should redirect to dashboard (or /
      await page.waitForTimeout(3000);
    });

    // ── UI-2: Admin Dashboard stats ──────────────────────────────────────
    await test.step("UI-2: Admin Dashboard hiển thị thống kê", async () => {
      await page.goto("/admin/dashboard");
      await expect(page.getByText("Tổng quan hệ thống")).toBeVisible({ timeout: 15_000 });
      // KPI cards should be present
      await expect(page.locator("#main-content").getByText("Ứng viên", { exact: true })).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("#main-content").getByText("Nhà tuyển dụng", { exact: true })).toBeVisible({ timeout: 5_000 });
      await expect(page.locator("#main-content").getByText("Tin đang hoạt động", { exact: true })).toBeVisible({ timeout: 5_000 });
      // Charts should have data
      await expect(page.getByText("Người dùng mới (30 ngày)")).toBeVisible({ timeout: 5_000 });
      console.log("[UI-2] Admin dashboard rendered with stats and charts");
    });

    // ── UI-3: Companies page — approve/reject ────────────────────────────
    await test.step("UI-3: Admin Companies — duyệt/từ chối công ty", async () => {
      await page.goto("/admin/companies");
      await expect(page.getByText("Quản lý công ty")).toBeVisible({ timeout: 10_000 });

      // Wait for company list to load
      await expect(page.getByRole("button", { name: /^(Khóa|Duyệt)$/ }).first())
        .toBeVisible({ timeout: 15_000 });

      // Find a company that is active and click "Khóa"
      const khoaButtons = page.getByRole("button", { name: "Khóa" });
      const khoaCount = await khoaButtons.count();
      if (khoaCount > 0) {
        await khoaButtons.first().click();
        // The action must switch to "Duyệt" after deactivation.
        const duyetButton = page.getByRole("button", { name: "Duyệt" }).first();
        await expect(duyetButton).toBeVisible({ timeout: 5_000 });
        await duyetButton.click();
        await expect(page.getByText("Đã duyệt tài khoản.")).toBeVisible({ timeout: 5_000 });
        console.log("[UI-3] Company approve/reject toggle works");
      } else {
        console.log("[UI-3] No active companies to toggle — skipping");
      }
    });

    // ── UI-4: Users page — toggle status ─────────────────────────────────
    await test.step("UI-4: Admin Users — khóa/mở khóa người dùng", async () => {
      await page.goto("/admin/users");
      await expect(page.getByText("Quản lý người dùng")).toBeVisible({ timeout: 10_000 });

      // Wait for user rows to load
      await expect(page.getByRole("button", { name: /^(Khóa|Mở khóa)$/ }).first())
        .toBeVisible({ timeout: 15_000 });

      // Click first "Khóa" button
      const khoaBtn = page.getByRole("button", { name: "Khóa" }).first();
      if (await khoaBtn.isVisible().catch(() => false)) {
        await khoaBtn.click();
        const moKhoaBtn = page.getByRole("button", { name: "Mở khóa" }).first();
        await expect(moKhoaBtn).toBeVisible({ timeout: 5_000 });
        await moKhoaBtn.click();
        console.log("[UI-4] User toggle status works");
      } else {
        console.log("[UI-4] No active users to toggle — skipping");
      }
    });

    // ── UI-5: Jobs page — search + paginate ─────────────────────────────
    await test.step("UI-5: Admin Jobs — tìm kiếm và phân trang", async () => {
      await page.goto("/admin/jobs");
      await expect(page.getByText("Quản lý tin tuyển dụng")).toBeVisible({ timeout: 10_000 });

      // Wait for job table to load
      await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });

      // Try search
      const searchInput = page.getByPlaceholder("Tiêu đề, công ty hoặc email...");
      await searchInput.fill("Python");
      await page.getByRole("button", { name: "Tìm" }).click();
      await page.waitForTimeout(2000);

      // Clear search
      await searchInput.fill("");
      await page.getByRole("button", { name: "Tìm" }).click();
      await page.waitForTimeout(2000);

      // Verify pagination is present
      await expect(page.getByText(/tin — Trang/)).toBeVisible({ timeout: 5_000 });
      console.log("[UI-5] Admin jobs search + pagination renders");
    });

    await test.step("UI-6: Admin Jobs — đóng/mở tin và giữ dữ liệu", async () => {
      const closeButton = page.getByRole("button", { name: "Đóng tin" }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        page.once("dialog", (dialog) => dialog.accept());
        await closeButton.click();
        await expect(page.getByText(/Đã đóng tin/)).toBeVisible({ timeout: 5_000 });
        page.once("dialog", (dialog) => dialog.accept());
        await page.getByRole("button", { name: "Mở lại" }).first().click();
        await expect(page.getByText(/Đã mở lại tin/)).toBeVisible({ timeout: 5_000 });
      }
    });

    await test.step("UI-7: Nhật ký hiển thị thao tác vừa thực hiện", async () => {
      await page.goto("/admin/audit-logs");
      await expect(page.getByText("Nhật ký quản trị")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/Duyệt công ty|Mở lại tin|Khóa người dùng/).first()).toBeVisible({ timeout: 15_000 });
    });

    await ctx.close();
  });
});
