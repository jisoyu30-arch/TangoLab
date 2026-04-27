// Firebase 클라우드 스냅샷 패널 — 주간 자동 백업 상태 + 수동 트리거 + 복원
import { useEffect, useState } from 'react';
import {
  createSnapshot,
  listSnapshots,
  loadSnapshot,
  daysSinceLastBackup,
} from '../lib/firestoreBackup';
import { useTrainingStore } from '../hooks/useTrainingStore';

interface SnapshotMeta {
  id: string;
  snapshotAt: number;
  snapshotBy?: string | null;
}

export function CloudSnapshotsPanel() {
  const { classes, practices, ownCompetitions, isSignedIn } = useTrainingStore();
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [days, setDays] = useState<number | null>(null);

  const refresh = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const list = await listSnapshots();
      setSnapshots(list);
      setDays(daysSinceLastBackup());
    } catch (e: any) {
      setMsg('스냅샷 목록 로드 실패: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) refresh();
  }, [isSignedIn]);

  const handleCreate = async () => {
    setBusy(true);
    setMsg('');
    try {
      const id = await createSnapshot({
        classes, practices, ownCompetitions, updatedAt: Date.now(),
      });
      setMsg(`✅ 스냅샷 생성: ${id}`);
      await refresh();
    } catch (e: any) {
      setMsg('❌ ' + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm(`"${id}" 시점 데이터로 복원하시겠습니까?\n\n현재 클라우드 데이터는 다음 자동 동기화 시점에 덮어씌워집니다.\n중요 데이터는 먼저 로컬 백업 다운로드를 권장합니다.`)) return;
    setBusy(true);
    setMsg('');
    try {
      const data = await loadSnapshot(id);
      if (!data) {
        setMsg('❌ 스냅샷 데이터 로드 실패');
        return;
      }
      // localStorage 에 직접 덮어쓰기 → 페이지 reload 시 복원
      localStorage.setItem('tango_lab_training_data', JSON.stringify({
        classes: data.classes || [],
        practices: data.practices || [],
        ownCompetitions: data.ownCompetitions || [],
      }));
      setMsg(`✅ "${id}" 로 복원 완료. 3초 후 새로고침합니다…`);
      setTimeout(() => window.location.reload(), 3000);
    } catch (e: any) {
      setMsg('❌ ' + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 text-xs text-tango-cream/60 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        로그인하시면 클라우드 자동 백업이 활성화됩니다 (주 1회 자동 스냅샷).
      </div>
    );
  }

  const lastBackupLabel = days === null ? '한 번도 없음' : days === 0 ? '오늘' : `${days}일 전`;
  const isOverdue = days === null || days >= 7;

  return (
    <div className="bg-tango-shadow/50 border border-tango-brass/20 rounded-sm p-5 space-y-4">
      <div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
          Cloud Snapshots
        </div>
        <h3 className="font-display italic text-xl text-tango-paper mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          클라우드 <em className="text-tango-brass">자동 백업</em>
        </h3>
        <p className="text-xs text-tango-cream/60 font-serif italic mt-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          7일마다 Firestore 에 스냅샷 자동 저장 · 최대 12개 보관 (≈3개월)
        </p>
      </div>

      {/* 상태 */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white/5 rounded-sm p-3">
          <div className="text-[10px] uppercase tracking-widest text-tango-cream/50 mb-1">최근 백업</div>
          <div className={`font-display text-lg ${isOverdue ? 'text-tango-rose' : 'text-tango-brass'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {lastBackupLabel}
          </div>
        </div>
        <div className="bg-white/5 rounded-sm p-3">
          <div className="text-[10px] uppercase tracking-widest text-tango-cream/50 mb-1">보관 스냅샷</div>
          <div className="font-display text-lg text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {snapshots.length}개
          </div>
        </div>
      </div>

      {/* 수동 백업 */}
      <button
        onClick={handleCreate}
        disabled={busy}
        className="w-full bg-tango-brass/20 hover:bg-tango-brass/30 text-tango-brass border border-tango-brass/40 rounded-sm py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        ☁ 지금 클라우드 백업
      </button>

      {/* 스냅샷 목록 */}
      {loading ? (
        <div className="text-xs text-tango-cream/50 text-center py-3">불러오는 중…</div>
      ) : snapshots.length === 0 ? (
        <div className="text-xs text-tango-cream/50 text-center py-3 font-serif italic">
          아직 스냅샷이 없습니다.
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {snapshots.map(s => {
            const d = new Date(s.snapshotAt);
            return (
              <div key={s.id} className="flex items-center gap-2 bg-white/5 rounded-sm p-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-tango-paper truncate">{s.id}</div>
                  <div className="text-[10px] text-tango-cream/50">
                    {d.toLocaleDateString()} {d.toLocaleTimeString().slice(0, 5)}
                    {s.snapshotBy && ` · ${s.snapshotBy}`}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(s.id)}
                  disabled={busy}
                  className="text-[10px] text-tango-brass hover:bg-tango-brass/20 px-2 py-1 rounded-sm border border-tango-brass/30 disabled:opacity-50"
                  title="이 시점 데이터로 복원"
                >
                  복원
                </button>
              </div>
            );
          })}
        </div>
      )}

      {msg && (
        <div className="text-xs text-tango-cream/70 bg-white/5 border border-white/10 rounded-sm p-2">
          {msg}
        </div>
      )}
    </div>
  );
}
