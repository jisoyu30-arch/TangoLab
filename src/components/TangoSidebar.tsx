import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthButton } from './AuthButton';
import { BackupRestore } from './BackupRestore';

const COLLAPSED_KEY = 'tango_lab_sidebar_collapsed_groups';

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 그룹화된 네비게이션 — "우승 전략 랩실" 관점
interface NavItem {
  to: string;
  label: string;
  sub: string;
  num?: string;
  end?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Home',
    items: [
      { to: '/', label: 'Cover', sub: '표지', end: true },
    ],
  },
  {
    title: 'Championship Strategy',
    items: [
      { to: '/command', label: 'Command', sub: '우리 부부 허브', num: '♔' },
      { to: '/strategy', label: 'Game Plan', sub: '우승 전략 매트릭스', num: '◆' },
      { to: '/champions', label: 'Champions', sub: '우승자 분석', num: '★' },
      { to: '/weakness', label: 'Weakness', sub: '약점 해부', num: '✕' },
      { to: '/tanda-simulator', label: 'Simulator', sub: '탄다 시뮬레이터', num: '◎' },
      { to: '/collage', label: 'Collage', sub: '영상 콜라주', num: '▦' },
      { to: '/mundial', label: 'Year Stories', sub: 'Mundial 연도별', num: '01' },
      { to: '/trends', label: 'Trends', sub: '트렌드 분석', num: '02' },
      { to: '/compare-year', label: 'Cross-Year', sub: '연도 비교', num: '03' },
    ],
  },
  {
    title: 'Music & Orchestra',
    items: [
      { to: '/orchestra', label: 'Orchestras', sub: '악단 연구', num: '04' },
      { to: '/compare-orchestra', label: 'Duel', sub: '악단 비교', num: '05' },
      { to: '/vocalists', label: 'Voices', sub: '보컬리스트', num: '06' },
      { to: '/judges', label: 'Judges', sub: '심사위원', num: '07' },
    ],
  },
  {
    title: 'Song Database',
    items: [
      { to: '/songs', label: 'Archive', sub: '곡 아카이브', num: '08' },
      { to: '/tanda', label: 'Tandas', sub: '탄다 연구소', num: '09' },
      { to: '/results', label: 'Rankings', sub: '대회 순위', num: '10' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { to: '/ai', label: 'AI Tanda', sub: 'AI 탄다 추천', num: '11' },
      { to: '/quiz', label: 'Quiz', sub: '곡 맞추기', num: '12' },
      { to: '/chat', label: 'Q&A', sub: '탱고 Q&A', num: '13' },
    ],
  },
  {
    title: 'Our Journal',
    items: [
      { to: '/my-competitions', label: 'My Records', sub: '내 대회 기록', num: '14' },
      { to: '/training', label: 'Training', sub: '수업 & 연습', num: '15' },
      { to: '/practice', label: 'Practice', sub: '연습 보드', num: '16' },
      { to: '/compare', label: 'Compare', sub: '비교 연습실', num: '17' },
      { to: '/checklist', label: 'Prep', sub: '대회 체크리스트', num: '18' },
      { to: '/notes', label: 'Notes', sub: '공유 메모판', num: '19' },
      { to: '/favorites', label: 'Favorites', sub: '즐겨찾기', num: '20' },
    ],
  },
];

interface Props {
  onNavigate?: () => void;
}

export function TangoSidebar({ onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);

  // 다른 탭 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === COLLAPSED_KEY) setCollapsed(loadCollapsed());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleGroup = (title: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [title]: !prev[title] };
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside className="w-64 h-full bg-tango-shadow border-r border-tango-brass/20 flex flex-col flex-shrink-0">
      {/* 매거진 마스트헤드 */}
      <div className="p-5 border-b border-tango-brass/20">
        <div className="text-[9px] tracking-[0.3em] uppercase text-tango-brass mb-2 font-sans">
          Vol. 001 · {new Date().getFullYear()}
        </div>
        <h1 className="font-display italic text-2xl text-tango-paper leading-tight mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Tango Lab
        </h1>
        <div className="flex items-center gap-2">
          <div className="h-px w-4 bg-tango-brass/40"></div>
          <span className="text-tango-brass text-[10px]">◈</span>
          <div className="h-px flex-1 bg-tango-brass/40"></div>
        </div>
        <p className="text-[10px] text-tango-cream/60 mt-2 font-serif italic">Mundial 우승 전략 랩실</p>
      </div>

      {/* 네비 */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => {
          const isCollapsed = !!collapsed[group.title];
          // Home 그룹은 항상 펼침 (1개 항목이라)
          const collapsible = group.items.length > 1;
          return (
            <div key={gi} className="mb-3">
              <button
                onClick={() => collapsible && toggleGroup(group.title)}
                disabled={!collapsible}
                className={`w-full flex items-center justify-between px-3 py-2 group ${collapsible ? 'cursor-pointer hover:bg-tango-brass/5 rounded-sm' : ''}`}
              >
                <span className="text-[9px] tracking-[0.3em] uppercase text-tango-brass/60 font-sans">
                  — {group.title} —
                </span>
                {collapsible && (
                  <span className={`text-tango-brass/60 text-[10px] transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
                    ▶
                  </span>
                )}
              </button>
              {!isCollapsed && (
                <div className="space-y-px mt-1">
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `group w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-colors ${
                          isActive
                            ? 'bg-tango-brass/10 text-tango-brass'
                            : 'text-tango-cream/70 hover:bg-tango-brass/5 hover:text-tango-paper'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`text-[10px] font-sans ${isActive ? 'text-tango-brass' : item.num === '★' ? 'text-tango-rose' : 'text-tango-cream/40'}`}>
                            {item.num || ''}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-serif italic text-sm truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {item.label}
                            </div>
                            <div className="text-[10px] text-tango-cream/40 font-sans truncate">
                              {item.sub}
                            </div>
                          </div>
                          {isActive && <span className="text-tango-brass text-xs">◈</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 백업·복원 */}
      <div className="p-3 border-t border-tango-brass/20 space-y-2">
        <BackupRestore compact />
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="block w-full text-center text-[10px] tracking-[0.2em] uppercase text-tango-cream/50 hover:text-tango-brass transition-colors py-1"
        >
          ☁ 클라우드 백업 관리
        </NavLink>
      </div>

      {/* 로그인 */}
      <div className="p-3 border-t border-tango-brass/20">
        <AuthButton />
      </div>
    </aside>
  );
}
