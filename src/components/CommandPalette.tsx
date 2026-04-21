// Universal Search — Cmd+K 커맨드 팔레트
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import songsData from '../data/songs.json';
import orchestrasData from '../data/orchestras.json';
import competitionsData from '../data/competitions.json';
import type { Song, Orchestra, Competition } from '../types/tango';
import { matchesKoreanChosung } from '../utils/koreanSearch';

const songs = songsData as Song[];
const orchestras = orchestrasData as Orchestra[];
const competitions = competitionsData as Competition[];

interface Result {
  type: 'song' | 'orchestra' | 'page' | 'competition';
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  to: string;
}

const PAGES: Array<{ title: string; to: string; keywords: string[] }> = [
  { title: '홈', to: '/', keywords: ['home', 'main'] },
  { title: '곡 아카이브', to: '/songs', keywords: ['songs', 'archive', '곡', '아카이브'] },
  { title: '탄다 연구소', to: '/tanda', keywords: ['tanda', 'tandas', '탄다'] },
  { title: '악단 연구', to: '/orchestra', keywords: ['orchestra', '악단'] },
  { title: '트렌드 분석', to: '/trends', keywords: ['trends', '트렌드', '분석'] },
  { title: '대회 순위', to: '/results', keywords: ['results', 'rankings', '순위'] },
  { title: '곡 퀴즈', to: '/quiz', keywords: ['quiz', '퀴즈'] },
  { title: 'AI 탄다 추천', to: '/ai', keywords: ['ai', '추천'] },
  { title: '내 대회 기록', to: '/my-competitions', keywords: ['my', 'competitions', '대회'] },
  { title: '수업 & 연습', to: '/training', keywords: ['training', 'class', '수업', '연습'] },
  { title: '연습 보드', to: '/practice', keywords: ['practice', '연습', '보드'] },
  { title: '비교 연습실', to: '/compare', keywords: ['compare', '비교'] },
  { title: '공유 메모판', to: '/notes', keywords: ['notes', '메모'] },
  { title: '탱고 Q&A', to: '/chat', keywords: ['qa', 'chat', '질문'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 단축키: Cmd/Ctrl+K 또는 /
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === '/' && !isTyping(e.target as Element)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo((): Result[] => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // 빈 상태: 자주 쓰는 페이지만
      return PAGES.slice(0, 8).map(p => ({
        type: 'page',
        id: p.to,
        title: p.title,
        icon: '◈',
        to: p.to,
      }));
    }

    const hits: Result[] = [];

    // 페이지 검색 (한글 초성 포함)
    for (const p of PAGES) {
      if (
        matchesKoreanChosung(q, p.title) ||
        p.keywords.some(k => matchesKoreanChosung(q, k))
      ) {
        hits.push({ type: 'page', id: p.to, title: p.title, icon: '→', to: p.to });
      }
    }

    // 곡 검색 (한글 초성 포함)
    for (const s of songs) {
      if (hits.length > 30) break;
      if (
        matchesKoreanChosung(q, s.title) ||
        matchesKoreanChosung(q, s.orchestra || '') ||
        matchesKoreanChosung(q, s.vocalist || '')
      ) {
        hits.push({
          type: 'song',
          id: s.song_id,
          title: s.title,
          subtitle: `${s.orchestra || '미상'}${s.vocalist ? ' · ' + s.vocalist : ''}${s.recording_date ? ' · ' + s.recording_date : ''}`,
          icon: '♪',
          to: `/song/${s.song_id}`,
        });
      }
    }

    // 악단 검색 (한글 초성 포함)
    for (const o of orchestras) {
      if (hits.length > 40) break;
      if (
        matchesKoreanChosung(q, o.orchestra_name) ||
        (o.alt_names || []).some(n => matchesKoreanChosung(q, n))
      ) {
        hits.push({
          type: 'orchestra',
          id: o.orchestra_id,
          title: o.orchestra_name,
          subtitle: o.alt_names?.[0] || '',
          icon: '♫',
          to: `/orchestra?id=${o.orchestra_id}`,
        });
      }
    }

    // 대회 검색
    for (const c of competitions) {
      if (hits.length > 45) break;
      if (
        c.competition_name.toLowerCase().includes(q) ||
        (c.alt_names || []).some(n => n.toLowerCase().includes(q))
      ) {
        hits.push({
          type: 'competition',
          id: c.competition_id,
          title: c.competition_name,
          subtitle: c.country,
          icon: '🏆',
          to: `/results`,
        });
      }
    }

    return hits.slice(0, 30);
  }, [query]);

  const go = useCallback((r: Result) => {
    navigate(r.to);
    setOpen(false);
  }, [navigate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selected]) go(results[selected]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, selected, go]);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden md:flex fixed bottom-6 right-6 items-center gap-2 px-4 py-2.5 bg-tango-shadow border border-tango-brass/30 rounded-full text-xs text-tango-cream/70 hover:border-tango-brass/60 hover:text-tango-paper shadow-lg transition-all z-40"
      title="검색 (Cmd+K / /)"
    >
      <span className="text-tango-brass">◈</span>
      <span className="font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>검색</span>
      <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 border border-tango-brass/30 rounded font-sans">⌘K</kbd>
    </button>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] max-w-full z-[101] animate-fade-in-up">
        <div className="bg-tango-shadow border border-tango-brass/30 rounded-sm shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-tango-brass/20">
            <span className="text-tango-brass text-lg">◈</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
              placeholder="곡, 악단, 페이지 검색…"
              className="flex-1 bg-transparent border-0 text-tango-paper placeholder-tango-cream/30 focus:outline-none font-serif text-lg italic"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            />
            <kbd className="text-[10px] px-1.5 py-0.5 border border-tango-brass/30 rounded text-tango-cream/50 font-sans">ESC</kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 && query && (
              <div className="px-5 py-8 text-center text-tango-cream/50 font-serif italic">
                결과 없음
              </div>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onClick={() => go(r)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-4 px-5 py-3 text-left border-b border-tango-brass/10 transition-colors ${
                  selected === i ? 'bg-tango-brass/10' : 'hover:bg-tango-brass/5'
                }`}
              >
                <span className="text-tango-brass text-lg w-6 text-center">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-serif italic text-base text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {r.title}
                  </div>
                  {r.subtitle && (
                    <div className="text-[11px] text-tango-cream/50 truncate font-sans mt-0.5">
                      {r.subtitle}
                    </div>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-tango-cream/40 font-sans">
                  {r.type === 'song' ? 'Song' : r.type === 'orchestra' ? 'Orchestra' : r.type === 'page' ? 'Page' : 'Comp'}
                </span>
              </button>
            ))}
          </div>
          <div className="px-5 py-2 border-t border-tango-brass/20 flex items-center justify-between text-[10px] text-tango-cream/40 font-sans">
            <span>↑↓ 이동 · Enter 선택 · ESC 닫기</span>
            <span>{results.length}개</span>
          </div>
        </div>
      </div>
    </>
  );
}

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}
