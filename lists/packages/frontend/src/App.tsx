import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { ListIndexPage } from "@frontend/pages/ListIndexPage";
import { ListDetailPage } from "@frontend/pages/ListDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListIndexPage />} />
        <Route path="/lists/:id" element={<ListDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
