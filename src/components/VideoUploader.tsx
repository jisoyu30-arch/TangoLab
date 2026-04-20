// 영상 업로드 컴포넌트 — YouTube URL 붙여넣기 또는 Firebase Storage 직접 업로드
import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadVideo, isFirebaseStorageUrl, deleteVideo } from '../lib/firestoreStorage';
import type { UploadProgress } from '../lib/firestoreStorage';
import { extractYouTubeId } from '../utils/tangoHelpers';

interface Props {
  videoUrl: string | null;
  onChange: (url: string | null) => void;
  /** 최대 업로드 크기 (바이트). 기본 500MB */
  maxSize?: number;
}

export function VideoUploader({ videoUrl, onChange, maxSize = 500 * 1024 * 1024 }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState(videoUrl || '');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoId = extractYouTubeId(videoUrl);
  const isUploaded = isFirebaseStorageUrl(videoUrl);

  const handleFile = async (file: File) => {
    setUploadError(null);

    if (!user) {
      setUploadError('로그인 후 업로드 가능합니다');
      return;
    }
    if (file.size > maxSize) {
      setUploadError(`파일이 너무 큽니다 (최대 ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }
    if (!file.type.startsWith('video/')) {
      setUploadError('영상 파일만 업로드 가능합니다');
      return;
    }

    const handle = uploadVideo(user.uid, file, (p) => setProgress(p));

    try {
      const downloadUrl = await handle.promise;
      onChange(downloadUrl);
      setProgress(null);
    } catch (err: any) {
      setUploadError(err.message || '업로드 실패');
      setProgress(null);
    }
  };

  const handleUrlSave = () => {
    onChange(urlInput || null);
  };

  const handleRemove = async () => {
    if (!confirm('영상을 제거하시겠습니까?')) return;
    // Firebase Storage 업로드된 거면 실제 파일도 삭제
    if (videoUrl && isFirebaseStorageUrl(videoUrl)) {
      await deleteVideo(videoUrl);
    }
    onChange(null);
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      {/* 영상 임베드 미리보기 */}
      {videoUrl && videoId && (
        <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {videoUrl && isUploaded && (
        <video
          className="w-full rounded-lg bg-black max-h-96"
          src={videoUrl}
          controls
          playsInline
        />
      )}

      {/* 업로드된 영상 표시 */}
      {videoUrl && (
        <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-cyan-400 text-sm">{isUploaded ? '📁 업로드됨' : '🔗 URL'}</span>
            <span className="text-xs text-gray-500 truncate">{videoUrl}</span>
          </div>
          <button onClick={handleRemove} className="text-xs text-gray-600 hover:text-red-400 flex-shrink-0">제거</button>
        </div>
      )}

      {/* 모드 선택 탭 */}
      {!videoUrl && (
        <>
          <div className="flex gap-1 border-b border-white/10">
            <button
              onClick={() => setMode('url')}
              className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                mode === 'url' ? 'text-tango-brass border-tango-brass' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              🔗 URL 붙여넣기
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                mode === 'upload' ? 'text-tango-brass border-tango-brass' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              📁 파일 업로드
            </button>
          </div>

          {/* URL 모드 */}
          {mode === 'url' && (
            <div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="YouTube, Instagram, Google Drive URL"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                />
                <button
                  onClick={handleUrlSave}
                  disabled={!urlInput.trim()}
                  className="px-4 bg-tango-brass/20 text-tango-brass rounded-lg text-sm font-medium hover:bg-tango-brass/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  저장
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1.5">💡 Tip: 큰 영상은 먼저 YouTube 비공개로 업로드 후 링크를 넣으세요 (무제한 용량)</p>
            </div>
          )}

          {/* 직접 업로드 모드 */}
          {mode === 'upload' && (
            <div>
              {!user ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                  <p className="text-xs text-yellow-400 mb-2">⚠️ 직접 업로드는 로그인 후 사용 가능합니다</p>
                  <p className="text-[10px] text-gray-500">사이드바 하단의 "Google로 로그인"을 이용하세요</p>
                </div>
              ) : progress ? (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-tango-brass">업로드 중...</span>
                    <span className="text-xs text-gray-400">{Math.round(progress.progress)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tango-brass transition-all duration-200"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    {(progress.bytesTransferred / 1024 / 1024).toFixed(1)} / {(progress.totalBytes / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-tango-brass/40 rounded-xl p-6 text-center transition-colors"
                  >
                    <div className="text-3xl mb-2">📹</div>
                    <div className="text-sm text-white font-medium">영상 파일 선택</div>
                    <div className="text-[10px] text-gray-500 mt-1">또는 이 영역에 드래그 & 드롭</div>
                    <div className="text-[10px] text-gray-600 mt-1">최대 {Math.round(maxSize / 1024 / 1024)}MB · MP4, MOV, WebM</div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      // reset so same file can be reselected
                      e.target.value = '';
                    }}
                  />
                  <p className="text-[10px] text-gray-600 mt-2 text-center">
                    💡 Firebase 무료 5GB 저장 공간 사용 (본인만 볼 수 있음)
                  </p>
                </>
              )}
              {uploadError && (
                <p className="text-[11px] text-red-400 mt-2 px-2">{uploadError}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
