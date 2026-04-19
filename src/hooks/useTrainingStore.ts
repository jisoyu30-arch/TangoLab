// 수업/연습/대회 기록 localStorage 저장 훅
import { useState, useCallback } from 'react';
import type { ClassRecord, PracticeLog, OwnCompetition, Judge, ScoreEntry, ScoreCriteria } from '../types/tango';

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

function loadData(): TrainingData {
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

const EMPTY_CRITERIA: ScoreCriteria = {
  musicality: 0,
  technique: 0,
  elegance: 0,
  embrace: 0,
  floor_navigation: 0,
};

export function useTrainingStore() {
  const [data, setData] = useState<TrainingData>(loadData);

  const persist = useCallback((newData: TrainingData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

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
  };
}
