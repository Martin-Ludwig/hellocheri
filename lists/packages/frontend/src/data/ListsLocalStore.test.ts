import { describe, test, expect, beforeEach } from "bun:test";
import { IDBFactory } from "fake-indexeddb";
import {
  List,
  ListWithStatus,
  ListItem,
  ItemStatus,
  CreateListInput,
  UpdateListInput,
  CreateListItemInput,
  UpdateListItemInput,
} from "@lists/shared";
import { ListsLocalStore } from "@frontend/data/ListsLocalStore";

describe("ListsLocalStore", () => {
  let store: ListsLocalStore;

  beforeEach(() => {
    // Each test gets a fresh in-memory IndexedDB so there is no shared state
    globalThis.indexedDB = new IDBFactory();
    store = new ListsLocalStore();
  });

  // --- getLists ---

  test("getLists returns empty array when no lists exist", async () => {
    const result = await store.getLists();

    expect(result).toEqual([]);
  });

  test("getLists returns a ListWithStatus for each created list", async () => {
    await store.createList(new CreateListInput("Groceries"));
    await store.createList(new CreateListInput("Todos"));

    const result = await store.getLists();

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(ListWithStatus);
    const names = result.map((list) => list.name);
    expect(names).toContain("Groceries");
    expect(names).toContain("Todos");
  });

  test("getLists marks an empty list as not completed", async () => {
    await store.createList(new CreateListInput("Empty"));

    const result = await store.getLists();

    expect(result[0]?.completed).toBe(false);
  });

  test("getLists marks a list with all items completed as completed", async () => {
    const list = await store.createList(new CreateListInput("Done List"));
    const item = await store.createListItem(list.id, new CreateListItemInput(list.id, "Task", 0));
    await store.updateListItem(list.id, item.id, new UpdateListItemInput(undefined, ItemStatus.Completed));

    const result = await store.getLists();

    expect(result[0]?.completed).toBe(true);
  });

  test("getLists marks a list with at least one incomplete item as not completed", async () => {
    const list = await store.createList(new CreateListInput("Mixed"));
    const item1 = await store.createListItem(list.id, new CreateListItemInput(list.id, "Done", 0));
    await store.createListItem(list.id, new CreateListItemInput(list.id, "Pending", 1));
    await store.updateListItem(list.id, item1.id, new UpdateListItemInput(undefined, ItemStatus.Completed));

    const result = await store.getLists();

    expect(result[0]?.completed).toBe(false);
  });

  // --- createList ---

  test("createList returns a List with a generated id and timestamps", async () => {
    const result = await store.createList(new CreateListInput("Groceries"));

    expect(result).toBeInstanceOf(List);
    expect(result.name).toBe("Groceries");
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  test("createList persists the list so it appears in getLists", async () => {
    await store.createList(new CreateListInput("Groceries"));

    const lists = await store.getLists();

    expect(lists).toHaveLength(1);
    expect(lists[0]?.name).toBe("Groceries");
  });

  // --- getList ---

  test("getList returns a ListWithStatus for the given id", async () => {
    const list = await store.createList(new CreateListInput("Work"));

    const result = await store.getList(list.id);

    expect(result).toBeInstanceOf(ListWithStatus);
    expect(result.id).toBe(list.id);
    expect(result.name).toBe("Work");
    expect(result.completed).toBe(false);
  });

  test("getList throws when the list does not exist", async () => {
    await expect(store.getList("non-existent-id")).rejects.toThrow("List not found");
  });

  // --- updateList ---

  test("updateList renames the list and returns ListWithStatus", async () => {
    const list = await store.createList(new CreateListInput("Old Name"));

    const result = await store.updateList(list.id, new UpdateListInput("New Name"));

    expect(result).toBeInstanceOf(ListWithStatus);
    expect(result.id).toBe(list.id);
    expect(result.name).toBe("New Name");
  });

  test("updateList persists the change so subsequent getLists reflects it", async () => {
    const list = await store.createList(new CreateListInput("Original"));
    await store.updateList(list.id, new UpdateListInput("Renamed"));

    const lists = await store.getLists();

    expect(lists[0]?.name).toBe("Renamed");
  });

  // --- getListItems ---

  test("getListItems returns empty array when the list has no items", async () => {
    const list = await store.createList(new CreateListInput("Empty"));

    const result = await store.getListItems(list.id);

    expect(result).toEqual([]);
  });

  test("getListItems returns only items belonging to the specified list", async () => {
    const list1 = await store.createList(new CreateListInput("List 1"));
    const list2 = await store.createList(new CreateListInput("List 2"));
    await store.createListItem(list1.id, new CreateListItemInput(list1.id, "Item for list 1", 0));
    await store.createListItem(list2.id, new CreateListItemInput(list2.id, "Item for list 2", 0));

    const result = await store.getListItems(list1.id);

    expect(result).toHaveLength(1);
    expect(result[0]?.text).toBe("Item for list 1");
  });

  // --- createListItem ---

  test("createListItem throws when the list does not exist", async () => {
    await expect(
      store.createListItem("non-existent-id", new CreateListItemInput("non-existent-id", "Task", 0)),
    ).rejects.toThrow("List not found");
  });

  test("createListItem returns a ListItem with a generated id, default status, and correct position", async () => {
    const list = await store.createList(new CreateListInput("Groceries"));

    const result = await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy milk", 0));

    expect(result).toBeInstanceOf(ListItem);
    expect(result.text).toBe("Buy milk");
    expect(result.status).toBe(ItemStatus.Default);
    expect(result.position).toBe(0);
    expect(result.listId).toBe(list.id);
    expect(result.id).toBeDefined();
    expect(result.isCompleted()).toBe(false);
  });

  // --- updateListItem ---

  test("updateListItem throws when the item belongs to a different list", async () => {
    const list1 = await store.createList(new CreateListInput("List 1"));
    const list2 = await store.createList(new CreateListInput("List 2"));
    const item = await store.createListItem(list1.id, new CreateListItemInput(list1.id, "Task", 0));

    await expect(
      store.updateListItem(list2.id, item.id, new UpdateListItemInput("Hijacked")),
    ).rejects.toThrow("List item not found");
  });

  test("updateListItem updates status and leaves other fields unchanged", async () => {
    const list = await store.createList(new CreateListInput("Groceries"));
    const item = await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy milk", 0));

    const result = await store.updateListItem(list.id, item.id, new UpdateListItemInput(undefined, ItemStatus.Completed));

    expect(result).toBeInstanceOf(ListItem);
    expect(result.status).toBe(ItemStatus.Completed);
    expect(result.text).toBe("Buy milk");
    expect(result.position).toBe(0);
    expect(result.isCompleted()).toBe(true);
  });

  test("updateListItem updates text and leaves other fields unchanged", async () => {
    const list = await store.createList(new CreateListInput("Groceries"));
    const item = await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy milk", 0));

    const result = await store.updateListItem(list.id, item.id, new UpdateListItemInput("Buy oat milk"));

    expect(result.text).toBe("Buy oat milk");
    expect(result.status).toBe(ItemStatus.Default);
    expect(result.position).toBe(0);
  });

  test("updateListItem updates position and leaves other fields unchanged", async () => {
    const list = await store.createList(new CreateListInput("Groceries"));
    const item = await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy milk", 0));

    const result = await store.updateListItem(list.id, item.id, new UpdateListItemInput(undefined, undefined, 2));

    expect(result.position).toBe(2);
    expect(result.text).toBe("Buy milk");
    expect(result.status).toBe(ItemStatus.Default);
  });

  // --- deleteListItem ---

  test("deleteListItem throws when the item belongs to a different list", async () => {
    const list1 = await store.createList(new CreateListInput("List 1"));
    const list2 = await store.createList(new CreateListInput("List 2"));
    const item = await store.createListItem(list1.id, new CreateListItemInput(list1.id, "Task", 0));

    await expect(store.deleteListItem(list2.id, item.id)).rejects.toThrow("List item not found");
  });

  test("deleteListItem removes the item so getListItems no longer returns it", async () => {
    const list = await store.createList(new CreateListInput("Groceries"));
    const item = await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy milk", 0));

    await store.deleteListItem(list.id, item.id);

    const items = await store.getListItems(list.id);
    expect(items).toHaveLength(0);
  });

  test("deleteListItem removes only the specified item", async () => {
    const list = await store.createList(new CreateListInput("Groceries"));
    const item1 = await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy milk", 0));
    await store.createListItem(list.id, new CreateListItemInput(list.id, "Buy eggs", 1));

    await store.deleteListItem(list.id, item1.id);

    const items = await store.getListItems(list.id);
    expect(items).toHaveLength(1);
    expect(items[0]?.text).toBe("Buy eggs");
  });
});
