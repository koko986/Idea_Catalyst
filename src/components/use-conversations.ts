"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CHAT_CHANGED_EVENT, CHAT_STORAGE_KEY, parseConversations } from "@/lib/chat";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHAT_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHAT_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function snapshot() {
  return window.localStorage.getItem(CHAT_STORAGE_KEY) ?? "[]";
}

export function useConversations() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => parseConversations(raw), [raw]);
}
