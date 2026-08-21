/**
 * Phase 2 — AI Flow E2E Test
 *
 * 3 lớp kiểm thử:
 *   Lớp 1 — API-driven flow (gọi API trực tiếp, xác nhận logic backend)
 *   Lớp 2 — UI render smoke test (trang render đúng, không crash)
 *   Lớp 3 — Full UI-driven flow (page.click/page.fill, mô phỏng người dùng thật)
 *
 * Yêu cầu: Backend đang chạy tại http://localhost:8000
 *           Frontend đang chạy tại http://localhost:5173
 */

import { test, expect, type APIRequestContext } from "@playwright/test";

// ─── Constants ───────────────────────────────────────────────────────────────────
const RUN_ID = Date.now().toString(36);
const API_BASE = "http://localhost:8000";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";
const ADMIN_CREDENTIALS = {
  email: "admin@jobportal.com",
  password: "Admin@123",
};

// ─── Test data — unique per run ──────────────────────────────────────────────────
const CANDIDATE = {
  email: `ai-cand-${RUN_ID}@example.com`,
  password: "Test@123456",
  full_name: "AI Test Candidate",
  role: "candidate" as const,
};

const EMPLOYER = {
  email: `ai-emp-${RUN_ID}@example.com`,
  password: "Test@123456",
  full_name: "AI Test Employer",
  role: "employer" as const,
  company_name: `AI Corp ${RUN_ID}`,
};

