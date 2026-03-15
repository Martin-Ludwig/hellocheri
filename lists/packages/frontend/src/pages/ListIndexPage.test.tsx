import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { ListIndexPage } from "@frontend/pages/ListIndexPage";

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
    render(<MemoryRouter><ListIndexPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("My Lists")).toBeDefined();
    });
  });

  test("renders New List button", async () => {
    render(<MemoryRouter><ListIndexPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New List" })).toBeDefined();
    });
  });

  test("shows empty state when no lists exist", async () => {
    render(<MemoryRouter><ListIndexPage /></MemoryRouter>);
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
    render(<MemoryRouter><ListIndexPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Groceries")).toBeDefined();
      expect(screen.getByText("Books")).toBeDefined();
    });
  });

  test("shows error state when fetch fails", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 500 })) as typeof fetch;
    render(<MemoryRouter><ListIndexPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Failed to load lists.")).toBeDefined();
    });
  });

  test("creates a list with default name when New List is clicked", async () => {
    const calls: Request[] = [];
    globalThis.fetch = mock(async (input: RequestInfo) => {
      const req = new Request(input instanceof Request ? input.url : input);
      calls.push(req);
      return new Response(
        JSON.stringify({ id: "1", name: "New List", createdAt: "", updatedAt: "" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    render(<MemoryRouter><ListIndexPage /></MemoryRouter>);
    await waitFor(() => screen.getByRole("button", { name: "New List" }));
    fireEvent.click(screen.getByRole("button", { name: "New List" }));

    await waitFor(() => {
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
