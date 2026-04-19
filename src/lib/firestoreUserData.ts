// 사용자별 훈련/대회 데이터 Firestore 동기화
// 구조: users/{uid}/data/training  (단일 문서에 전체 데이터)
import { db } from './firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import type { ClassRecord, PracticeLog, OwnCompetition } from '../types/tango';

export interface UserTrainingData {
  classes: ClassRecord[];
  practices: PracticeLog[];
  ownCompetitions: OwnCompetition[];
  updatedAt: number;
}

function dataRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'training');
}

export async function saveUserData(uid: string, data: Omit<UserTrainingData, 'updatedAt'>) {
  await setDoc(dataRef(uid), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function loadUserData(uid: string): Promise<UserTrainingData | null> {
  const snap = await getDoc(dataRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as UserTrainingData;
}

export function subscribeToUserData(
  uid: string,
  callback: (data: UserTrainingData | null) => void
) {
  return onSnapshot(dataRef(uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserTrainingData) : null);
  });
}
