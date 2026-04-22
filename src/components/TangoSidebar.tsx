import { NavLink } from 'react-router-dom';
import { AuthButton } from './AuthButton';

const NAV_ITEMS = [
  { to: '/', label: 'Home', sub: '홈', num: '00', end: true },
  { to: '/songs', label: 'Songs', sub: '곡 아카이브', num: '01', end: false },
  { to: '/tanda', label: 'Tandas', sub: '탄다 연구소', num: '02', end: false },
  { to: '/orchestra', label: 'Orchestras', sub: '악단 연구', num: '03', end: false },
  { to: '/compare-orchestra', label: 'Duel', sub: '악단 비교', num: '03a', end: false },
  { to: '/judges', label: 'Judges', sub: '심사위원', num: '03b', end: false },
  { to: '/vocalists', label: 'Voices', sub: '보컬리스트', num: '03c', end: false },
  { to: '/compare-year', label: 'Cross-Year', sub: '연도 비교', num: '04a', end: false },
  { to: '/trends', label: 'Trends', sub: '트렌드 분석', num: '04', end: false },
  { to: '/results', label: 'Rankings', sub: '대회 순위', num: '05', end: false },
  { to: '/quiz', label: 'Quiz', sub: '곡 맞추기', num: '06', end: false },
  { to: '/ai', label: 'AI', sub: 'AI 탄다 추천', num: '07', end: false },
  { to: '/mundial', label: 'Features', sub: 'Mundial 스토리', num: '07a', end: false },
  { to: '/checklist', label: 'Prep', sub: '대회 체크리스트', num: '07b', end: false },
  { to: '/my-competitions', label: 'My Records', sub: '내 대회 기록', num: '08', end: false },
  { to: '/training', label: 'Training', sub: '수업 & 연습', num: '09', end: false },
  { to: '/practice', label: 'Practice', sub: '연습 보드', num: '10', end: false },
  { to: '/compare', label: 'Compare', sub: '비교 연습실', num: '11', end: false },
  { to: '/notes', label: 'Notes', sub: '공유 메모판', num: '12', end: false },
  { to: '/favorites', label: 'Favorites', sub: '즐겨찾기', num: '13', end: false },
  { to: '/chat', label: 'Q&A', sub: '탱고 Q&A', num: '14', end: false },
];

interface Props {
  onNavigate?: () => void;
}

export function TangoSidebar({ onNavigate }: Props) {
  return (
    <aside className="w-64 h-full bg-tango-shadow border-r border-tango-brass/20 flex flex-col flex-shrink-0">
      {/* 로고 / 타이틀 영역 — 매거진 발행 정보 스타일 */}
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
        <p className="text-[10px] text-tango-cream/60 mt-2 font-serif italic">석정소유의 탱고 매거진</p>
      </div>

      {/* 네비 */}
      <nav className="flex-1 p-2 space-y-px overflow-y-auto">
        <div className="text-[9px] tracking-[0.3em] uppercase text-tango-brass/60 font-sans px-3 py-3">
          — Contents —
        </div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${
                isActive
                  ? 'bg-tango-brass/10 text-tango-brass'
                  : 'text-tango-cream/70 hover:bg-tango-brass/5 hover:text-tango-paper'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-[10px] font-sans ${isActive ? 'text-tango-brass' : 'text-tango-cream/40'}`}>
                  {item.num}
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
      </nav>

      {/* 로그인 */}
      <div className="p-3 border-t border-tango-brass/20">
        <AuthButton />
      </div>
    </aside>
  );
}
