import { NavLink } from 'react-router-dom';

const BOTTOM_NAV_ITEMS = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/songs', label: '곡', icon: '🎵', end: false },
  { to: '/orchestra', label: '악단', icon: '🎻', end: false },
  { to: '/practice', label: '연습', icon: '📝', end: false },
  { to: '/compare', label: '비교', icon: '👀', end: false },
];

export function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-secretary-navy border-t border-secretary-gold/20 flex flex-row items-center justify-around z-50 px-2 pb-1">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive
                ? 'text-secretary-gold'
                : 'text-gray-500 hover:text-gray-300'
            }`
          }
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
