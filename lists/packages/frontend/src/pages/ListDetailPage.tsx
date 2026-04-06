import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ListItem, ItemStatus, UpdateListInput, UpdateListItemInput, CreateListItemInput } from "@lists/shared";
import type { ListsStore } from "@frontend/data/ListsStore";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; listName: string; items: ListItem[] };

interface ListDetailPageProps {
  store: ListsStore;
}

export function ListDetailPage({ store }: ListDetailPageProps) {
  const { id: listId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [newItemText, setNewItemText] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const addItemInputRef = useRef<HTMLInputElement>(null);
  const nameBeforeEditRef = useRef<string>("");

  useEffect(() => {
    if (!listId) return;
    setPageState({ status: "loading" });

    void Promise.all([store.getList(listId), store.getListItems(listId)])
      .then(([list, items]) => {
        setPageState({ status: "success", listName: list.name, items });
      })
      .catch(() => {
        setPageState({ status: "error", message: "Failed to load list." });
      });
  }, [listId, store]);

  useEffect(() => {
    if (pageState.status === "success" && titleRef.current) {
      if (titleRef.current.textContent !== pageState.listName) {
        titleRef.current.textContent = pageState.listName;
      }
    }
  }, [pageState]);

  function handleTitleFocus() {
    if (pageState.status === "success") {
      nameBeforeEditRef.current = pageState.listName;
    }
  }

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLHeadingElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      titleRef.current?.blur();
    }
    if (event.key === "Escape") {
      if (titleRef.current) {
        titleRef.current.textContent = nameBeforeEditRef.current;
      }
      titleRef.current?.blur();
    }
  }

  async function handleTitleBlur() {
    if (!listId || !titleRef.current || pageState.status !== "success") return;

    const newName = titleRef.current.textContent?.trim() ?? "";

    if (!newName || newName === pageState.listName) {
      titleRef.current.textContent = pageState.listName;
      return;
    }

    await store.updateList(listId, new UpdateListInput(newName));
    setPageState({ ...pageState, listName: newName });
  }

  async function handleToggleItem(item: ListItem) {
    if (!listId || pageState.status !== "success") return;
    const newStatus = item.isCompleted() ? ItemStatus.Default : ItemStatus.Completed;
    const updatedItem = await store.updateListItem(listId, item.id, new UpdateListItemInput(undefined, newStatus));
    setPageState({
      ...pageState,
      items: pageState.items.map((existingItem) =>
        existingItem.id === item.id ? updatedItem : existingItem,
      ),
    });
  }

  async function handleAddItem(): Promise<void> {
    const text = newItemText.trim();
    if (!text || !listId || pageState.status !== "success") return;

    const newItem = await store.createListItem(
      listId,
      new CreateListItemInput(listId, text, pageState.items.length + 1),
    );
    setPageState({ ...pageState, items: [...pageState.items, newItem] });
    setNewItemText("");
    addItemInputRef.current?.focus();
  }

  function handleAddItemKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleAddItem();
    }
    if (event.key === "Escape") {
      setNewItemText("");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!listId || pageState.status !== "success") return;
    await store.deleteListItem(listId, itemId);
    setPageState({
      ...pageState,
      items: pageState.items.filter((item) => item.id !== itemId),
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void navigate("/")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back
        </button>

        {pageState.status === "success" && (
          <h1
            ref={titleRef}
            contentEditable="plaintext-only"
            suppressContentEditableWarning
            className="text-2xl font-bold text-gray-900 cursor-text outline-none"
            onFocus={handleTitleFocus}
            onKeyDown={handleTitleKeyDown}
            onBlur={() => void handleTitleBlur()}
          />
        )}
      </div>

      {pageState.status === "loading" && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {pageState.status === "error" && (
        <p className="text-sm text-red-600">{pageState.message}</p>
      )}

      {pageState.status === "success" && pageState.items.length === 0 && (
        <p className="text-sm text-gray-500">No items in this list.</p>
      )}

      {pageState.status === "success" && pageState.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pageState.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isCompleted()}
                  onChange={() => void handleToggleItem(item)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span
                  className={
                    item.isCompleted()
                      ? "text-sm text-gray-400 line-through"
                      : "text-sm text-gray-900"
                  }
                >
                  {item.text}
                </span>
              </label>
              <button
                type="button"
                onClick={() => void handleDeleteItem(item.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {pageState.status === "success" && (
        <input
          ref={addItemInputRef}
          type="text"
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          onKeyDown={handleAddItemKeyDown}
          placeholder="Add item..."
          className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
}
