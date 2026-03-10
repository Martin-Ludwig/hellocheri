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
