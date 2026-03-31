import { describe, test, expect, spyOn, beforeEach } from "bun:test";
import { List, ListWithStatus, ListItem, ItemStatus, CreateListInput, UpdateListInput, CreateListItemInput, UpdateListItemInput } from "@lists/shared";
import { ListsApiStore } from "@frontend/data/ListsApiStore";

const BASE_URL = "http://localhost:3001";

function makeFetchSpy(body: unknown, status = 200) {
  return spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("ListsApiStore", () => {
  let store: ListsApiStore;

  beforeEach(() => {
    store = new ListsApiStore(BASE_URL);
  });

  test("getLists fetches /lists and returns ListWithStatus[]", async () => {
    const fetchSpy = makeFetchSpy([
      { id: "1", name: "Groceries", createdAt: "2024-01-01", updatedAt: "2024-01-01", completed: false },
    ]);

    const result = await store.getLists();

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists`);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ListWithStatus);
    expect(result[0]?.name).toBe("Groceries");
    expect(result[0]?.completed).toBe(false);
  });

  test("createList posts to /lists and returns List", async () => {
    const fetchSpy = makeFetchSpy({ id: "2", name: "Todos", createdAt: "2024-01-01", updatedAt: "2024-01-01" });

    const result = await store.createList(new CreateListInput("Todos"));

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Todos" }),
    });
    expect(result).toBeInstanceOf(List);
    expect(result.name).toBe("Todos");
  });

  test("getList fetches /lists/:id and returns ListWithStatus", async () => {
    const fetchSpy = makeFetchSpy({
      id: "3",
      name: "Work",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      completed: true,
    });

    const result = await store.getList("3");

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists/3`);
    expect(result).toBeInstanceOf(ListWithStatus);
    expect(result.completed).toBe(true);
  });

  test("updateList patches /lists/:id and returns ListWithStatus", async () => {
    const fetchSpy = makeFetchSpy({
      id: "3",
      name: "Work Updated",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      completed: false,
    });

    const result = await store.updateList("3", new UpdateListInput("Work Updated"));

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists/3`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Work Updated" }),
    });
    expect(result).toBeInstanceOf(ListWithStatus);
    expect(result.name).toBe("Work Updated");
  });

  test("getListItems fetches /lists/:id/items and returns ListItem[]", async () => {
    const fetchSpy = makeFetchSpy([
      { id: "i1", listId: "3", text: "Buy milk", status: 0, position: 0, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
    ]);

    const result = await store.getListItems("3");

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists/3/items`);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ListItem);
    expect(result[0]?.text).toBe("Buy milk");
  });

  test("createListItem posts to /lists/:id/items and returns ListItem", async () => {
    const fetchSpy = makeFetchSpy(
      { id: "i2", listId: "3", text: "Buy eggs", status: 0, position: 1, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      201,
    );

    const result = await store.createListItem("3", new CreateListItemInput("3", "Buy eggs", 1));

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists/3/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Buy eggs" }),
    });
    expect(result).toBeInstanceOf(ListItem);
    expect(result.text).toBe("Buy eggs");
  });

  test("updateListItem patches /lists/:id/items/:itemId and returns ListItem", async () => {
    const fetchSpy = makeFetchSpy({
      id: "i1",
      listId: "3",
      text: "Buy milk",
      status: 1,
      position: 0,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
    });

    const result = await store.updateListItem("3", "i1", new UpdateListItemInput(undefined, ItemStatus.Completed));

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists/3/items/i1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: ItemStatus.Completed }),
    });
    expect(result).toBeInstanceOf(ListItem);
    expect(result.isCompleted()).toBe(true);
  });

  test("deleteListItem sends DELETE to /lists/:id/items/:itemId", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await store.deleteListItem("3", "i1");

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/lists/3/items/i1`, {
      method: "DELETE",
    });
  });
});
