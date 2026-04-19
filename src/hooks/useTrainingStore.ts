// 수업/연습/대회 기록 저장 훅 (localStorage + Firebase Firestore 하이브리드)
// 로그인 상태면 Firestore 우선, 아니면 localStorage만 사용
import { useState, useCallback, useEffect, useRef } from 'react';
import type { ClassRecord, PracticeLog, OwnCompetition, Judge, ScoreEntry, ScoreCriteria } from '../types/tango';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserData, subscribeToUserData } from '../lib/firestoreUserData';

interface TrainingData {
  classes: ClassRecord[];
  practices: PracticeLog[];
  ownCompetitions: OwnCompetition[];
}

const STORAGE_KEY = 'tango_lab_training_data';

const initialData: TrainingData = {
  classes: [],
  practices: [],
  ownCompetitions: [],
};

function loadLocal(): TrainingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    const parsed = JSON.parse(raw);
    return {
      classes: parsed.classes || [],
      practices: parsed.practices || [],
      ownCompetitions: parsed.ownCompetitions || [],
    };
  } catch (err) {
    console.error('Training data 로드 실패:', err);
    return initialData;
  }
}

function saveLocal(data: TrainingData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const EMPTY_CRITERIA: ScoreCriteria = {
  musicality: 0,
  technique: 0,
  elegance: 0,
  embrace: 0,
  floor_navigation: 0,
};

export function useTrainingStore() {
  const [data, setData] = useState<TrainingData>(loadLocal);
  const [userUid, setUserUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [userEmail, setUserEmail] = useState<string | null>(auth.currentUser?.email ?? null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const skipNextSaveRef = useRef(false); // 구독으로 내려온 데이터는 다시 업로드하지 않기

  // 인증 상태 추적
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserUid(u?.uid ?? null);
      setUserEmail(u?.email ?? null);
    });
    return () => unsub();
  }, []);

  // 로그인 시 Firestore 구독 + 마이그레이션
  useEffect(() => {
    if (!userUid) return;

    setSyncing(true);
    const unsub = subscribeToUserData(userUid, async (cloudData) => {
      setSyncing(false);
      if (!cloudData) {
        // 클라우드 데이터 없음 → 로컬 데이터를 마이그레이션
        const local = loadLocal();
        const hasLocal = local.classes.length + local.practices.length + local.ownCompetitions.length > 0;
        if (hasLocal) {
          try {
            await saveUserData(userUid, local, userEmail);
          } catch (e: any) {
            setSyncError(e.message);
          }
        }
      } else {
        // 클라우드 데이터 있음 → 로컬 덮어쓰기
        skipNextSaveRef.current = true;
        const merged: TrainingData = {
          classes: cloudData.classes || [],
          practices: cloudData.practices || [],
          ownCompetitions: cloudData.ownCompetitions || [],
        };
        setData(merged);
        saveLocal(merged);
      }
    });

    return () => unsub();
  }, [userUid]);

  // 데이터 변경시 저장 (localStorage + Firestore)
  const persist = useCallback((newData: TrainingData) => {
    setData(newData);
    saveLocal(newData);

    if (userUid) {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      // 비동기로 Firestore 업로드 (실패해도 로컬은 저장됨)
      saveUserData(userUid, newData, userEmail).catch((e) => {
        console.error('Firestore 동기화 실패:', e);
        setSyncError(e.message);
      });
    }
  }, [userUid, userEmail]);

  // === Classes ===
  const addClass = useCallback((partial: Partial<ClassRecord>): string => {
    const now = new Date().toISOString();
    const newClass: ClassRecord = {
      id: `class-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: '새 수업',
      instructor: '',
      location: '',
      duration_minutes: 60,
      topics: [],
      video_url: null,
      notes: '',
      key_takeaways: [],
      partner: null,
      created_at: now,
      updated_at: now,
      ...partial,
    };
    persist({ ...data, classes: [newClass, ...data.classes] });
    return newClass.id;
  }, [data, persist]);

  const updateClass = useCallback((id: string, updates: Partial<ClassRecord>) => {
    persist({
      ...data,
      classes: data.classes.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c),
    });
  }, [data, persist]);

  const deleteClass = useCallback((id: string) => {
    persist({ ...data, classes: data.classes.filter(c => c.id !== id) });
  }, [data, persist]);

  // === Practices ===
  const addPractice = useCallback((partial: Partial<PracticeLog>): string => {
    const newPractice: PracticeLog = {
      id: `practice-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 60,
      partner: '혼자',
      focus: [],
      notes: '',
      energy_level: null,
      created_at: new Date().toISOString(),
      ...partial,
    };
    persist({ ...data, practices: [newPractice, ...data.practices] });
    return newPractice.id;
  }, [data, persist]);

  const updatePractice = useCallback((id: string, updates: Partial<PracticeLog>) => {
    persist({
      ...data,
      practices: data.practices.map(p => p.id === id ? { ...p, ...updates } : p),
    });
  }, [data, persist]);

  const deletePractice = useCallback((id: string) => {
    persist({ ...data, practices: data.practices.filter(p => p.id !== id) });
  }, [data, persist]);

  // === Own Competitions ===
  const addOwnCompetition = useCallback((partial: Partial<OwnCompetition>): string => {
    const now = new Date().toISOString();
    const newComp: OwnCompetition = {
      id: `mycomp-${Date.now()}`,
      competition_name: partial.competition_name || '새 대회 기록',
      date: new Date().toISOString().split('T')[0],
      partner: '',
      category: 'pista',
      stage: 'qualifying',
      ronda_number: null,
      songs: [],
      judges: [],
      scores: [],
      video_url: null,
      video_note: '',
      result_placement: null,
      advanced_to_next: false,
      overall_notes: '',
      strengths: '',
      improvements: '',
      bib_number: null,
      created_at: now,
      updated_at: now,
      ...partial,
    };
    persist({ ...data, ownCompetitions: [newComp, ...data.ownCompetitions] });
    return newComp.id;
  }, [data, persist]);

  const updateOwnCompetition = useCallback((id: string, updates: Partial<OwnCompetition>) => {
    persist({
      ...data,
      ownCompetitions: data.ownCompetitions.map(c =>
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    });
  }, [data, persist]);

  const deleteOwnCompetition = useCallback((id: string) => {
    persist({ ...data, ownCompetitions: data.ownCompetitions.filter(c => c.id !== id) });
  }, [data, persist]);

  const addJudge = useCallback((compId: string, judge: Judge) => {
    const comp = data.ownCompetitions.find(c => c.id === compId);
    if (!comp) return;
    updateOwnCompetition(compId, { judges: [...comp.judges, judge] });
  }, [data, updateOwnCompetition]);

  const removeJudge = useCallback((compId: string, judgeIndex: number) => {
    const comp = data.ownCompetitions.find(c => c.id === compId);
    if (!comp) return;
    updateOwnCompetition(compId, { judges: comp.judges.filter((_, i) => i !== judgeIndex) });
  }, [data, updateOwnCompetition]);

  const addScore = useCallback((compId: string, judgeName: string) => {
    const comp = data.ownCompetitions.find(c => c.id === compId);
    if (!comp) return;
    const newScore: ScoreEntry = {
      judge_name: judgeName,
      criteria: { ...EMPTY_CRITERIA },
      total: 0,
      notes: '',
    };
    updateOwnCompetition(compId, { scores: [...comp.scores, newScore] });
  }, [data, updateOwnCompetition]);

  const updateScore = useCallback((compId: string, scoreIndex: number, updates: Partial<ScoreEntry>) => {
    const comp = data.ownCompetitions.find(c => c.id === compId);
    if (!comp) return;
    const newScores = comp.scores.map((s, i) => i === scoreIndex ? { ...s, ...updates } : s);
    updateOwnCompetition(compId, { scores: newScores });
  }, [data, updateOwnCompetition]);

  const removeScore = useCallback((compId: string, scoreIndex: number) => {
    const comp = data.ownCompetitions.find(c => c.id === compId);
    if (!comp) return;
    updateOwnCompetition(compId, { scores: comp.scores.filter((_, i) => i !== scoreIndex) });
  }, [data, updateOwnCompetition]);

  // === 통계 ===
  const weeklyPracticeMinutes = useCallback((): { date: string; minutes: number }[] => {
    const map = new Map<string, number>();
    for (const p of data.practices) {
      map.set(p.date, (map.get(p.date) || 0) + p.duration_minutes);
    }
    const now = new Date();
    const result: { date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, minutes: map.get(key) || 0 });
    }
    return result;
  }, [data.practices]);

  return {
    classes: data.classes,
    practices: data.practices,
    ownCompetitions: data.ownCompetitions,
    addClass, updateClass, deleteClass,
    addPractice, updatePractice, deletePractice,
    addOwnCompetition, updateOwnCompetition, deleteOwnCompetition,
    addJudge, removeJudge,
    addScore, updateScore, removeScore,
    weeklyPracticeMinutes,
    // 동기화 상태
    isSignedIn: !!userUid,
    syncing,
    syncError,
  };
}
