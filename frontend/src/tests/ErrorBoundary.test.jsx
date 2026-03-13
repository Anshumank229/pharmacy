import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ErrorBoundary from "../components/ErrorBoundary";

// A component that throws an error
const ThrowError = () => {
    throw new Error("Test Error");
};

describe("ErrorBoundary", () => {
    it("should render children normally", () => {
        render(
            <ErrorBoundary>
                <div>Test Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should catch error and show fallback UI", () => {
        // Suppress console.error for this test to keep output clean
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();

        spy.mockRestore();
    });

    it("should show Try Again button that resets error state", () => {
        vi.spyOn(console, "error").mockImplementation(() => { });

        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

        const resetButton = screen.getByRole("button", { name: /try again/i });
        fireEvent.click(resetButton);

        // After reset, try to render something healthy
        rerender(
            <ErrorBoundary>
                <div>Recovered</div>
            </ErrorBoundary>
        );

        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
        expect(screen.getByText("Recovered")).toBeInTheDocument();

        vi.restoreAllMocks();
    });
});
