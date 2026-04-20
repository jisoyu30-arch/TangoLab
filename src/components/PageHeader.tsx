import { useSidebar } from './TangoLayout';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function PageHeader({ title, onBack, right }: PageHeaderProps) {
  const { openSidebar } = useSidebar();

  return (
    <header className="h-14 border-b border-tango-brass/20 bg-tango-shadow/80 backdrop-blur-sm flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-tango-cream/60 hover:text-tango-brass text-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          >
            ←
          </button>
        ) : (
          <button
            onClick={openSidebar}
            className="md:hidden text-tango-brass text-lg min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          >
            ☰
          </button>
        )}
        <h2 className="font-serif italic text-base md:text-lg text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          {title}
        </h2>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  );
}
