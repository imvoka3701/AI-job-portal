import { expect, test, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:8000";
const runId = Date.now();
const password = "Test@123456";
const owner = {
  email: `rbac-owner-${runId}@test.com`,
  full_name: "RBAC Owner",
  company_name: `RBAC Company ${runId}`,
};
const head = {
  email: `rbac-head-${runId}@test.com`,
  full_name: "RBAC Department Head",
};
const candidate = {
  email: `rbac-candidate-${runId}@test.com`,
  full_name: "RBAC Candidate",
};

async function login(request: APIRequestContext, email: string, userPassword = password) {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password: userPassword },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).access_token as string;
}

test.describe.serial("Employer internal RBAC", () => {
  let ownerToken = "";
  let headToken = "";
  let candidateToken = "";
  let departmentId = 0;
  let jobId = 0;
  let applicationId = 0;
  let recruitmentRequestId = 0;

  test("owner bootstraps company, department, and invitation", async ({ request }) => {
    const adminToken = await login(request, "admin@jobportal.com", "Admin@123");
    const registration = await request.post(`${API_BASE}/auth/register`, {
      data: { ...owner, password, role: "employer" },
    });
    expect(registration.status()).toBe(201);
    const ownerUser = await registration.json();

    const approval = await request.patch(
      `${API_BASE}/admin/companies/${ownerUser.id}/approve`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(approval.ok(), await approval.text()).toBeTruthy();
    ownerToken = await login(request, owner.email);

    const context = await request.get(`${API_BASE}/employer/company-context`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(context.ok()).toBeTruthy();
    const contextData = await context.json();
    expect(contextData.membership.is_owner).toBe(true);
    expect(contextData.permissions).toContain("team:manage");

    const department = await request.post(`${API_BASE}/employer/departments`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { name: "Engineering", description: "Engineering department" },
    });
    expect(department.status()).toBe(201);
    departmentId = (await department.json()).id;

    const invitation = await request.post(`${API_BASE}/employer/team/invitations`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        email: head.email,
        member_role: "department_head",
        department_id: departmentId,
      },
    });
    expect(invitation.status()).toBe(201);
    const invitationData = await invitation.json();
    expect(invitationData.delivery_status).toBe("not_configured");
    const inviteToken = invitationData.invite_token;

    const acceptance = await request.post(
      `${API_BASE}/employer/invitations/${inviteToken}/accept`,
      { data: { full_name: head.full_name, password } },
    );
    expect(acceptance.ok(), await acceptance.text()).toBeTruthy();
    headToken = await login(request, head.email);
  });

  test("department head is scoped and cannot perform HR operations", async ({ request }) => {
    const job = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        title: `RBAC Backend Engineer ${runId}`,
        description: "Build reliable recruitment services with Python and PostgreSQL.",
        requirements: "Python, FastAPI, PostgreSQL",
        department_id: departmentId,
      },
    });
    expect(job.status()).toBe(201);
    jobId = (await job.json()).id;

    const context = await request.get(`${API_BASE}/employer/company-context`, {
      headers: { Authorization: `Bearer ${headToken}` },
    });
    const contextData = await context.json();
    expect(contextData.membership.member_role).toBe("department_head");
    expect(contextData.membership.department_id).toBe(departmentId);
    expect(contextData.permissions).toContain("candidate:recommend");
    expect(contextData.permissions).not.toContain("job:manage");
    expect(contextData.permissions).not.toContain("team:manage");

    const scopedJobs = await request.get(`${API_BASE}/employer/team/jobs`, {
      headers: { Authorization: `Bearer ${headToken}` },
    });
    expect(scopedJobs.ok()).toBeTruthy();
    expect((await scopedJobs.json()).map((item: { id: number }) => item.id)).toContain(jobId);

    const forbiddenJob = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${headToken}` },
      data: { title: "Forbidden Job", description: "This operation must be denied." },
    });
    expect(forbiddenJob.status()).toBe(403);

    const candidateRegistration = await request.post(`${API_BASE}/auth/register`, {
      data: { ...candidate, password, role: "candidate" },
    });
    expect(candidateRegistration.status()).toBe(201);
    candidateToken = await login(request, candidate.email);
    const application = await request.post(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { job_id: jobId },
    });
    expect(application.status()).toBe(201);
    applicationId = (await application.json()).id;

    const recommendation = await request.put(
      `${API_BASE}/applications/${applicationId}/recommendation`,
      {
        headers: { Authorization: `Bearer ${headToken}` },
        data: { recommendation: "recommended", note: "Meets technical criteria." },
      },
    );
    expect(recommendation.ok(), await recommendation.text()).toBeTruthy();
    expect((await recommendation.json()).hiring_recommendation).toBe("recommended");

    const forbiddenDecision = await request.patch(`${API_BASE}/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${headToken}` },
      data: { status: "accepted" },
    });
    expect(forbiddenDecision.status()).toBe(403);

    const finalDecision = await request.patch(`${API_BASE}/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { status: "accepted", decision_reason: "HR approved after human review." },
    });
    expect(finalDecision.ok(), await finalDecision.text()).toBeTruthy();
    const decisionData = await finalDecision.json();
    expect(decisionData.decision_by_id).toBeTruthy();
    expect(decisionData.decision_reason).toBe("HR approved after human review.");
  });

  test("department head submits a recruitment request and HR converts it once", async ({ request }) => {
    const created = await request.post(`${API_BASE}/employer/recruitment-requests`, {
      headers: { Authorization: `Bearer ${headToken}` },
      data: {
        title: `Platform Engineer ${runId}`,
        headcount: 2,
        job_type: "full_time",
        priority: "high",
        reason: "The engineering team needs more capacity for the recruitment platform.",
        responsibilities: "Design and operate reliable backend services for the recruitment workflow.",
        requirements: "Strong Python, FastAPI, PostgreSQL, testing, and system design experience.",
        submit: true,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const createdData = await created.json();
    recruitmentRequestId = createdData.id;
    expect(createdData.status).toBe("submitted");
    expect(createdData.department_id).toBe(departmentId);

    const forbiddenReview = await request.post(
      `${API_BASE}/employer/recruitment-requests/${recruitmentRequestId}/review`,
      {
        headers: { Authorization: `Bearer ${headToken}` },
        data: { decision: "approved", note: "Self-approval must be denied." },
      },
    );
    expect(forbiddenReview.status()).toBe(403);

    const approved = await request.post(
      `${API_BASE}/employer/recruitment-requests/${recruitmentRequestId}/review`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
        data: { decision: "approved", note: "Budget and headcount confirmed by HR." },
      },
    );
    expect(approved.ok(), await approved.text()).toBeTruthy();
    expect((await approved.json()).status).toBe("approved");

    const converted = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        title: `Platform Engineer ${runId}`,
        description: "Build reliable recruitment services with Python and PostgreSQL.",
        requirements: "Python, FastAPI, PostgreSQL, system design",
        recruitment_request_id: recruitmentRequestId,
      },
    });
    expect(converted.status(), await converted.text()).toBe(201);

    const duplicateConversion = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        title: `Duplicate Platform Engineer ${runId}`,
        description: "This second conversion must be rejected.",
        recruitment_request_id: recruitmentRequestId,
      },
    });
    expect(duplicateConversion.status()).toBe(409);

    const requestDetail = await request.get(
      `${API_BASE}/employer/recruitment-requests/${recruitmentRequestId}`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    expect(requestDetail.ok()).toBeTruthy();
    expect((await requestDetail.json()).converted_job_id).toBeTruthy();
  });

  test("UI shows owner and department-head permissions", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Nhập email của bạn").fill(head.email);
    await page.getByPlaceholder("Nhập mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/employer/dashboard");

    await expect(page.getByRole("heading", { name: "Không gian đánh giá chuyên môn" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ứng viên cần đánh giá" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nhu cầu tuyển dụng" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng tin mới" })).toHaveCount(0);

    await page.goto("/employer/recruitment-requests");
    await expect(page.getByRole("heading", { name: "Nhu cầu tuyển dụng" })).toBeVisible();
    await expect(page.getByText(`Platform Engineer ${runId}`).first()).toBeVisible();
    await expect(page.getByText(/Đã tạo job #/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Duyệt" })).toHaveCount(0);

    await page.goto("/employer/team");

    await expect(page.getByRole("heading", { name: "Đội ngũ & phân quyền" })).toBeVisible();
    await expect(page.getByText("Trưởng bộ phận", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Mời thành viên" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Đăng tin mới" })).toHaveCount(0);

    await page.getByRole("tab", { name: "Ma trận quyền" }).click();
    await expect(page.getByRole("heading", { name: "Ma trận quyền nghiệp vụ" })).toBeVisible();
    await expect(page.getByText("Vai trò của bạn: Trưởng bộ phận")).toBeVisible();
    await expect(page.getByText("Quyết định tuyển dụng cuối luôn thuộc về Owner hoặc Nhân sự.")).toBeVisible();

    await page.goto("/employer/jobs/new");
    await expect(page.getByText("Bạn không có quyền đăng tin")).toBeVisible();

    await page.evaluate(() => window.localStorage.clear());
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByPlaceholder("Nhập email của bạn").fill(owner.email);
    await page.getByPlaceholder("Nhập mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/employer/dashboard");

    await expect(page.getByRole("heading", { name: "Trung tâm vận hành tuyển dụng" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Quản lý đội ngũ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nhu cầu tuyển dụng" })).toBeVisible();
    await page.goto("/employer/team");

    await page.getByLabel("Lọc theo vai trò").selectOption("department_head");
    await expect(page).toHaveURL(/role=department_head/);
    await page.reload();
    await expect(page.getByLabel("Lọc theo vai trò")).toHaveValue("department_head");
    await expect(page.getByText(head.full_name)).toBeVisible();

    await page.getByRole("tab", { name: "Nhật ký" }).click();
    await expect(page).toHaveURL(/tab=activity/);
    await expect(page.getByRole("heading", { name: "Nhật ký hoạt động" })).toBeVisible();
    await expect(page.getByText("Đã tạo lời mời").first()).toBeVisible();

    await page.getByRole("tab", { name: "Lời mời" }).click();
    await expect(page.getByText("Chưa cấu hình SMTP").first()).toBeVisible();

    await page.getByRole("tab", { name: "Thành viên" }).click();

    await page.getByRole("button", { name: `Phân công job cho ${head.full_name}` }).click();
    const scopeDrawer = page.getByRole("dialog", { name: `Phạm vi tuyển dụng · ${head.full_name}` });
    await expect(scopeDrawer).toBeVisible();
    await expect(scopeDrawer.getByText("Kế thừa phòng ban")).toBeVisible();
    await expect(scopeDrawer.getByText("Theo phòng ban", { exact: true }).last()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(scopeDrawer).toBeHidden();

    await page.getByLabel(`Vai trò của ${head.full_name}`).selectOption("hr");
    const confirmation = page.getByRole("dialog", { name: "Xác nhận thay đổi vai trò" });
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByText("Vai trò mới sẽ có hiệu lực ngay ở request tiếp theo.")).toBeVisible();
    await confirmation.getByRole("button", { name: "Hủy" }).click();
    await expect(confirmation).toBeHidden();
  });
});
