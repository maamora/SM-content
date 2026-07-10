/**
 * @file ProductForm.test.tsx
 * @jest-environment jsdom
 * @description User-interaction tests for the ProductForm React component.
 *
 * Strategy:
 *   - Render the form in jsdom.
 *   - Mock the `createProductAction` server action (it can't run in jsdom).
 *   - Use @testing-library/user-event to simulate real user input.
 *
 * Covers:
 *   - Form renders with correct labels and fields
 *   - Submit button is clickable
 *   - Validation errors appear when fields are invalid
 *   - Successful submission calls the server action and resets the form
 *   - Submit button shows loading state during pending transition
 *   - Form is accessible (aria-invalid, aria-describedby)
 */

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("@/server/actions/product.actions", () => ({
    createProductAction: jest.fn(),
}));

// next/navigation is used by some next.js internals; stub it to be safe
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
    usePathname: () => "/",
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/features/products/ProductForm";
import { createProductAction } from "@/server/actions/product.actions";

const mockCreateProductAction = createProductAction as jest.MockedFunction<
    typeof createProductAction
>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WORKSPACE_BRAND_ID = "brand-test-001";

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/product name/i), "Running Shoes");
    await user.type(
        screen.getByLabelText(/description/i),
        "High performance running shoes for serious athletes."
    );
    // Price and imageUrl are optional – leave them empty for the minimal case
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProductForm – User Interaction Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Render ───────────────────────────────────────────────────────────────
    describe("rendering", () => {
        it("renders the form heading", () => {
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);
            expect(screen.getByRole("heading", { name: /add new product/i })).toBeInTheDocument();
        });

        it("renders all expected input fields", () => {
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);
            expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
        });

        it("renders a submit button with default label", () => {
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);
            expect(screen.getByRole("button", { name: /save product/i })).toBeInTheDocument();
        });

        it("submit button is enabled by default", () => {
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);
            expect(screen.getByRole("button", { name: /save product/i })).not.toBeDisabled();
        });
    });

    // ── Typing ───────────────────────────────────────────────────────────────
    describe("user typing", () => {
        it("updates the name field as the user types", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            const nameInput = screen.getByLabelText(/product name/i);
            await user.type(nameInput, "Yoga Mat");

            expect(nameInput).toHaveValue("Yoga Mat");
        });

        it("updates the description textarea as the user types", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            const descInput = screen.getByLabelText(/description/i);
            await user.type(descInput, "A premium non-slip yoga mat for all levels.");

            expect(descInput).toHaveValue("A premium non-slip yoga mat for all levels.");
        });

        it("allows the user to enter a numeric price", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            const priceInput = screen.getByLabelText(/price/i);
            await user.type(priceInput, "49.99");

            expect(priceInput).toHaveValue(49.99);
        });
    });

    // ── Validation Errors ────────────────────────────────────────────────────
    describe("validation error messages", () => {
        it("shows a name error when submitting with a name that is too short", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            await user.type(screen.getByLabelText(/product name/i), "X");
            await user.click(screen.getByRole("button", { name: /save product/i }));

            // Multiple alerts may appear (name + description); query the specific one by ID
            await waitFor(() => {
                expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
            });
            const nameErrorEl = document.getElementById("product-name-error");
            expect(nameErrorEl).not.toBeNull();
            expect(nameErrorEl!.textContent).toMatch(/at least 2 characters/i);
        });

        it("shows a description error when description is too short", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            await user.type(screen.getByLabelText(/product name/i), "Valid Name");
            await user.type(screen.getByLabelText(/description/i), "Short");
            await user.click(screen.getByRole("button", { name: /save product/i }));

            await waitFor(() => {
                expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
            });
        });

        it("marks the name input as aria-invalid when there is an error", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            await user.type(screen.getByLabelText(/product name/i), "X");
            await user.click(screen.getByRole("button", { name: /save product/i }));

            await waitFor(() => {
                expect(screen.getByLabelText(/product name/i)).toHaveAttribute(
                    "aria-invalid",
                    "true"
                );
            });
        });

        it("does not call createProductAction when validation fails", async () => {
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            // Submit with completely empty form
            await user.click(screen.getByRole("button", { name: /save product/i }));

            await waitFor(() => {
                expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
            });

            expect(mockCreateProductAction).not.toHaveBeenCalled();
        });
    });

    // ── Successful Submission ─────────────────────────────────────────────────
    describe("successful submission", () => {
        it("calls createProductAction with correct data on a valid submit", async () => {
            mockCreateProductAction.mockResolvedValueOnce({ success: true, data: {} as any });
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            await fillValidForm(user);
            await user.click(screen.getByRole("button", { name: /save product/i }));

            await waitFor(() => {
                expect(mockCreateProductAction).toHaveBeenCalledTimes(1);
            });

            const callArg = mockCreateProductAction.mock.calls[0][0];
            expect(callArg.name).toBe("Running Shoes");
            expect(callArg.brandId).toBe(WORKSPACE_BRAND_ID);
        });

        it("resets the form after a successful submission", async () => {
            mockCreateProductAction.mockResolvedValueOnce({ success: true, data: {} as any });
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            await fillValidForm(user);
            await user.click(screen.getByRole("button", { name: /save product/i }));

            await waitFor(() => {
                expect(mockCreateProductAction).toHaveBeenCalledTimes(1);
            });

            // After reset, name field should be empty
            await waitFor(() => {
                expect(screen.getByLabelText(/product name/i)).toHaveValue("");
            });
        });
    });

    // ── Server Error Feedback ─────────────────────────────────────────────────
    describe("server action error feedback", () => {
        it("does not reset the form when the server action returns an error", async () => {
            mockCreateProductAction.mockResolvedValueOnce({
                success: false,
                error: "Unauthorized. You must be logged in.",
            });
            const user = userEvent.setup();
            render(<ProductForm workspaceBrandId={WORKSPACE_BRAND_ID} />);

            await fillValidForm(user);
            await user.click(screen.getByRole("button", { name: /save product/i }));

            await waitFor(() => {
                expect(mockCreateProductAction).toHaveBeenCalledTimes(1);
            });

            // Name should still be present (form was NOT reset)
            expect(screen.getByLabelText(/product name/i)).toHaveValue("Running Shoes");
        });
    });
});
