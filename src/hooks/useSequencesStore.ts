// 우리가 익혀야 할 시퀀스 라이브러리 (수업 페이지 산하)
// 각 시퀀스 = 이름 + 설명 + 1개 레퍼런스 영상 + N개 우리 연습 영상 (날짜순)
import { useState, useEffect, useCallback } from 'react';

export interface PracticeClip {
  id: string;
  url: string;
  date: string; // YYYY-MM-DD
  note?: string;
  added_at: string;
}

export interface SequenceItem {
  id: string;
  title: string;
  description: string;
  music_type?: 'rhythmic' | 'melodic' | 'show' | 'traditional' | '';
  reference_url: string;
  reference_label?: string;
  practice_clips: PracticeClip[];
  status: 'learning' | 'practicing' | 'mastered';
  tags: string[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'tango_lab_sequences';

function load(): SequenceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(list: SequenceItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useSequencesStore() {
  const [sequences, setSequences] = useState<SequenceItem[]>(load);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSequences(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addSequence = useCallback((partial: Partial<SequenceItem> = {}): string => {
    const now = new Date().toISOString();
    const newSeq: SequenceItem = {
      id: `seq-${Date.now()}`,
      title: '새 시퀀스',
      description: '',
      music_type: '',
      reference_url: '',
      practice_clips: [],
      status: 'learning',
      tags: [],
      created_at: now,
      updated_at: now,
      ...partial,
    };
    setSequences(prev => {
      const next = [newSeq, ...prev];
      save(next);
      return next;
    });
    return newSeq.id;
  }, []);

  const updateSequence = useCallback((id: string, patch: Partial<SequenceItem>) => {
    setSequences(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch, updated_at: new Date().toISOString() } : s);
      save(next);
      return next;
    });
  }, []);

  const deleteSequence = useCallback((id: string) => {
    setSequences(prev => {
      const next = prev.filter(s => s.id !== id);
      save(next);
      return next;
    });
  }, []);

  const addPracticeClip = useCallback((seqId: string, url: string, note?: string, date?: string) => {
    setSequences(prev => {
      const next = prev.map(s => {
        if (s.id !== seqId) return s;
        const clip: PracticeClip = {
          id: `clip-${Date.now()}`,
          url: url.trim(),
          note: note?.trim(),
          date: date || new Date().toISOString().split('T')[0],
          added_at: new Date().toISOString(),
        };
        return {
          ...s,
          practice_clips: [...s.practice_clips, clip].sort((a, b) => b.date.localeCompare(a.date)),
          updated_at: new Date().toISOString(),
        };
      });
      save(next);
      return next;
    });
  }, []);

  const removePracticeClip = useCallback((seqId: string, clipId: string) => {
    setSequences(prev => {
      const next = prev.map(s => {
        if (s.id !== seqId) return s;
        return {
          ...s,
          practice_clips: s.practice_clips.filter(c => c.id !== clipId),
          updated_at: new Date().toISOString(),
        };
      });
      save(next);
      return next;
    });
  }, []);

  return {
    sequences,
    addSequence,
    updateSequence,
    deleteSequence,
    addPracticeClip,
    removePracticeClip,
  };
}

// YouTube/Instagram 임베드 URL 추출
export function extractEmbed(url: string): { type: 'youtube' | 'instagram' | 'other'; embedUrl?: string; thumbnail?: string } {
  if (!url) return { type: 'other' };
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&enablejsapi=1`,
      thumbnail: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/);
  if (ig) {
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/p/${ig[1]}/embed`,
    };
  }
  return { type: 'other' };
}
