// 첫 방문 온보딩 모달 — 간단 3단계
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrnamentDivider } from './editorial';

const STORAGE_KEY = 'tango_lab_onboarded';

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // 첫 방문시 1초 딜레이 후 표시
        const t = setTimeout(() => setOpen(true), 1000);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-tango-ink border border-tango-brass/30 rounded-sm max-w-lg w-full p-8 md:p-10 shadow-2xl animate-fade-in-up">
        <button
          onClick={close}
          className="absolute top-4 right-4 text-tango-cream/40 hover:text-tango-paper text-xl"
        >
          ×
        </button>

        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
          Welcome · {step + 1} / {STEPS.length}
        </div>

        <h2 className="font-display text-3xl md:text-4xl text-tango-paper italic mb-4 leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          {current.title}
        </h2>

        <p className="font-serif text-lg text-tango-cream/80 italic leading-relaxed mb-6" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          {current.body}
        </p>

        {current.preview && (
          <div className="bg-tango-shadow/60 border border-tango-brass/20 rounded-sm p-4 mb-6">
            {current.preview}
          </div>
        )}

        <OrnamentDivider className="mb-6" />

        <div className="flex items-center justify-between">
          <button
            onClick={close}
            className="text-xs text-tango-cream/50 hover:text-tango-paper font-sans tracking-wider uppercase"
          >
            건너뛰기
          </button>
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-tango-brass' : 'bg-tango-brass/20'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="px-5 py-2 bg-tango-brass text-tango-ink rounded-sm font-serif italic hover:bg-tango-brass/90 transition-colors"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {step === STEPS.length - 1 ? '시작하기 →' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const STEPS: Array<{ title: string; body: string; preview?: React.ReactNode }> = [
  {
    title: '환영합니다',
    body: '석정소유의 탱고랩 — Mundial 우승 도전 랩실. 데이터 분석 + 우리 부부 전략 + 연습 일지가 한 곳에.',
  },
  {
    title: '🎯 우승 전략 도구',
    body: '대회 준비 핵심 4 페이지:',
    preview: (
      <ul className="space-y-2 text-sm">
        <li>
          <Link to="/command" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ♔ Command Center
          </Link>
          <span className="text-tango-cream/70"> — 우리 부부 점수·심사위원 분석</span>
        </li>
        <li>
          <Link to="/strategy" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ◆ Game Plan
          </Link>
          <span className="text-tango-cream/70"> — 음악 4 × 차원 5 매트릭스</span>
        </li>
        <li>
          <Link to="/training/sequences" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ◈ Sequences
          </Link>
          <span className="text-tango-cream/70"> — 레퍼런스↔우리 영상 2분할</span>
        </li>
        <li>
          <Link to="/checklist" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            📋 Prep
          </Link>
          <span className="text-tango-cream/70"> — D-30 체크리스트, 다음 대회 D-day</span>
        </li>
      </ul>
    ),
  },
  {
    title: '📊 데이터 분석',
    body: '대회 데이터로 패턴을 읽고 약점을 찾습니다:',
    preview: (
      <ul className="space-y-2 text-sm">
        <li>
          <Link to="/trends" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            📈 Trends
          </Link>
          <span className="text-tango-cream/70"> — 연도별 악단 변천사</span>
        </li>
        <li>
          <Link to="/champions" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ★ Champions
          </Link>
          <span className="text-tango-cream/70"> — Mundial 우승자 패턴</span>
        </li>
        <li>
          <Link to="/weakness" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ✕ Weakness
          </Link>
          <span className="text-tango-cream/70"> — 약점 자동 진단</span>
        </li>
        <li>
          <Link to="/judges" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ⚖ Judges
          </Link>
          <span className="text-tango-cream/70"> — 심사위원 성향 카드</span>
        </li>
      </ul>
    ),
  },
  {
    title: '검색은 ⌘K / 슬래시(/)',
    body: '어디서나 `⌘K`(Mac) 또는 `Ctrl+K`(Windows)로 곡·악단·페이지를 즉시 검색. 한글 초성(ㄷㅇㄴ → D\'Arienzo)도 지원합니다.',
  },
  {
    title: '☁ 데이터 동기화',
    body: '로그인하시면 수업·연습·대회 기록이 모든 기기에 자동 동기화됩니다. 7일마다 클라우드 자동 백업 (최대 12개 스냅샷). 모바일은 홈 화면에 추가하면 앱처럼 작동.',
  },
];
