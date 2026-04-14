import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TangoSidebar } from './TangoSidebar';

import { MobileBottomNav } from './MobileBottomNav';

export function TangoLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-secretary-dark">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 — 데스크탑: 항상 보임, 모바일: 토글 */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <TangoSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* 모바일 헤더 */}
        <div className="md:hidden h-12 border-b border-secretary-gold/20 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-secretary-gold text-lg mr-3"
          >
            ☰
          </button>
          <span className="text-sm font-semibold text-secretary-gold">석정소유의 탱고랩</span>
        </div>

        {/* 페이지 콘텐츠 — 모바일에서는 하단 탭 높이만큼 패딩 */}
        <div className="flex-1 overflow-hidden pb-16 md:pb-0">
          <Outlet />
        </div>

        <MobileBottomNav />
      </main>
    </div>
  );
}
