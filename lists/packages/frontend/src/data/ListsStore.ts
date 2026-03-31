import type {
  List,
  ListWithStatus,
  ListItem,
  CreateListInput,
  UpdateListInput,
  CreateListItemInput,
  UpdateListItemInput,
} from "@lists/shared";

export interface ListsStore {
  getLists(): Promise<ListWithStatus[]>;
  createList(input: CreateListInput): Promise<List>;
  getList(listId: string): Promise<ListWithStatus>;
  updateList(listId: string, input: UpdateListInput): Promise<ListWithStatus>;
  getListItems(listId: string): Promise<ListItem[]>;
  createListItem(listId: string, input: CreateListItemInput): Promise<ListItem>;
  updateListItem(listId: string, itemId: string, input: UpdateListItemInput): Promise<ListItem>;
  deleteListItem(listId: string, itemId: string): Promise<void>;
}
