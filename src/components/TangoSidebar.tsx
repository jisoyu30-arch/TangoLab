import { NavLink } from 'react-router-dom';
import { AuthButton } from './AuthButton';

const NAV_ITEMS = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/songs', label: '곡 아카이브', icon: '🎵', end: false },
  { to: '/tanda', label: '탄다 연구소', icon: '🔗', end: false },
  { to: '/orchestra', label: '악단 연구', icon: '🎻', end: false },
  { to: '/results', label: '대회 순위', icon: '🏆', end: false },
  { to: '/my-competitions', label: '내 대회 기록', icon: '🏅', end: false },
  { to: '/training', label: '수업 & 연습', icon: '🎓', end: false },
  { to: '/practice', label: '연습 보드', icon: '📋', end: false },
  { to: '/compare', label: '비교 연습실', icon: '🔍', end: false },
  { to: '/chat', label: '탱고 Q&A', icon: '💬', end: false },
];

interface Props {
  onNavigate?: () => void;
}

export function TangoSidebar({ onNavigate }: Props) {
  return (
    <aside className="w-64 h-full bg-secretary-navy border-r border-secretary-gold/20 flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-secretary-gold/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secretary-gold/20 flex items-center justify-center text-xl">
          💃
        </div>
        <div>
          <h1 className="text-base font-bold text-secretary-gold leading-tight">석정소유의 탱고랩</h1>
          <p className="text-xs text-gray-400">Tango Competition Lab</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-secretary-gold/10 text-secretary-gold'
                  : 'text-gray-400 hover:bg-white/5'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 로그인/로그아웃 */}
      <div className="p-3 border-t border-secretary-gold/20">
        <AuthButton />
      </div>
    </aside>
  );
}
