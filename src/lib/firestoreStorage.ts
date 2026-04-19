// Firebase Storage 영상/파일 업로드 서비스
import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadProgress {
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
  error?: string;
}

export interface UploadHandle {
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  promise: Promise<string>; // 다운로드 URL
}

/**
 * 사용자 영상을 Firebase Storage에 업로드
 * 경로: users/{uid}/videos/{timestamp}-{filename}
 */
export function uploadVideo(
  uid: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): UploadHandle {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `users/${uid}/videos/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  const promise = new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (!onProgress) return;
        onProgress({
          progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          state: snapshot.state,
        });
      },
      (err) => {
        onProgress?.({
          progress: 0,
          bytesTransferred: 0,
          totalBytes: file.size,
          state: 'error',
          error: err.message,
        });
        reject(err);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onProgress?.({
            progress: 100,
            bytesTransferred: file.size,
            totalBytes: file.size,
            state: 'success',
          });
          resolve(url);
        } catch (err: any) {
          reject(err);
        }
      }
    );
  });

  return {
    cancel: () => task.cancel(),
    pause: () => task.pause(),
    resume: () => task.resume(),
    promise,
  };
}

/** Storage URL에서 파일 삭제 (선택적) */
export async function deleteVideo(downloadUrl: string): Promise<void> {
  try {
    // downloadURL에서 path 추출
    const fileRef = ref(storage, downloadUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('영상 삭제 실패 (이미 삭제됐거나 권한 부족):', err);
  }
}

/** URL이 Firebase Storage URL인지 확인 */
export function isFirebaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('firebasestorage.app') || url.includes('firebasestorage.googleapis.com');
}
