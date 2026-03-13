import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import TwoFactorVerify from "../pages/TwoFactorVerify";
import api from "../api/axiosClient";

// Mock axiosClient
vi.mock("../api/axiosClient", () => ({
    default: {
        post: vi.fn(),
    },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("TwoFactorVerify", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderTwoFactor = () => {
        return render(
            <BrowserRouter>
                <TwoFactorVerify />
            </BrowserRouter>
        );
    };

    it("should render 6-digit input", () => {
        renderTwoFactor();
        expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /verify & continue/i })).toBeInTheDocument();
    });

    it("should allow only digits in input", () => {
        renderTwoFactor();
        const input = screen.getByPlaceholderText("000000");

        fireEvent.change(input, { target: { value: "abc123" } });
        expect(input.value).toBe("123");
    });

    it("should submit code and redirect on success", async () => {
        api.post.mockResolvedValueOnce({ data: { success: true } });
        renderTwoFactor();

        const input = screen.getByPlaceholderText("000000");
        const button = screen.getByRole("button", { name: /verify & continue/i });

        fireEvent.change(input, { target: { value: "123456" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/2fa/login", { token: "123456" });
            expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard", { replace: true });
        });
    });

    it("should show error on invalid code", async () => {
        api.post.mockRejectedValueOnce({
            response: { data: { message: "Invalid code" } }
        });
        renderTwoFactor();

        const input = screen.getByPlaceholderText("000000");
        const button = screen.getByRole("button", { name: /verify & continue/i });

        fireEvent.change(input, { target: { value: "111111" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
        });
    });
});
