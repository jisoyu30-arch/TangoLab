import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

const MAIN_NAV = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/songs', label: '곡', icon: '🎵', end: false },
  { to: '/orchestra', label: '악단', icon: '🎻', end: false },
  { to: '/tanda', label: '탄다', icon: '🎼', end: false },
];

const MORE_ITEMS = [
  { to: '/training', label: '수업 & 연습', icon: '🎓' },
  { to: '/my-competitions', label: '내 대회 기록', icon: '🏅' },
  { to: '/practice', label: '연습 보드', icon: '📝' },
  { to: '/compare', label: '비교 연습실', icon: '👀' },
  { to: '/results', label: '대회 순위', icon: '🏆' },
  { to: '/chat', label: '탱고 Q&A', icon: '💬' },
];

export function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const isMoreActive = MORE_ITEMS.some(item => location.pathname.startsWith(item.to));

  return (
    <>
      {/* 더보기 팝업 */}
      {showMore && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowMore(false)} />
          <div className="md:hidden fixed bottom-16 left-2 right-2 bg-tango-shadow border border-tango-brass/20 rounded-xl shadow-2xl z-50 p-2">
            {MORE_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-tango-brass/10 text-tango-brass' : 'text-gray-300 hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}

      {/* 하단 탭 바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-tango-shadow border-t border-tango-brass/20 flex flex-row items-center justify-around z-50 px-2 pb-1">
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
          <span className="text-xl leading-none">⋯</span>
          <span className="text-[10px] font-medium leading-none">더보기</span>
        </button>
      </nav>
    </>
  );
}
