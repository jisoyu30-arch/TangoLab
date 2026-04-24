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
        manualChunks: (id) => {
          // node_modules → vendor 청크로 분리
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('recharts') || id.includes('chart')) return 'vendor-charts';
            return 'vendor-misc';
          }
          // 큰 데이터 파일 → 별도 청크 (한 번만 로드)
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
