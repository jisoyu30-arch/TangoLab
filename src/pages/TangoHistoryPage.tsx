// 탱고 역사·계보 페이지 — 황금기 댄서 + 학술 문헌 + 핵심 인터뷰
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import dancersData from '../data/dancers_history.json';
import bibData from '../data/tango_bibliography.json';

interface DancerEntry {
  id: string;
  name: string;
  nickname?: string | null;
  lifespan?: string;
  era?: string;
  role?: string;
  school?: 'tradicional' | 'escenario' | 'pioneer' | 'innovator';
  nickname_etymology?: string;
  origin_story?: string;
  photo?: { url: string; caption?: string; wikipedia_url?: string };
  summary?: string;
  partnership?: string;
  philosophy?: string;
  famous_anecdote?: string;
  lineage?: string;
  key_moments?: { year?: number; body: string }[];
  video_archives?: { label: string; url: string }[];
  key_quote?: string;
  sources?: { label: string; url: string }[];
}

const SCHOOL_LABELS: Record<string, { label: string; color: string }> = {
  tradicional: { label: '전통 / 밀롱게로', color: '#7A8E6E' },
  escenario:   { label: '무대 (Escenario)', color: '#D4AF37' },
  pioneer:     { label: '국제화 선구자', color: '#5D7A8E' },
  innovator:   { label: '혁신가', color: '#C72C1C' },
};

interface Book {
  id: string;
  author: string;
  title: string;
  year: number;
  publisher?: string;
  summary: string;
  tags?: string[];
}

interface Interview {
  id: string;
  subject: string;
  year: number;
  interlocutor?: string;
  quote_ko: string;
  context: string;
}

const dancers: DancerEntry[] = (dancersData as any).dancers;
const books: Book[] = (bibData as any).books;
const interviews: Interview[] = (bibData as any).key_interviews;

type Tab = 'dancers' | 'books' | 'interviews' | 'context';

