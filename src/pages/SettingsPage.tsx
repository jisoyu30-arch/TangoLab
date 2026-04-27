// 데이터 관리 — 로컬 백업 + 클라우드 스냅샷
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { BackupRestore } from '../components/BackupRestore';
import { CloudSnapshotsPanel } from '../components/CloudSnapshotsPanel';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="데이터 관리" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Data Management
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              데이터 <em className="text-tango-brass">백업 · 복원</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              브라우저 로컬 백업 + 클라우드 자동 스냅샷 · 모든 수업/연습/대회 기록을 안전하게
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 로컬 백업 */}
          <BackupRestore />

          {/* 클라우드 백업 */}
          <CloudSnapshotsPanel />

          <OrnamentDivider className="pt-6" />

          <div className="text-[11px] text-tango-cream/50 font-serif italic text-center" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            로컬 백업 = JSON 파일 다운로드 (기기 변경 대비)<br />
            클라우드 백업 = Firestore 자동 스냅샷 (실수 복구용 · 7일마다)
          </div>
        </div>
      </div>
    </>
  );
}
