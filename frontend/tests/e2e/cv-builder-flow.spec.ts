import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:8000";

test("Candidate tạo CV Builder, ứng tuyển và Employer xem đúng CV", async ({ page, request }) => {
  const runId = Date.now().toString(36);
  const email = `cv-builder-${runId}@example.com`;
  const employerEmail = `cv-builder-employer-${runId}@example.com`;
  const password = "Test@123456";

  const adminLogin = await request.post(`${API_BASE}/auth/login`, {
    data: { email: "admin@jobportal.com", password: "Admin@123" },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const adminToken = (await adminLogin.json()).access_token;

  const employerRegistration = await request.post(`${API_BASE}/auth/register`, {
    data: { email: employerEmail, password, full_name: "CV Builder Employer", role: "employer", company_name: `CV Builder Corp ${runId}` },
  });
  expect(employerRegistration.ok()).toBeTruthy();
  const employer = await employerRegistration.json();
  const approval = await request.patch(`${API_BASE}/admin/companies/${employer.id}/approve`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(approval.ok()).toBeTruthy();
  const employerLogin = await request.post(`${API_BASE}/auth/login`, { data: { email: employerEmail, password } });
  const employerToken = (await employerLogin.json()).access_token;
  const jobResponse = await request.post(`${API_BASE}/jobs`, {
    headers: { Authorization: `Bearer ${employerToken}` },
    data: {
      title: `Backend CV Builder ${runId}`,
      description: "Tuyển Backend Developer có kinh nghiệm Python và FastAPI cho sản phẩm tuyển dụng.",
      requirements: "Python, FastAPI, PostgreSQL",
      benefits: "Làm việc linh hoạt",
      job_type: "full_time",
      experience_level: "senior",
      location: "Hồ Chí Minh",
    },
  });
  expect(jobResponse.ok()).toBeTruthy();
  const job = await jobResponse.json();

  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("CV Builder Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: /đăng ký tài khoản/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  await page.goto("/cv/new");
  await expect(page.getByText("Chọn mẫu")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Tên bản CV").fill("CV Backend Demo");
  await page.getByLabel("Họ và tên").fill("CV Builder Candidate");
  await page.getByLabel("Tiêu đề nghề nghiệp").fill("Senior Backend Developer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Tóm tắt nghề nghiệp").fill("Backend developer with Python and FastAPI experience.");
  await page.getByLabel("Kỹ năng (cách nhau bằng dấu phẩy)").fill("Python, FastAPI, PostgreSQL");

  for (const name of ["ATS Minimal", "Modern Two Column", "Professional Blue", "Executive", "Creative Clean"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }

  await expect(page.getByText("Đã lưu")).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByLabel("Họ và tên")).toHaveValue("CV Builder Candidate");
  await expect(page.getByText("CV Builder Candidate").last()).toBeVisible();

  await page.getByRole("button", { name: "Xem trước" }).click();
  await page.waitForURL(/\/cv\/\d+\/preview$/);
  await expect(page.getByText("Senior Backend Developer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xuất PDF" })).toBeVisible();

  await page.goto(`/jobs/${job.id}`);
  await page.getByLabel("CV đính kèm").selectOption({ label: "CV Builder: CV Backend Demo" });
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();
  await expect(page.getByText(/Ứng tuyển thành công/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.goto("/login");
  await page.getByPlaceholder("Nhập email").fill(employerEmail);
  await page.getByPlaceholder("Nhập mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/employer/dashboard", { timeout: 15_000 });
  await page.getByRole("heading", { name: job.title, exact: true }).click();
  const applicationRow = page.getByTestId("application-row").filter({ hasText: "CV Builder Candidate" });
  await expect(applicationRow).toBeVisible({ timeout: 15_000 });
  await applicationRow.getByRole("button", { name: "Chọn ứng viên CV Builder Candidate" }).click();
  await page.getByRole("button", { name: "Xem CV" }).click();
  await expect(page.getByRole("dialog", { name: "CV Builder — CV Backend Demo" })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Senior Backend Developer")).toBeVisible();
});
