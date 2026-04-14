import { useState, useCallback, useEffect } from 'react';
import type { RecentItem } from '../types/tango';

const STORAGE_KEY = 'tango_recent_items';
const MAX_ITEMS = 20;

function loadRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: RecentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>(loadRecent);

  useEffect(() => {
    saveRecent(items);
  }, [items]);

  const addRecent = useCallback((item: Omit<RecentItem, 'visited_at'>) => {
    setItems(prev => {
      const filtered = prev.filter(i => !(i.type === item.type && i.id === item.id));
      const next: RecentItem = { ...item, visited_at: new Date().toISOString() };
      return [next, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return { recentItems: items, addRecent };
}
