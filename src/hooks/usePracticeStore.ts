import { useState, useCallback } from 'react';
import type { PracticeBoard, PracticeNote, CompareSession } from '../types/tango';

interface PracticeData {
  boards: PracticeBoard[];
  compareSessions: CompareSession[];
}

const STORAGE_KEY = 'tango_lab_practice_data';

const initialData: PracticeData = {
  boards: [
    {
      id: 'default-board-1',
      title: '이번 주 연습곡',
      description: '정규 연습 및 소셜을 위한 기본 보드',
      song_ids: [],
      notes: [],
      checkpoints: ['기본축 확인', '바라기 타이밍 맞추기'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  compareSessions: []
};

// 로컬 스토리지에서 데이터 로드
function loadData(): PracticeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse local storage data:', err);
    return initialData;
  }
}

export function usePracticeStore() {
  const [data, setData] = useState<PracticeData>(loadData);

  const persistData = useCallback((newData: PracticeData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const addBoard = (title: string, description: string = '') => {
    const newBoard: PracticeBoard = {
      id: `board-${Date.now()}`,
      title,
      description,
      song_ids: [],
      notes: [],
      checkpoints: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    persistData({ ...data, boards: [...data.boards, newBoard] });
  };

  const updateBoard = (id: string, updates: Partial<PracticeBoard>) => {
    persistData({
      ...data,
      boards: data.boards.map(b => b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b)
    });
  };

  const deleteBoard = (id: string) => {
    persistData({
      ...data,
      boards: data.boards.filter(b => b.id !== id)
    });
  };

  const addSongToBoard = (boardId: string, songId: string) => {
    persistData({
      ...data,
      boards: data.boards.map(b => b.id === boardId && !b.song_ids.includes(songId) 
        ? { ...b, song_ids: [...b.song_ids, songId], updated_at: new Date().toISOString() } 
        : b)
    });
  };

  const removeSongFromBoard = (boardId: string, songId: string) => {
    persistData({
      ...data,
      boards: data.boards.map(b => b.id === boardId 
        ? { ...b, song_ids: b.song_ids.filter(id => id !== songId), updated_at: new Date().toISOString() } 
        : b)
    });
  };

  const addNoteToBoard = (boardId: string, content: string, songId: string | null = null, tags: string[] = []) => {
    const newNote: PracticeNote = {
      id: `note-${Date.now()}`,
      board_id: boardId,
      song_id: songId,
      content,
      tags,
      created_at: new Date().toISOString()
    };
    persistData({
      ...data,
      boards: data.boards.map(b => b.id === boardId 
        ? { ...b, notes: [...b.notes, newNote], updated_at: new Date().toISOString() } 
        : b)
    });
  };

  const addCompareSession = (title: string, songId: string | null, referenceVideoUrl: string = '', ownVideoUrl: string = ''): string => {
    const sessionId = `compare-${Date.now()}`;
    const newSession: CompareSession = {
      id: sessionId,
      title,
      song_id: songId,
      reference_video_url: referenceVideoUrl,
      own_video_url: ownVideoUrl,
      checklist: [
        { key: 'musicality', label: '음악 해석 일치도', checked: false },
        { key: 'frame', label: '프레임 유지', checked: false },
        { key: 'connection', label: '호흡 및 레가토 연결', checked: false }
      ],
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    persistData({ ...data, compareSessions: [...data.compareSessions, newSession] });
    return sessionId;
  };

  const updateCompareSession = (id: string, updates: Partial<CompareSession>) => {
    persistData({
      ...data,
      compareSessions: data.compareSessions.map(cs => cs.id === id ? { ...cs, ...updates, updated_at: new Date().toISOString() } : cs)
    });
  };

  const deleteCompareSession = (id: string) => {
    persistData({
      ...data,
      compareSessions: data.compareSessions.filter(cs => cs.id !== id)
    });
  };

  return {
    boards: data.boards,
    compareSessions: data.compareSessions,
    addBoard,
    updateBoard,
    deleteBoard,
    addSongToBoard,
    removeSongFromBoard,
    addNoteToBoard,
    addCompareSession,
    updateCompareSession,
    deleteCompareSession
  };
}

