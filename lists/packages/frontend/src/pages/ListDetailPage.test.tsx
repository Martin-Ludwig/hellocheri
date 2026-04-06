import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ListDetailPage } from "@frontend/pages/ListDetailPage";
import { ListWithStatus, ListItem, ItemStatus, UpdateListInput, UpdateListItemInput, CreateListItemInput } from "@lists/shared";
import type { ListsStore } from "@frontend/data/ListsStore";

const LIST_ID = "list-abc";
const now = "2026-03-12T00:00:00.000Z";

const mockList = new ListWithStatus(LIST_ID, "Groceries", now, now, false, 0);
const mockItems = [
  new ListItem("item-1", LIST_ID, "Milk", ItemStatus.Default, 1, now, now),
  new ListItem("item-2", LIST_ID, "Eggs", ItemStatus.Completed, 2, now, now),
];

function makeMockStore(overrides: Partial<ListsStore> = {}): ListsStore {
  return {
    getLists: mock(() => Promise.resolve([])),
    createList: mock(() => Promise.reject(new Error("not implemented"))),
    getList: mock(() => Promise.resolve(mockList)),
    updateList: mock(() => Promise.resolve(mockList)),
    getListItems: mock(() => Promise.resolve(mockItems)),
    createListItem: mock(() => Promise.reject(new Error("not implemented"))),
    updateListItem: mock(() => Promise.reject(new Error("not implemented"))),
    deleteListItem: mock(() => Promise.resolve()),
    ...overrides,
  };
}

let mockStore: ListsStore;

function renderDetailPage(initialPath = `/lists/${LIST_ID}`) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/lists/:id" element={<ListDetailPage store={mockStore} />} />
        <Route path="/" element={<div>Index</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockStore = makeMockStore();
});

