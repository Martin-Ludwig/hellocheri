import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { CreateListModal } from "@frontend/components/CreateListModal";

const mockOnCreated = mock(() => {});
const mockOnClose = mock(() => {});

beforeEach(() => {
  mockOnCreated.mockClear();
  mockOnClose.mockClear();
  globalThis.fetch = mock(async () =>
    new Response(JSON.stringify({ id: "1", name: "Test", createdAt: "", updatedAt: "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  ) as typeof fetch;
});

describe("CreateListModal", () => {
  test("renders input and buttons", () => {
    render(<CreateListModal onCreated={mockOnCreated} onClose={mockOnClose} />);
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  test("calls onClose when Cancel is clicked", () => {
    render(<CreateListModal onCreated={mockOnCreated} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when Escape is pressed", () => {
    render(<CreateListModal onCreated={mockOnCreated} onClose={mockOnClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("shows error when submitting empty name", async () => {
    render(<CreateListModal onCreated={mockOnCreated} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(screen.getByText("Name is required.")).toBeDefined();
    });
    expect(mockOnCreated).not.toHaveBeenCalled();
  });

  test("calls onCreated after successful creation", async () => {
    render(<CreateListModal onCreated={mockOnCreated} onClose={mockOnClose} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Books" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalledTimes(1);
    });
  });
});
