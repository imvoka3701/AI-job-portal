/**
 * Phase 1 — E2E Flow Test
 *
 * Mô phỏng luồng nghiệp vụ lõi:
 *   1. Đăng ký Employer  → Đăng tin tuyển dụng
 *   2. Đăng ký Candidate → Ứng tuyển vào tin vừa đăng
 *   3. Kiểm tra Candidate Dashboard hiển thị đơn ứng tuyển
 *   4. Kiểm tra Employer thấy ứng viên đã ứng tuyển
 *
 * Yêu cầu: Backend đang chạy tại http://localhost:8000
 *           Frontend đang chạy tại http://localhost:5173
 */

import { test, expect, type APIRequestContext } from "@playwright/test";

// ─── Test data — unique per run to avoid conflicts ─────────────────────────────
const RUN_ID = Date.now().toString(36);

const EMPLOYER = {
  email: `employer-${RUN_ID}@example.com`,
  password: "Test@123456",
  full_name: "E2E Employer",
  role: "employer" as const,
  company_name: `E2E Corp ${RUN_ID}`,
};

const CANDIDATE = {
  email: `candidate-${RUN_ID}@example.com`,
  password: "Test@123456",
  full_name: "E2E Candidate",
  role: "candidate" as const,
};

const JOB_DATA = {
  title: `Senior React Developer (E2E-${RUN_ID})`,
  description:
    "Vị trí Senior React Developer tại E2E Corp. Yêu cầu kinh nghiệm 3+ năm với React, TypeScript. Mô tả đủ dài để pass validation.",
  requirements: "React, TypeScript, Tailwind CSS, REST API",
  benefits: "Remote, 13th month salary, Health insurance",
  job_type: "full_time",
  experience_level: "senior",
  salary_min: 25_000_000,
  salary_max: 45_000_000,
  location: "Hồ Chí Minh",
};

const API_BASE = "http://localhost:8000";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const ADMIN_CREDENTIALS = {
  email: "admin@jobportal.com",
  password: "Admin@123",
};

/** Get an admin token for approval actions. */
async function getAdminToken(api: APIRequestContext): Promise<string> {
  const loginRes = await api.post(`${API_BASE}/auth/login`, {
    data: ADMIN_CREDENTIALS,
  });
  expect(loginRes.ok(), `Admin login failed: ${loginRes.status()}`).toBeTruthy();
  return (await loginRes.json()).access_token;
}

/** Register a user and return { user, token }.
 *  Employer accounts default to is_active=False — requires admin approval.
 *  Pass adminToken to auto-approve employers before login. */
