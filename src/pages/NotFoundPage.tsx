// 404 페이지 — 매거진 스타일
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="페이지 없음" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-2xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-4">
            Error · 404 · Page Not Found
          </div>
          <h1
            className="font-display text-tango-paper italic leading-none mb-6"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(5rem, 14vw, 10rem)' }}
          >
            <em className="text-tango-brass">Missing</em>
            <br />
            <span className="text-tango-paper">Page</span>
          </h1>
          <OrnamentDivider className="my-8" />
          <p className="font-serif italic text-xl md:text-2xl text-tango-cream/70 mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            이번 호에 실리지 않은 페이지입니다
          </p>
          <p className="text-sm text-tango-cream/50 mb-12 font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            URL을 다시 확인해보시거나, 아래 목차로 돌아가세요.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-tango-brass text-tango-ink font-serif italic text-lg hover:bg-tango-brass/90 transition-colors"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              ← 표지로
            </Link>
            <Link
              to="/songs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-tango-brass/40 text-tango-brass font-serif italic text-lg hover:bg-tango-brass/10 transition-colors"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              곡 아카이브
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
