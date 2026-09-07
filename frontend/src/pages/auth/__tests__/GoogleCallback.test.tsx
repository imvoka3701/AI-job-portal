import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GoogleCallback } from "../GoogleCallback";
import { tokenStorage } from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("GoogleCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.remove();
    window.location.hash = "";
  });

  it("extracts token and redirect from URL fragment (#token=...&redirect=...) and cleans address bar", async () => {
    const fetchMeMock = vi.fn().mockResolvedValue({ id: 1, role: "employer" });
    vi.spyOn(useAuthStore, "getState").mockReturnValue({
      fetchMe: fetchMeMock,
    } as unknown as ReturnType<typeof useAuthStore.getState>);

    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    window.location.hash = "#token=sample_oauth_token&redirect=/employer/dashboard";

    render(
      <MemoryRouter>
        <GoogleCallback />
      </MemoryRouter>
    );

    expect(tokenStorage.get()).toBe("sample_oauth_token");
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", window.location.pathname);

    await waitFor(() => {
      expect(fetchMeMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/employer/dashboard", { replace: true });
    });
  });

  it("shows error if no token is found in hash or query parameters", async () => {
    window.location.hash = "";

    render(
      <MemoryRouter initialEntries={["/auth/google/callback"]}>
        <GoogleCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Đăng nhập Google thất bại — không nhận được token.")
    ).toBeInTheDocument();
  });
});
