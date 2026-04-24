import { useSidebar } from './TangoLayout';
import { usePageMeta } from '../hooks/usePageMeta';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** 문서 title을 자동 설정할지. SongDetailPage처럼 이미 설정하면 false */
  autoMeta?: boolean;
}

export function PageHeader({ title, onBack, right, autoMeta = true }: PageHeaderProps) {
  const { openSidebar } = useSidebar();

  // 자동으로 document.title 설정
  usePageMeta(autoMeta ? { title } : {});

  return (
    <header className="h-14 border-b border-tango-brass/20 bg-tango-shadow/80 backdrop-blur-sm flex items-center justify-between px-2 md:px-4 flex-shrink-0">
      <div className="flex items-center gap-1 md:gap-3 min-w-0">
        {/* 뒤로가기 (onBack 있을 때만) */}
        {onBack && (
          <button
            onClick={onBack}
            className="text-tango-cream/60 hover:text-tango-brass text-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
            aria-label="뒤로가기"
          >
            ←
          </button>
        )}
        {/* 햄버거 (모바일에서 항상) */}
        <button
          onClick={openSidebar}
          className="md:hidden text-tango-brass text-lg min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          aria-label="메뉴 열기"
        >
          ☰
        </button>
        <h2 className="font-serif italic text-base md:text-lg text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          {title}
        </h2>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  );
}
