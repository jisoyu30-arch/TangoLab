// 곡 공출현 네트워크 — 자주 같이 묶이는 곡들 시각화 (force-directed)
import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import roundsData from '../data/competition_rounds.json';
import songsData from '../data/songs.json';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import type { Song } from '../types/tango';

const songs = songsData as Song[];
const rounds = (roundsData as any).rounds;
const songMap = new Map(songs.map(s => [s.song_id, s]));

interface Node {
  id: string;
  label: string;
  orchestra: string;
  appearances: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Edge {
  a: string;
  b: string;
  weight: number;
}

const ORCH_COLORS: Record<string, string> = {
  "D'Arienzo": '#C72C1C',
  'Di Sarli': '#D4AF37',
  'Pugliese': '#6B1F2E',
  'Tanturi': '#8B7A4F',
  'Troilo': '#4A6FA5',
  'Caló': '#B85C38',
  "D'Agostino": '#9B7B4A',
  'Laurenz': '#7A8E6E',
  'Biagi': '#E68F4A',
  'Fresedo': '#5D7A8E',
  'Demare': '#A8857A',
  'Gobbi': '#6E8B5F',
};

interface Props {
  focusSongId?: string;  // 특정 곡 중심 네트워크
  limit?: number;
}

export function SongCooccurrenceNetwork({ focusSongId, limit = 30 }: Props) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });

  const { nodes: initialNodes, edges } = useMemo(() => {
    // 곡 쌍 공출현 카운트
    const pairCount = new Map<string, number>();
    const songAppCount = new Map<string, number>();

    for (const r of rounds) {
      if (!r.songs || r.songs.length < 2) continue;
      const ids = r.songs.map((s: any) => s.song_id).filter(Boolean);
      for (const id of ids) {
        songAppCount.set(id, (songAppCount.get(id) || 0) + 1);
      }
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = [ids[i], ids[j]].sort().join('|');
          pairCount.set(key, (pairCount.get(key) || 0) + 1);
        }
      }
    }

    // focus 모드: 특정 곡 주변만
    let relevantSongs = new Set<string>();
    if (focusSongId) {
      relevantSongs.add(focusSongId);
      for (const [key] of pairCount) {
        const [a, b] = key.split('|');
        if (a === focusSongId || b === focusSongId) {
          relevantSongs.add(a);
          relevantSongs.add(b);
        }
      }
    } else {
      // 최빈 곡만
      const sorted = Array.from(songAppCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
      relevantSongs = new Set(sorted.map(([id]) => id));
    }

    // 노드 생성 (원형 배치 초기값)
    const nodeList = Array.from(relevantSongs).map((id, i) => {
      const s = songMap.get(id);
      const angle = (i / relevantSongs.size) * Math.PI * 2;
      const radius = 180;
      return {
        id,
        label: s?.title || id,
        orchestra: shortOrchestraName(s?.orchestra || ''),
        appearances: songAppCount.get(id) || 1,
        x: 400 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        r: Math.min(25, 8 + Math.sqrt(songAppCount.get(id) || 1) * 2.5),
      } as Node;
    });

    // 엣지 필터링 (관련 곡 쌍만)
    const edgeList: Edge[] = [];
    for (const [key, count] of pairCount) {
      const [a, b] = key.split('|');
      if (relevantSongs.has(a) && relevantSongs.has(b) && count >= 1) {
        edgeList.push({ a, b, weight: count });
      }
    }

    return { nodes: nodeList, edges: edgeList };
  }, [focusSongId, limit]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  // Force simulation (간단한 spring-repulsion)
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    if (nodes.length === 0) return;
    let frame = 0;
    const MAX_ITER = 200;
    let raf = 0;

    const step = () => {
      if (frame > MAX_ITER) return;
      frame++;

      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));
        const centerX = dims.w / 2;
        const centerY = dims.h / 2;

        // 반발력 (모든 노드 쌍)
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i], b = next[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1500 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }

        // 인력 (엣지)
        for (const e of edges) {
          const a = next.find(n => n.id === e.a);
          const b = next.find(n => n.id === e.b);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const ideal = 100;
          const force = (dist - ideal) * 0.02 * Math.log(e.weight + 1);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }

        // 중심 인력
        for (const n of next) {
          n.vx += (centerX - n.x) * 0.005;
          n.vy += (centerY - n.y) * 0.005;

          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;

          // 경계 클램프
          n.x = Math.max(30, Math.min(dims.w - 30, n.x));
          n.y = Math.max(30, Math.min(dims.h - 30, n.y));
        }

        return next;
      });

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [edges, dims]);

  // 반응형 크기
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDims({ w: Math.max(400, rect.width), h: 500 });
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="text-sm text-tango-cream/50 text-center py-8 font-serif italic">
        네트워크 데이터 없음
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
            Network
          </div>
          <h3 className="font-display italic text-xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            곡 공출현 네트워크
          </h3>
          <p className="text-[11px] text-tango-cream/50 font-sans mt-1">
            {nodes.length}개 곡 · {edges.length}개 연결 · 원 크기 = 출현 빈도
          </p>
        </div>
      </div>

      <div className="overflow-hidden">
        <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="w-full h-auto" style={{ minHeight: '400px' }}>
          {/* 엣지 */}
          {edges.map((e, i) => {
            const a = nodes.find(n => n.id === e.a);
            const b = nodes.find(n => n.id === e.b);
            if (!a || !b) return null;
            const highlighted = hoveredNode === a.id || hoveredNode === b.id;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#B8863F"
                strokeOpacity={highlighted ? 0.8 : Math.min(0.5, e.weight * 0.1)}
                strokeWidth={Math.min(3, 0.5 + e.weight * 0.3)}
              />
            );
          })}

          {/* 노드 */}
          {nodes.map(n => {
            const isHover = hoveredNode === n.id;
            const color = ORCH_COLORS[n.orchestra] || '#888';
            return (
              <g key={n.id}>
                <Link to={`/song/${n.id}`}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill={color}
                    fillOpacity={isHover ? 1 : 0.7}
                    stroke={color}
                    strokeWidth={isHover ? 2 : 1}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  />
                </Link>
                {(isHover || n.r > 14) && (
                  <text
                    x={n.x}
                    y={n.y + n.r + 12}
                    textAnchor="middle"
                    fontSize={isHover ? 12 : 10}
                    fill="#F5F1E8"
                    fontFamily="Cormorant Garamond, serif"
                    fontStyle="italic"
                    fontWeight={isHover ? 700 : 400}
                    style={{ pointerEvents: 'none' }}
                  >
                    {n.label.slice(0, 18)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
