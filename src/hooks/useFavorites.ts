// 즐겨찾기 훅 — 곡/탄다/악단 즐겨찾기 (localStorage + Firestore 동기화 준비)
import { useState, useCallback, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export type FavoriteType = 'song' | 'tanda' | 'orchestra' | 'round';

export interface Favorite {
  type: FavoriteType;
  id: string;
  title?: string;
  added_at: string;
}

interface FavoritesData {
  items: Favorite[];
  updatedAt: number;
}

const STORAGE_KEY = 'tango_lab_favorites';

function loadLocal(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: Favorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useFavorites() {
  const [items, setItems] = useState<Favorite[]>(loadLocal);
  const [userUid, setUserUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  // 인증 상태 추적
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  // Firestore 동기화 (로그인 시)
  useEffect(() => {
    if (!userUid) return;

    const ref = doc(db, 'couples', 'tango-couple', 'data', 'favorites');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const cloudItems = (snap.data() as FavoritesData).items || [];
        setItems(cloudItems);
        saveLocal(cloudItems);
      }
    });
    return () => unsub();
  }, [userUid]);

  const persist = useCallback((newItems: Favorite[]) => {
    setItems(newItems);
    saveLocal(newItems);
    if (userUid) {
      const ref = doc(db, 'couples', 'tango-couple', 'data', 'favorites');
      setDoc(ref, { items: newItems, updatedAt: Date.now() }).catch(() => {});
    }
  }, [userUid]);

  const isFavorite = useCallback((type: FavoriteType, id: string): boolean => {
    return items.some(f => f.type === type && f.id === id);
  }, [items]);

  const toggle = useCallback((type: FavoriteType, id: string, title?: string) => {
    const existing = items.find(f => f.type === type && f.id === id);
    if (existing) {
      persist(items.filter(f => !(f.type === type && f.id === id)));
    } else {
      persist([{ type, id, title, added_at: new Date().toISOString() }, ...items]);
    }
  }, [items, persist]);

  const countByType = useCallback((type: FavoriteType): number => {
    return items.filter(f => f.type === type).length;
  }, [items]);

  const listByType = useCallback((type: FavoriteType): Favorite[] => {
    return items.filter(f => f.type === type);
  }, [items]);

  return { items, isFavorite, toggle, countByType, listByType };
}

/** 즐겨찾기 하트 버튼 컴포넌트용 훅 */
export function useFavoriteButton(type: FavoriteType, id: string, title?: string) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(type, id);
  return {
    active,
    onClick: (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      toggle(type, id, title);
    },
  };
}
