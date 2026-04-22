// 단축키 도움말 모달 — ? 키로 열기
import { useState, useEffect } from 'react';
import { OrnamentDivider } from './editorial';

export function KeyboardHelpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || target.isContentEditable;

      if (e.key === '?' && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="relative bg-tango-ink border border-tango-brass/30 rounded-sm max-w-md w-full p-6 md:p-8 shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-tango-cream/40 hover:text-tango-paper text-xl w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>

        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
          Keyboard Shortcuts
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          키보드 <em className="text-tango-brass">단축키</em>
        </h2>

        <div className="space-y-3 mb-6">
          <ShortcutRow keys={['⌘', 'K']} label="검색 (Windows: Ctrl+K)" />
          <ShortcutRow keys={['/']} label="빠른 검색" />
          <ShortcutRow keys={['?']} label="이 도움말" />
          <ShortcutRow keys={['Esc']} label="닫기" />
          <ShortcutRow keys={['↑', '↓']} label="검색 결과 탐색" />
          <ShortcutRow keys={['Enter']} label="선택" />
        </div>

        <OrnamentDivider />

        <p className="text-[11px] text-tango-cream/50 mt-4 font-serif italic text-center" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          한글 초성 검색도 지원합니다 — "ㄷㅇㄹ" → D'Arienzo
        </p>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[28px] px-2 py-1 text-xs text-tango-brass border border-tango-brass/40 rounded-sm font-sans bg-tango-shadow/50"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="font-serif italic text-sm text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        {label}
      </span>
    </div>
  );
}
