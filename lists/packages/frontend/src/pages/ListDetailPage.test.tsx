import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ListDetailPage } from "@frontend/pages/ListDetailPage";

const LIST_ID = "list-abc";
const now = "2026-03-12T00:00:00.000Z";

const mockList = { id: LIST_ID, name: "Groceries", createdAt: now, updatedAt: now };
const mockItems = [
  { id: "item-1", listId: LIST_ID, text: "Milk", status: 0, position: 1, createdAt: now, updatedAt: now },
  { id: "item-2", listId: LIST_ID, text: "Eggs", status: 1, position: 2, createdAt: now, updatedAt: now },
];

function renderDetailPage(initialPath = `/lists/${LIST_ID}`) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/lists/:id" element={<ListDetailPage />} />
        <Route path="/" element={<div>Index</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function makeFetchMock(listResponse: Response, itemsResponse: Response) {
  let callCount = 0;
  return mock(() => {
    callCount++;
    return Promise.resolve(callCount % 2 === 1 ? listResponse : itemsResponse);
  });
}

beforeEach(() => {
  globalThis.fetch = makeFetchMock(
    new Response(JSON.stringify(mockList), { status: 200 }),
    new Response(JSON.stringify(mockItems), { status: 200 }),
  );
});

describe("ListDetailPage", () => {
  test("shows loading state on mount", () => {
    // Delay fetch so loading state is visible
    globalThis.fetch = mock(() => new Promise(() => {}));
    renderDetailPage();
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  test("shows error state when list fetch fails", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 500 })),
    );
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Failed to load list.")).toBeDefined());
  });

  test("renders list name and items after successful fetch", async () => {
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
    globalThis.fetch = makeFetchMock(
      new Response(JSON.stringify(mockList), { status: 200 }),
      new Response(JSON.stringify([]), { status: 200 }),
    );
    renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText("No items in this list.")).toBeDefined(),
    );
  });

  test("calls PATCH with toggled status and reloads on checkbox click", async () => {
    const fetchCalls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      if (url.includes("/items") && init?.method === "PATCH") {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      }
      if (url.includes("/items")) {
        return Promise.resolve(new Response(JSON.stringify(mockItems), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockList), { status: 200 }));
    });

    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Milk")).toBeDefined());

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      const patchCall = fetchCalls.find((call) => call.init?.method === "PATCH");
      expect(patchCall).toBeDefined();
      expect(patchCall?.url).toContain(`/lists/${LIST_ID}/items/item-1`);
      const body = JSON.parse(patchCall?.init?.body as string) as { status: number };
      expect(body.status).toBe(1); // toggled from 0 to 1
    });
  });

  test("title is contenteditable", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());
    const heading = screen.getByRole("heading") as HTMLElement;
    expect(heading.getAttribute("contenteditable")).toBe("plaintext-only");
  });

  test("blurring the title with a new name sends a PATCH request", async () => {
    const fetchCalls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      if (init?.method === "PATCH" && !url.includes("/items")) {
        return Promise.resolve(new Response(JSON.stringify({ ...mockList, name: "Updated" }), { status: 200 }));
      }
      if (url.includes("/items")) {
        return Promise.resolve(new Response(JSON.stringify(mockItems), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockList), { status: 200 }));
    });

    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());

    const heading = screen.getByRole("heading") as HTMLElement;
    fireEvent.focus(heading);
    heading.textContent = "Updated";
    fireEvent.blur(heading);

    await waitFor(() => {
      const patchCall = fetchCalls.find((call) => call.init?.method === "PATCH" && !call.url.includes("/items"));
      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall?.init?.body as string) as { name: string };
      expect(body.name).toBe("Updated");
    });
  });

  test("blurring the title with the same name skips the PATCH request", async () => {
    const fetchCalls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      if (url.includes("/items")) {
        return Promise.resolve(new Response(JSON.stringify(mockItems), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockList), { status: 200 }));
    });

    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());

    const heading = screen.getByRole("heading") as HTMLElement;
    fireEvent.focus(heading);
    // textContent already equals "Groceries" - no change
    fireEvent.blur(heading);

    await waitFor(() => {
      const patchCall = fetchCalls.find((call) => call.init?.method === "PATCH" && !call.url.includes("/items"));
      expect(patchCall).toBeUndefined();
    });
  });

  test("pressing Escape reverts the title and skips the PATCH request", async () => {
    const fetchCalls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      if (url.includes("/items")) {
        return Promise.resolve(new Response(JSON.stringify(mockItems), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockList), { status: 200 }));
    });

    renderDetailPage();
    await waitFor(() => expect(screen.getByRole("heading")).toBeDefined());

    const heading = screen.getByRole("heading") as HTMLElement;
    fireEvent.focus(heading);
    heading.textContent = "Edited";
    fireEvent.keyDown(heading, { key: "Escape" });

    expect(heading.textContent).toBe("Groceries");

    await waitFor(() => {
      const patchCall = fetchCalls.find((call) => call.init?.method === "PATCH" && !call.url.includes("/items"));
      expect(patchCall).toBeUndefined();
    });
  });

  test("calls DELETE and reloads on delete button click", async () => {
    const fetchCalls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      if (init?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/items")) {
        return Promise.resolve(new Response(JSON.stringify(mockItems), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockList), { status: 200 }));
    });

    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Milk")).toBeDefined());

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      const deleteCall = fetchCalls.find((call) => call.init?.method === "DELETE");
      expect(deleteCall).toBeDefined();
      expect(deleteCall?.url).toContain(`/lists/${LIST_ID}/items/item-1`);
    });
  });
});
