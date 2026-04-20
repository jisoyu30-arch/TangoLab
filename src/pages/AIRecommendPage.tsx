// AI 탄다 추천 — Gemini 기반 맞춤 추천
import { useState, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EditorialButton, OrnamentDivider } from '../components/editorial';
import { askGemini } from '../lib/gemini';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import roundsData from '../data/competition_rounds.json';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const rounds = (roundsData as any).rounds;

type Mood = 'energetic' | 'elegant' | 'dramatic' | 'melodic' | 'balanced';
type Level = 'beginner' | 'intermediate' | 'advanced';
type Purpose = 'competition' | 'milonga' | 'practice';

const MOOD_OPTIONS: { v: Mood; l: string; desc: string }[] = [
  { v: 'energetic', l: '에너지', desc: 'D\'Arienzo · Biagi 계열' },
  { v: 'elegant', l: '우아함', desc: 'Di Sarli · D\'Agostino' },
  { v: 'dramatic', l: '드라마틱', desc: 'Pugliese · Troilo' },
  { v: 'melodic', l: '멜로디', desc: 'Tanturi · Caló' },
  { v: 'balanced', l: '균형', desc: '고르게 섞기' },
];

export function AIRecommendPage() {
  const [mood, setMood] = useState<Mood>('balanced');
  const [level, setLevel] = useState<Level>('intermediate');
  const [purpose, setPurpose] = useState<Purpose>('competition');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contextData = useMemo(() => {
    // 대회에서 인기 있는 조합 상위 (탄다 연구소 결과)
    const topCombos: Record<string, number> = {};
    for (const r of rounds) {
      if (r.songs.length < 2) continue;
      const orchs = [...new Set(r.songs.map((s: any) => (s.orchestra || '').split(' ')[0]))].sort().join(' + ');
      topCombos[orchs] = (topCombos[orchs] || 0) + 1;
    }
    const topList = Object.entries(topCombos).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalSongs: songs.length,
      totalRounds: rounds.length,
      totalApp: appearances.length,
      topCombos: topList.map(([c, n]) => `${c} (${n}회)`).join(', '),
    };
  }, []);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const moodLabel = MOOD_OPTIONS.find(m => m.v === mood)!.l;
    const levelLabel = level === 'beginner' ? '초급' : level === 'intermediate' ? '중급' : '상급';
    const purposeLabel = purpose === 'competition' ? '대회' : purpose === 'milonga' ? '밀롱가' : '연습';

    const prompt = `당신은 아르헨티나 탱고 대회 DJ이자 분석가입니다.

사용자가 다음 조건으로 탄다(3곡 세트)를 추천받고 싶어합니다:
- 무드: ${moodLabel} (${MOOD_OPTIONS.find(m => m.v === mood)!.desc})
- 수준: ${levelLabel}
- 용도: ${purposeLabel}
${customNote ? `- 추가 요청: ${customNote}` : ''}

탱고랩 DB 컨텍스트:
- 곡 ${contextData.totalSongs}개, 대회 라운드 ${contextData.totalRounds}개, 출현 기록 ${contextData.totalApp}건
- 대회 인기 악단 조합 TOP 5: ${contextData.topCombos}

응답 형식:
## 추천 탄다
**1번째 곡**: [곡명] / [악단]
- 이유: ...

**2번째 곡**: [곡명] / [악단]
- 이유: ...

**3번째 곡**: [곡명] / [악단]
- 이유: ...

## 이 탄다의 특징
- 에너지 흐름: ...
- 춤 추는 포인트: ...
- 주의할 점: ...

반드시 실존하는 탱고 클래식 곡을 추천하세요. 가상의 곡은 만들지 마세요.`;

    try {
      const reply = await askGemini(prompt, []);
      setResult(reply);
    } catch (e: any) {
      setError(e.message || 'AI 호출 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="AI 탄다 추천" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              AI Assistant · Tanda Recommendation
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              <em className="text-tango-brass">AI가 설계한</em> 당신의 탄다
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              무드·수준·용도를 말씀해주시면 Gemini가 3곡 탄다를 설계해드립니다
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 무드 */}
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">무드</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.v}
                  onClick={() => setMood(m.v)}
                  className={`px-3 py-4 rounded-sm text-center transition-all border-2 ${
                    mood === m.v
                      ? 'border-tango-brass bg-tango-brass/10 text-tango-paper'
                      : 'border-tango-brass/20 text-tango-cream/60 hover:border-tango-brass/40'
                  }`}
                >
                  <div className="font-serif italic text-lg" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {m.l}
                  </div>
                  <div className="text-[10px] text-tango-cream/50 mt-1 font-sans">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 수준 + 용도 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">수준</div>
              <div className="flex gap-2">
                {[
                  { v: 'beginner' as Level, l: '초급' },
                  { v: 'intermediate' as Level, l: '중급' },
                  { v: 'advanced' as Level, l: '상급' },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => setLevel(o.v)}
                    className={`flex-1 py-2 rounded-sm border-2 transition-all text-sm font-serif italic ${
                      level === o.v
                        ? 'border-tango-brass bg-tango-brass/10 text-tango-paper'
                        : 'border-tango-brass/20 text-tango-cream/60'
                    }`}
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">용도</div>
              <div className="flex gap-2">
                {[
                  { v: 'competition' as Purpose, l: '대회' },
                  { v: 'milonga' as Purpose, l: '밀롱가' },
                  { v: 'practice' as Purpose, l: '연습' },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => setPurpose(o.v)}
                    className={`flex-1 py-2 rounded-sm border-2 transition-all text-sm font-serif italic ${
                      purpose === o.v
                        ? 'border-tango-brass bg-tango-brass/10 text-tango-paper'
                        : 'border-tango-brass/20 text-tango-cream/60'
                    }`}
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 추가 요청 */}
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">추가 요청 (선택)</div>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="예: 2번째에 발스 1곡 넣어주세요, Pugliese는 피해주세요..."
              rows={2}
              className="w-full bg-transparent border-b-2 border-tango-brass/20 focus:border-tango-brass pb-2 text-tango-paper placeholder-tango-cream/30 focus:outline-none font-serif text-sm"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            />
          </div>

          {/* 버튼 */}
          <div className="text-center">
            <EditorialButton variant="primary" onClick={handleAsk} className={loading ? 'opacity-60 pointer-events-none' : ''}>
              {loading ? 'AI 생각 중…' : '✨ 탄다 추천받기'}
            </EditorialButton>
          </div>

          {/* 에러 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* 결과 */}
          {result && (
            <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-4">
                AI Response
              </div>
              <pre className="font-serif text-base text-tango-paper whitespace-pre-wrap leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