async function registerUser(
  api: APIRequestContext,
  payload: {
    email: string;
    password: string;
    full_name: string;
    role: "employer" | "candidate";
    company_name?: string;
  },
  adminToken?: string,
) {
  const registerRes = await api.post(`${API_BASE}/auth/register`, {
    data: payload,
  });
  expect(
    registerRes.ok(),
    `Register ${payload.role} failed: ${registerRes.status()} ${await registerRes.text()}`,
  ).toBeTruthy();
  const user = await registerRes.json();

  // Employer accounts need admin approval before they can login
  if (payload.role === "employer" && adminToken) {
    const approveRes = await api.patch(
      `${API_BASE}/admin/companies/${user.id}/approve`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(
      approveRes.ok(),
      `Approve employer failed: ${approveRes.status()} ${await approveRes.text()}`,
    ).toBeTruthy();
  }

  // Login to get token
  const loginRes = await api.post(`${API_BASE}/auth/login`, {
    data: { email: payload.email, password: payload.password },
  });
  expect(
    loginRes.ok(),
    `Login ${payload.role} failed: ${loginRes.status()} ${await loginRes.text()}`,
  ).toBeTruthy();
  const { access_token } = await loginRes.json();

  return { user, token: access_token };
}

// ─── Shared state across ordered test steps ────────────────────────────────────
let employerToken: string;
let employerUserId: number;
let candidateToken: string;
let candidateUserId: number;
let createdJobId: number;
let applicationId: number;

// ─── Test suite ────────────────────────────────────────────────────────────────
test.describe.serial("Phase 1 — Luồng nghiệp vụ lõi E2E", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.1: Đăng ký tài khoản Employer
  // ──────────────────────────────────────────────────────────────────────────
  test("1.1 — Đăng ký tài khoản Employer (có Admin duyệt)", async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const { user, token } = await registerUser(request, EMPLOYER, adminToken);

    expect(user.email).toBe(EMPLOYER.email);
    expect(user.role).toBe("employer");
    expect(user.company_name).toBe(EMPLOYER.company_name);
    expect(token).toBeTruthy();

    employerToken = token;
    employerUserId = user.id;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.2: Employer đăng tin tuyển dụng mới (POST /jobs)
  // ──────────────────────────────────────────────────────────────────────────
  test("1.2 — Employer đăng tin tuyển dụng mới", async ({ request }) => {
    const res = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${employerToken}` },
      data: JOB_DATA,
    });
    expect(
      res.ok(),
      `Create job failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const job = await res.json();
    expect(job.title).toBe(JOB_DATA.title);
    expect(job.employer_id).toBe(employerUserId);
    expect(job.is_active).toBe(true);
    expect(job.id).toBeGreaterThan(0);

    createdJobId = job.id;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.3: Verify — Employer thấy tin đã đăng trong danh sách
  // ──────────────────────────────────────────────────────────────────────────
  test("1.3 — Employer thấy tin đã đăng trong danh sách GET /jobs", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/jobs`, {
      params: { employer_id: employerUserId, page: 1, page_size: 10 },
    });
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.items.length).toBeGreaterThanOrEqual(1);

    const found = data.items.find(
      (j: { id: number }) => j.id === createdJobId,
    );
    expect(found, "Tin tuyển dụng vừa tạo phải có trong danh sách").toBeTruthy();
    expect(found.title).toBe(JOB_DATA.title);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.4: Job Detail Page trả về đủ thông tin (GET /jobs/:id)
  // ──────────────────────────────────────────────────────────────────────────
  test("1.4 — Job Detail trả về đầy đủ thông tin", async ({ request }) => {
    const res = await request.get(`${API_BASE}/jobs/${createdJobId}`);
    expect(res.ok()).toBeTruthy();

    const job = await res.json();
    expect(job.id).toBe(createdJobId);
    expect(job.title).toBe(JOB_DATA.title);
    expect(job.description).toBe(JOB_DATA.description);
    expect(job.requirements).toBe(JOB_DATA.requirements);
    expect(job.benefits).toBe(JOB_DATA.benefits);
    expect(job.job_type).toBe(JOB_DATA.job_type);
    expect(job.experience_level).toBe(JOB_DATA.experience_level);
    expect(job.salary_min).toBe(JOB_DATA.salary_min);
    expect(job.salary_max).toBe(JOB_DATA.salary_max);
    expect(job.location).toBe(JOB_DATA.location);
    // Employer info should be populated
    expect(job.employer).toBeTruthy();
    expect(job.employer.company_name).toBe(EMPLOYER.company_name);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.1: Đăng ký tài khoản Candidate
  // ──────────────────────────────────────────────────────────────────────────
  test("2.1 — Đăng ký tài khoản Candidate", async ({ request }) => {
    const { user, token } = await registerUser(request, CANDIDATE);

    expect(user.email).toBe(CANDIDATE.email);
    expect(user.role).toBe("candidate");
    expect(token).toBeTruthy();

    candidateToken = token;
    candidateUserId = user.id;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.2: Candidate ứng tuyển vào tin (POST /applications)
  // ──────────────────────────────────────────────────────────────────────────
  test("2.2 — Candidate ứng tuyển vào tin tuyển dụng", async ({ request }) => {
    const res = await request.post(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: {
        job_id: createdJobId,
        cover_letter: "Tôi là ứng viên E2E test, rất phù hợp với vị trí này.",
      },
    });
    expect(
      res.ok(),
      `Apply failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const application = await res.json();
    expect(application.job_id).toBe(createdJobId);
    expect(application.candidate_id).toBe(candidateUserId);
    expect(application.status).toBe("pending");
    expect(application.cover_letter).toContain("E2E test");

    applicationId = application.id;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.3: Candidate Dashboard — hiển thị đơn đã ứng tuyển (GET /applications/me)
  // ──────────────────────────────────────────────────────────────────────────
  test("2.3 — Candidate Dashboard hiển thị đơn đã ứng tuyển", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/applications/me`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    expect(res.ok()).toBeTruthy();

    const applications = await res.json();
    expect(applications.length).toBeGreaterThanOrEqual(1);

    const myApp = applications.find(
      (a: { id: number }) => a.id === applicationId,
    );
    expect(
      myApp,
      "Đơn ứng tuyển phải hiển thị trong danh sách của candidate",
    ).toBeTruthy();
    expect(myApp.job_id).toBe(createdJobId);
    expect(myApp.status).toBe("pending");

    // Job info should be populated via relationship
    if (myApp.job) {
      expect(myApp.job.title).toBe(JOB_DATA.title);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.4: Employer thấy ứng viên đã ứng tuyển vào tin của mình
  //           (GET /applications/:id hoặc query by job)
  // ──────────────────────────────────────────────────────────────────────────
  test("2.4 — Employer thấy ứng viên đã ứng tuyển", async ({ request }) => {
    // Verify via application detail
    const res = await request.get(`${API_BASE}/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${employerToken}` },
    });
    expect(
      res.ok(),
      `Get application detail failed: ${res.status()}`,
    ).toBeTruthy();

    const application = await res.json();
    expect(application.id).toBe(applicationId);
    expect(application.candidate_id).toBe(candidateUserId);
    expect(application.job_id).toBe(createdJobId);
    expect(application.status).toBe("pending");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.5: Employer cập nhật trạng thái ứng tuyển → "reviewed"
  // ──────────────────────────────────────────────────────────────────────────
  test("2.5 — Employer cập nhật trạng thái ứng viên sang 'reviewed'", async ({
    request,
  }) => {
    const res = await request.patch(
      `${API_BASE}/applications/${applicationId}`,
      {
        headers: { Authorization: `Bearer ${employerToken}` },
        data: { status: "reviewed" },
      },
    );
    expect(
      res.ok(),
      `Update application status failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const updated = await res.json();
    expect(updated.status).toBe("reviewed");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.6: Candidate thấy trạng thái đã cập nhật trên Dashboard
  // ──────────────────────────────────────────────────────────────────────────
  test("2.6 — Candidate thấy trạng thái cập nhật 'reviewed' trên Dashboard", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/applications/me`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    expect(res.ok()).toBeTruthy();

    const applications = await res.json();
    const myApp = applications.find(
      (a: { id: number }) => a.id === applicationId,
    );
    expect(myApp).toBeTruthy();
    expect(myApp.status).toBe("reviewed");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 3: UI Smoke — Frontend pages render without crashing
  //         (Requires frontend running at localhost:5173)
  // ──────────────────────────────────────────────────────────────────────────
  test("3.1 — [UI] Trang danh sách việc làm render thành công", async ({
    page,
  }) => {
    await page.goto("/jobs");
    // Should show job list (either from API or fallback)
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
  });

  test("3.2 — [UI] Job Detail page render với tin vừa tạo", async ({
    page,
  }) => {
    await page.goto(`/jobs/${createdJobId}`);
    // Wait for the job title to appear
    await expect(page.getByText(JOB_DATA.title)).toBeVisible({
      timeout: 10_000,
    });
    // Verify the Apply button is present
    await expect(
      page.getByRole("button", { name: /ứng tuyển/i }),
    ).toBeVisible();
  });

  test("3.3 — [UI] Login page render thành công", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Chào mừng trở lại")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByPlaceholder("Nhập email của bạn")).toBeVisible();
  });

  test("3.4 — [UI] Register page render thành công", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Tạo tài khoản mới")).toBeVisible({
      timeout: 10_000,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3.5-3.6: Google OAuth smoke tests
  // ──────────────────────────────────────────────────────────────────────────
  test("3.5 — [UI] LoginPage có nút Đăng nhập với Google", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Đăng nhập bằng Google")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("3.6 — [API] GET /auth/google/login redirects đến Google", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/auth/google/login`, {
      maxRedirects: 0,
    });
    // Should be a redirect (307 or 302)
    expect(res.status()).toBe(307);
    const location = res.headers()["location"];
    expect(location).toBeTruthy();
    expect(location).toContain("accounts.google.com");
    expect(location).toContain("client_id=");
  });

  test("3.7 — [API] GET /auth/google/callback với code giả trả lỗi 502", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/auth/google/callback`, {
      params: { code: "fake-code-that-does-not-exist" },
    });
    // Invalid code should fail at token exchange (502 from Google)
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1 — Full UI Flow (mô phỏng thao tác người dùng thật qua giao diện)
//
// Không gọi API trực tiếp — mọi thao tác đều qua page.goto(), page.fill(),
// page.click(), page.getByLabel(), page.getByRole()...
// ═══════════════════════════════════════════════════════════════════════════════
test.describe("Phase 1 — Full UI Flow (thao tác người dùng thật)", () => {
  test("Employer đăng tin → Candidate ứng tuyển → Dashboard (qua UI)", async ({
    browser,
  }) => {
    const UI_RUN = Date.now().toString(36);
    const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

    const EMP = {
      full_name: "UI Employer Test",
      email: `ui-emp-${UI_RUN}@example.com`,
      password: "Test@123456",
      company: `UITestCorp ${UI_RUN}`,
    };

    const CAND = {
      full_name: "UI Candidate Test",
      email: `ui-cand-${UI_RUN}@example.com`,
      password: "Test@123456",
    };

    const JOB = {
      title: `React Developer (UI-${UI_RUN})`,
      description:
        "Chúng tôi cần tuyển React Developer với kinh nghiệm tối thiểu 2 năm làm việc với TypeScript và React framework.",
      location: "Đà Nẵng",
      requirements: "React, TypeScript, Tailwind CSS",
      benefits: "Lương tháng 13, bảo hiểm sức khỏe",
    };

    let jobDetailPath = "";

    // ════════════════════════════════════════════════════════════════════════
    // EMPLOYER SESSION — browser context riêng, có localStorage riêng
    // ════════════════════════════════════════════════════════════════════════
    const empCtx = await browser.newContext({ baseURL: BASE_URL });
    const empPage = await empCtx.newPage();

    // ── UI-1: Employer đăng ký tài khoản (chờ Admin duyệt) ──────────────
    await test.step("UI-1: Employer đăng ký qua form — tài khoản chờ duyệt", async () => {
      await empPage.goto("/register");
      await empPage.getByText("Nhà tuyển dụng", { exact: true }).click();
      await expect(empPage.getByLabel("Tên công ty")).toBeVisible();
      await empPage.getByLabel("Họ và tên").fill(EMP.full_name);
      await empPage.getByLabel("Email").fill(EMP.email);
      await empPage.getByLabel("Mật khẩu").fill(EMP.password);
      await empPage.getByLabel("Tên công ty").fill(EMP.company);
      await empPage.getByRole("button", { name: /đăng ký tài khoản/i }).click();

      // Employer accounts are pending admin approval — success message should appear
      await expect(empPage.getByText(/đang chờ Admin duyệt/i)).toBeVisible({
        timeout: 10_000,
      });
    });

    // ── UI-1b: Admin duyệt tài khoản employer (API) ──────────────────────
    await test.step("UI-1b: Admin duyệt tài khoản employer qua API", async () => {
      // Get admin token
      const adminLoginRes = await empPage.evaluate(
        async (creds) => {
          const res = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(creds),
          });
          return (await res.json()).access_token;
        },
        ADMIN_CREDENTIALS,
      );

      // Find the employer by email and approve
      await empPage.evaluate(
        async ({ email, token }) => {
          const res = await fetch("http://localhost:8000/admin/companies", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const companies = await res.json();
          const emp = companies.find((c: { email: string }) => c.email === email);
          if (emp) {
            await fetch(`http://localhost:8000/admin/companies/${emp.id}/approve`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        },
        { email: EMP.email, token: adminLoginRes },
      );
    });

    // ── UI-1c: Employer đăng nhập sau khi được duyệt ─────────────────────
    await test.step("UI-1c: Employer đăng nhập sau khi Admin duyệt", async () => {
      await empPage.goto("/login");
      await empPage.getByPlaceholder("Nhập email của bạn").fill(EMP.email);
      await empPage.getByPlaceholder("Nhập mật khẩu").fill(EMP.password);
      await empPage.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await empPage.waitForURL("**/employer/dashboard", { timeout: 15_000 });
      await expect(
        empPage.getByRole("heading", {
          name: `Chào mừng trở lại, ${EMP.company}`,
          exact: true,
        }),
      ).toBeVisible({ timeout: 5_000 });
    });

    // ── UI-2: Employer đăng tin tuyển dụng ───────────────────────────────
    await test.step("UI-2: Employer đăng tin tuyển dụng qua form NewJobPage", async () => {
      await empPage.goto("/employer/jobs/new");

      // Tiêu đề & Địa điểm (Input component with label prop → getByLabel)
      await empPage.getByLabel("Tiêu đề công việc").fill(JOB.title);
      await empPage.getByLabel("Địa điểm").fill(JOB.location);

      // Dropdown — select bằng name attribute (không có htmlFor)
      await empPage
        .locator('select[name="experience_level"]')
        .selectOption("senior");
      await empPage
        .locator('select[name="job_type"]')
        .selectOption("full_time");

      // Lương
      await empPage.getByLabel("Lương tối thiểu").fill("25000000");
      await empPage.getByLabel("Lương tối đa").fill("45000000");

      // Yêu cầu & Quyền lợi
      await empPage.getByLabel("Yêu cầu").fill(JOB.requirements);
      await empPage.getByLabel("Quyền lợi").fill(JOB.benefits);

      // Mô tả công việc (textarea, không có htmlFor — dùng name selector)
      await empPage
        .locator('textarea[name="description"]')
        .fill(JOB.description);

      // Bấm nút tạo tin
      await empPage
        .getByRole("button", { name: /tạo tin tuyển dụng/i })
        .click();

      // Chờ chuyển hướng sang trang Job Detail (/jobs/:id)
      await empPage.waitForURL(/\/jobs\/\d+$/, { timeout: 15_000 });

      // Lưu path để Candidate truy cập sau
      jobDetailPath = new URL(empPage.url()).pathname;

      // Xác nhận tiêu đề công việc hiển thị trên trang detail
      await expect(empPage.getByText(JOB.title)).toBeVisible({
        timeout: 5_000,
      });
    });

    // ── UI-2b: Employer thấy tin trong danh sách quản lý ─────────────────
    await test.step("UI-2b: Employer thấy tin trong trang Quản lý tuyển dụng", async () => {
      await empPage.goto("/employer/jobs");

      // Xác nhận trang load
      await expect(empPage.getByRole("heading", {
        name: "Quản lý tuyển dụng",
        exact: true,
      })).toBeVisible({
        timeout: 15_000,
      });

      // Xác nhận tin vừa đăng xuất hiện
      await expect(empPage.getByText(JOB.title)).toBeVisible({
        timeout: 15_000,
      });
    });

    await empCtx.close();

    // ════════════════════════════════════════════════════════════════════════
    // CANDIDATE SESSION — browser context riêng, chưa đăng nhập
    // ════════════════════════════════════════════════════════════════════════
    const candCtx = await browser.newContext({ baseURL: BASE_URL });
    const candPage = await candCtx.newPage();

    // ── UI-3: Candidate đăng ký tài khoản ────────────────────────────────
    await test.step("UI-3: Candidate đăng ký tài khoản qua form", async () => {
      await candPage.goto("/register");

      // "Ứng viên" đã được chọn sẵn mặc định — không cần click

      // Điền form
      await candPage.getByLabel("Họ và tên").fill(CAND.full_name);
      await candPage.getByLabel("Email").fill(CAND.email);
      await candPage.getByLabel("Mật khẩu").fill(CAND.password);

      // Bấm nút đăng ký
      await candPage
        .getByRole("button", { name: /đăng ký tài khoản/i })
        .click();

      // Chờ redirect sang Candidate Dashboard
      await candPage.waitForURL("**/dashboard", { timeout: 15_000 });

      // Xác nhận dashboard hiển thị tên ứng viên
      await expect(candPage.getByText(CAND.full_name)).toBeVisible({
        timeout: 15_000,
      });
    });

    // ── UI-4: Candidate mở Job Detail và bấm nút Ứng tuyển ──────────────
    await test.step("UI-4: Candidate mở Job Detail và bấm nút Ứng tuyển", async () => {
      // Truy cập trang chi tiết tin tuyển dụng do Employer vừa đăng
      await candPage.goto(jobDetailPath);
      await candPage.waitForLoadState("networkidle");

      // Xác nhận tiêu đề tin hiển thị
      await expect(candPage.getByText(JOB.title)).toBeVisible({
        timeout: 15_000,
      });

      // Xác nhận thông tin công ty hiển thị
      await expect(candPage.getByText(EMP.company)).toBeVisible({
        timeout: 15_000,
      });

      // Bấm nút "Ứng tuyển ngay"
      await candPage
        .getByRole("button", { name: /ứng tuyển ngay/i })
        .click();

      // Chờ thông báo thành công xuất hiện trên UI
      await expect(
        candPage.getByText(/ứng tuyển thành công/i),
      ).toBeVisible({ timeout: 15_000 });
    });

    // ── UI-5: Candidate Dashboard hiển thị đơn đã ứng tuyển ─────────────
    await test.step("UI-5: Candidate Dashboard hiển thị đơn ứng tuyển qua UI", async () => {
      // Quay về Dashboard
      await candPage.goto("/dashboard");

      // Xác nhận Dashboard load thành công
      await expect(candPage.getByText("Dashboard ứng viên")).toBeVisible({
        timeout: 15_000,
      });

      // Xác nhận đúng hàng ứng tuyển đã tải xong trong bảng lịch sử.
      // Không dùng `.animate-pulse`: Dashboard có chấm trạng thái pulse liên tục.
      const applicationRow = candPage
        .getByRole("table")
        .getByRole("row")
        .filter({ has: candPage.getByRole("link", { name: JOB.title }) });

      await expect(applicationRow).toBeVisible({ timeout: 15_000 });
      await expect(applicationRow.getByText(/pending/i)).toBeVisible();
    });

    await candCtx.close();
  });
});
