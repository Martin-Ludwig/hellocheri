import {
  List,
  ListWithStatus,
  ListItem,
  ItemStatus,
  type CreateListInput,
  type UpdateListInput,
  type CreateListItemInput,
  type UpdateListItemInput,
} from "@lists/shared";
import type { ListsStore } from "@frontend/data/ListsStore";

type StoredList = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Derived fields cached on the record, recomputed after every item write
  completed: boolean;
  itemCount: number;
};

type StoredListItem = {
  id: string;
  listId: string;
  text: string;
  status: number;
  position: number;
  createdAt: string;
  updatedAt: string;
};

const DATABASE_VERSION = 1;
const LISTS_STORE_NAME = "lists";
const LIST_ITEMS_STORE_NAME = "list_items";
const LIST_ID_INDEX_NAME = "by-list-id";

export class ListsLocalStore implements ListsStore {
  private database: IDBDatabase | null = null;

  constructor(private readonly databaseName: string = "lists-store") {}

  private openDatabase(): Promise<IDBDatabase> {
    if (this.database !== null) {
      return Promise.resolve(this.database);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, DATABASE_VERSION);

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        database.createObjectStore(LISTS_STORE_NAME, { keyPath: "id" });
        const listItemsStore = database.createObjectStore(LIST_ITEMS_STORE_NAME, { keyPath: "id" });
        listItemsStore.createIndex(LIST_ID_INDEX_NAME, "listId", { unique: false });
      };

