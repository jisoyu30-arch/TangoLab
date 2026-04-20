// 즐겨찾기 하트 버튼
import { useFavoriteButton } from '../hooks/useFavorites';
import type { FavoriteType } from '../hooks/useFavorites';

interface Props {
  type: FavoriteType;
  id: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FavoriteButton({ type, id, title, size = 'md', className = '' }: Props) {
  const { active, onClick } = useFavoriteButton(type, id, title);

  const sizeCls = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-xl',
  }[size];

  return (
    <button
      onClick={onClick}
      title={active ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      className={`inline-flex items-center justify-center rounded-full transition-all ${sizeCls} ${
        active
          ? 'text-tango-rose bg-tango-burgundy/20 hover:bg-tango-burgundy/30'
          : 'text-tango-cream/30 hover:text-tango-rose hover:bg-tango-rose/10'
      } ${className}`}
    >
      {active ? '♥' : '♡'}
    </button>
  );
}
