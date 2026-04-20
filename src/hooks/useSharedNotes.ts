// 공유 메모판 훅 — 작가님 + 신랑분 실시간 메모 교환
import { useState, useCallback, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export interface SharedNote {
  id: string;
  author: string; // email
  content: string;
  tags: string[];
  created_at: string;
}

const STORAGE_KEY = 'tango_lab_shared_notes';

function loadLocal(): SharedNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useSharedNotes() {
  const [notes, setNotes] = useState<SharedNote[]>(loadLocal);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'couples', 'tango-couple', 'data', 'sharedNotes');
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data() as { items: SharedNote[] };
        setNotes(data.items || []);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.items || []));
      }
    });
    return () => unsub();
  }, [user]);

  const persist = useCallback((items: SharedNote[]) => {
    setNotes(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (user) {
      const ref = doc(db, 'couples', 'tango-couple', 'data', 'sharedNotes');
      setDoc(ref, { items, updatedAt: Date.now() }).catch(() => {});
    }
  }, [user]);

  const addNote = useCallback((content: string, tags: string[] = []) => {
    const note: SharedNote = {
      id: `note-${Date.now()}`,
      author: user?.email || 'anonymous',
      content,
      tags,
      created_at: new Date().toISOString(),
    };
    persist([note, ...notes]);
  }, [notes, persist, user]);

  const deleteNote = useCallback((id: string) => {
    persist(notes.filter(n => n.id !== id));
  }, [notes, persist]);

  return { notes, addNote, deleteNote, isSignedIn: !!user };
}
