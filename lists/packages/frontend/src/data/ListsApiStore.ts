import {
  List,
  ListWithStatus,
  ListItem,
  type CreateListInput,
  type UpdateListInput,
  type CreateListItemInput,
  type UpdateListItemInput,
} from "@lists/shared";
import type { ListsStore } from "@frontend/data/ListsStore";
import { IS_ONLINE } from "@framework/Environment";

type ListApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ListWithStatusApiResponse = ListApiResponse & {
  completed: boolean;
  itemCount?: number;
};

type ListItemApiResponse = {
  id: string;
  listId: string;
  text: string;
  status: number;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export class ListsApiStore implements ListsStore {
  constructor(private readonly baseUrl: string = "http://localhost:3001") {}

  async getLists(): Promise<ListWithStatus[]> {
    if (IS_ONLINE) {
      const response = await fetch(`${this.baseUrl}/lists`);
      if (!response.ok) throw new Error("Failed to fetch lists");
      const data = (await response.json()) as ListWithStatusApiResponse[];
      return data.map(
        (item) =>
          new ListWithStatus(
            item.id,
            item.name,
            item.createdAt,
            item.updatedAt,
            item.completed,
            item.itemCount ?? 0,
          ),
      );
    } else {
      throw new Error("Store is not online.");
    }
  }

  async createList(input: CreateListInput): Promise<List> {
    if (IS_ONLINE) {
      const response = await fetch(`${this.baseUrl}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.name }),
      });
      if (!response.ok) throw new Error("Failed to create list");
      const data = (await response.json()) as ListApiResponse;
      return new List(data.id, data.name, data.createdAt, data.updatedAt);
    } else {
      throw new Error("Store is not online.");
    }
  }

  async getList(listId: string): Promise<ListWithStatus> {
    if (IS_ONLINE) {
      const response = await fetch(`${this.baseUrl}/lists/${listId}`);
      if (!response.ok) throw new Error("Failed to fetch list");
      const data = (await response.json()) as ListWithStatusApiResponse;
      return new ListWithStatus(
        data.id,
        data.name,
        data.createdAt,
        data.updatedAt,
        data.completed,
        data.itemCount ?? 0,
      );
    } else {
      throw new Error("Store is not online.");
    }
  }

  async updateList(
    listId: string,
    input: UpdateListInput,
  ): Promise<ListWithStatus> {
    if (IS_ONLINE) {
      const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.name }),
      });
      if (!response.ok) throw new Error("Failed to update list");
      const data = (await response.json()) as ListWithStatusApiResponse;
      return new ListWithStatus(
        data.id,
        data.name,
        data.createdAt,
        data.updatedAt,
        data.completed,
        data.itemCount ?? 0,
      );
    } else {
      throw new Error("Store is not online.");
    }
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    if (IS_ONLINE) {
      const response = await fetch(`${this.baseUrl}/lists/${listId}/items`);
      if (!response.ok) throw new Error("Failed to fetch list items");
      const data = (await response.json()) as ListItemApiResponse[];
      return data.map(
        (item) =>
          new ListItem(
            item.id,
            item.listId,
            item.text,
            item.status,
            item.position,
            item.createdAt,
            item.updatedAt,
          ),
      );
    } else {
      throw new Error("Store is not online.");
    }
  }

  async createListItem(
    listId: string,
    input: CreateListItemInput,
  ): Promise<ListItem> {
    if (IS_ONLINE) {
      const response = await fetch(`${this.baseUrl}/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.text, position: input.position }),
      });
      if (!response.ok) throw new Error("Failed to create list item");
      const data = (await response.json()) as ListItemApiResponse;
      return new ListItem(
        data.id,
        data.listId,
        data.text,
        data.status,
        data.position,
        data.createdAt,
        data.updatedAt,
      );
    } else {
      throw new Error("Store is not online.");
    }
  }

  async updateListItem(
    listId: string,
    itemId: string,
    input: UpdateListItemInput,
  ): Promise<ListItem> {
    if (IS_ONLINE) {
      const body: { text?: string; status?: number; position?: number } = {};
      if (input.text !== undefined) body.text = input.text;
      if (input.status !== undefined) body.status = input.status;
      if (input.position !== undefined) body.position = input.position;

      const response = await fetch(
        `${this.baseUrl}/lists/${listId}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw new Error("Failed to update list item");
      const data = (await response.json()) as ListItemApiResponse;
      return new ListItem(
        data.id,
        data.listId,
        data.text,
        data.status,
        data.position,
        data.createdAt,
        data.updatedAt,
      );
    } else {
      throw new Error("Store is not online.");
    }
  }

  async deleteListItem(listId: string, itemId: string): Promise<void> {
    if (IS_ONLINE) {
      const response = await fetch(
        `${this.baseUrl}/lists/${listId}/items/${itemId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Failed to delete list item");
    } else {
      throw new Error("Store is not online.");
    }
  }
}
