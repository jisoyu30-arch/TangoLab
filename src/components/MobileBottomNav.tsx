import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

// 메인 탭 5개 — 작가님 부부 우승 전략 기준 우선순위
const MAIN_NAV = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/command', label: 'Command', icon: '♔', end: false },
  { to: '/tanda-simulator', label: '시뮬', icon: '◎', end: false },
  { to: '/champions', label: '우승자', icon: '★', end: false },
];

// 더보기 — 카테고리별 그룹화
const MORE_GROUPS: Array<{ title: string; items: Array<{ to: string; label: string; icon: string }> }> = [
  {
    title: 'Championship Strategy',
    items: [
      { to: '/mundial', label: 'Year Stories', icon: '📚' },
      { to: '/trends', label: '트렌드 분석', icon: '📈' },
      { to: '/compare-year', label: '연도 비교', icon: '🔀' },
    ],
  },
  {
    title: 'Music & Orchestra',
    items: [
      { to: '/orchestra', label: '악단 연구', icon: '🎻' },
      { to: '/compare-orchestra', label: '악단 비교', icon: '⚔' },
      { to: '/vocalists', label: '보컬리스트', icon: '🎤' },
      { to: '/judges', label: '심사위원', icon: '⚖' },
    ],
  },
  {
    title: 'Song Database',
    items: [
      { to: '/songs', label: '곡 아카이브', icon: '🎵' },
      { to: '/tanda', label: '탄다 연구소', icon: '🎼' },
      { to: '/results', label: '대회 순위', icon: '🏆' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { to: '/ai', label: 'AI 탄다 추천', icon: '✨' },
      { to: '/quiz', label: '곡 퀴즈', icon: '🎧' },
      { to: '/chat', label: '탱고 Q&A', icon: '💬' },
    ],
  },
  {
    title: 'Our Journal',
    items: [
      { to: '/my-competitions', label: '내 대회 기록', icon: '🏅' },
      { to: '/training', label: '수업 & 연습', icon: '🎓' },
      { to: '/practice', label: '연습 보드', icon: '📝' },
      { to: '/compare', label: '비교 연습실', icon: '👀' },
      { to: '/checklist', label: '대회 체크리스트', icon: '✅' },
      { to: '/notes', label: '공유 메모', icon: '🖋' },
      { to: '/favorites', label: '즐겨찾기', icon: '⭐' },
    ],
  },
];

const ALL_MORE_PATHS = MORE_GROUPS.flatMap(g => g.items.map(i => i.to));

export function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const isMoreActive = ALL_MORE_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <>
      {/* 더보기 팝업 - 풀스크린 시트 */}
      {showMore && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setShowMore(false)} />
          <div className="md:hidden fixed bottom-16 left-0 right-0 max-h-[75vh] bg-tango-shadow border-t border-tango-brass/30 rounded-t-xl shadow-2xl z-50 overflow-y-auto">
            {/* 핸들 */}
            <div className="sticky top-0 bg-tango-shadow z-10 border-b border-tango-brass/10">
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-tango-brass/30 rounded-full" />
              </div>
              <div className="px-4 pb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">Navigate</span>
                <button
                  onClick={() => setShowMore(false)}
                  className="text-tango-cream/60 hover:text-red-400 text-sm px-2"
                >
                  ✕ 닫기
                </button>
              </div>
            </div>

            {/* 그룹별 렌더 */}
            <div className="p-2 space-y-3 pb-6">
              {MORE_GROUPS.map(group => (
                <div key={group.title}>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-tango-cream/40 font-sans px-3 py-1.5">
                    — {group.title} —
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowMore(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive ? 'bg-tango-brass/15 text-tango-brass border border-tango-brass/30' : 'text-gray-300 hover:bg-white/5 border border-transparent'
                          }`
                        }
                      >
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 하단 탭 바 — 5 icons */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-tango-shadow border-t border-tango-brass/20 flex flex-row items-center justify-around z-50 px-1 pb-1">
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-tango-brass' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
        {/* 더보기 버튼 */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isMoreActive || showMore ? 'text-tango-brass' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="text-xl leading-none">{showMore ? '✕' : '⋯'}</span>
          <span className="text-[10px] font-medium leading-none">{showMore ? '닫기' : '더보기'}</span>
        </button>
      </nav>
    </>
  );
}
