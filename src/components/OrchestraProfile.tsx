// 악단 심층 프로파일 — orchestra_profiles.json 기반
import profilesData from '../data/orchestra_profiles.json';

interface VocalistEntry {
  name: string;
  phases?: string;
  note?: string;
}

interface HistoryPeriod {
  label: string;
  body: string;
}

interface SourceLink {
  label: string;
  url: string;
}

interface OrchestraProfileData {
  orchestra_id: string;
  short_name: string;
  nickname: string | null;
  lifespan?: string;
  active_era?: string;
  founded?: string;
  summary?: string;
  origin_story?: string;
  musical_innovations?: string[];
  singer_innovation?: string;
  personal_anecdotes?: string[];
  history_periods?: HistoryPeriod[];
  musical_style?: string;
  vocalists?: VocalistEntry[];
  key_collaborator?: string;
  episodes?: string[];
  competition_relevance?: string;
  sources?: SourceLink[];
  photo?: { url: string; caption?: string; wikipedia_url?: string };
}

const profiles = (profilesData as { profiles: Record<string, OrchestraProfileData> }).profiles;

export function getOrchestraProfile(orchestraId: string): OrchestraProfileData | null {
  return profiles[orchestraId] || null;
}

export function hasOrchestraProfile(orchestraId: string): boolean {
  return !!profiles[orchestraId];
}

export function OrchestraProfile({ orchestraId, compact = false }: { orchestraId: string; compact?: boolean }) {
  const profile = getOrchestraProfile(orchestraId);
  if (!profile) return null;

  return (
    <div className="space-y-5">
      {/* 사진 + 헤더 */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {profile.photo && (
          <a href={profile.photo.wikipedia_url || profile.photo.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <img
              src={profile.photo.url}
              alt={profile.short_name}
              loading="lazy"
              className="w-32 h-32 md:w-36 md:h-36 object-cover rounded-sm border border-tango-brass/30 grayscale hover:grayscale-0 transition-all"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {profile.photo.caption && (
              <div className="text-[9px] text-tango-cream/40 mt-1 italic max-w-[9rem]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.photo.caption}
              </div>
            )}
          </a>
        )}
        <div className="flex-1 border-l-2 border-tango-brass pl-4">
          {profile.nickname && (
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
              {profile.nickname}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tango-cream/60 font-sans">
            {profile.lifespan && <span>● {profile.lifespan}</span>}
            {profile.active_era && <span>활동: {profile.active_era}</span>}
            {profile.founded && <span>오케스트라 결성: {profile.founded}</span>}
          </div>
        </div>
      </div>

      {/* 요약 */}
      {profile.summary && (
        <div className="bg-tango-brass/5 border-l-4 border-tango-brass/60 rounded-sm p-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
            한눈에
          </div>
          <p className="text-sm text-tango-cream/85 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {profile.summary}
          </p>
        </div>
      )}

      {!compact && (
        <>
          {/* 출생·입문 일화 */}
          {profile.origin_story && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                ◐ 출생·입문
              </div>
              <p className="text-sm text-tango-cream/85 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.origin_story}
              </p>
            </section>
          )}

          {/* 음악적 혁신 */}
          {profile.musical_innovations && profile.musical_innovations.length > 0 && (
            <section className="bg-tango-brass/5 border-l-4 border-tango-brass/50 rounded-sm p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                ⚡ 음악적 혁신
              </div>
              <ul className="space-y-1.5 text-xs md:text-sm text-tango-cream/85 font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.musical_innovations.map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-tango-brass flex-shrink-0">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 가수 승격 (Troilo 전용 필드) */}
          {profile.singer_innovation && (
            <section className="bg-tango-rose/5 border border-tango-rose/30 rounded-sm p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans mb-2">
                ♬ 가수 승격 (Singer Elevation)
              </div>
              <p className="text-xs md:text-sm text-tango-cream/85 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.singer_innovation}
              </p>
            </section>
          )}

          {/* 음악적 특징 */}
          {profile.musical_style && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                ♪ 음악적 특징
              </div>
              <p className="text-sm text-tango-paper/85 font-serif leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.musical_style}
              </p>
            </section>
          )}

          {/* 시기별 연혁 */}
          {profile.history_periods && profile.history_periods.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                ▸ 시기별 연혁
              </div>
              <div className="space-y-3">
                {profile.history_periods.map((p, i) => (
                  <div key={i} className="grid grid-cols-[120px_1fr] gap-3 items-baseline">
                    <div className="text-xs font-sans tracking-widest uppercase text-tango-brass/80">
                      {p.label}
                    </div>
                    <div className="text-sm text-tango-cream/85 font-serif leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {p.body}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 보컬리스트 */}
          {profile.vocalists && profile.vocalists.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                ♫ 핵심 보컬리스트
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {profile.vocalists.map((v, i) => (
                  <div key={i} className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-3">
                    <div className="font-display italic text-base text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {v.name}
                    </div>
                    {v.phases && (
                      <div className="text-[10px] text-tango-brass/70 mt-0.5 font-sans">
                        {v.phases}
                      </div>
                    )}
                    {v.note && (
                      <div className="text-xs text-tango-cream/70 mt-2 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {v.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 핵심 협력자 */}
          {profile.key_collaborator && (
            <section className="bg-tango-rose/5 border border-tango-rose/30 rounded-sm p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-rose font-sans mb-1">
                ★ 핵심 협력자
              </div>
              <p className="text-sm text-tango-paper/85 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.key_collaborator}
              </p>
            </section>
          )}

          {/* 에피소드 */}
          {profile.episodes && profile.episodes.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                ▣ 에피소드
              </div>
              <ul className="space-y-2">
                {profile.episodes.map((e, i) => (
                  <li key={i} className="flex gap-2 text-sm text-tango-cream/80 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    <span className="text-tango-brass flex-shrink-0">·</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 인간적 일화 (Pugliese의 dulce de leche, 귤 일화 등) */}
          {profile.personal_anecdotes && profile.personal_anecdotes.length > 0 && (
            <section className="bg-tango-shadow/30 border border-tango-brass/15 rounded-sm p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-cream/60 font-sans mb-2">
                😊 인간적 일화
              </div>
              <ul className="space-y-1.5">
                {profile.personal_anecdotes.map((a, i) => (
                  <li key={i} className="flex gap-2 text-xs md:text-sm text-tango-cream/75 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    <span className="text-tango-brass/60 flex-shrink-0">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 대회 적합성 */}
          {profile.competition_relevance && (
            <section className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                ◈ 대회에서의 의미
              </div>
              <p className="text-sm text-tango-paper/85 font-serif leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {profile.competition_relevance}
              </p>
            </section>
          )}
        </>
      )}

      {/* 출처 */}
      {profile.sources && profile.sources.length > 0 && (
        <section className="border-t border-tango-brass/15 pt-3">
          <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 font-sans mb-2">
            Sources
          </div>
          <ul className="space-y-1">
            {profile.sources.map((s, i) => (
              <li key={i} className="text-[11px]">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-tango-cream/60 hover:text-tango-brass hover:underline">
                  → {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
