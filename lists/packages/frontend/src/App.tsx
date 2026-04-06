import "./index.css";
import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { ListIndexPage } from "@frontend/pages/ListIndexPage";
import { ListDetailPage } from "@frontend/pages/ListDetailPage";
import { ListsOfflineFirstStore } from "@frontend/data/ListsOfflineFirstStore";
import { ListsLocalStore } from "@frontend/data/ListsLocalStore";
import { ListsApiStore } from "@frontend/data/ListsApiStore";

export function App() {
  const store = useMemo(
    () => new ListsOfflineFirstStore(new ListsLocalStore(), new ListsApiStore()),
    [],
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListIndexPage store={store} />} />
        <Route path="/lists/:id" element={<ListDetailPage store={store} />} />
      </Routes>
    </BrowserRouter>
  );
}
