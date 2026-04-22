// 심사위원 프로필 — Mundial 데이터에서 추출
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import mundialData from '../data/mundial_results.json';

interface JudgeRecord {
  name: string;
  appearances: Array<{ year: number; stage: string; group?: string }>;
  years: Set<number>;
  stages: Set<string>;
}

export function JudgesPage() {
  const [query, setQuery] = useState('');

  const judges = useMemo(() => {
    const map = new Map<string, JudgeRecord>();

    for (const [year, yearData] of Object.entries(mundialData as any)) {
      const stages = (yearData as any).stages;
      if (!stages) continue;

      for (const [stageName, stage] of Object.entries(stages) as any) {
        // 그룹형 (예선/준결승)
        if (stage.groups) {
          for (const [gName, group] of Object.entries(stage.groups) as any) {
            for (const name of (group.judges || [])) {
              const clean = name.trim();
              if (!clean) continue;
              if (!map.has(clean)) map.set(clean, { name: clean, appearances: [], years: new Set(), stages: new Set() });
              const j = map.get(clean)!;
              j.appearances.push({ year: parseInt(year), stage: stageName, group: gName });
              j.years.add(parseInt(year));
              j.stages.add(stageName);
            }
          }
        }
        // 평면형 (결승)
        if (stage.judges) {
          for (const name of stage.judges) {
            const clean = name.trim();
            if (!clean) continue;
            if (!map.has(clean)) map.set(clean, { name: clean, appearances: [], years: new Set(), stages: new Set() });
            const j = map.get(clean)!;
            j.appearances.push({ year: parseInt(year), stage: stageName });
            j.years.add(parseInt(year));
            j.stages.add(stageName);
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.appearances.length - a.appearances.length);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return judges;
    const q = query.toLowerCase();
    return judges.filter(j => j.name.toLowerCase().includes(q));
  }, [judges, query]);

  return (
    <>
      <PageHeader title="심사위원" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Panel · Mundial Judges
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              <em className="text-tango-brass">심사</em>위원단
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              Mundial de Tango 역대 심사위원 · 총 {judges.length}명
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 검색 */}
          <div className="relative max-w-lg mx-auto">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tango-brass">◈</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="심사위원 이름 검색…"
              className="w-full bg-transparent border-0 border-b-2 border-tango-brass/30 focus:border-tango-brass pb-2 pt-1 pl-8 font-serif text-lg text-tango-paper placeholder-tango-cream/30 focus:outline-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            />
          </div>

          {/* 목록 */}
          <div className="space-y-0">
            {filtered.map((j, i) => {
              const years = Array.from(j.years).sort();
              return (
                <div key={j.name} className="grid grid-cols-[60px_1fr_auto] items-baseline gap-4 py-5 border-b border-tango-brass/15 hover:bg-tango-brass/5 px-3 -mx-3 transition-colors">
                  <span className="font-display text-3xl text-tango-brass/50 italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl md:text-2xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {j.name}
                    </h3>
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mt-1">
                      {years[0]}–{years[years.length - 1]} · {Array.from(j.stages).join(' / ')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {j.appearances.length}
                    </div>
                    <div className="text-[9px] tracking-widest uppercase text-tango-cream/40">심사</div>
                  </div>
                </div>
              );
            })}
          </div>

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}
