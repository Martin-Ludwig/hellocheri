import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ListIndexPage } from "./ListIndexPage";

const makeFetchResponse = (data: unknown, status = 200) =>
  mock(async () =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as typeof fetch;

beforeEach(() => {
  globalThis.fetch = makeFetchResponse([]);
});

describe("ListIndexPage", () => {
  test("renders the page title", async () => {
    render(<ListIndexPage />);
    await waitFor(() => {
      expect(screen.getByText("My Lists")).toBeDefined();
    });
  });

  test("renders New List button", async () => {
    render(<ListIndexPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New List" })).toBeDefined();
    });
  });

  test("shows empty state when no lists exist", async () => {
    render(<ListIndexPage />);
    await waitFor(() => {
      expect(screen.getByText("No lists yet. Create your first one.")).toBeDefined();
    });
  });

  test("renders list cards when lists are returned", async () => {
    const now = "2026-03-12T00:00:00.000Z";
    globalThis.fetch = makeFetchResponse([
      { id: "1", name: "Groceries", createdAt: now, updatedAt: now, completed: false },
      { id: "2", name: "Books", createdAt: now, updatedAt: now, completed: true },
    ]);
    render(<ListIndexPage />);
    await waitFor(() => {
      expect(screen.getByText("Groceries")).toBeDefined();
      expect(screen.getByText("Books")).toBeDefined();
    });
  });

  test("shows error state when fetch fails", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 500 })) as typeof fetch;
    render(<ListIndexPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load lists.")).toBeDefined();
    });
  });

  test("opens create modal when New List is clicked", async () => {
    render(<ListIndexPage />);
    await waitFor(() => screen.getByRole("button", { name: "New List" }));
    fireEvent.click(screen.getByRole("button", { name: "New List" }));
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});