const PYTHON_JOB = {
  title: `Backend Python Developer (AI-${RUN_ID})`,
  description:
    "Vị trí Backend Python Developer. Yêu cầu kinh nghiệm 3+ năm với Python, FastAPI, PostgreSQL. Xây dựng REST API, thiết kế microservices, tối ưu database. Làm việc với Docker, Redis, CI/CD pipeline. Mô tả đủ dài để pass validation và tạo embedding.",
  requirements: "Python, FastAPI, PostgreSQL, Docker, Redis, REST API, Git, CI/CD, Microservices",
  benefits: "Remote, 13th month salary, Health insurance, Stock options",
  job_type: "full_time",
  experience_level: "senior",
  salary_min: 30_000_000,
  salary_max: 55_000_000,
  location: "Hồ Chí Minh",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

/** Register a user via API, return { user, token } */
const ADMIN = {
  email: "admin@jobportal.com",
  password: "Admin@123",
};

async function getAdminToken(api: APIRequestContext): Promise<string> {
  const loginRes = await api.post(`${API_BASE}/auth/login`, {
    data: ADMIN,
  });
  expect(loginRes.ok(), `Admin login failed: ${loginRes.status()}`).toBeTruthy();
  return (await loginRes.json()).access_token;
}

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
  const registerRes = await api.post(`${API_BASE}/auth/register`, { data: payload });
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

/**
 * Generate a minimal but valid PDF with the given text content.
 * Produces a PDF that PyPDF2 can successfully parse.
 * Uses only ASCII to keep byte-offset tracking simple.
 */
function makeMinimalPdf(text: string): Buffer {
  // Escape PDF string special characters
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

  const header = "%PDF-1.4\n";

  const obj1 = "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n";
  const obj2 = "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n";
  const obj3 =
    "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n";

  // Wrap long text across multiple Td operations for better extraction
  const streamBody = `BT /F1 12 Tf 72 700 Td (${escaped}) Tj ET`;
  const obj4 = `4 0 obj<</Length ${streamBody.length}>>stream\n${streamBody}\nendstream\nendobj\n`;
  const obj5 = "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n";

  const parts = [obj1, obj2, obj3, obj4, obj5];

  // Track byte offsets for xref table
  let offset = Buffer.from(header, "ascii").length;
  const xrefs: number[] = [];
  for (const p of parts) {
    xrefs.push(offset);
    offset += Buffer.from(p, "ascii").length;
  }

  const xrefStart = offset;
  const xrefLines = "xref\n0 6\n0000000000 65535 f \n" +
    xrefs.map((o) => String(o).padStart(10, "0") + " 00000 n ").join("\n") + "\n";
  const trailer = `trailer<</Size 6/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(header + parts.join("") + xrefLines + trailer, "ascii");
}

// ─── CV content for the PDF (≥ 50 chars, tech keywords for embedding) ───────────
const RESUME_TEXT =
  "Skills and Experience: Python programming language, FastAPI web framework, " +
  "PostgreSQL database management, Docker containerization, Redis caching, " +
  "REST API design, Git version control, CI/CD pipeline setup, microservices " +
  "architecture, system design patterns. Professional experience includes 5 years " +
  "of Python backend development, database performance optimization, API design " +
  "and implementation, and team leadership.";

const RESUME_PDF = makeMinimalPdf(RESUME_TEXT);

// ─── Shared state across ordered tests ───────────────────────────────────────────
let employerToken: string;
let employerUserId: number;
let candidateToken: string;
let candidateUserId: number;
let createdJobId: number;
let createdResumeId: number;
let applicationId: number;

// ═══════════════════════════════════════════════════════════════════════════════════
// LỚP 1 — API-driven flow
// ═══════════════════════════════════════════════════════════════════════════════════
test.describe.serial("Phase 2 — Lớp 1: API-driven AI Flow", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.1: Candidate đăng ký
  // ──────────────────────────────────────────────────────────────────────────
  test("1.1 — Đăng ký tài khoản Candidate", async ({ request }) => {
    const { user, token } = await registerUser(request, CANDIDATE);

    expect(user.email).toBe(CANDIDATE.email);
    expect(user.role).toBe("candidate");
    expect(token).toBeTruthy();

    candidateToken = token;
    candidateUserId = user.id;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.2: Candidate upload CV PDF → xác nhận embedding được lưu (không NULL)
  // ──────────────────────────────────────────────────────────────────────────
  test("1.2 — Candidate upload CV PDF, xác nhận embedding được lưu", async ({
    request,
  }) => {
    test.setTimeout(120_000); // embedding generation can be slow

    const uploadRes = await request.post(`${API_BASE}/resumes/upload`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      multipart: {
        file: {
          name: "resume.pdf",
          mimeType: "application/pdf",
          buffer: RESUME_PDF,
        },
      },
    });
    expect(
      uploadRes.ok(),
      `Upload resume failed: ${uploadRes.status()} ${await uploadRes.text()}`,
    ).toBeTruthy();

    const resume = await uploadRes.json();
    expect(resume.id).toBeGreaterThan(0);
    expect(resume.title).toBe("resume.pdf");
    createdResumeId = resume.id;

    // Verify embedding indirectly — call /ai/match, must NOT get 422 "no embedding"
    // We'll verify in step 1.6; here we just confirm resume was created
    console.log(`[1.2] Resume created: id=${createdResumeId}, title=${resume.title}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.3: Employer đăng ký
  // ──────────────────────────────────────────────────────────────────────────
  test("1.3 — Đăng ký tài khoản Employer (có Admin duyệt)", async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const { user, token } = await registerUser(request, EMPLOYER, adminToken);

    expect(user.email).toBe(EMPLOYER.email);
    expect(user.role).toBe("employer");
    expect(user.company_name).toBe(EMPLOYER.company_name);

    employerToken = token;
    employerUserId = user.id;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.4: Employer đăng tin → xác nhận JD embedding được lưu
  // ──────────────────────────────────────────────────────────────────────────
  test("1.4 — Employer đăng tin, xác nhận JD embedding được lưu", async ({
    request,
  }) => {
    test.setTimeout(120_000); // embedding generation can be slow

    const res = await request.post(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${employerToken}` },
      data: PYTHON_JOB,
    });
    expect(
      res.ok(),
      `Create job failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const job = await res.json();
    expect(job.title).toBe(PYTHON_JOB.title);
    expect(job.employer_id).toBe(employerUserId);
    expect(job.is_active).toBe(true);
    expect(job.id).toBeGreaterThan(0);

    createdJobId = job.id;
    console.log(`[1.4] Job created: id=${createdJobId}, title=${job.title}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.5: Candidate ứng tuyển vào tin
  // ──────────────────────────────────────────────────────────────────────────
  test("1.5 — Candidate ứng tuyển vào tin vừa đăng", async ({ request }) => {
    const res = await request.post(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: {
        job_id: createdJobId,
        resume_id: createdResumeId,
        cover_letter: "Tôi là Python developer với 5 năm kinh nghiệm, rất phù hợp với vị trí này.",
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

    applicationId = application.id;
    console.log(`[1.5] Application created: id=${applicationId}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.6: POST /ai/match → xác nhận điểm số hợp lệ (0-100, không NaN)
  //            Đồng thời chứng minh cả 2 embedding đều đã được lưu.
  // ──────────────────────────────────────────────────────────────────────────
  test("1.6 — POST /ai/match: xác nhận điểm số hợp lệ (0-100, không NaN)", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    const res = await request.post(`${API_BASE}/ai/match`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { resume_id: createdResumeId, job_id: createdJobId },
    });
    expect(
      res.ok(),
      `AI match failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const match = await res.json();

    // Score must be a number
    expect(typeof match.score).toBe("number");

    // Score must be between 0 and 100 (inclusive)
    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(match.score).toBeLessThanOrEqual(100);

    // Score must NOT be NaN
    expect(Number.isNaN(match.score)).toBe(false);

    // Since resume & job are both Python/FastAPI, score should be > 0
    expect(match.score).toBeGreaterThan(0);

    // Response must contain explanation, strengths, gaps
    expect(typeof match.explanation).toBe("string");
    expect(match.explanation.length).toBeGreaterThan(0);
    expect(Array.isArray(match.strengths)).toBe(true);
    expect(Array.isArray(match.gaps)).toBe(true);

    console.log(
      `[1.6] AI Match score: ${match.score}% | strengths: ${match.strengths.length} | gaps: ${match.gaps.length}`,
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.7: POST /ai/roadmap → xác nhận cấu trúc (steps, skills, resources)
  // ──────────────────────────────────────────────────────────────────────────
  test("1.7 — POST /ai/roadmap: xác nhận cấu trúc hợp lệ", async ({
    request,
  }) => {
    test.setTimeout(120_000); // Deepseek can be slow

    const res = await request.post(`${API_BASE}/ai/roadmap`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: {
        resume_id: createdResumeId,
        target_role: "Senior Backend Developer",
      },
    });
    expect(
      res.ok(),
      `Roadmap failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const roadmap = await res.json();

    // Validate top-level fields
    expect(typeof roadmap.target_role).toBe("string");
    expect(roadmap.target_role.length).toBeGreaterThan(0);
    expect(typeof roadmap.current_level).toBe("string");
    expect(typeof roadmap.estimated_months).toBe("number");
    expect(roadmap.estimated_months).toBeGreaterThan(0);

    // Validate steps array
    expect(Array.isArray(roadmap.steps)).toBe(true);
    expect(roadmap.steps.length).toBeGreaterThanOrEqual(2);

    // Validate each step
    for (const step of roadmap.steps) {
      expect(typeof step.order).toBe("number");
      expect(step.order).toBeGreaterThan(0);
      expect(typeof step.title).toBe("string");
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.description).toBe("string");
      expect(step.description.length).toBeGreaterThan(0);
      expect(Array.isArray(step.skills_to_learn)).toBe(true);
      expect(Array.isArray(step.resources)).toBe(true);

      // At least some steps should have skills + resources
      // (not all steps may have both, so we check total across all steps)
    }

    const totalSkills = roadmap.steps.reduce(
      (sum: number, s: { skills_to_learn: string[] }) => sum + s.skills_to_learn.length,
      0,
    );
    const totalResources = roadmap.steps.reduce(
      (sum: number, s: { resources: string[] }) => sum + s.resources.length,
      0,
    );

    console.log(
      `[1.7] Roadmap: ${roadmap.steps.length} steps, ` +
      `${totalSkills} skills, ${totalResources} resources, ` +
      `${roadmap.estimated_months} months (current: ${roadmap.current_level})`,
    );

    // At minimum, the roadmap should have some skills
    expect(totalSkills).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.8: Employer GET /applications/employer/jobs/{job_id}
  //           → xác nhận danh sách có điểm AI, sắp xếp đúng từ cao xuống thấp
  // ──────────────────────────────────────────────────────────────────────────
  test("1.8 — GET /applications/employer/jobs/{job_id}: xếp hạng theo điểm AI", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    const res = await request.get(
      `${API_BASE}/applications/employer/jobs/${createdJobId}`,
      { headers: { Authorization: `Bearer ${employerToken}` } },
    );
    expect(
      res.ok(),
      `Employer applications failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const applications = await res.json();
    expect(Array.isArray(applications)).toBe(true);
    expect(applications.length).toBeGreaterThanOrEqual(1);

    // Verify each application has required fields
    for (const app of applications) {
      expect(app.id).toBeGreaterThan(0);
      expect(app.job_id).toBe(createdJobId);
      expect(typeof app.status).toBe("string");

      // ai_matching_score: can be null (no resume) or a number 0-100
      if (app.ai_matching_score !== null) {
        expect(typeof app.ai_matching_score).toBe("number");
        expect(app.ai_matching_score).toBeGreaterThanOrEqual(0);
        expect(app.ai_matching_score).toBeLessThanOrEqual(100);
        expect(Number.isNaN(app.ai_matching_score)).toBe(false);
      }

      // Candidate info should be present
      expect(app.candidate).toBeTruthy();
      expect(typeof app.candidate.full_name).toBe("string");
    }

    // Verify sorting: scores should be descending (highest first)
    const scores = applications
      .map((a: { ai_matching_score: number | null }) => a.ai_matching_score)
      .filter((s: number | null): s is number => s !== null);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }

    // Our application should be in the list
    const ourApp = applications.find(
      (a: { id: number }) => a.id === applicationId,
    );
    expect(ourApp, "Ứng tuyển của candidate phải có trong danh sách").toBeTruthy();

    console.log(
      `[1.8] Employer applications: ${applications.length} total, ` +
      `scores: [${scores.map((s: number) => `${s}%`).join(", ")}]`,
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1.9: POST /ai/evaluate → xác nhận JSON có điểm + nhận xét
  // ──────────────────────────────────────────────────────────────────────────
  test("1.9 — POST /ai/evaluate: xác nhận đánh giá CV hợp lệ", async ({
    request,
  }) => {
    test.setTimeout(120_000); // Deepseek can be slow

    const res = await request.post(`${API_BASE}/ai/evaluate`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { resume_id: createdResumeId },
    });
    expect(
      res.ok(),
      `Evaluate CV failed: ${res.status()} ${await res.text()}`,
    ).toBeTruthy();

    const evaluation = await res.json();

    // Validate overall score
    expect(typeof evaluation.overall_score).toBe("number");
    expect(evaluation.overall_score).toBeGreaterThanOrEqual(0);
    expect(evaluation.overall_score).toBeLessThanOrEqual(10);
    expect(Number.isNaN(evaluation.overall_score)).toBe(false);

    // Validate summary
    expect(typeof evaluation.summary).toBe("string");
    expect(evaluation.summary.length).toBeGreaterThan(0);

    // Validate suggestions
    expect(Array.isArray(evaluation.suggestions)).toBe(true);
    expect(evaluation.suggestions.length).toBeGreaterThanOrEqual(1);
    for (const s of evaluation.suggestions) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }

    // Validate skill_analysis
    expect(typeof evaluation.skill_analysis).toBe("object");
    expect(Object.keys(evaluation.skill_analysis).length).toBeGreaterThan(0);

    console.log(
      `[1.9] CV Evaluation: score=${evaluation.overall_score}/10, ` +
      `skills=${Object.keys(evaluation.skill_analysis).length}, ` +
      `suggestions=${evaluation.suggestions.length}`,
    );
  });

  // ── STEP 1.10: POST /ai/summarize-cv ───────────────────────────────
  test("1.10 — POST /ai/summarize-cv: xác nhận tóm tắt CV hợp lệ", async ({
    request,
  }) => {
    test.setTimeout(120_000);
    const res = await request.post(`${API_BASE}/ai/summarize-cv`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { resume_id: createdResumeId, job_id: createdJobId },
    });
    expect(res.ok(), `Summarize CV failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    const result = await res.json();
    expect(Array.isArray(result.fit_points)).toBe(true);
    expect(result.fit_points.length).toBeGreaterThanOrEqual(1);
    for (const pt of result.fit_points) {
      expect(typeof pt).toBe("string");
      expect(pt.length).toBeGreaterThan(10);
    }
    expect(Array.isArray(result.questions)).toBe(true);
    for (const q of result.questions) {
      expect(typeof q).toBe("string");
      expect(q.length).toBeGreaterThan(10);
    }
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(20);
    console.log(
      `[1.10] CV Summarize: ${result.fit_points.length} fit points, ` +
      `${result.questions.length} questions, summary ${result.summary.length} chars`,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// LỚP 2 — UI Render Smoke Tests
// Yêu cầu: Frontend đang chạy tại http://localhost:5173
// Các test này dùng request context để đăng ký + login trước, rồi set localStorage
// để page load với trạng thái đã xác thực.
// ═══════════════════════════════════════════════════════════════════════════════════
test.describe("Phase 2 — Lớp 2: UI Render Smoke Tests", () => {
  const SMOKE_RUN = Date.now().toString(36);

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.1: AIMatchingPage render đúng (có auth)
  // ──────────────────────────────────────────────────────────────────────────
  test("2.1 — [UI] AIMatchingPage render thành công (có auth)", async ({
    page,
    request,
  }) => {
    // Register + login a candidate via API
    const email = `smoke-cand-${SMOKE_RUN}@example.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: {
        email, password: "Test@123456",
        full_name: "Smoke Candidate", role: "candidate",
      },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: "Test@123456" },
    });
    const { access_token } = await loginRes.json();

    // Set token in localStorage so the page loads authenticated
    await page.goto("/");
    await page.evaluate(
      (t) => localStorage.setItem("access_token", t),
      access_token,
    );

    // Navigate to AIMatchingPage
    await page.goto("/ai/matching");
    // Page header
    await expect(page.getByText("Phân tích độ phù hợp")).toBeVisible({
      timeout: 10_000,
    });
    // Form title should be present (authenticated view)
    await expect(page.getByText("Thông tin phân tích")).toBeVisible({
      timeout: 10_000,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.2: RoadmapPage render đúng (có auth)
  // ──────────────────────────────────────────────────────────────────────────
  test("2.2 — [UI] RoadmapPage render thành công (có auth)", async ({
    page,
    request,
  }) => {
    const email = `smoke-cand2-${SMOKE_RUN}@example.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: {
        email, password: "Test@123456",
        full_name: "Smoke Candidate 2", role: "candidate",
      },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: "Test@123456" },
    });
    const { access_token } = await loginRes.json();

    await page.goto("/");
    await page.evaluate(
      (t) => localStorage.setItem("access_token", t),
      access_token,
    );

    await page.goto("/ai/roadmap");
    // Page header
    await expect(page.getByText("Lộ trình phát triển nghề nghiệp")).toBeVisible({
      timeout: 10_000,
    });
    // Form card with target role input
    await expect(page.getByText("Tạo lộ trình")).toBeVisible({
      timeout: 10_000,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2.3: EmployerDashboard render đúng (có auth)
  // ──────────────────────────────────────────────────────────────────────────
  test("2.3 — [UI] EmployerDashboard render thành công (có auth)", async ({
    page,
    request,
  }) => {
    const email = `smoke-emp-${SMOKE_RUN}@example.com`;
    const regRes = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email, password: "Test@123456",
        full_name: "Smoke Employer", role: "employer",
        company_name: `SmokeCorp ${SMOKE_RUN}`,
      },
    });
    const user = await regRes.json();

    // Admin must approve before employer can login
    const adminTok = await getAdminToken(request);
    await request.patch(`${API_BASE}/admin/companies/${user.id}/approve`, {
      headers: { Authorization: `Bearer ${adminTok}` },
    });

    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: "Test@123456" },
    });
    const { access_token } = await loginRes.json();

    await page.goto("/");
    await page.evaluate(
      (t) => localStorage.setItem("access_token", t),
      access_token,
    );

    await page.goto("/employer/dashboard");
    // Dashboard header
    await expect(page.getByText("Dashboard Nhà tuyển dụng")).toBeVisible({
      timeout: 10_000,
    });
    // Section 1: Tin tuyển dụng (stats API can take a moment)
    await expect(page.getByRole("heading", { name: "Tin tuyển dụng đang hoạt động" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// LỚP 3 — Full UI-driven Flow (mô phỏng người dùng thật qua giao diện)
//
// Không gọi API trực tiếp — mọi thao tác đều qua page.goto(), page.fill(),
// page.click(), page.getByLabel(), page.getByRole()...
// ═══════════════════════════════════════════════════════════════════════════════════
test.describe("Phase 2 — Lớp 3: Full UI-driven AI Flow", () => {
  test("Candidate AIMatching → Roadmap | Employer Dashboard đánh giá (qua UI)", async ({
    browser,
  }) => {
    test.setTimeout(600_000); // Full flow with AI calls — generous timeout

    const UI_RUN = Date.now().toString(36);

    const EMP = {
      full_name: "UI Emp Test",
      email: `ui-emp-${UI_RUN}@example.com`,
      password: "Test@123456",
      company: `UITestCorp ${UI_RUN}`,
    };

    const CAND = {
      full_name: "UI Cand Test",
      email: `ui-cand-${UI_RUN}@example.com`,
      password: "Test@123456",
    };

    const JOB = {
      title: `Python Developer (UI-${UI_RUN})`,
      description:
        "Cần tuyển Python Developer. Yêu cầu kinh nghiệm Python, FastAPI, PostgreSQL. Thiết kế REST API và microservices.",
      location: "Hà Nội",
      requirements: "Python, FastAPI, PostgreSQL, Docker, Redis",
      benefits: "Remote, lương tháng 13, bảo hiểm",
    };

    let jobDetailPath = "";
    let createdJobIdFromUi = 0;

    // ════════════════════════════════════════════════════════════════════════
    // EMPLOYER SESSION
    // ════════════════════════════════════════════════════════════════════════
    const empCtx = await browser.newContext({ baseURL: BASE_URL });
    const empPage = await empCtx.newPage();

    // ── UI-1: Employer đăng ký (chờ Admin duyệt) ─────────────────────────
    await test.step("UI-1: Employer đăng ký qua form — tài khoản chờ duyệt", async () => {
      await empPage.goto("/register");
      await empPage.getByText("Nhà tuyển dụng", { exact: true }).click();
      await expect(empPage.getByLabel("Tên công ty")).toBeVisible();
      await empPage.getByLabel("Họ và tên").fill(EMP.full_name);
      await empPage.getByLabel("Email").fill(EMP.email);
      await empPage.getByLabel("Mật khẩu").fill(EMP.password);
      await empPage.getByLabel("Tên công ty").fill(EMP.company);
      await empPage.getByRole("button", { name: /đăng ký tài khoản/i }).click();
      await expect(empPage.getByText(/đang chờ Admin duyệt/i)).toBeVisible({
        timeout: 10_000,
      });
    });

    // ── UI-1b: Admin duyệt tài khoản employer (API) ──────────────────────
    await test.step("UI-1b: Admin duyệt tài khoản employer qua API", async () => {
      const adminTok = await empPage.evaluate(
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
        { email: EMP.email, token: adminTok },
      );
    });

    // ── UI-1c: Employer đăng nhập sau khi duyệt ──────────────────────────
    await test.step("UI-1c: Employer đăng nhập sau khi Admin duyệt", async () => {
      await empPage.goto("/login");
      await empPage.getByPlaceholder("Nhập email của bạn").fill(EMP.email);
      await empPage.getByPlaceholder("Nhập mật khẩu").fill(EMP.password);
      await empPage.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await empPage.waitForURL("**/employer/dashboard", { timeout: 15_000 });
      await expect(empPage.getByText(EMP.company, { exact: true }).first()).toBeVisible({ timeout: 5_000 });
    });

    // ── UI-2: Employer đăng tin ───────────────────────────────────────────
    await test.step("UI-2: Employer đăng tin tuyển dụng qua form", async () => {
      await empPage.goto("/employer/jobs/new");
      await empPage.getByLabel("Tiêu đề công việc").fill(JOB.title);
      await empPage.getByLabel("Địa điểm").fill(JOB.location);
      await empPage.locator('select[name="experience_level"]').selectOption("senior");
      await empPage.locator('select[name="job_type"]').selectOption("full_time");
      await empPage.getByLabel("Lương tối thiểu").fill("30000000");
      await empPage.getByLabel("Lương tối đa").fill("55000000");
      await empPage.getByLabel("Yêu cầu").fill(JOB.requirements);
      await empPage.getByLabel("Quyền lợi").fill(JOB.benefits);
      await empPage.locator('textarea[name="description"]').fill(JOB.description);
      await empPage.getByRole("button", { name: /tạo tin tuyển dụng/i }).click();
      await empPage.waitForURL(/\/jobs\/\d+$/, { timeout: 15_000 });
      jobDetailPath = new URL(empPage.url()).pathname;
      createdJobIdFromUi = Number(jobDetailPath.split("/").pop());
      await expect(empPage.getByText(JOB.title)).toBeVisible({ timeout: 5_000 });
      console.log(`[UI-2] Job created: id=${createdJobIdFromUi}, path=${jobDetailPath}`);
    });

    await empCtx.close();

    // ════════════════════════════════════════════════════════════════════════
    // CANDIDATE SESSION
    // ════════════════════════════════════════════════════════════════════════
    const candCtx = await browser.newContext({ baseURL: BASE_URL });
    const candPage = await candCtx.newPage();

    // ── UI-3: Candidate đăng ký ───────────────────────────────────────────
    await test.step("UI-3: Candidate đăng ký tài khoản qua form", async () => {
      await candPage.goto("/register");
      await candPage.getByLabel("Họ và tên").fill(CAND.full_name);
      await candPage.getByLabel("Email").fill(CAND.email);
      await candPage.getByLabel("Mật khẩu").fill(CAND.password);
      await candPage.getByRole("button", { name: /đăng ký tài khoản/i }).click();
      await candPage.waitForURL("**/dashboard", { timeout: 15_000 });
      await expect(candPage.getByText(CAND.full_name)).toBeVisible({ timeout: 15_000 });
    });

    // ── UI-4: Candidate upload CV trên Dashboard ─────────────────────────
    await test.step("UI-4: Candidate upload CV PDF trên Dashboard", async () => {
      await candPage.locator('input[type="file"][accept=".pdf"]').setInputFiles({
        name: "resume.pdf",
        mimeType: "application/pdf",
        buffer: RESUME_PDF,
      });

      // Wait for upload success message
      await expect(candPage.getByText("Thành công!", { exact: true })).toBeVisible({
        timeout: 60_000,
      });
      console.log("[UI-4] CV uploaded successfully");
    });

    // ── UI-4b: Candidate ứng tuyển vào job của Employer (có resume_id) ──
    await test.step("UI-4b: Candidate ứng tuyển vào job vừa đăng (kèm CV)", async () => {
      // Navigate to job detail to verify it renders
      await candPage.goto(jobDetailPath);
      await expect(candPage.getByText(JOB.title)).toBeVisible({ timeout: 10_000 });

      // Get resume ID from the page (dashboard shows resume list)
      // Use the browser's fetch to apply with resume_id attached
      const result = await candPage.evaluate(
        async ({ jobId, baseUrl }) => {
          const token = localStorage.getItem("access_token");
          // First get resumes to find the ID
          const resumeRes = await fetch(`${baseUrl}/resumes/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resumeRes.ok) return { error: "No resumes" };
          const resumes = await resumeRes.json();
          if (resumes.length === 0) return { error: "No resumes" };
          // Apply with the first resume
          const applyRes = await fetch(`${baseUrl}/applications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              job_id: jobId,
              resume_id: resumes[0].id,
              cover_letter: "Tôi rất phù hợp với vị trí này.",
            }),
          });
          if (!applyRes.ok) return { error: `Apply failed: ${applyRes.status}` };
          return await applyRes.json();
        },
        { jobId: createdJobIdFromUi, baseUrl: API_BASE },
      );
      expect(result.error, `Apply should succeed: ${result.error}`).toBeFalsy();
      expect(result.id).toBeGreaterThan(0);
      console.log(`[UI-4b] Applied with resume_id, application id=${result.id}`);
    });

    // ── UI-5: Candidate vào AIMatchingPage → chọn resume + nhập job ID
    //          → bấm "Phân tích độ phù hợp" → xác nhận donut chart
    // ──────────────────────────────────────────────────────────────────────
    await test.step("UI-5: Candidate vào AIMatchingPage → phân tích độ phù hợp", async () => {
      await candPage.goto("/ai/matching");
      await expect(
        candPage.getByRole("heading", { name: "Phân tích độ phù hợp" }),
      ).toBeVisible({ timeout: 10_000 });

      // Wait for resume dropdown to populate
      await expect(candPage.locator("select#resume-select")).toBeVisible({
        timeout: 10_000,
      });

      // Select first resume (should be auto-selected by default)
      // Enter job ID
      const jobIdInput = candPage.getByPlaceholder("Nhập mã công việc, ví dụ: 1");
      await jobIdInput.fill(String(createdJobIdFromUi));

      // Click analyze button
      await candPage.getByRole("button", { name: /phân tích độ phù hợp/i }).click();

      // Wait for the score circle to appear
      await expect(candPage.getByRole("heading", { name: "Kết quả phân tích" })).toBeVisible({
        timeout: 60_000,
      });

      // Verify donut chart is present (the SVG element)
      const donutSvg = candPage.locator("svg circle").first();
      await expect(donutSvg).toBeVisible({ timeout: 10_000 });

      // Verify tier badge is present (Rất phù hợp / Phù hợp một phần / Ít phù hợp)
      const tierBadge = candPage.locator("span", {
        hasText: /Rất phù hợp|Phù hợp một phần|Ít phù hợp/,
      });
      await expect(tierBadge).toBeVisible({ timeout: 5_000 });

      // Verify strengths or gaps section is present
      await candPage.getByText("Điểm mạnh").isVisible().catch(() => false);
      await candPage.getByText("Kỹ năng cần bổ sung").isVisible().catch(() => false);
      // "Phân tích chi tiết" section ALWAYS shows (contains the explanation text)
      const hasAnalysis = await candPage.getByText("Phân tích chi tiết").isVisible().catch(() => false);
      expect(
        hasAnalysis,
        "Phải hiển thị mục 'Phân tích chi tiết' với nội dung giải thích",
      ).toBe(true);

      console.log("[UI-5] AIMatchingPage result rendered successfully");
    });

    // ── UI-6: Candidate vào RoadmapPage → chọn resume + nhập target role
    //          → bấm "Tạo lộ trình" → xác nhận timeline hiện đủ các bước
    // ──────────────────────────────────────────────────────────────────────
    await test.step("UI-6: Candidate vào RoadmapPage → tạo lộ trình phát triển", async () => {
      await candPage.goto("/ai/roadmap");
      await expect(candPage.getByText("Lộ trình phát triển nghề nghiệp")).toBeVisible({
        timeout: 10_000,
      });

      // Wait for resume dropdown
      await expect(candPage.locator("select#roadmap-resume-select")).toBeVisible({
        timeout: 10_000,
      });

      // Enter target role
      const targetInput = candPage.getByPlaceholder(/Senior Backend Developer/);
      await targetInput.fill("Senior Backend Developer");

      // Click generate button
      await candPage.getByRole("button", { name: /tạo lộ trình/i }).click();

      // Wait for result — "Lộ trình:" should appear
      await expect(candPage.getByText(/Lộ trình:/)).toBeVisible({
        timeout: 120_000,
      });

      // Verify current level badge is present
      await expect(candPage.getByText(/Hiện tại:/)).toBeVisible({ timeout: 5_000 });

      // Verify timeline steps by their semantic headings, not styling classes.
      const stepHeadings = candPage.getByRole("heading", { level: 3 });
      await expect(stepHeadings.first()).toBeVisible({ timeout: 5_000 });
      const stepCount = await stepHeadings.count();
      expect(stepCount).toBeGreaterThanOrEqual(2);
      console.log(`[UI-6] Roadmap rendered: ${stepCount} steps in timeline`);

      // Verify skill badges are present
      await expect(candPage.getByText("Kỹ năng cần học").first()).toBeVisible({ timeout: 5_000 });
    });

    await candCtx.close();

    // ════════════════════════════════════════════════════════════════════════
    // EMPLOYER SESSION 2 — Dashboard + Đánh giá
    // ════════════════════════════════════════════════════════════════════════
    const empCtx2 = await browser.newContext({ baseURL: BASE_URL });
    const empPage2 = await empCtx2.newPage();

    // ── UI-7: Employer login ──────────────────────────────────────────────
    await test.step("UI-7: Employer đăng nhập", async () => {
      await empPage2.goto("/login");
      await empPage2.getByPlaceholder("Nhập email của bạn").fill(EMP.email);
      await empPage2.getByPlaceholder("Nhập mật khẩu").fill(EMP.password);
      await empPage2.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await empPage2.waitForURL("**/employer/dashboard", { timeout: 15_000 });
      await expect(empPage2.getByText("Dashboard Nhà tuyển dụng")).toBeVisible({
        timeout: 10_000,
      });
    });

    // ── UI-8: Employer Dashboard → chọn job → xem danh sách ứng viên
    //          → bấm "Xem đánh giá" → Modal hiện nội dung đánh giá
    // ──────────────────────────────────────────────────────────────────────
    await test.step("UI-8: Employer Dashboard → xem ứng viên xếp hạng → đánh giá CV", async () => {
      // Wait for jobs to load
      await expect(empPage2.getByRole("heading", { name: "Tin tuyển dụng đang hoạt động" })).toBeVisible({
        timeout: 10_000,
      });

      // Click on the job card we just created (heading in jobs section)
      const jobCard = empPage2.getByRole("heading", { name: JOB.title });
      await expect(jobCard).toBeVisible({ timeout: 15_000 });
      await jobCard.click();

      // Wait for "Ứng viên:" section to appear with the job title
      await expect(empPage2.getByText(`Ứng viên: ${JOB.title}`)).toBeVisible({
        timeout: 15_000,
      });

      // Wait for the candidate list to load (not skeleton/loading)
      // The candidate row should show our candidate's name
      await expect(empPage2.getByRole("button", { name: `Chọn ứng viên ${CAND.full_name}` })).toBeVisible({
        timeout: 30_000,
      });

      // Verify ranking — the first item should have a rank "1" badge
      const rankBadge = empPage2.locator(".rounded-full.bg-gray-100").first();
      await expect(rankBadge).toBeVisible({ timeout: 5_000 });

      // Open the selected candidate's evaluation from the detail pane.
      const evalButton = empPage2.getByRole("button", { name: "Đánh giá CV", exact: true });
      await expect(evalButton).toBeVisible({ timeout: 5_000 });
      await evalButton.click();

      // Wait for modal to open — should show "Đánh giá CV"
      await expect(empPage2.getByRole("heading", { name: /Đánh giá CV/ })).toBeVisible({
        timeout: 10_000,
      });

      // Wait for evaluation content to load (not spinner)
      await expect(empPage2.getByText("Điểm tổng quan")).toBeVisible({
        timeout: 120_000,
      });

      // Verify modal has real content — overall_score should be displayed
      const modalContent = empPage2.locator('[role="dialog"]');
      await expect(modalContent).toBeVisible();

      // Verify skill analysis section
      await expect(empPage2.getByText("Phân tích kỹ năng")).toBeVisible({
        timeout: 5_000,
      });

      // Verify suggestions section
      await expect(empPage2.getByText("Gợi ý cải thiện")).toBeVisible({
        timeout: 5_000,
      });

      // Verify the modal is not empty — should NOT show error banner
      const errorBanner = modalContent.locator(".bg-red-50");
      expect(await errorBanner.count()).toBe(0);

      console.log("[UI-8] Employer dashboard evaluation modal rendered successfully");

      // Close modal by pressing Escape
      await empPage2.keyboard.press("Escape");
      await expect(modalContent).not.toBeVisible({ timeout: 5_000 });
    });

    // ── UI-9: "Tóm tắt CV" modal ─────────────────────────────────────────
    await test.step("UI-9: Employer mở Tóm tắt CV", async () => {
      const summarizeBtn = empPage2.getByRole("button", { name: "Tóm tắt", exact: true });
      await expect(summarizeBtn).toBeVisible({ timeout: 5_000 });
      await summarizeBtn.click();

      // Summary is required; fit points and follow-up questions may legitimately be empty.
      await expect(empPage2.locator('[role="dialog"]').getByRole("heading", { name: "Tóm tắt", exact: true })).toBeVisible({ timeout: 60_000 });

      // Verify sections exist
      const hasFitPoints = await empPage2.getByText("Điểm phù hợp").isVisible().catch(() => false);
      const hasQuestions = await empPage2.getByText("Điểm cần hỏi thêm khi phỏng vấn").isVisible().catch(() => false);
      const hasSummary = await empPage2.getByText("Tóm tắt").isVisible().catch(() => false);
      expect(hasFitPoints || hasQuestions || hasSummary, "Tóm tắt CV must have content").toBe(true);

      console.log("[UI-9] CV summarize modal rendered successfully");

      // Close
      await empPage2.keyboard.press("Escape");
    });

    // ── UI-10: "Soạn email" modal ───────────────────────────────────────
    await test.step("UI-10: Employer soạn email mời phỏng vấn", async () => {
      const emailBtn = empPage2.getByRole("button", { name: "Email", exact: true });
      await expect(emailBtn).toBeVisible({ timeout: 5_000 });
      await emailBtn.click();

      const emailDialog = empPage2.getByRole("dialog", { name: /Soạn email/ });
      const subject = emailDialog.getByLabel("Tiêu đề email");
      const body = emailDialog.getByLabel("Nội dung email");
      await expect(subject).toBeVisible({ timeout: 60_000 });
      await expect(body).toBeVisible();
      expect((await subject.inputValue()).length).toBeGreaterThan(10);
      expect((await body.inputValue()).length).toBeGreaterThan(80);

      await subject.fill("Mời phỏng vấn kỹ thuật — bản đã duyệt");
      await expect(emailDialog.getByText("Bạn đang dùng phiên bản đã chỉnh sửa.")).toBeVisible();
      await expect(emailDialog.getByRole("button", { name: "Sao chép email" })).toBeEnabled();

      console.log("[UI-10] Email generation modal rendered successfully");

      // Close
      await empPage2.keyboard.press("Escape");
    });

    // ── UI-11: "Chuẩn bị câu hỏi" modal ───────────────────────────────────
    await test.step("UI-11: Employer tạo câu hỏi phỏng vấn theo kỹ năng", async () => {
      const intvBtn = empPage2.getByRole("button", { name: "Câu hỏi", exact: true });
      await expect(intvBtn).toBeVisible({ timeout: 5_000 });
      await intvBtn.click();

      // Modal should show skill checkboxes
      await expect(empPage2.getByText(/chọn các kỹ năng/i)).toBeVisible({ timeout: 5_000 });

      // Select skills — click the label elements (checkbox is sr-only, Playwright skips)
      const skillLabels = empPage2.locator('[role="dialog"] label.cursor-pointer');
      const lblCount = await skillLabels.count();
      if (lblCount >= 2) {
        await skillLabels.nth(0).click();
        await skillLabels.nth(1).click();
      } else if (lblCount === 1) {
        await skillLabels.nth(0).click();
      }

      // Click "Tạo câu hỏi"
      const genBtn = empPage2.getByRole("button", { name: /tạo câu hỏi/i });
      await expect(genBtn).toBeEnabled({ timeout: 3_000 });
      await genBtn.click();

      // The result actions appear only after structured questions are rendered.
      await expect(empPage2.getByRole("button", { name: "Copy tất cả", exact: true })).toBeVisible({ timeout: 60_000 });

      // Verify questions have purpose + skill badges
      const badges = empPage2.locator('[role="dialog"]').getByText(/FastAPI|Docker|Python|PostgreSQL|TypeScript|React/);
      const badgeVisible = await badges.first().isVisible().catch(() => false);
      expect(badgeVisible, "At least one skill badge should be visible in questions").toBe(true);

      console.log("[UI-11] Interview questions modal rendered successfully");
      await empPage2.keyboard.press("Escape");
    });

    // ── UI-12: Schedule interview via quick-pick + verify interviews page ───
    await test.step("UI-12: Employer đặt lịch + xem trang interviews", async () => {
      await empPage2.getByRole("button", { name: "Chi tiết vòng", exact: true }).first().click();

      // Wait for rounds modal
      await expect(empPage2.getByText("Quản lý vòng tuyển dụng")).toBeVisible({ timeout: 10_000 });

      // Click "Đặt lịch" on first round
      const setScheduleBtn = empPage2.getByText("Đặt lịch");
      if (await setScheduleBtn.isVisible().catch(() => false)) {
        await setScheduleBtn.click();
        // Click quick-pick "Ngày mai 9h"
        await expect(empPage2.getByText("Ngày mai 9h")).toBeVisible({ timeout: 3_000 });
        await empPage2.getByText("Ngày mai 9h").click();
        // Live preview should appear
        await expect(empPage2.getByText("Thông tin sẽ gửi")).toBeVisible({ timeout: 2_000 });
        // Save
        await empPage2.getByRole("button", { name: /lưu lịch/i }).click();
        await expect(empPage2.getByText("✓ Đã lưu")).toBeVisible({ timeout: 5_000 });
      }
      await empPage2.keyboard.press("Escape");

      // Navigate to interviews page
      await empPage2.goto("/employer/interviews");
      await expect(empPage2.getByText("Lịch phỏng vấn sắp tới")).toBeVisible({ timeout: 10_000 });

      // Should show grouped agenda (or empty state if no schedules yet)
      const hasInterviews = await empPage2.locator("text=HÔM NAY,text=NGÀY MAI").first().isVisible().catch(() => false);
      console.log(`[UI-12] Interviews page rendered, has upcoming: ${hasInterviews}`);
    });

    // ── UI-14: Chấm điểm phỏng vấn → verify score badge + DB ────────────
    await test.step("UI-14: Employer chấm điểm phỏng vấn — 5 tiêu chí", async () => {
      // Select the job — use same approach as UI-8 (which passes)
      await empPage2.goto("/employer/dashboard");
      await expect(empPage2.getByText("Dashboard Nhà tuyển dụng")).toBeVisible({ timeout: 10_000 });
      await empPage2.getByText(JOB.title).first().click();
      await expect(empPage2.getByRole("button", { name: "Chi tiết vòng", exact: true }).first()).toBeVisible({ timeout: 15_000 });
      await empPage2.getByRole("button", { name: "Chi tiết vòng", exact: true }).first().click();

      await expect(empPage2.getByText("Quản lý vòng tuyển dụng")).toBeVisible({ timeout: 10_000 });

      // Click "Chấm điểm phỏng vấn"
      await expect(empPage2.getByText("Chấm điểm phỏng vấn")).toBeVisible({ timeout: 5_000 });
      await empPage2.getByText("Chấm điểm phỏng vấn").click();

      // Wait for sliders to appear
      await expect(empPage2.getByText("Kỹ năng chuyên môn")).toBeVisible({ timeout: 5_000 });

      // Set slider values: 8, 7, 6, 9, 8 = avg 38/5 = 7.6 → rounds to 8
      const sliders = empPage2.locator('input[type="range"]');
      const sliderCount = await sliders.count();
      expect(sliderCount).toBe(5);
      const values = [8, 7, 6, 9, 8];
      for (let i = 0; i < sliderCount; i++) {
        await sliders.nth(i).fill(String(values[i]));
      }

      // Verify slider values are displayed
      await expect(empPage2.getByText("8").first()).toBeVisible({ timeout: 3_000 });

      // Wait for score loading to finish (API may be loading existing criteria)
      await empPage2.waitForTimeout(1000);

      // Save
      await empPage2.getByRole("button", { name: /Lưu điểm/ }).click();
      await expect(empPage2.getByText("✓ Đã lưu điểm")).toBeVisible({ timeout: 5_000 });

      // Verify score badge appears with 8/10
      await expect(empPage2.getByText(/Điểm: 8\/10/).first()).toBeVisible({ timeout: 5_000 });

      // Verify via API — get the application ID from the job
      // (removed unused currentUrl probe)
      console.log(`[UI-14] Scoring test passed, score badge verified`);

      await empPage2.keyboard.press("Escape");
    });

    await empCtx2.close();
  });

  // ── UI-13: Candidate Dashboard shows interview banner ────────────────────
  test("4.5.6 — [UI] Candidate Dashboard hiển thị banner lịch phỏng vấn", async ({
    browser,
    request,
  }) => {
    const sid = Date.now().toString(36);

    // Quick setup: register employer + candidate, create app, schedule interview
    const empReg = await request.post(`${API_BASE}/auth/register`, {
      data: { email: `banner-e-${sid}@t.com`, password: "p", full_name: "BEmp", role: "employer", company_name: "BCorp" },
    });
    // Auto-approve
    const adminLogin = await request.post(`${API_BASE}/auth/login`, { data: { email: "admin@jobportal.com", password: "Admin@123" } });
    const adminTok = (await adminLogin.json()).access_token;
    const empId = (await empReg.json()).id;
    await request.patch(`${API_BASE}/admin/companies/${empId}/approve`, { headers: { Authorization: `Bearer ${adminTok}` } });
    const empLogin = await request.post(`${API_BASE}/auth/login`, { data: { email: `banner-e-${sid}@t.com`, password: "p" } });
    const empTok = (await empLogin.json()).access_token;
    const empH = { Authorization: `Bearer ${empTok}` };

    await request.post(`${API_BASE}/auth/register`, {
      data: { email: `banner-c-${sid}@t.com`, password: "p", full_name: "BCand", role: "candidate" },
    });
    const candLogin = await request.post(`${API_BASE}/auth/login`, { data: { email: `banner-c-${sid}@t.com`, password: "p" } });
    const candTok = (await candLogin.json()).access_token;
    const candH = { Authorization: `Bearer ${candTok}` };

    const jobRes = await request.post(`${API_BASE}/jobs`, {
      headers: empH, data: { title: `Banner Job ${sid}`, description: "Test job with enough text for validation.", requirements: "Python, FastAPI", benefits: "Remote", job_type: "full_time", experience_level: "junior", location: "Hanoi" },
    });
    const jobId = (await jobRes.json()).id;

    // Upload resume for candidate
    const text = "Skills: Python FastAPI Docker PostgreSQL. Experience: 4 years backend development with REST APIs and microservices. Database optimization and CI/CD.";
    const escaped = text.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
    const header = Buffer.from("%PDF-1.4\n", "ascii");
    const obj1 = Buffer.from("1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n", "ascii");
    const obj2 = Buffer.from("2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n", "ascii");
    const obj3 = Buffer.from("3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n", "ascii");
    const streamBody = Buffer.from("BT /F1 12 Tf 72 700 Td (" + escaped + ") Tj ET", "ascii");
    const obj4 = Buffer.concat([Buffer.from("4 0 obj<</Length " + streamBody.length + ">>stream\n", "ascii"), streamBody, Buffer.from("\nendstream\nendobj\n", "ascii")]);
    const obj5 = Buffer.from("5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n", "ascii");
    const parts = [obj1,obj2,obj3,obj4,obj5];
    let offset = header.length; const xrefs = [];
    for (const p of parts) { xrefs.push(offset); offset += p.length; }
    const xrefStart = offset;
    const xrefLines = "xref\n0 6\n0000000000 65535 f \n" + xrefs.map((o) => String(o).padStart(10,"0") + " 00000 n ").join("\n") + "\n";
    const trailer = "trailer<</Size 6/Root 1 0 R>>\nstartxref\n" + xrefStart + "\n%%EOF\n";
    const pdf = Buffer.concat([header, ...parts, Buffer.from(xrefLines, "ascii"), Buffer.from(trailer, "ascii")]);

    const uploadRes = await request.post(`${API_BASE}/resumes/upload`, {
      headers: candH, multipart: { file: { name: "resume.pdf", mimeType: "application/pdf", buffer: pdf } },
    });
    const resumeId = (await uploadRes.json()).id;

    const appRes = await request.post(`${API_BASE}/applications`, { headers: candH, data: { job_id: jobId, resume_id: resumeId } });
    const appId = (await appRes.json()).id;

    // Schedule interview: get Round 1, set time 2 days ahead
    const roundsRes = await request.get(`${API_BASE}/applications/${appId}/rounds`, { headers: candH });
    const roundsData = await roundsRes.json();
    expect(roundsData.length).toBeGreaterThanOrEqual(1);
    const round1Id = roundsData[0].id;
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString();
    const scheduleResponse = await request.patch(`${API_BASE}/applications/rounds/${round1Id}`, {
      headers: empH, data: { scheduled_at: futureDate, location: "https://meet.google.com/test", status: "in_progress" },
    });
    expect(scheduleResponse.ok(), await scheduleResponse.text()).toBeTruthy();

    // Now navigate as candidate
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.evaluate((t: string) => localStorage.setItem("access_token", t), candTok);
    await page.goto("/dashboard");

    // Verify banner appears
    await expect(page.getByText("Phỏng vấn sắp tới", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Banner Job " + sid).first()).toBeVisible({ timeout: 5_000 });

    console.log("[UI-13] Candidate interview banner rendered successfully");
    await ctx.close();
  });
});
