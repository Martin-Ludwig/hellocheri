import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ListWithStatus } from "@lists/shared";
import { ListCard } from "./ListCard";

const now = "2026-03-12T00:00:00.000Z";

function makeList(name: string, completed: boolean): ListWithStatus {
  return new ListWithStatus(crypto.randomUUID(), name, now, now, completed);
}

describe("ListCard", () => {
  test("renders the list name", () => {
    render(<ListCard list={makeList("Groceries", false)} />);
    expect(screen.getByText("Groceries")).toBeDefined();
  });

  test("shows Completed badge when list is completed", () => {
    render(<ListCard list={makeList("Books", true)} />);
    expect(screen.getByText("Completed")).toBeDefined();
  });

  test("shows In progress badge when list is not completed", () => {
    render(<ListCard list={makeList("Wishlist", false)} />);
    expect(screen.getByText("In progress")).toBeDefined();
  });
});
