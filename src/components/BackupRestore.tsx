// 백업/복원 패널 — 사이드바 하단 또는 설정에서 사용
import { useRef, useState, useEffect } from 'react';
import { downloadBackup, restoreFromFile, getBackupSummary, markLastBackup } from '../utils/backup';
import type { RestoreResult } from '../utils/backup';

export function BackupRestore({ compact = false }: { compact?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState(() => getBackupSummary());
  const [lastAction, setLastAction] = useState<string>('');
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSummary(getBackupSummary());
  }, [restoreResult]);

  const handleExport = () => {
    setBusy(true);
    try {
      const b = downloadBackup();
      markLastBackup();
      setLastAction(`✅ 백업 다운로드 완료 · ${b.summary.total_keys}개 항목 · ${b.summary.estimated_size_kb}KB`);
      setSummary(getBackupSummary());
    } catch (e) {
      setLastAction('❌ 백업 실패: ' + String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(`"${file.name}" 을(를) 복원하시겠습니까?\n\n현재 데이터는 복원 전 자동으로 백업 파일로 다운로드됩니다. 이후 페이지가 새로고침됩니다.`)) {
      e.target.value = '';
      return;
    }
    setBusy(true);
    try {
      const r = await restoreFromFile(file, { autoBackupBefore: true, overwrite: true });
      setRestoreResult(r);
      if (r.ok) {
        setLastAction(`✅ 복원 완료 · ${r.restored_keys}개 항목 (3초 후 새로고침)`);
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setLastAction(`⚠ 복원 문제: ${r.errors.join(' / ')}`);
      }
    } catch (err) {
      setLastAction('❌ 복원 실패: ' + String(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const formatLastBackup = (iso: string | null) => {
    if (!iso) return '이전 백업 없음';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return '오늘 백업됨';
    if (diffDays === 1) return '어제 백업됨';
    if (diffDays < 7) return `${diffDays}일 전 백업`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전 백업`;
    return `${Math.floor(diffDays / 30)}개월 전 — ⚠ 백업 권장`;
  };

  if (compact) {
    // 🔧 데이터가 0KB면 "백업 필요"라 표시할 의미 없음
    const hasData = (summary.sizeKB ?? 0) > 0;
    const needsBackup = hasData && (!summary.lastBackup || (Date.now() - new Date(summary.lastBackup).getTime()) > 7 * 86400000);
    return (
      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={busy || !hasData}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs border transition-colors ${
            needsBackup
              ? 'border-tango-brass/50 bg-tango-brass/10 text-tango-brass hover:bg-tango-brass/20'
              : 'border-tango-brass/20 bg-white/5 text-tango-cream/80 hover:bg-tango-brass/5'
          } ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>📥 {!hasData ? '백업할 데이터 없음' : (needsBackup ? '백업 필요' : '백업 다운로드')}</span>
          <span className="opacity-60">{summary.sizeKB}KB</span>
        </button>
        <button
          onClick={handleRestoreClick}
          disabled={busy}
          className="w-full text-left px-3 py-2 rounded-sm text-xs text-tango-cream/60 hover:bg-white/5 border border-transparent hover:border-tango-brass/20"
        >
          📤 백업 복원
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />
        {lastAction && (
          <div className="text-[10px] text-tango-cream/60 font-sans px-2">
            {lastAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-tango-shadow/50 border border-tango-brass/20 rounded-sm p-5 space-y-4">
      <div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
          Data Backup
        </div>
        <h3 className="font-display italic text-xl text-tango-paper mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          내 데이터 <em className="text-tango-brass">백업 · 복원</em>
        </h3>
        <p className="text-xs text-tango-cream/60 font-serif italic mt-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          수업 기록, 대회 기록, 연습 보드, 메모 등 브라우저에 저장된 사용자 데이터 전체
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/5 rounded-sm p-3">
          <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {summary.keys}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-tango-cream/50">항목</div>
        </div>
        <div className="bg-white/5 rounded-sm p-3">
          <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {summary.sizeKB}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-tango-cream/50">KB</div>
        </div>
        <div className="bg-white/5 rounded-sm p-3">
          <div className="text-[10px] text-tango-paper font-serif italic">
            {formatLastBackup(summary.lastBackup)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={busy}
          className="w-full bg-tango-brass/20 hover:bg-tango-brass/30 text-tango-brass border border-tango-brass/40 rounded-sm py-3 text-sm font-semibold transition-colors"
        >
          📥 백업 다운로드
        </button>
        <button
          onClick={handleRestoreClick}
          disabled={busy}
          className="w-full bg-white/5 hover:bg-white/10 text-tango-cream border border-white/10 rounded-sm py-2.5 text-xs transition-colors"
        >
          📤 백업 파일에서 복원
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {lastAction && (
        <div className="text-xs text-tango-cream/70 bg-white/5 border border-white/10 rounded-sm p-3">
          {lastAction}
        </div>
      )}

      <div className="text-[10px] text-tango-cream/50 leading-relaxed">
        💡 다운로드된 JSON 파일을 <strong>Google Drive, Dropbox, 또는 이메일</strong>에 보관하면 기기 변경 시에도 복원 가능합니다. 주 1회 백업을 권장.
      </div>
    </div>
  );
}
