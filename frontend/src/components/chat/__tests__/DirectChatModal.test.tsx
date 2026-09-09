import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DirectChatModal } from "../DirectChatModal";
import * as chatApi from "@/lib/api/chat";

vi.mock("@/lib/api/chat", () => ({
  initApplicationConversation: vi.fn(),
  getConversationDetail: vi.fn(),
  sendChatMessage: vi.fn(),
  markConversationRead: vi.fn(),
}));

vi.mock("@/stores/authStore", () => ({
  useUser: () => ({ id: 1, full_name: "HR Recruiter", role: "employer" }),
  useAuthStore: (selector: (s: { token: string }) => unknown) => selector({ token: "fake-jwt" }),
}));

vi.mock("@/hooks/useWebSocketNotifications", () => ({
  useWebSocketNotifications: () => ({ isConnected: true }),
}));

describe("DirectChatModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <DirectChatModal
        isOpen={false}
        onClose={vi.fn()}
        applicationId={1}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("loads and displays conversation messages when open", async () => {
    vi.mocked(chatApi.initApplicationConversation).mockResolvedValue({
      id: 10,
      application_id: 1,
      job_id: 2,
      job_title: "Senior React Engineer",
      candidate_id: 5,
      candidate_name: "Le Van B",
      candidate_avatar: null,
      company_id: 3,
      company_name: "Tech Solutions",
      last_message: "Chào bạn!",
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: 101,
          conversation_id: 10,
          sender_id: 5,
          sender_name: "Le Van B",
          sender_role: "candidate",
          content: "Chào HR, em đã nộp đơn ứng tuyển.",
          is_read: true,
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(
      <DirectChatModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId={1}
        candidateName="Le Van B"
        jobTitle="Senior React Engineer"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText("Le Van B").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Senior React Engineer")).toBeInTheDocument();
      expect(screen.getByText("Chào HR, em đã nộp đơn ứng tuyển.")).toBeInTheDocument();
    });
  });

  it("allows typing and sending a message", async () => {
    vi.mocked(chatApi.initApplicationConversation).mockResolvedValue({
      id: 10,
      application_id: 1,
      job_id: 2,
      job_title: "Senior React Engineer",
      candidate_id: 5,
      candidate_name: "Le Van B",
      candidate_avatar: null,
      company_id: 3,
      company_name: "Tech Solutions",
      last_message: null,
      last_message_at: null,
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    });

    vi.mocked(chatApi.sendChatMessage).mockResolvedValue({
      id: 102,
      conversation_id: 10,
      sender_id: 1,
      sender_name: "HR Recruiter",
      sender_role: "employer",
      content: "Chào bạn, mời bạn tham gia phỏng vấn.",
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    });

    render(
      <DirectChatModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nhập tin nhắn trao đổi/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/nhập tin nhắn trao đổi/i);
    await userEvent.type(textarea, "Chào bạn, mời bạn tham gia phỏng vấn.");

    const sendBtn = screen.getByRole("button", { name: /gửi/i });
    await userEvent.click(sendBtn);

    await waitFor(() => {
      expect(chatApi.sendChatMessage).toHaveBeenCalledWith(10, "Chào bạn, mời bạn tham gia phỏng vấn.");
      expect(screen.getByText("Chào bạn, mời bạn tham gia phỏng vấn.")).toBeInTheDocument();
    });
  });

  it("populates input when clicking quick template", async () => {
    vi.mocked(chatApi.initApplicationConversation).mockResolvedValue({
      id: 10,
      application_id: 1,
      job_id: 2,
      job_title: "Senior React Engineer",
      candidate_id: 5,
      candidate_name: "Le Van B",
      candidate_avatar: null,
      company_id: 3,
      company_name: "Tech Solutions",
      last_message: null,
      last_message_at: null,
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    });

    render(
      <DirectChatModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/mẫu:/i)).toBeInTheDocument();
    });

    const templateBtn = screen.getAllByRole("button").find(b => b.textContent?.includes("Chào bạn, hồ sơ của bạn"));
    expect(templateBtn).toBeDefined();
    if (templateBtn) {
      await userEvent.click(templateBtn);
      const textarea = screen.getByPlaceholderText(/nhập tin nhắn trao đổi/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain("Chào bạn, hồ sơ của bạn rất ấn tượng!");
    }
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    vi.mocked(chatApi.initApplicationConversation).mockResolvedValue({
      id: 10,
      application_id: 1,
      job_id: 2,
      job_title: "Senior React Engineer",
      candidate_id: 5,
      candidate_name: "Le Van B",
      candidate_avatar: null,
      company_id: 3,
      company_name: "Tech Solutions",
      last_message: null,
      last_message_at: null,
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    });

    render(
      <DirectChatModal
        isOpen={true}
        onClose={handleClose}
        applicationId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Đóng")).toBeInTheDocument();
    });

    const closeBtn = screen.getByLabelText("Đóng");
    await userEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
