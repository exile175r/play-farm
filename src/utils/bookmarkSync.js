// src/utils/bookmarkSync.js
export const BOOKMARK_KEY = "bookmarks_program";
export const BOOKMARK_EVENT = "bookmarks:changed";

export function emitBookmarksChanged() {
  window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT));
}

export function readBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY) || "[]";
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
