import { useSidebar } from './TangoLayout';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function PageHeader({ title, onBack, right }: PageHeaderProps) {
  const { openSidebar } = useSidebar();

  return (
    <header className="h-14 border-b border-secretary-gold/20 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* 모바일: 뒤로가기 없으면 햄버거, 있으면 뒤로가기 */}
        {onBack ? (
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-secretary-gold text-sm transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          >
            ←
          </button>
        ) : (
          <button
            onClick={openSidebar}
            className="md:hidden text-secretary-gold text-lg min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          >
            ☰
          </button>
        )}
        <h2 className="text-sm font-semibold text-gray-300 truncate">{title}</h2>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  );
}
