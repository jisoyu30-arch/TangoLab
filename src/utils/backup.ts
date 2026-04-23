// 사용자 데이터 백업/복원 — localStorage 전체 + Firestore 스냅샷
// 모든 tango_* 키와 사용자 입력 데이터를 JSON으로 내보내고 복원

const BACKUP_VERSION = 1;

/** localStorage에서 사용자 데이터 관련 키만 수집 */
function collectUserKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    // 사용자 데이터 키 패턴
    if (
      key.startsWith('tango_') ||
      key.startsWith('tangolab_') ||
      key.startsWith('practice_') ||
      key.startsWith('training_') ||
      key.startsWith('favorites') ||
      key.startsWith('notes_') ||
      key.startsWith('recent_') ||
      key.startsWith('my_competitions') ||
      key.startsWith('compare_') ||
      key.startsWith('checklist_')
    ) {
      keys.push(key);
    }
  }
  return keys;
}

export interface BackupData {
  version: number;
  exported_at: string;
  app: 'tango-lab';
  user_agent: string;
  summary: {
    total_keys: number;
    estimated_size_kb: number;
  };
  data: Record<string, unknown>;
}

/** 현재 localStorage 상태를 JSON 객체로 */
export function buildBackup(): BackupData {
  const keys = collectUserKeys();
  const data: Record<string, unknown> = {};
  let totalBytes = 0;

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    totalBytes += raw.length;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw; // 그대로 저장 (원시 문자열)
    }
  }

  return {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    app: 'tango-lab',
    user_agent: navigator.userAgent,
    summary: {
      total_keys: keys.length,
      estimated_size_kb: Math.round(totalBytes / 1024),
    },
    data,
  };
}

/** 백업을 파일로 다운로드 */
export function downloadBackup(): BackupData {
  const backup = buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `tangolab-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return backup;
}

/** 복원 결과 */
export interface RestoreResult {
  ok: boolean;
  restored_keys: number;
  skipped_keys: number;
  errors: string[];
  backed_up_file?: string; // 복원 전 자동 백업한 파일명
}

/** JSON 파일에서 복원 */
export function restoreFromBackup(backup: unknown, opts: { autoBackupBefore?: boolean; overwrite?: boolean } = {}): RestoreResult {
  const result: RestoreResult = { ok: false, restored_keys: 0, skipped_keys: 0, errors: [] };
  const { autoBackupBefore = true, overwrite = true } = opts;

  // 유효성
  if (!backup || typeof backup !== 'object') {
    result.errors.push('백업 파일이 유효하지 않습니다');
    return result;
  }
  const b = backup as BackupData;
  if (b.app !== 'tango-lab') {
    result.errors.push('TangoLab 백업 파일이 아닙니다');
    return result;
  }
  if (!b.data || typeof b.data !== 'object') {
    result.errors.push('데이터 필드가 없습니다');
    return result;
  }

  // 복원 전 현재 상태 자동 백업
  if (autoBackupBefore) {
    try {
      const pre = downloadBackup();
      result.backed_up_file = `tangolab-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json (복원 직전)`;
      void pre;
    } catch (e) {
      result.errors.push('복원 전 자동 백업 실패: ' + String(e));
    }
  }

  // 복원
  for (const [key, value] of Object.entries(b.data)) {
    try {
      if (!overwrite && localStorage.getItem(key) !== null) {
        result.skipped_keys++;
        continue;
      }
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      result.restored_keys++;
    } catch (e) {
      result.errors.push(`키 ${key}: ${String(e)}`);
    }
  }

  result.ok = result.restored_keys > 0 || result.errors.length === 0;
  return result;
}

/** 업로드된 File 객체에서 복원 */
export async function restoreFromFile(file: File, opts?: Parameters<typeof restoreFromBackup>[1]): Promise<RestoreResult> {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    return restoreFromBackup(json, opts);
  } catch (e) {
    return { ok: false, restored_keys: 0, skipped_keys: 0, errors: ['JSON 파싱 실패: ' + String(e)] };
  }
}

/** 사용자 데이터 현황 요약 (사이드바 표시용) */
export function getBackupSummary(): { keys: number; sizeKB: number; lastBackup: string | null } {
  const keys = collectUserKeys();
  let bytes = 0;
  for (const k of keys) bytes += (localStorage.getItem(k) || '').length;
  return {
    keys: keys.length,
    sizeKB: Math.round(bytes / 1024),
    lastBackup: localStorage.getItem('tango_last_backup_at'),
  };
}

export function markLastBackup() {
  localStorage.setItem('tango_last_backup_at', new Date().toISOString());
}
