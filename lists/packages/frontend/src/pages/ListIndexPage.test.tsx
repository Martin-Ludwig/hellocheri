import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { ListIndexPage } from "@frontend/pages/ListIndexPage";
import { ListWithStatus, List, CreateListInput } from "@lists/shared";
import type { ListsStore } from "@frontend/data/ListsStore";

const now = "2026-03-12T00:00:00.000Z";

function makeMockStore(overrides: Partial<ListsStore> = {}): ListsStore {
  return {
    getLists: mock(() => Promise.resolve([])),
    createList: mock(() =>
      Promise.resolve(new List("new-id", "New List", now, now)),
    ),
    getList: mock(() => Promise.reject(new Error("not implemented"))),
    updateList: mock(() => Promise.reject(new Error("not implemented"))),
    getListItems: mock(() => Promise.reject(new Error("not implemented"))),
    createListItem: mock(() => Promise.reject(new Error("not implemented"))),
    updateListItem: mock(() => Promise.reject(new Error("not implemented"))),
    deleteListItem: mock(() => Promise.reject(new Error("not implemented"))),
    ...overrides,
  };
}

let mockStore: ListsStore;

beforeEach(() => {
  mockStore = makeMockStore();
});

describe("ListIndexPage", () => {
  test("renders the page title", async () => {
    render(<MemoryRouter><ListIndexPage store={mockStore} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("My Lists")).toBeDefined();
    });
  });

  test("renders New List button", async () => {
    render(<MemoryRouter><ListIndexPage store={mockStore} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New List" })).toBeDefined();
    });
  });

  test("shows empty state when no lists exist", async () => {
    render(<MemoryRouter><ListIndexPage store={mockStore} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("No lists yet. Create your first one.")).toBeDefined();
    });
  });

  test("renders list cards when lists are returned", async () => {
    mockStore = makeMockStore({
      getLists: mock(() =>
        Promise.resolve([
          new ListWithStatus("1", "Groceries", now, now, false, 0),
          new ListWithStatus("2", "Books", now, now, true, 3),
        ]),
      ),
    });
    render(<MemoryRouter><ListIndexPage store={mockStore} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Groceries")).toBeDefined();
      expect(screen.getByText("Books")).toBeDefined();
    });
  });

  test("shows error state when store rejects", async () => {
    mockStore = makeMockStore({
      getLists: mock(() => Promise.reject(new Error("network error"))),
    });
    render(<MemoryRouter><ListIndexPage store={mockStore} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Failed to load lists.")).toBeDefined();
    });
  });

  test("calls createList with default name when New List is clicked", async () => {
    const createListMock = mock(() =>
      Promise.resolve(new List("new-id", "New List", now, now)),
    );
    mockStore = makeMockStore({ createList: createListMock });

    render(<MemoryRouter><ListIndexPage store={mockStore} /></MemoryRouter>);
    await waitFor(() => screen.getByRole("button", { name: "New List" }));
    fireEvent.click(screen.getByRole("button", { name: "New List" }));

    await waitFor(() => {
      expect(createListMock.mock.calls.length).toBe(1);
      expect(createListMock.mock.calls[0]).toEqual([new CreateListInput("New List")]);
    });
  });
});
