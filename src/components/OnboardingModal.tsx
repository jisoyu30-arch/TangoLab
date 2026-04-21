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
    body: '석정소유의 탱고랩은 Mundial, KTC 등 대회 음악을 분석하고 탄다를 연구하는 에디토리얼 매거진입니다. 638개의 곡과 332개의 라운드 데이터가 정리되어 있습니다.',
  },
  {
    title: '어디서 시작하시겠어요?',
    body: '3가지 주요 섹션이 있습니다:',
    preview: (
      <ul className="space-y-3 text-sm">
        <li>
          <Link to="/trends" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            📈 트렌드 분석
          </Link>
          <span className="text-tango-cream/70"> — 연도별 악단 인기 변천사</span>
        </li>
        <li>
          <Link to="/tanda" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            🎼 탄다 연구소
          </Link>
          <span className="text-tango-cream/70"> — 3곡 조합 패턴 + AI 해설</span>
        </li>
        <li>
          <Link to="/ai" className="text-tango-brass hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            ✨ AI 추천
          </Link>
          <span className="text-tango-cream/70"> — 맞춤 탄다 설계</span>
        </li>
      </ul>
    ),
  },
  {
    title: '검색은 ⌘K / 슬래시(/)',
    body: '어디서나 `⌘K`(Mac) 또는 `Ctrl+K`(Windows)로 곡·악단·페이지를 즉시 검색. 한글 초성(ㄷㅇㄴ → D\'Arienzo)도 지원합니다.',
  },
  {
    title: '모바일에서도',
    body: '홈 화면에 추가하면 앱처럼 작동합니다. 로그인하시면 연습·대회·메모가 모든 기기에 자동 동기화됩니다.',
  },
];