export function TangoHistoryPage() {
  const [tab, setTab] = useState<Tab>('dancers');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const filteredDancers = schoolFilter === 'all' ? dancers : dancers.filter(d => d.school === schoolFilter);

  return (
    <>
      <PageHeader title="탱고 역사·계보" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              History · 1880s ~ Now
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              탱고의 <em className="text-tango-brass">계보</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              황금기 댄서 · 학술 문헌 · 거장 인터뷰 · 사회·역사 맥락
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 탭 */}
          <div className="flex gap-0 border-b border-tango-brass/20 overflow-x-auto">
            {([
              { v: 'dancers', l: `🩰 댄서 계보 (${dancers.length})` },
              { v: 'context', l: '🏛 사회·역사 맥락' },
              { v: 'books', l: `📚 학술 문헌 (${books.length})` },
              { v: 'interviews', l: `💬 거장 인터뷰 (${interviews.length})` },
            ] as const).map(t => (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                className={`px-4 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
                  tab === t.v
                    ? 'text-tango-paper border-tango-brass'
                    : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
                }`}
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* 댄서 */}
          {tab === 'dancers' && (
            <div className="space-y-4">
              {/* 유파 필터 */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSchoolFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                    schoolFilter === 'all' ? 'border-tango-brass bg-tango-brass/15 text-tango-brass' : 'border-tango-brass/20 text-tango-cream/60 hover:border-tango-brass/40'
                  }`}
                >
                  전체 ({dancers.length})
                </button>
                {Object.entries(SCHOOL_LABELS).map(([key, info]) => {
                  const count = dancers.filter(d => d.school === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSchoolFilter(key)}
                      className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                        schoolFilter === key ? 'text-tango-paper' : 'text-tango-cream/60 hover:border-tango-brass/40'
                      }`}
                      style={{
                        borderColor: schoolFilter === key ? info.color : `${info.color}33`,
                        backgroundColor: schoolFilter === key ? `${info.color}25` : 'transparent',
                      }}
                    >
                      {info.label} ({count})
                    </button>
                  );
                })}
              </div>

              {filteredDancers.map(d => (
                <article key={d.id} className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-3">
                    {d.photo && (
                      <div className="flex-shrink-0">
                        <a href={d.photo.wikipedia_url || d.photo.url} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={d.photo.url}
                            alt={d.name}
                            className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-sm border border-tango-brass/30 grayscale hover:grayscale-0 transition-all"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          {d.photo.caption && (
                            <div className="text-[9px] text-tango-cream/40 mt-1 italic max-w-[10rem]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {d.photo.caption}
                            </div>
                          )}
                        </a>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <div>
                          <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            {d.name}
                          </h2>
                          {d.nickname && (
                            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mt-1">
                              {d.nickname}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-tango-cream/50 font-sans text-right">
                          {d.lifespan && <div>● {d.lifespan}</div>}
                          {d.era && <div>활동: {d.era}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    {d.role && (
                      <span className="text-sm text-tango-rose font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        ★ {d.role}
                      </span>
                    )}
                    {d.school && SCHOOL_LABELS[d.school] && (
                      <span
                        className="text-[10px] tracking-widest uppercase font-sans px-2 py-0.5 rounded-sm"
                        style={{
                          color: SCHOOL_LABELS[d.school].color,
                          backgroundColor: `${SCHOOL_LABELS[d.school].color}20`,
                        }}
                      >
                        {SCHOOL_LABELS[d.school].label}
                      </span>
                    )}
                  </div>

                  {d.nickname_etymology && (
                    <div className="text-xs text-tango-cream/60 font-serif italic mb-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      <span className="text-tango-brass not-italic">📛 별명 어원:</span> {d.nickname_etymology}
                    </div>
                  )}

                  {d.origin_story && (
                    <div className="bg-tango-brass/5 border-l-4 border-tango-brass/40 pl-3 py-2 my-3">
                      <div className="text-[10px] tracking-widest uppercase text-tango-brass/70 font-sans mb-1">◐ 출생·입문</div>
                      <p className="text-xs md:text-sm text-tango-cream/80 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {d.origin_story}
                      </p>
                    </div>
                  )}

                  {d.summary && (
                    <p className="text-sm text-tango-cream/85 font-serif leading-relaxed mb-3" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {d.summary}
                    </p>
                  )}

                  {d.partnership && (
                    <div className="text-xs text-tango-cream/70 font-serif italic mb-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      <span className="text-tango-brass">파트너십:</span> {d.partnership}
                    </div>
                  )}

                  {d.philosophy && (
                    <blockquote className="border-l-4 border-tango-brass/50 pl-4 italic text-tango-cream/80 my-3 font-serif text-sm" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      💭 {d.philosophy}
                    </blockquote>
                  )}

                  {d.famous_anecdote && (
                    <div className="bg-tango-rose/5 border border-tango-rose/30 rounded-sm p-3 my-3">
                      <div className="text-[10px] tracking-widest uppercase text-tango-rose/80 font-sans mb-1">▣ 유명한 일화</div>
                      <p className="text-xs md:text-sm text-tango-cream/85 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {d.famous_anecdote}
                      </p>
                    </div>
                  )}

                  {d.lineage && (
                    <div className="text-xs text-tango-cream/70 font-serif italic mb-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      <span className="text-tango-brass">계보·영향:</span> {d.lineage}
                    </div>
                  )}

                  {d.key_moments && d.key_moments.length > 0 && (
                    <div className="bg-tango-ink/40 border-l-4 border-tango-brass/40 pl-4 py-2 my-3">
                      {d.key_moments.map((m, i) => (
                        <div key={i} className="text-sm text-tango-cream/80 font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {m.year && <span className="text-tango-brass font-bold not-italic mr-2">{m.year}</span>}
                          {m.body}
                        </div>
                      ))}
                    </div>
                  )}

                  {d.key_quote && (
                    <blockquote className="border-l-4 border-tango-rose/50 pl-4 italic text-tango-cream/80 my-3 font-serif">
                      "{d.key_quote}"
                    </blockquote>
                  )}

                  {d.video_archives && d.video_archives.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-tango-brass/15">
                      <div className="text-[10px] tracking-widest uppercase text-tango-brass/70 font-sans mb-1">📽 영상 아카이브</div>
                      <ul className="space-y-0.5">
                        {d.video_archives.map((v, i) => (
                          <li key={i} className="text-xs">
                            <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-tango-cream/70 hover:text-tango-brass hover:underline">
                              → {v.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {d.sources && d.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-tango-brass/15">
                      <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 font-sans mb-1">Sources</div>
                      <ul className="space-y-0.5">
                        {d.sources.map((s, i) => (
                          <li key={i} className="text-[11px]">
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-tango-cream/60 hover:text-tango-brass hover:underline">
                              → {s.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* 사회·역사 맥락 */}
          {tab === 'context' && (
            <div className="space-y-6">
              <article className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5 md:p-6">
                <h2 className="font-display text-2xl text-tango-paper italic mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  황금기 (Época de Oro, 1935-1955)
                </h2>
                <p className="text-sm text-tango-cream/85 font-serif leading-relaxed mb-3" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  탱고 역사상 가장 찬란했던 시기. 음악가들의 연주와 무용수들의 스텝이 완벽한 조화를 이루었으며, 부에노스아이레스의 모든 세대가 일상적으로 탱고를 즐기는 사회적 현상.
                </p>
                <ul className="space-y-2 text-xs md:text-sm text-tango-cream/75 font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  <li>· 1929 대공황 → 아르헨티나 농산물 수출 의존 경제에 타격</li>
                  <li>· 1930년대 수입 대체 산업화(ISI) 전략 → 도시화 가속</li>
                  <li>· 지방→부에노스아이레스 인구 유입: 1930s 중반 연 8,000명 → 1940s 중반 연 117,000명</li>
                  <li>· 1935 부에노스아이레스 400주년 — 오벨리스크(72m) 건설, 7월 9일 대로 개통</li>
                  <li>· 1940s 중반 부에노스아이레스 도시권 = 국가 산업의 56%, 노동력 61%</li>
                  <li>· 저렴한 레코드 + 무도회장 = 모든 세대의 절대적 여가 수단</li>
                  <li>· 오케스트라(Orquesta Típica) 13인조 이상 대형화, 하프·비브라폰 등 교향악적 악기 도입</li>
                </ul>
              </article>

              <article className="bg-tango-rose/5 border border-tango-rose/30 rounded-sm p-5 md:p-6">
                <h2 className="font-display text-2xl text-tango-paper italic mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  쇠퇴와 저항 (1955-)
                </h2>
                <p className="text-sm text-tango-cream/85 font-serif leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  1950년대 군사 정권의 야간 통행 금지 + 유흥업소 영업 제한 → 탱고 인기 쇠퇴. 로큰롤 부상. 탱고는 망명자 커뮤니티와 비공개 살롱에서 감정적 저항의 예술로 명맥 유지. 1983년 브로드웨이 《Tango Argentino》가 세계적 르네상스 도화선.
                </p>
              </article>

              <article className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5 md:p-6">
                <h2 className="font-display text-2xl text-tango-paper italic mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  무용 양식의 분화
                </h2>
                <div className="space-y-3 text-sm text-tango-cream/80 font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  <div>
                    <strong className="text-tango-brass not-italic">Estilo Milonguero (Apilado)</strong> — 좁은 도심 댄스홀에서 발전. 가슴 완전 밀착(chest-to-chest), 화려한 발동작 배제, 응축된 감정적 일체감. <em>Carlos Gavito, Tete Rusconi, Ricardo Vidort.</em>
                  </div>
                  <div>
                    <strong className="text-tango-brass not-italic">Villa Urquiza Style (살롱)</strong> — 부에노스아이레스 북부 넓은 플로어에서 발전. 꼿꼿한 자세, 매끄럽고 길게 미끄러지는 우아함. <em>Luis Lemos('Milonguita'), El Turco Jose, Andres Laza Moreno.</em>
                  </div>
                  <div>
                    <strong className="text-tango-brass not-italic">Stage Tango (Escenario)</strong> — 1950s 후반 Copes & Nieves가 구조화. 군무·서사적 안무·발레 요소. 1983년 《Tango Argentino》 브로드웨이 흥행.
                  </div>
                </div>
              </article>

              <div className="text-[11px] text-tango-cream/40 text-center font-serif italic">
                상세 출처는 학술 문헌 탭 참조
              </div>
            </div>
          )}

          {/* 학술 문헌 */}
          {tab === 'books' && (
            <div className="space-y-4">
              {books.map(b => (
                <article key={b.id} className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                    <h3 className="font-display text-xl md:text-2xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {b.title}
                    </h3>
                    <span className="text-xs text-tango-brass font-mono">{b.year}</span>
                  </div>
                  <div className="text-sm text-tango-brass font-serif italic mb-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {b.author}{b.publisher && ` · ${b.publisher}`}
                  </div>
                  <p className="text-sm text-tango-cream/80 font-serif leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {b.summary}
                  </p>
                  {b.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {b.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 border border-tango-brass/25 text-tango-brass/70 rounded-sm uppercase tracking-wider font-sans">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* 인터뷰 */}
          {tab === 'interviews' && (
            <div className="space-y-4">
              {interviews.map(i => (
                <article key={i.id} className="bg-gradient-to-br from-tango-shadow/40 via-tango-shadow/40 to-tango-brass/5 border border-tango-brass/25 rounded-sm p-5 md:p-6">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                    <h3 className="font-display text-xl md:text-2xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {i.subject}
                    </h3>
                    <span className="text-xs text-tango-brass font-mono">{i.year}</span>
                  </div>
                  <blockquote className="border-l-4 border-tango-brass/60 pl-4 my-3">
                    <p className="font-serif italic text-base md:text-lg text-tango-paper leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      "{i.quote_ko}"
                    </p>
                  </blockquote>
                  <div className="text-xs text-tango-cream/70 font-serif italic mt-3" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    <strong className="not-italic text-tango-brass">맥락:</strong> {i.context}
                    {i.interlocutor && (
                      <span className="block mt-1 text-tango-cream/50">대담자: {i.interlocutor}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <OrnamentDivider className="pt-6" />
        </div>
      </div>
    </>
  );
}
