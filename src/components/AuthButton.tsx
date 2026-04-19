// 로그인/로그아웃 버튼 (사이드바 하단에 배치)
import { useAuth } from '../hooks/useAuth';

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut, error } = useAuth();

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-gray-500">
        로그인 확인 중...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-1">
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors min-h-[40px]"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google로 로그인
        </button>
        {error && (
          <p className="text-[10px] text-red-400 px-2">{error}</p>
        )}
        <p className="text-[10px] text-gray-600 px-2 text-center">
          로그인하면 모든 기기에 자동 동기화됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
        {user.photoURL && (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{user.displayName || '사용자'}</div>
          <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
      <button
        onClick={signOut}
        className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 text-left transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