describe("ListDetailPage", () => {
  test("shows loading state on mount", () => {
    mockStore = makeMockStore({
      getList: mock(() => new Promise(() => {})),
      getListItems: mock(() => new Promise(() => {})),
    });
    renderDetailPage();
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  test("shows error state when store rejects", async () => {
    mockStore = makeMockStore({
      getList: mock(() => Promise.reject(new Error("network error"))),
    });
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Failed to load list.")).toBeDefined());
  });

  test("renders list name and items after successful load", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Groceries")).toBeDefined());
    expect(screen.getByText("Milk")).toBeDefined();
    expect(screen.getByText("Eggs")).toBeDefined();
  });

  test("renders unchecked checkbox for default item", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Milk")).toBeDefined());
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    const milkCheckbox = checkboxes[0];
    expect(milkCheckbox.checked).toBe(false);
  });

  test("renders checked checkbox for completed item", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Eggs")).toBeDefined());
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    const eggsCheckbox = checkboxes[1];
    expect(eggsCheckbox.checked).toBe(true);
  });

  test("shows empty state when no items returned", async () => {
    mockStore = makeMockStore({
      getListItems: mock(() => Promise.resolve([])),
    });
    renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText("No items in this list.")).toBeDefined(),
    );
  });

  test("calls updateListItem with toggled status and updates UI", async () => {
    const completedMilk = new ListItem("item-1", LIST_ID, "Milk", ItemStatus.Completed, 1, now, now);
    const updateListItemMock = mock(() => Promise.resolve(completedMilk));
    mockStore = makeMockStore({ updateListItem: updateListItemMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Milk")).toBeDefined());

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(updateListItemMock.mock.calls.length).toBe(1);
      expect(updateListItemMock.mock.calls[0]).toEqual([
        LIST_ID,
        "item-1",
        new UpdateListItemInput(undefined, ItemStatus.Completed),
      ]);
    });

    // UI reflects the updated item without a reload
    await waitFor(() => {
      const checkboxesAfter = screen.getAllByRole("checkbox") as HTMLInputElement[];
      expect(checkboxesAfter[0].checked).toBe(true);
    });
  });

  test("title is contenteditable", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());
    const heading = screen.getByRole("heading") as HTMLElement;
    expect(heading.getAttribute("contenteditable")).toBe("plaintext-only");
  });

  test("blurring the title with a new name calls updateList", async () => {
    const updateListMock = mock(() => Promise.resolve(mockList));
    mockStore = makeMockStore({ updateList: updateListMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());

    const heading = screen.getByRole("heading") as HTMLElement;
    fireEvent.focus(heading);
    heading.textContent = "Updated";
    fireEvent.blur(heading);

    await waitFor(() => {
      expect(updateListMock.mock.calls.length).toBe(1);
      expect(updateListMock.mock.calls[0]).toEqual([LIST_ID, new UpdateListInput("Updated")]);
    });
  });

  test("blurring the title with the same name skips updateList", async () => {
    const updateListMock = mock(() => Promise.resolve(mockList));
    mockStore = makeMockStore({ updateList: updateListMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());

    const heading = screen.getByRole("heading") as HTMLElement;
    fireEvent.focus(heading);
    // textContent already equals "Groceries" — no change
    fireEvent.blur(heading);

    await waitFor(() => {
      expect(updateListMock.mock.calls.length).toBe(0);
    });
  });

  test("pressing Escape reverts the title and skips updateList", async () => {
    const updateListMock = mock(() => Promise.resolve(mockList));
    mockStore = makeMockStore({ updateList: updateListMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());

    const heading = screen.getByRole("heading") as HTMLElement;
    fireEvent.focus(heading);
    heading.textContent = "Edited";
    fireEvent.keyDown(heading, { key: "Escape" });

    expect(heading.textContent).toBe("Groceries");
    expect(updateListMock.mock.calls.length).toBe(0);
  });

  test("add item input is visible when list is loaded", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Groceries")).toBeDefined());
    const input = screen.getByPlaceholderText("Add item...") as HTMLInputElement;
    expect(input).toBeDefined();
  });

  test("pressing Enter with text calls createListItem and appends item to UI", async () => {
    const newItem = new ListItem("new-item", LIST_ID, "Butter", ItemStatus.Default, 3, now, now);
    const createListItemMock = mock(() => Promise.resolve(newItem));
    mockStore = makeMockStore({ createListItem: createListItemMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByPlaceholderText("Add item...")).toBeDefined());

    const input = screen.getByPlaceholderText("Add item...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Butter" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(createListItemMock.mock.calls.length).toBe(1);
      expect(createListItemMock.mock.calls[0]).toEqual([
        LIST_ID,
        new CreateListItemInput(LIST_ID, "Butter", mockItems.length + 1),
      ]);
    });

    await waitFor(() => expect(screen.getByText("Butter")).toBeDefined());
    await waitFor(() => expect(input.value).toBe(""));
  });

  test("pressing Enter with empty input does not call createListItem", async () => {
    const createListItemMock = mock(() => Promise.resolve(mockItems[0]));
    mockStore = makeMockStore({ createListItem: createListItemMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByPlaceholderText("Add item...")).toBeDefined());

    const input = screen.getByPlaceholderText("Add item...");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(createListItemMock.mock.calls.length).toBe(0);
    });
  });

  test("pressing Escape clears the input value", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByPlaceholderText("Add item...")).toBeDefined());

    const input = screen.getByPlaceholderText("Add item...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Something" } });
    expect(input.value).toBe("Something");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("");
  });

  test("calls deleteListItem and removes item from UI", async () => {
    const deleteListItemMock = mock(() => Promise.resolve());
    mockStore = makeMockStore({ deleteListItem: deleteListItemMock });

    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Milk")).toBeDefined());

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteListItemMock.mock.calls.length).toBe(1);
      expect(deleteListItemMock.mock.calls[0]).toEqual([LIST_ID, "item-1"]);
    });

    await waitFor(() => expect(screen.queryByText("Milk")).toBeNull());
  });
});
