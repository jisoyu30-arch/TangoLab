// 커플 공유 훈련/대회 데이터 Firestore 동기화
// 구조: couples/tango-couple/data/training  (공유 문서 — 승인된 이메일만 접근)
import { db } from './firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import type { ClassRecord, PracticeLog, OwnCompetition } from '../types/tango';

export interface UserTrainingData {
  classes: ClassRecord[];
  practices: PracticeLog[];
  ownCompetitions: OwnCompetition[];
  updatedAt: number;
  updatedBy?: string; // 마지막으로 수정한 사람 이메일
}

// 공유 커플 ID — Firestore 규칙에서 이 경로를 승인된 이메일만 접근 가능하게 함
const COUPLE_ID = 'tango-couple';

function dataRef() {
  return doc(db, 'couples', COUPLE_ID, 'data', 'training');
}

export async function saveUserData(
  _uid: string,
  data: Omit<UserTrainingData, 'updatedAt'>,
  userEmail?: string | null
) {
  await setDoc(dataRef(), {
    ...data,
    updatedAt: Date.now(),
    updatedBy: userEmail ?? null,
  });
}

export async function loadUserData(_uid: string): Promise<UserTrainingData | null> {
  const snap = await getDoc(dataRef());
  if (!snap.exists()) return null;
  return snap.data() as UserTrainingData;
}

export function subscribeToUserData(
  _uid: string,
  callback: (data: UserTrainingData | null) => void
) {
  return onSnapshot(dataRef(), (snap) => {
    callback(snap.exists() ? (snap.data() as UserTrainingData) : null);
  });
}
