import { describe, expect, test } from "bun:test";
import {
  ItemStatus,
  List,
  ListItem,
  ListWithStatus,
  CreateListInput,
  UpdateListInput,
  CreateListItemInput,
  UpdateListItemInput,
} from "./index";

describe("ItemStatus", () => {
  test("has correct integer values", () => {
    expect(ItemStatus.Default).toBe(0);
    expect(ItemStatus.Completed).toBe(1);
  });
});

describe("ListItem.isCompleted", () => {
  const baseItem = new ListItem("item-1", "list-1", "Buy milk", ItemStatus.Default, 0,
    "2026-03-08T00:00:00.000Z", "2026-03-08T00:00:00.000Z");

  test("returns false for default status", () => {
    expect(baseItem.isCompleted()).toBe(false);
  });

  test("returns true for completed status", () => {
    const completedItem = new ListItem("item-1", "list-1", "Buy milk", ItemStatus.Completed, 0,
      "2026-03-08T00:00:00.000Z", "2026-03-08T00:00:00.000Z");
    expect(completedItem.isCompleted()).toBe(true);
  });
});

describe("List", () => {
  test("stores all fields", () => {
    const list = new List("list-1", "Groceries", "2026-03-08T00:00:00.000Z", "2026-03-08T00:00:00.000Z");
    expect(list.id).toBe("list-1");
    expect(list.name).toBe("Groceries");
    expect(list.createdAt).toBe("2026-03-08T00:00:00.000Z");
    expect(list.updatedAt).toBe("2026-03-08T00:00:00.000Z");
  });
});

describe("ListWithStatus", () => {
  test("extends List with a computed completed field", () => {
    const list = new ListWithStatus("list-1", "Groceries", "2026-03-08T00:00:00.000Z", "2026-03-08T00:00:00.000Z", false);
    expect(list.completed).toBe(false);
    expect(list.name).toBe("Groceries");
  });
});

describe("ListItem", () => {
  test("stores all fields", () => {
    const item = new ListItem("item-1", "list-1", "Buy milk", ItemStatus.Default, 0,
      "2026-03-08T00:00:00.000Z", "2026-03-08T00:00:00.000Z");
    expect(item.listId).toBe("list-1");
    expect(item.text).toBe("Buy milk");
    expect(item.status).toBe(ItemStatus.Default);
    expect(item.position).toBe(0);
  });
});

describe("CreateListInput", () => {
  test("stores name", () => {
    const input = new CreateListInput("Groceries");
    expect(input.name).toBe("Groceries");
  });
});

describe("UpdateListInput", () => {
  test("accepts a name", () => {
    const input = new UpdateListInput("Updated");
    expect(input.name).toBe("Updated");
  });

  test("name is optional", () => {
    const input = new UpdateListInput();
    expect(input.name).toBeUndefined();
  });
});

describe("CreateListItemInput", () => {
  test("stores listId, text, and position", () => {
    const input = new CreateListItemInput("list-1", "Buy milk", 0);
    expect(input.listId).toBe("list-1");
    expect(input.text).toBe("Buy milk");
    expect(input.position).toBe(0);
  });
});

describe("UpdateListItemInput", () => {
  test("accepts a status update", () => {
    const input = new UpdateListItemInput(undefined, ItemStatus.Completed);
    expect(input.status).toBe(ItemStatus.Completed);
  });

  test("all fields are optional", () => {
    const input = new UpdateListItemInput();
    expect(input.text).toBeUndefined();
    expect(input.status).toBeUndefined();
    expect(input.position).toBeUndefined();
  });
});
