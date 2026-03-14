// Enum mirrors the item_status table (id = integer value)
export enum ItemStatus {
  Default   = 0,
  Completed = 1,
}

export class List {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}
}

// Mirrors the lists_with_status view — completed is computed, not stored
export class ListWithStatus extends List {
  constructor(
    id: string,
    name: string,
    createdAt: string,
    updatedAt: string,
    public readonly completed: boolean,
  ) {
    super(id, name, createdAt, updatedAt);
  }
}

export class ListItem {
  constructor(
    public readonly id: string,
    public readonly listId: string,
    public readonly text: string,
    public readonly status: ItemStatus,
    public readonly position: number,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  isCompleted(): boolean {
    return this.status === ItemStatus.Completed;
  }
}

// Raw SQLite row shapes — snake_case mirrors column names from the DB/views
export type ListRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ListWithStatusRow = ListRow & {
  completed: number;
};

export type ListItemRow = {
  id: string;
  list_id: string;
  text: string;
  status: number;
  position: number;
  created_at: string;
  updated_at: string;
};

export class CreateListInput {
  constructor(public readonly name: string) {}
}

export class UpdateListInput {
  constructor(public readonly name?: string) {}
}

export class CreateListItemInput {
  constructor(
    public readonly listId: string,
    public readonly text: string,
    public readonly position: number,
  ) {}
}

export class UpdateListItemInput {
  constructor(
    public readonly text?: string,
    public readonly status?: ItemStatus,
    public readonly position?: number,
  ) {}
}
