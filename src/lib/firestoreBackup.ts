// Firestore 자동 스냅샷 백업
// 구조: couples/tango-couple/snapshots/{yyyy-mm-dd-HHmm}
// - 마지막 백업 후 7일 경과 시 자동 트리거
// - 최대 12개 보관 (≈3개월), 그 이상은 수동 정리
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import type { UserTrainingData } from './firestoreUserData';

const COUPLE_ID = 'tango-couple';
const MAX_SNAPSHOTS = 12;
const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const LAST_BACKUP_KEY = 'tango_lab_last_backup_at';

function snapshotsRef() {
  return collection(db, 'couples', COUPLE_ID, 'snapshots');
}

function snapshotDocRef(id: string) {
  return doc(db, 'couples', COUPLE_ID, 'snapshots', id);
}

function fmtSnapshotId(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function createSnapshot(data: UserTrainingData, userEmail?: string | null): Promise<string> {
  const now = new Date();
  const id = fmtSnapshotId(now);
  await setDoc(snapshotDocRef(id), {
    ...data,
    snapshotAt: Date.now(),
    snapshotBy: userEmail ?? null,
  });
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));

  // 12개 초과분 자동 정리
  await pruneOldSnapshots();

  return id;
}

export async function listSnapshots(): Promise<Array<{ id: string; snapshotAt: number; snapshotBy?: string | null }>> {
  const q = query(snapshotsRef(), orderBy('snapshotAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    snapshotAt: d.data().snapshotAt,
    snapshotBy: d.data().snapshotBy,
  }));
}

export async function loadSnapshot(id: string): Promise<UserTrainingData | null> {
  const snap = await getDocs(query(snapshotsRef(), orderBy('snapshotAt', 'desc')));
  const found = snap.docs.find(d => d.id === id);
  return found ? (found.data() as UserTrainingData) : null;
}

async function pruneOldSnapshots() {
  const all = await listSnapshots();
  if (all.length <= MAX_SNAPSHOTS) return;
  const toDelete = all.slice(MAX_SNAPSHOTS);
  await Promise.all(toDelete.map(s => deleteDoc(snapshotDocRef(s.id)).catch(() => {})));
}

// 마지막 백업으로부터 일수
export function daysSinceLastBackup(): number | null {
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return null;
  const last = parseInt(raw);
  if (isNaN(last)) return null;
  return Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
}

// 자동 백업이 필요한지 (7일 이상 경과)
export function needsAutoBackup(): boolean {
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return true;
  const last = parseInt(raw);
  if (isNaN(last)) return true;
  return Date.now() - last >= BACKUP_INTERVAL_MS;
}

// 자동 백업 시도 (조건 만족 시에만)
export async function autoBackupIfNeeded(
  data: UserTrainingData,
  userEmail?: string | null
): Promise<{ created: boolean; id?: string; reason?: string }> {
  if (!needsAutoBackup()) {
    return { created: false, reason: 'too-recent' };
  }
  // 데이터가 비어있으면 백업하지 않음
  const hasData = data.classes.length + data.practices.length + data.ownCompetitions.length > 0;
  if (!hasData) {
    return { created: false, reason: 'empty' };
  }
  try {
    const id = await createSnapshot(data, userEmail);
    return { created: true, id };
  } catch (e: any) {
    return { created: false, reason: e.message || 'error' };
  }
}
