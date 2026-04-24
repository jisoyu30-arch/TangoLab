import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
  },
  build: {
    // 청크 크기 경고 기준 완화 (대회 데이터가 큼)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // ⚠️ node_modules 수동 분리는 React 초기화 순서를 망쳐서
        // "Cannot set properties of undefined (setting 'Children')" 에러 발생.
        // Vite 기본 청크 전략을 그대로 두고, 큰 데이터 JSON만 별도 청크로 분리한다.
        manualChunks: (id) => {
          if (id.includes('src/data/competition_rounds.json')) return 'data-rounds';
          if (id.includes('src/data/mundial_participants')) return 'data-participants';
          if (id.includes('src/data/mundial_results')) return 'data-mundial';
          if (id.includes('src/data/songs.json')) return 'data-songs';
          if (id.includes('src/data/dance_guides.json')) return 'data-guides';
          if (id.includes('src/data/appearances.json')) return 'data-appearances';
          if (id.includes('src/data/orchestras.json')) return 'data-orchestras';
          if (id.includes('src/data/ktc_participants')) return 'data-ktc';
          if (id.includes('src/data/champion')) return 'data-champions';
        },
      },
    },
  },
});
