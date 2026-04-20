// 공유 버튼 — URL 복사 / Web Share API
import { useState } from 'react';

interface Props {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export function ShareButton({ title, text, url, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;
    const shareText = text || '';

    // Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // fallthrough to clipboard
      }
    }

    // Fallback: clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-serif italic text-tango-brass hover:bg-tango-brass/10 border border-tango-brass/30 hover:border-tango-brass rounded-sm transition-all ${className}`}
      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      title="공유하기"
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>링크 복사됨</span>
        </>
      ) : (
        <>
          <span>◈</span>
          <span>공유</span>
        </>
      )}
    </button>
  );
}
