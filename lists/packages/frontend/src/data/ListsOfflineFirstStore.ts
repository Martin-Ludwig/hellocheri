import {
  List,
  ListWithStatus,
  ListItem,
  UpdateListInput,
  UpdateListItemInput,
  type CreateListInput,
  type CreateListItemInput,
} from "@lists/shared";
import type { ListsStore } from "@frontend/data/ListsStore";
import { ListsLocalStore } from "@frontend/data/ListsLocalStore";
import { ListsApiStore } from "@frontend/data/ListsApiStore";

export class ListsOfflineFirstStore implements ListsStore {
  // Tracks the most recent background sync — exposed so tests can await side effects
  backgroundSync: Promise<void> = Promise.resolve();

  constructor(
    private readonly localStore: ListsLocalStore,
    private readonly apiStore: ListsApiStore,
  ) {}

  async getLists(): Promise<ListWithStatus[]> {
    const lists = await this.localStore.getLists();
    this.backgroundSync = this.refreshListsFromApi();
    return lists;
  }

  private async refreshListsFromApi(): Promise<void> {
    try {
      const [apiLists, localLists] = await Promise.all([
        this.apiStore.getLists(),
        this.localStore.getLists(),
      ]);

      const localListById = new Map(localLists.map((list) => [list.id, list]));

      for (const apiList of apiLists) {
        const localList = localListById.get(apiList.id);
        if (localList === undefined) continue;
        if (apiList.updatedAt > localList.updatedAt) {
          await this.localStore.updateList(apiList.id, new UpdateListInput(apiList.name));
        }
      }
    } catch {
      // Silently ignore — we may be offline
    }
  }

  async getList(listId: string): Promise<ListWithStatus> {
    const list = await this.localStore.getList(listId);
    this.backgroundSync = this.refreshListFromApi(listId);
    return list;
  }

  private async refreshListFromApi(listId: string): Promise<void> {
    try {
      const [apiList, localList] = await Promise.all([
        this.apiStore.getList(listId),
        this.localStore.getList(listId),
      ]);

      if (apiList.updatedAt > localList.updatedAt) {
        await this.localStore.updateList(listId, new UpdateListInput(apiList.name));
      }
    } catch {
      // Silently ignore — we may be offline or the list may have been deleted
    }
  }

  async createList(input: CreateListInput): Promise<List> {
    const list = await this.localStore.createList(input);
    this.backgroundSync = this.apiStore.createList(input).then(() => {}).catch(() => {});
    return list;
  }

  async updateList(listId: string, input: UpdateListInput): Promise<ListWithStatus> {
    const list = await this.localStore.updateList(listId, input);
    this.backgroundSync = this.apiStore.updateList(listId, input).then(() => {}).catch(() => {});
    return list;
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    const items = await this.localStore.getListItems(listId);
    this.backgroundSync = this.refreshListItemsFromApi(listId);
    return items;
  }

  private async refreshListItemsFromApi(listId: string): Promise<void> {
    try {
      const [apiItems, localItems] = await Promise.all([
        this.apiStore.getListItems(listId),
        this.localStore.getListItems(listId),
      ]);

      const localItemById = new Map(localItems.map((item) => [item.id, item]));

      for (const apiItem of apiItems) {
        const localItem = localItemById.get(apiItem.id);
        if (localItem === undefined) continue;
        if (apiItem.updatedAt > localItem.updatedAt) {
          await this.localStore.updateListItem(
            listId,
            apiItem.id,
            new UpdateListItemInput(apiItem.text, apiItem.status, apiItem.position),
          );
        }
      }
    } catch {
      // Silently ignore — we may be offline
    }
  }

  async createListItem(listId: string, input: CreateListItemInput): Promise<ListItem> {
    const item = await this.localStore.createListItem(listId, input);
    this.backgroundSync = this.apiStore.createListItem(listId, input).then(() => {}).catch(() => {});
    return item;
  }

  async updateListItem(listId: string, itemId: string, input: UpdateListItemInput): Promise<ListItem> {
    const item = await this.localStore.updateListItem(listId, itemId, input);
    this.backgroundSync = this.apiStore.updateListItem(listId, itemId, input).then(() => {}).catch(() => {});
    return item;
  }

  async deleteListItem(listId: string, itemId: string): Promise<void> {
    await this.localStore.deleteListItem(listId, itemId);
    this.backgroundSync = this.apiStore.deleteListItem(listId, itemId).catch(() => {});
  }
}
