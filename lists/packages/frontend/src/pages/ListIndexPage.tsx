import React, { useEffect, useState } from "react";
import { ListWithStatus, CreateListInput } from "@lists/shared";
import { ListCard } from "@frontend/components/ListCard";
import type { ListsStore } from "@frontend/data/ListsStore";

const DEFAULT_LIST_NAME = "New List";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; lists: ListWithStatus[] };

interface ListIndexPageProps {
  store: ListsStore;
}

export function ListIndexPage({ store }: ListIndexPageProps) {
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setPageState({ status: "loading" });
    void store.getLists()
      .then((lists) => setPageState({ status: "success", lists }))
      .catch(() => setPageState({ status: "error", message: "Failed to load lists." }));
  }, [store]);

  async function handleNewList() {
    if (pageState.status !== "success") return;
    setCreating(true);
    try {
      const newList = await store.createList(new CreateListInput(DEFAULT_LIST_NAME));
      const newListWithStatus = new ListWithStatus(newList.id, newList.name, newList.createdAt, newList.updatedAt, false, 0);
      setPageState({ ...pageState, lists: [...pageState.lists, newListWithStatus] });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
        <button
          type="button"
          onClick={() => void handleNewList()}
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          New List
        </button>
      </div>

      {pageState.status === "loading" && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {pageState.status === "error" && (
        <p className="text-sm text-red-600">{pageState.message}</p>
      )}

      {pageState.status === "success" && pageState.lists.length === 0 && (
        <p className="text-sm text-gray-500">
          No lists yet. Create your first one.
        </p>
      )}

      {pageState.status === "success" && pageState.lists.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pageState.lists.map((list) => (
            <li key={list.id}>
              <ListCard list={list} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
