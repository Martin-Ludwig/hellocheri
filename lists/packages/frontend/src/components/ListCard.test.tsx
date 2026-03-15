import { describe, test, expect } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ListWithStatus } from "@lists/shared";
import { ListCard } from "@frontend/components/ListCard";

const now = "2026-03-12T00:00:00.000Z";

function makeList(name: string, completed: boolean): ListWithStatus {
  return new ListWithStatus(crypto.randomUUID(), name, now, now, completed);
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ListCard", () => {
  test("renders the list name", () => {
    renderWithRouter(<ListCard list={makeList("Groceries", false)} />);
    expect(screen.getByText("Groceries")).toBeDefined();
  });

  test("shows Completed badge when list is completed", () => {
    renderWithRouter(<ListCard list={makeList("Books", true)} />);
    expect(screen.getByText("Completed")).toBeDefined();
  });

  test("shows In progress badge when list is not completed", () => {
    renderWithRouter(<ListCard list={makeList("Wishlist", false)} />);
    expect(screen.getByText("In progress")).toBeDefined();
  });

  test("navigates to list detail page on click", async () => {
    const list = makeList("Groceries", false);
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ListCard list={list} />} />
          <Route path="/lists/:id" element={<div>Detail Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByText("Detail Page")).toBeDefined());
  });
});