      request.onsuccess = () => {
        this.database = request.result;
        resolve(this.database);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Recomputes completed and itemCount from the current items and stores them on the list record.
  // Must be called within a readwrite transaction that includes both object stores.
  private async recomputeAndStoreDerivedFields(
    listId: string,
    transaction: IDBTransaction,
  ): Promise<void> {
    const storedList = await this.wrapRequest<StoredList | undefined>(
      transaction.objectStore(LISTS_STORE_NAME).get(listId),
    );
    if (storedList === undefined) return;

    const items = await this.wrapRequest<StoredListItem[]>(
      transaction.objectStore(LIST_ITEMS_STORE_NAME).index(LIST_ID_INDEX_NAME).getAll(listId),
    );

    const itemCount = items.length;
    const completed = itemCount > 0 && items.every((item) => item.status === ItemStatus.Completed);

    await this.wrapRequest(
      transaction.objectStore(LISTS_STORE_NAME).put({ ...storedList, completed, itemCount }),
    );
  }

  async getLists(): Promise<ListWithStatus[]> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME], "readonly");

    const allLists = await this.wrapRequest<StoredList[]>(
      transaction.objectStore(LISTS_STORE_NAME).getAll(),
    );

    return allLists.map(
      (storedList) =>
        new ListWithStatus(
          storedList.id,
          storedList.name,
          storedList.createdAt,
          storedList.updatedAt,
          storedList.completed ?? false,
          storedList.itemCount ?? 0,
        ),
    );
  }

  async createList(input: CreateListInput): Promise<List> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME], "readwrite");

    const now = new Date().toISOString();
    const storedList: StoredList = {
      id: crypto.randomUUID(),
      name: input.name,
      createdAt: now,
      updatedAt: now,
      completed: false,
      itemCount: 0,
    };

    await this.wrapRequest(transaction.objectStore(LISTS_STORE_NAME).add(storedList));
    return new List(storedList.id, storedList.name, storedList.createdAt, storedList.updatedAt);
  }

  async getList(listId: string): Promise<ListWithStatus> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME], "readonly");

    const storedList = await this.wrapRequest<StoredList | undefined>(
      transaction.objectStore(LISTS_STORE_NAME).get(listId),
    );

    if (storedList === undefined) throw new Error(`List not found: ${listId}`);

    return new ListWithStatus(
      storedList.id,
      storedList.name,
      storedList.createdAt,
      storedList.updatedAt,
      storedList.completed ?? false,
      storedList.itemCount ?? 0,
    );
  }

  async updateList(listId: string, input: UpdateListInput): Promise<ListWithStatus> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME], "readwrite");
    const listsStore = transaction.objectStore(LISTS_STORE_NAME);

    const storedList = await this.wrapRequest<StoredList | undefined>(listsStore.get(listId));
    if (storedList === undefined) throw new Error(`List not found: ${listId}`);

    const updatedList: StoredList = {
      ...storedList,
      name: input.name ?? storedList.name,
      updatedAt: new Date().toISOString(),
    };

    await this.wrapRequest(listsStore.put(updatedList));

    return new ListWithStatus(
      updatedList.id,
      updatedList.name,
      updatedList.createdAt,
      updatedList.updatedAt,
      updatedList.completed ?? false,
      updatedList.itemCount ?? 0,
    );
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LIST_ITEMS_STORE_NAME], "readonly");

    const storedItems = await this.wrapRequest<StoredListItem[]>(
      transaction.objectStore(LIST_ITEMS_STORE_NAME).index(LIST_ID_INDEX_NAME).getAll(listId),
    );

    return storedItems.map(
      (item) =>
        new ListItem(item.id, item.listId, item.text, item.status, item.position, item.createdAt, item.updatedAt),
    );
  }

  async createListItem(listId: string, input: CreateListItemInput): Promise<ListItem> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME, LIST_ITEMS_STORE_NAME], "readwrite");
    const listsStore = transaction.objectStore(LISTS_STORE_NAME);
    const listItemsStore = transaction.objectStore(LIST_ITEMS_STORE_NAME);

    const storedList = await this.wrapRequest<StoredList | undefined>(listsStore.get(listId));
    if (storedList === undefined) throw new Error(`List not found: ${listId}`);

    const now = new Date().toISOString();
    const storedItem: StoredListItem = {
      id: crypto.randomUUID(),
      listId,
      text: input.text,
      status: ItemStatus.Default,
      position: input.position,
      createdAt: now,
      updatedAt: now,
    };

    await this.wrapRequest(listItemsStore.add(storedItem));
    await this.recomputeAndStoreDerivedFields(listId, transaction);

    return new ListItem(
      storedItem.id,
      storedItem.listId,
      storedItem.text,
      storedItem.status,
      storedItem.position,
      storedItem.createdAt,
      storedItem.updatedAt,
    );
  }

  async updateListItem(listId: string, itemId: string, input: UpdateListItemInput): Promise<ListItem> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME, LIST_ITEMS_STORE_NAME], "readwrite");
    const listItemsStore = transaction.objectStore(LIST_ITEMS_STORE_NAME);

    const storedItem = await this.wrapRequest<StoredListItem | undefined>(listItemsStore.get(itemId));
    if (storedItem === undefined || storedItem.listId !== listId) {
      throw new Error(`List item not found: ${itemId}`);
    }

    const updatedItem: StoredListItem = {
      ...storedItem,
      text: input.text ?? storedItem.text,
      status: input.status ?? storedItem.status,
      position: input.position ?? storedItem.position,
      updatedAt: new Date().toISOString(),
    };

    await this.wrapRequest(listItemsStore.put(updatedItem));
    await this.recomputeAndStoreDerivedFields(listId, transaction);

    return new ListItem(
      updatedItem.id,
      updatedItem.listId,
      updatedItem.text,
      updatedItem.status,
      updatedItem.position,
      updatedItem.createdAt,
      updatedItem.updatedAt,
    );
  }

  async deleteListItem(listId: string, itemId: string): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction([LISTS_STORE_NAME, LIST_ITEMS_STORE_NAME], "readwrite");
    const listItemsStore = transaction.objectStore(LIST_ITEMS_STORE_NAME);

    const storedItem = await this.wrapRequest<StoredListItem | undefined>(listItemsStore.get(itemId));
    if (storedItem === undefined || storedItem.listId !== listId) {
      throw new Error(`List item not found: ${itemId}`);
    }

    await this.wrapRequest(listItemsStore.delete(itemId));
    await this.recomputeAndStoreDerivedFields(listId, transaction);
  }
}
