import { useCallback, useMemo, useState } from "react";

const VIEW_KEY_STORAGE = "plushies:viewKey";
const EDIT_KEY_STORAGE = "plushies:editKey";

export function useAuthKeys() {
  const [viewKey, setViewKeyState] = useState<string>(() => localStorage.getItem(VIEW_KEY_STORAGE) || "");
  const [editKey, setEditKeyState] = useState<string>(() => localStorage.getItem(EDIT_KEY_STORAGE) || "");

  const setViewKey = useCallback((k: string) => {
    setViewKeyState(k);
    if (k) localStorage.setItem(VIEW_KEY_STORAGE, k);
    else localStorage.removeItem(VIEW_KEY_STORAGE);
  }, []);

  const setEditKey = useCallback((k: string) => {
    setEditKeyState(k);
    if (k) localStorage.setItem(EDIT_KEY_STORAGE, k);
    else localStorage.removeItem(EDIT_KEY_STORAGE);
  }, []);

  const clearAll = useCallback(() => {
    setViewKey("");
    setEditKey("");
  }, [setViewKey, setEditKey]);

  return useMemo(() => ({ viewKey, setViewKey, editKey, setEditKey, clearAll }), [viewKey, setViewKey, editKey, setEditKey, clearAll]);
}

