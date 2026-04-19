// 수업 & 연습 기록 페이지
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useTrainingStore } from '../hooks/useTrainingStore';

type Tab = 'overview' | 'classes' | 'practices';

export function TrainingPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const { classes, practices, addClass, addPractice, weeklyPracticeMinutes, isSignedIn, syncing } = useTrainingStore();

  const weeklyData = useMemo(() => weeklyPracticeMinutes(), [practices]);
  const weekTotal = useMemo(() => weeklyData.reduce((a, b) => a + b.minutes, 0), [weeklyData]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthPractices = practices.filter(p => p.date.startsWith(yearMonth));
    const monthClasses = classes.filter(c => c.date.startsWith(yearMonth));
    const totalMinutes = monthPractices.reduce((a, b) => a + b.duration_minutes, 0)
                      + monthClasses.reduce((a, b) => a + b.duration_minutes, 0);
    return { practices: monthPractices.length, classes: monthClasses.length, totalMinutes };
  }, [practices, classes]);

  const handleQuickPractice = () => {
    addPractice({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 60,
      partner: '혼자',
      focus: [],
      notes: '',
    });
  };

  const handleQuickClass = () => {
    const id = addClass({
      date: new Date().toISOString().split('T')[0],
      title: '새 수업',
      duration_minutes: 90,
    });
    window.location.href = `/training/class/${id}`;
  };

  return (
    <>
      <PageHeader
        title="수업 & 연습 기록"
        right={
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            isSignedIn ? (syncing ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400') : 'bg-gray-500/20 text-gray-400'
          }`}>
            {isSignedIn ? (syncing ? '동기화 중...' : '☁ 동기화됨') : '💾 로컬 저장'}
          </span>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-5 space-y-5">

          {/* 빠른 액션 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleQuickPractice}
              className="bg-secretary-gold/20 hover:bg-secretary-gold/30 text-secretary-gold rounded-xl p-4 text-left transition-colors min-h-[80px]"
            >
              <div className="text-2xl mb-1">⏱️</div>
              <div className="font-semibold">연습 시작</div>
              <div className="text-xs text-gray-400 mt-0.5">바로 기록 추가</div>
            </button>
            <button
              onClick={handleQuickClass}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl p-4 text-left transition-colors min-h-[80px]"
            >
              <div className="text-2xl mb-1">🎓</div>
              <div className="font-semibold">수업 추가</div>
              <div className="text-xs text-gray-400 mt-0.5">새 수업 기록</div>
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
            <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>📊 현황</TabButton>
            <TabButton active={tab === 'classes'} onClick={() => setTab('classes')}>🎓 수업 ({classes.length})</TabButton>
            <TabButton active={tab === 'practices'} onClick={() => setTab('practices')}>🏃 연습 ({practices.length})</TabButton>
          </div>

          {/* 현황 탭 */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* 이번 달 요약 */}
              <div className="bg-white/5 border border-secretary-gold/10 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-secretary-gold mb-3">이번 달</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="수업" value={thisMonth.classes} unit="회" />
                  <Stat label="연습" value={thisMonth.practices} unit="회" />
                  <Stat label="총 시간" value={Math.round(thisMonth.totalMinutes / 60 * 10) / 10} unit="시간" />
                </div>
              </div>

              {/* 최근 7일 연습량 */}
              <div className="bg-white/5 border border-secretary-gold/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-secretary-gold">최근 7일 연습</h3>
                  <span className="text-xs text-gray-400">주간 총 {Math.round(weekTotal / 60 * 10) / 10}시간</span>
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  {weeklyData.map((d, i) => {
                    const max = Math.max(...weeklyData.map(x => x.minutes), 60);
                    const height = d.minutes > 0 ? Math.max((d.minutes / max) * 100, 8) : 2;
                    const date = new Date(d.date);
                    const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                    const isToday = d.date === new Date().toISOString().split('T')[0];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex-1 w-full flex items-end">
                          <div
                            className={`w-full rounded-t transition-all ${isToday ? 'bg-secretary-gold' : 'bg-secretary-gold/40'}`}
                            style={{ height: `${height}%` }}
                            title={`${d.minutes}분`}
                          />
                        </div>
                        <div className={`text-[10px] ${isToday ? 'text-secretary-gold font-bold' : 'text-gray-500'}`}>
                          {dayLabel}
                        </div>
                        <div className="text-[9px] text-gray-600">{d.minutes}분</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 최근 기록 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">최근 기록</h3>
                {[...classes.slice(0, 3), ...practices.slice(0, 3)]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map(item => {
                    const isClass = 'title' in item;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg mb-1">
                        <span className="text-lg">{isClass ? '🎓' : '🏃'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {isClass ? (item as any).title : `${(item as any).partner}와 연습`}
                          </div>
                          <div className="text-xs text-gray-500">{item.date} · {(item as any).duration_minutes}분</div>
                        </div>
                        {isClass && (
                          <Link to={`/training/class/${item.id}`} className="text-xs text-secretary-gold hover:underline">보기</Link>
                        )}
                      </div>
                    );
                  })}
                {classes.length === 0 && practices.length === 0 && (
                  <div className="bg-white/5 border border-dashed border-secretary-gold/20 rounded-xl p-6 text-center text-gray-500 text-sm">
                    기록이 없습니다. 위의 "연습 시작" 또는 "수업 추가"로 시작하세요.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 수업 탭 */}
          {tab === 'classes' && (
            <ClassList />
          )}

          {/* 연습 탭 */}
          {tab === 'practices' && (
            <PracticeList />
          )}
        </div>
      </div>
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
        active ? 'text-secretary-gold border-secretary-gold' : 'text-gray-500 border-transparent hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-secretary-gold">{value}</div>
      <div className="text-xs text-gray-400">{unit}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function ClassList() {
  const { classes, deleteClass } = useTrainingStore();
  if (classes.length === 0) {
    return (
      <div className="bg-white/5 border border-dashed border-secretary-gold/20 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">🎓</div>
        <p className="text-gray-400 text-sm mb-1">수업 기록이 없습니다</p>
        <p className="text-gray-600 text-xs">위의 "수업 추가" 버튼으로 시작하세요</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {classes.map(c => (
        <Link
          key={c.id}
          to={`/training/class/${c.id}`}
          className="block bg-white/5 hover:bg-white/8 border border-white/10 hover:border-secretary-gold/30 rounded-xl p-4 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-500">{c.date}</span>
                {c.video_url && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">▶ 영상</span>}
              </div>
              <h4 className="text-white font-semibold truncate">{c.title}</h4>
              <div className="text-xs text-gray-400 mt-0.5">
                {c.instructor && <span>{c.instructor} · </span>}
                {c.duration_minutes}분
                {c.partner && ` · ${c.partner}`}
              </div>
              {c.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.topics.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-secretary-gold/10 text-secretary-gold rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); if (confirm('삭제하시겠습니까?')) deleteClass(c.id); }}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1"
            >
              삭제
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PracticeList() {
  const { practices, updatePractice, deletePractice, addPractice } = useTrainingStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditData({ ...p, focusStr: p.focus.join(', ') });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const focus = (editData.focusStr || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    updatePractice(editingId, {
      date: editData.date,
      duration_minutes: Number(editData.duration_minutes) || 60,
      partner: editData.partner,
      focus,
      notes: editData.notes,
      energy_level: editData.energy_level,
    });
    setEditingId(null);
  };

  if (practices.length === 0) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => {
            const id = addPractice({});
            const newP = { id, date: new Date().toISOString().split('T')[0], duration_minutes: 60, partner: '혼자', focus: [], notes: '', energy_level: null };
            startEdit(newP);
          }}
          className="w-full bg-secretary-gold/20 hover:bg-secretary-gold/30 text-secretary-gold rounded-xl p-4 text-center transition-colors min-h-[60px] font-medium"
        >
          + 첫 연습 기록 추가
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {practices.map(p => (
        <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
          {editingId === p.id ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
                <input type="number" value={editData.duration_minutes} onChange={e => setEditData({ ...editData, duration_minutes: e.target.value })}
                  placeholder="분" className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <input type="text" value={editData.partner || ''} onChange={e => setEditData({ ...editData, partner: e.target.value })}
                placeholder="연습 상대" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
              <input type="text" value={editData.focusStr || ''} onChange={e => setEditData({ ...editData, focusStr: e.target.value })}
                placeholder="연습 내용 (쉼표로 구분)" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(lv => (
                  <button key={lv} onClick={() => setEditData({ ...editData, energy_level: lv })}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      editData.energy_level === lv ? 'bg-secretary-gold/30 text-secretary-gold' : 'bg-white/5 text-gray-400'
                    }`}>
                    {lv === 'low' ? '😴 낮음' : lv === 'medium' ? '🙂 보통' : '🔥 높음'}
                  </button>
                ))}
              </div>
              <textarea value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })}
                placeholder="연습 메모 / 문제점 / 다음에 신경쓸 점" rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white resize-none" />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex-1 bg-secretary-gold/20 text-secretary-gold rounded-lg py-2 text-xs font-medium hover:bg-secretary-gold/30">저장</button>
                <button onClick={() => setEditingId(null)} className="px-4 bg-white/5 text-gray-400 rounded-lg py-2 text-xs hover:bg-white/10">취소</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">{p.date}</span>
                    <span className="text-xs text-secretary-gold">{p.duration_minutes}분</span>
                    {p.energy_level && (
                      <span className="text-xs">{p.energy_level === 'low' ? '😴' : p.energy_level === 'medium' ? '🙂' : '🔥'}</span>
                    )}
                  </div>
                  <div className="text-sm text-white">{p.partner}와 연습</div>
                  {p.focus.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.focus.map(f => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-secretary-gold/10 text-secretary-gold rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                  {p.notes && <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{p.notes}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="text-xs text-gray-500 hover:text-secretary-gold px-2 py-1">편집</button>
                  <button onClick={() => { if (confirm('삭제하시겠습니까?')) deletePractice(p.id); }} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1">삭제</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
