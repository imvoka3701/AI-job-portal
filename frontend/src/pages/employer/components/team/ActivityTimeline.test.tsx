import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityTimeline } from "@/pages/employer/components/team/ActivityTimeline";
import { getCompanyActivity } from "@/lib/api/company";

vi.mock("@/lib/api/company", () => ({
  getCompanyActivity: vi.fn(),
}));

const activityPage = {
  items: [{
    id: 1,
    actor_user_id: 7,
    actor_email: "owner@acme.test",
    action: "department.created",
    target_type: "department",
    target_id: "2",
    target_label: "Engineering",
    details_json: {},
    created_at: "2026-08-15T01:00:00Z",
  }],
  total: 1,
  page: 1,
  page_size: 10,
};

describe("ActivityTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompanyActivity).mockResolvedValue(activityPage);
  });

  it("renders real activity and reloads from page one when filters change", async () => {
    const user = userEvent.setup();
    render(<ActivityTimeline />);

    expect(await screen.findByText("Đã tạo phòng ban")).toBeInTheDocument();
    expect(screen.getByText(/Engineering/)).toBeInTheDocument();
    expect(screen.getByText(/owner@acme.test/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Lọc nhật ký theo đối tượng"), "department");
    await waitFor(() => expect(getCompanyActivity).toHaveBeenLastCalledWith({
      page: 1,
      page_size: 10,
      action: undefined,
      target_type: "department",
    }));
  });

  it("keeps an actionable retry path when activity loading fails", async () => {
    vi.mocked(getCompanyActivity)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 10 });
    const user = userEvent.setup();
    render(<ActivityTimeline />);

    expect(await screen.findByText("Không tải được nhật ký")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByText("Chưa có hoạt động phù hợp")).toBeInTheDocument();
    expect(getCompanyActivity).toHaveBeenCalledTimes(2);
  });
});
