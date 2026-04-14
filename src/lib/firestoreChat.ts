import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';

export interface FirestoreChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | null;
  pairId?: string; // Q&A 쌍을 연결하는 ID
}

const COLLECTION = 'tango_chat';

export function subscribeToChatMessages(
  callback: (messages: FirestoreChatMessage[]) => void
) {
  const q = query(collection(db, COLLECTION), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages: FirestoreChatMessage[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() ?? null,
        pairId: data.pairId,
      });
    });
    callback(messages);
  });
}

export async function addChatMessage(
  role: 'user' | 'assistant',
  content: string,
  pairId?: string
) {
  await addDoc(collection(db, COLLECTION), {
    role,
    content,
    timestamp: serverTimestamp(),
    pairId: pairId ?? null,
  });
}

export async function deleteChatPair(pairId: string) {
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.forEach((d) => {
    const data = d.data();
    if (data.pairId === pairId) {
      batch.delete(doc(db, COLLECTION, d.id));
    }
  });

  await batch.commit();
}

export async function deleteAllChat() {
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach((d) => {
    batch.delete(doc(db, COLLECTION, d.id));
  });
  await batch.commit();
}
