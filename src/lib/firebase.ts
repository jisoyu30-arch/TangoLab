// Firebase 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCBCMxKJ_gK_0YhXu5XKRn2rSyYuiTgsHQ',
  authDomain: 'tango-lab-ac184.firebaseapp.com',
  projectId: 'tango-lab-ac184',
  storageBucket: 'tango-lab-ac184.firebasestorage.app',
  messagingSenderId: '385121852084',
  appId: '1:385121852084:web:e6c46140b5b941f82095e1',
  measurementId: 'G-VK2LKWC9GH',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

// 오프라인 캐시 (IndexedDB) — 네트워크 끊겨도 로컬에서 작동
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    // 여러 탭 열려있으면 failed-precondition — 괜찮음
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
      console.warn('Firestore offline persistence:', err);
    }
  });
}
