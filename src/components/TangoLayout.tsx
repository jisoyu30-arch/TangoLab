import { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { TangoSidebar } from './TangoSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { CommandPalette } from './CommandPalette';

// 사이드바 토글을 자식 페이지에서 사용할 수 있도록 Context 제공
const SidebarContext = createContext<{ openSidebar: () => void }>({ openSidebar: () => {} });
export function useSidebar() { return useContext(SidebarContext); }

export function TangoLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
      <div className="flex h-screen bg-tango-ink text-tango-paper font-sans">
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
          {/* 페이지 콘텐츠 — 모바일에서는 하단 탭 높이만큼 패딩 */}
          <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
            <Outlet />
          </div>

          <MobileBottomNav />
        </main>
        <CommandPalette />
      </div>
    </SidebarContext.Provider>
  );
}
