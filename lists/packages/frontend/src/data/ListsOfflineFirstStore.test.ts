import { describe, test, expect, spyOn, beforeEach } from "bun:test";
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
import { ListsApiStore } from "@frontend/data/ListsApiStore";
import { ListsOfflineFirstStore } from "@frontend/data/ListsOfflineFirstStore";

describe("ListsOfflineFirstStore", () => {
  let localStore: ListsLocalStore;
  let apiStore: ListsApiStore;
  let store: ListsOfflineFirstStore;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    localStore = new ListsLocalStore();
    apiStore = new ListsApiStore();
    store = new ListsOfflineFirstStore(localStore, apiStore);
  });

  // --- getLists ---

  test("getLists returns local data without waiting for API", async () => {
    await localStore.createList(new CreateListInput("Local List"));
    spyOn(apiStore, "getLists").mockReturnValue(new Promise<ListWithStatus[]>(() => {}));

    const result = await store.getLists();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Local List");
  });

  test("getLists triggers background API refresh", async () => {
    const spy = spyOn(apiStore, "getLists").mockResolvedValue([]);

    await store.getLists();
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("getLists background refresh updates local list when API updatedAt is newer", async () => {
    const localList = await localStore.createList(new CreateListInput("Old Name"));
    spyOn(apiStore, "getLists").mockResolvedValue([
      new ListWithStatus(localList.id, "New Name", "2024-01-01", "9999-01-01", false, 0),
    ]);

    await store.getLists();
    await store.backgroundSync;

    const lists = await localStore.getLists();
    expect(lists[0]?.name).toBe("New Name");
  });

  test("getLists background refresh keeps local list when local updatedAt is newer", async () => {
    const localList = await localStore.createList(new CreateListInput("Local Name"));
    spyOn(apiStore, "getLists").mockResolvedValue([
      new ListWithStatus(localList.id, "API Name", "2024-01-01", "2000-01-01", false, 0),
    ]);

    await store.getLists();
    await store.backgroundSync;

    const lists = await localStore.getLists();
    expect(lists[0]?.name).toBe("Local Name");
  });

  test("getLists background refresh silences API errors", async () => {
    spyOn(apiStore, "getLists").mockRejectedValue(new Error("Network error"));

    await store.getLists();

    await expect(store.backgroundSync).resolves.toBeUndefined();
  });

  // --- getList ---

  test("getList returns local data without waiting for API", async () => {
    const localList = await localStore.createList(new CreateListInput("Test List"));
    spyOn(apiStore, "getList").mockReturnValue(new Promise<ListWithStatus>(() => {}));

    const result = await store.getList(localList.id);

    expect(result.name).toBe("Test List");
  });

  test("getList triggers background API refresh", async () => {
    const localList = await localStore.createList(new CreateListInput("Test List"));
    const spy = spyOn(apiStore, "getList").mockResolvedValue(
      new ListWithStatus(localList.id, "Test List", "2024-01-01", "2024-01-01", false, 0),
    );

    await store.getList(localList.id);
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("getList background refresh updates list name when API updatedAt is newer", async () => {
    const localList = await localStore.createList(new CreateListInput("Old Name"));
    spyOn(apiStore, "getList").mockResolvedValue(
      new ListWithStatus(localList.id, "New Name", "2024-01-01", "9999-01-01", false, 0),
    );

    await store.getList(localList.id);
    await store.backgroundSync;

    const updated = await localStore.getList(localList.id);
    expect(updated.name).toBe("New Name");
  });

  test("getList background refresh keeps local data when local updatedAt is newer", async () => {
    const localList = await localStore.createList(new CreateListInput("Local Name"));
    spyOn(apiStore, "getList").mockResolvedValue(
      new ListWithStatus(localList.id, "API Name", "2024-01-01", "2000-01-01", false, 0),
    );

    await store.getList(localList.id);
    await store.backgroundSync;

    const unchanged = await localStore.getList(localList.id);
    expect(unchanged.name).toBe("Local Name");
  });

  test("getList background refresh silences API errors", async () => {
    const localList = await localStore.createList(new CreateListInput("Test"));
    spyOn(apiStore, "getList").mockRejectedValue(new Error("Network error"));

    await store.getList(localList.id);

    await expect(store.backgroundSync).resolves.toBeUndefined();
  });

  // --- getListItems ---

  test("getListItems returns local items without waiting for API", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    await localStore.createListItem(localList.id, new CreateListItemInput(localList.id, "Milk", 0));
    spyOn(apiStore, "getListItems").mockReturnValue(new Promise<ListItem[]>(() => {}));

    const result = await store.getListItems(localList.id);

    expect(result).toHaveLength(1);
    expect(result[0]?.text).toBe("Milk");
  });

  test("getListItems background refresh updates item text when API updatedAt is newer", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const localItem = await localStore.createListItem(
      localList.id,
      new CreateListItemInput(localList.id, "Old Text", 0),
    );
    spyOn(apiStore, "getListItems").mockResolvedValue([
      new ListItem(localItem.id, localList.id, "New Text", ItemStatus.Default, 0, "2024-01-01", "9999-01-01"),
    ]);

    await store.getListItems(localList.id);
    await store.backgroundSync;

    const items = await localStore.getListItems(localList.id);
    expect(items[0]?.text).toBe("New Text");
  });

  test("getListItems background refresh keeps local item when local updatedAt is newer", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const localItem = await localStore.createListItem(
      localList.id,
      new CreateListItemInput(localList.id, "Local Text", 0),
    );
    spyOn(apiStore, "getListItems").mockResolvedValue([
      new ListItem(localItem.id, localList.id, "API Text", ItemStatus.Default, 0, "2024-01-01", "2000-01-01"),
    ]);

    await store.getListItems(localList.id);
    await store.backgroundSync;

    const items = await localStore.getListItems(localList.id);
    expect(items[0]?.text).toBe("Local Text");
  });

  test("getListItems background refresh silences API errors", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    spyOn(apiStore, "getListItems").mockRejectedValue(new Error("Network error"));

    await store.getListItems(localList.id);

    await expect(store.backgroundSync).resolves.toBeUndefined();
  });

  // --- createList ---

  test("createList writes to local store and returns List", async () => {
    spyOn(apiStore, "createList").mockReturnValue(new Promise<List>(() => {}));

    const result = await store.createList(new CreateListInput("New List"));

    expect(result).toBeInstanceOf(List);
    expect(result.name).toBe("New List");
    const localLists = await localStore.getLists();
    expect(localLists).toHaveLength(1);
  });

  test("createList fires apiStore.createList in background", async () => {
    const spy = spyOn(apiStore, "createList").mockResolvedValue(
      new List("api-id", "New List", "2024-01-01", "2024-01-01"),
    );

    await store.createList(new CreateListInput("New List"));
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("createList returns local result even when API rejects", async () => {
    spyOn(apiStore, "createList").mockRejectedValue(new Error("Network error"));

    const result = await store.createList(new CreateListInput("New List"));
    await expect(store.backgroundSync).resolves.toBeUndefined();

    expect(result).toBeInstanceOf(List);
    expect(result.name).toBe("New List");
  });

  // --- updateList ---

  test("updateList updates local store and returns ListWithStatus", async () => {
    const localList = await localStore.createList(new CreateListInput("Old Name"));
    spyOn(apiStore, "updateList").mockReturnValue(new Promise<ListWithStatus>(() => {}));

    const result = await store.updateList(localList.id, new UpdateListInput("New Name"));

    expect(result).toBeInstanceOf(ListWithStatus);
    expect(result.name).toBe("New Name");
  });

  test("updateList fires apiStore.updateList in background", async () => {
    const localList = await localStore.createList(new CreateListInput("Test"));
    const spy = spyOn(apiStore, "updateList").mockResolvedValue(
      new ListWithStatus(localList.id, "Test", "2024-01-01", "2024-01-01", false, 0),
    );

    await store.updateList(localList.id, new UpdateListInput("Test"));
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("updateList returns local result even when API rejects", async () => {
    const localList = await localStore.createList(new CreateListInput("Old Name"));
    spyOn(apiStore, "updateList").mockRejectedValue(new Error("Network error"));

    const result = await store.updateList(localList.id, new UpdateListInput("New Name"));
    await expect(store.backgroundSync).resolves.toBeUndefined();

    expect(result.name).toBe("New Name");
  });

  // --- createListItem ---

  test("createListItem writes to local store and returns ListItem", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    spyOn(apiStore, "createListItem").mockReturnValue(new Promise<ListItem>(() => {}));

    const result = await store.createListItem(localList.id, new CreateListItemInput(localList.id, "Milk", 0));

    expect(result).toBeInstanceOf(ListItem);
    expect(result.text).toBe("Milk");
    const items = await localStore.getListItems(localList.id);
    expect(items).toHaveLength(1);
  });

  test("createListItem fires apiStore.createListItem in background", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const spy = spyOn(apiStore, "createListItem").mockResolvedValue(
      new ListItem("api-item-id", localList.id, "Milk", ItemStatus.Default, 0, "2024-01-01", "2024-01-01"),
    );

    await store.createListItem(localList.id, new CreateListItemInput(localList.id, "Milk", 0));
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // --- updateListItem ---

  test("updateListItem updates local store and returns ListItem", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const localItem = await localStore.createListItem(
      localList.id,
      new CreateListItemInput(localList.id, "Milk", 0),
    );
    spyOn(apiStore, "updateListItem").mockReturnValue(new Promise<ListItem>(() => {}));

    const result = await store.updateListItem(
      localList.id,
      localItem.id,
      new UpdateListItemInput(undefined, ItemStatus.Completed),
    );

    expect(result).toBeInstanceOf(ListItem);
    expect(result.isCompleted()).toBe(true);
  });

  test("updateListItem fires apiStore.updateListItem in background", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const localItem = await localStore.createListItem(
      localList.id,
      new CreateListItemInput(localList.id, "Milk", 0),
    );
    const spy = spyOn(apiStore, "updateListItem").mockResolvedValue(
      new ListItem(localItem.id, localList.id, "Milk", ItemStatus.Completed, 0, "2024-01-01", "2024-01-01"),
    );

    await store.updateListItem(localList.id, localItem.id, new UpdateListItemInput(undefined, ItemStatus.Completed));
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // --- deleteListItem ---

  test("deleteListItem removes item from local store", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const localItem = await localStore.createListItem(
      localList.id,
      new CreateListItemInput(localList.id, "Milk", 0),
    );
    spyOn(apiStore, "deleteListItem").mockResolvedValue(undefined);

    await store.deleteListItem(localList.id, localItem.id);

    const items = await localStore.getListItems(localList.id);
    expect(items).toHaveLength(0);
  });

  test("deleteListItem fires apiStore.deleteListItem in background", async () => {
    const localList = await localStore.createList(new CreateListInput("Groceries"));
    const localItem = await localStore.createListItem(
      localList.id,
      new CreateListItemInput(localList.id, "Milk", 0),
    );
    const spy = spyOn(apiStore, "deleteListItem").mockResolvedValue(undefined);

    await store.deleteListItem(localList.id, localItem.id);
    await store.backgroundSync;

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
