import { db } from './firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
} from 'firebase/firestore';
import type { TrainingState } from '../types/tango';

const COLLECTION = 'training_states';

export async function saveTrainingStateToFirestore(songId: string, state: TrainingState) {
  await setDoc(doc(db, COLLECTION, songId), state);
}

export function subscribeToTrainingState(
  songId: string,
  callback: (state: TrainingState | null) => void
) {
  return onSnapshot(doc(db, COLLECTION, songId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as TrainingState);
    } else {
      callback(null);
    }
  });
}

export async function loadAllTrainingStatesFromFirestore(): Promise<Record<string, TrainingState>> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const result: Record<string, TrainingState> = {};
  snapshot.forEach((doc) => {
    result[doc.id] = doc.data() as TrainingState;
  });
  return result;
}
