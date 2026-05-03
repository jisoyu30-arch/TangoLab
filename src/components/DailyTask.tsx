// D-day 기반 오늘의 추천 액션 — 단계별 1개씩
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TARGET_KEY = 'tango_lab_checklist_target';

function loadTarget(): { name: string; date: string } | null {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    return t.date ? t : null;
  } catch {
    return null;
  }
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

interface DailyTask {
  category: string;
  text: string;
  link?: string;
  link_label?: string;
  emoji: string;
}

// D-day 단계별 오늘 할 일 풀
function getTaskForDay(dDay: number): DailyTask | null {
  if (dDay > 30) {
    // D-30 이전 — 큰 그림 잡기
    const pool: DailyTask[] = [
      { category: 'D-30+', emoji: '🎵', text: '대회 선곡 패턴 분석 — 지난 대회의 공통 흐름 파악', link: '/trends', link_label: '트렌드 분석' },
      { category: 'D-30+', emoji: '◆', text: '전략 매트릭스 1셀 채우기 — 음악 분류 1개씩 차원 1개 정리', link: '/strategy', link_label: '전략 매트릭스' },
      { category: 'D-30+', emoji: '👗', text: '의상 점검 — 신발·드레스·이너 헤드 카운트', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-30+', emoji: '🏃', text: '컨디션 베이스라인 — 주간 PT/연습 시간 확보', link: '/training', link_label: 'Training' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (dDay > 21) {
    // D-30 ~ D-21 — 음악 + 약점
    const pool: DailyTask[] = [
      { category: 'D-30', emoji: '🎵', text: '예상 악단 3곡 조합 구상 (밀롱가/피스타/발스)', link: '/tanda-simulator', link_label: '탄다 시뮬레이터' },
      { category: 'D-30', emoji: '✕', text: '약점 1가지 노트화 — 어떤 심사위원이 짜게 줬는지', link: '/weakness', link_label: '약점 해부' },
      { category: 'D-30', emoji: '◆', text: '매트릭스 약한 음악 분류 보강 (오늘 1셀)', link: '/strategy', link_label: '전략' },
      { category: 'D-30', emoji: '🩰', text: '시퀀스 라이브러리 1개 영상 추가 (참고 또는 우리)', link: '/training/sequences', link_label: '시퀀스' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (dDay > 14) {
    // D-21 ~ D-14 — 테크닉 집중
    const pool: DailyTask[] = [
      { category: 'D-21', emoji: '🩰', text: '테크닉 약점 3가지 노트화 (구체적 동작·시점)', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-21', emoji: '⏱', text: '오늘 연습 60분 + focus 1개 (예: 발스 워킹)', link: '/training', link_label: '연습 시작' },
      { category: 'D-21', emoji: '🤝', text: '파트너와 에너지 조율 합의 (5분 대화)', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-21', emoji: '🎬', text: '우리 영상 시청 — 가장 약한 부분 1구간 클립화', link: '/collage', link_label: '영상 콜라주' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (dDay > 7) {
    // D-14 ~ D-7 — 실전 리허설
    const pool: DailyTask[] = [
      { category: 'D-14', emoji: '🎯', text: '대회 동선 시뮬레이션 — 원형 이동 + 코너 처리', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-14', emoji: '📹', text: '긴장 상태 연습 (영상 촬영 후 자체 평가)', link: '/training/sequences', link_label: '시퀀스 라이브러리' },
      { category: 'D-14', emoji: '🚪', text: '플로어크래프트 특훈 — 다른 커플과 부딪히지 않기', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-14', emoji: '📋', text: '참가 신청·BIB 번호·대회장 위치 최종 확인', link: '/checklist', link_label: '체크리스트' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (dDay > 3) {
    // D-7 ~ D-3 — 마무리
    const pool: DailyTask[] = [
      { category: 'D-7', emoji: '👗', text: '의상 리허설 (실제 착용 + 동선 테스트)', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-7', emoji: '🛌', text: '수면 7시간 이상 확보 — 일찍 자는 루틴 시작', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-7', emoji: '🩰', text: '고난도 시퀀스 자제 — 기본기만 다지기', link: '/strategy', link_label: '전략' },
      { category: 'D-7', emoji: '🚗', text: '대회장 이동 경로·시간 시뮬레이션', link: '/checklist', link_label: '체크리스트' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (dDay > 1) {
    // D-3 ~ D-1
    const pool: DailyTask[] = [
      { category: 'D-3', emoji: '👞', text: '신발 베이킹·길들이기 완료', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-3', emoji: '🥗', text: '식이조절 — 무거운 음식 피하기', link: '/checklist', link_label: '체크리스트' },
      { category: 'D-3', emoji: '🧘', text: '파트너와 긴장 해소 대화 (15분)', link: '/checklist', link_label: '체크리스트' },
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (dDay === 1) {
    return { category: 'D-1', emoji: '🎒', text: '가방 싸기 — 여분 의상·응급키트·물·간식. 일찍 취침 (8시간+)', link: '/checklist', link_label: '체크리스트' };
  }
  if (dDay === 0) {
    return { category: 'D-day', emoji: '🌟', text: '2시간 전 도착 + 웜업 + 깊은 호흡 + 파트너 눈 맞추기', link: '/checklist', link_label: '체크리스트' };
  }
  if (dDay < 0) {
    return { category: 'D+1', emoji: '📝', text: `D+${Math.abs(dDay)} — 대회 기록 페이지에 점수·심사위원·개선점 정리`, link: '/my-competitions', link_label: '대회 기록' };
  }
  return null;
}

export function DailyTask() {
  const [target, setTarget] = useState<{ name: string; date: string } | null>(null);
  const [task, setTask] = useState<DailyTask | null>(null);
  const [dDay, setDDay] = useState<number | null>(null);

  useEffect(() => {
    const t = loadTarget();
    setTarget(t);
    if (!t) return;
    const d = daysUntil(t.date);
    setDDay(d);
    if (d !== null) setTask(getTaskForDay(d));
  }, []);

  if (!target || dDay === null || !task) return null;

  const dDayLabel = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-day' : `D+${Math.abs(dDay)}`;

  return (
    <Link
      to={task.link || '/checklist'}
      className="block bg-gradient-to-br from-tango-rose/15 to-tango-shadow border border-tango-rose/40 rounded-sm p-4 hover:bg-tango-rose/20 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{task.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans">
              오늘의 추천 · {dDayLabel}
            </span>
            <span className="text-[9px] text-tango-cream/40">{target.name}</span>
          </div>
          <div className="font-serif italic text-base md:text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {task.text}
          </div>
          {task.link_label && (
            <div className="text-xs text-tango-rose mt-1 font-sans">
              → {task.link_label}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
