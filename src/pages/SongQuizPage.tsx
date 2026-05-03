// 곡 퀴즈 v2 — 단일 곡 영상 + 강한 오버레이 + 답 후 곡 정보·가사
import { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EditorialButton, OrnamentDivider } from '../components/editorial';
import quizData from '../data/quiz_songs.json';

interface QuizEntry {
  video_id: string;
  song_title: string;
  orchestra: string;
  orchestra_short: string;
  vocalist: string;
  year: number;
  genre: string;
  start_sec?: number;
  end_sec?: number;
  multi_song_video?: boolean;
  info_ko?: string;
  lyrics_search_url?: string;
  sources?: { label: string; url: string }[];
}

interface QuizQuestion {
  entry: QuizEntry;
  choices: string[];
}

const ENTRIES: QuizEntry[] = (quizData as any).entries;

const ALL_ORCHESTRAS = [
  "D'Arienzo", 'Di Sarli', 'Pugliese', 'Tanturi', 'Troilo', 'Caló',
  'Laurenz', "D'Agostino", 'Biagi', 'Fresedo', 'Demare', 'Gobbi',
  'Canaro', 'De Angelis',
];

function pickQuiz(seenIds: Set<string>): QuizQuestion | null {
  if (ENTRIES.length === 0) return null;
  const unseen = ENTRIES.filter(e => !seenIds.has(e.video_id));
  const pool = unseen.length > 0 ? unseen : ENTRIES;
  const entry = pool[Math.floor(Math.random() * pool.length)];

  const wrongs = ALL_ORCHESTRAS
    .filter(o => o !== entry.orchestra_short)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const choices = [...wrongs, entry.orchestra_short].sort(() => Math.random() - 0.5);

  return { entry, choices };
}

export function SongQuizPage() {
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);

  const newQuiz = () => {
    const next = pickQuiz(seenIds);
    if (next) {
      setSeenIds(prev => {
        const merged = new Set(prev);
        merged.add(next.entry.video_id);
        if (merged.size >= ENTRIES.length) return new Set();
        return merged;
      });
    }
    setQuiz(next);
    setAnswer(null);
    setShowSources(false);
  };

  useEffect(() => { newQuiz(); }, []);

  const handleAnswer = (choice: string) => {
    if (answer || !quiz) return;
    setAnswer(choice);
    setStats(prev => ({
      correct: prev.correct + (choice === quiz.entry.orchestra_short ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const isCorrect = answer && quiz && answer === quiz.entry.orchestra_short;

  const videoUrl = quiz ? (() => {
    const params = new URLSearchParams();
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('controls', '0');
    params.set('disablekb', '1');
    params.set('iv_load_policy', '3');
    if (quiz.entry.start_sec) params.set('start', String(quiz.entry.start_sec));
    if (quiz.entry.end_sec) params.set('end', String(quiz.entry.end_sec));
    return `https://www.youtube.com/embed/${quiz.entry.video_id}?${params.toString()}`;
  })() : '';

  if (ENTRIES.length === 0) {
    return (
      <>
        <PageHeader title="탱고 곡 퀴즈" />
        <div className="flex-1 flex items-center justify-center text-tango-cream/60 font-serif italic">
          퀴즈 데이터가 없습니다.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="탱고 곡 퀴즈" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Game · Single-Song Quiz
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              <em className="text-tango-brass">귀로</em> 맞추는 악단
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              한 곡만 듣고 어느 악단인지 맞춰보세요
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          <div className="flex items-center justify-center gap-6 md:gap-8 py-4 border-y border-tango-brass/15">
            <div className="text-center">
              <div className="font-display text-2xl md:text-3xl text-tango-paper font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.correct}
              </div>
              <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mt-0.5">정답</div>
            </div>
            <div className="h-8 w-px bg-tango-brass/30"></div>
            <div className="text-center">
              <div className="font-display text-2xl md:text-3xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {accuracy}%
              </div>
              <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mt-0.5">정확도</div>
            </div>
            <div className="h-8 w-px bg-tango-brass/30"></div>
            <div className="text-center">
              <div className="font-display text-2xl md:text-3xl text-tango-paper font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.total}
              </div>
              <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mt-0.5">문항</div>
            </div>
            <div className="h-8 w-px bg-tango-brass/30"></div>
            <div className="text-center">
              <div className="font-display text-2xl md:text-3xl text-tango-cream/60 font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {ENTRIES.length}
              </div>
              <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 mt-0.5">DB</div>
            </div>
          </div>

          {quiz && (
            <>
              <div className="relative w-full rounded-sm overflow-hidden border border-tango-brass/20 bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={videoUrl}
                  title="Quiz audio"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {!answer && (
                  <div className="absolute inset-0 backdrop-blur-3xl bg-tango-ink/95 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="text-6xl mb-4">🔊</div>
                      <div className="text-tango-brass text-xs tracking-[0.3em] uppercase font-sans mb-2">
                        Listen Only · 화면 가림
                      </div>
                      <div className="text-tango-cream/70 font-serif italic text-sm" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        소리에만 집중해서 악단 맞추기
                      </div>
                      {quiz.entry.multi_song_video && (
                        <div className="text-tango-rose/70 text-[10px] mt-3 font-sans">
                          ⚠ 두 곡 연속 영상 — 첫 곡 기준
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
                  Question
                </div>
                <h2 className="font-serif italic text-2xl md:text-3xl text-tango-paper mt-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  이 곡을 연주한 악단은?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {quiz.choices.map(choice => {
                  const correct = choice === quiz.entry.orchestra_short;
                  const selected = answer === choice;
                  const colored = answer !== null;

                  let cls = 'border-tango-brass/20 hover:border-tango-brass/50 text-tango-paper';
                  if (colored) {
                    if (correct) cls = 'border-green-500 bg-green-500/10 text-green-300';
                    else if (selected) cls = 'border-red-500 bg-red-500/10 text-red-300';
                    else cls = 'border-tango-brass/10 text-tango-cream/40';
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={answer !== null}
                      className={`font-serif italic text-lg md:text-xl py-5 px-4 border-2 rounded-sm transition-all ${cls}`}
                      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {answer && (
                <div className="space-y-4">
                  <div className="text-center bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-6">
                    <div className={`text-[10px] tracking-[0.3em] uppercase mb-3 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {isCorrect ? '✓ Correct · 정답!' : '✕ Incorrect · 오답'}
                    </div>
                    <h3 className="font-display text-3xl md:text-4xl text-tango-paper italic mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {quiz.entry.song_title}
                    </h3>
                    <p className="text-base text-tango-brass mt-2 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {quiz.entry.orchestra}
                    </p>
                    <div className="text-sm text-tango-cream/70 mt-1 font-sans">
                      {quiz.entry.vocalist !== 'instrumental' && `${quiz.entry.vocalist} · `}
                      {quiz.entry.year} · {quiz.entry.genre.toUpperCase()}
                    </div>
                  </div>

                  {quiz.entry.info_ko && (
                    <div className="bg-tango-brass/5 border-l-4 border-tango-brass/60 rounded-sm p-4">
                      <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                        ♪ 이 곡은
                      </div>
                      <p className="text-sm text-tango-cream/85 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {quiz.entry.info_ko}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {quiz.entry.lyrics_search_url && (
                      <a
                        href={quiz.entry.lyrics_search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 bg-tango-brass/10 text-tango-brass hover:bg-tango-brass/20"
                      >
                        📜 원어 가사 보기 (Todotango) →
                      </a>
                    )}
                    <a
                      href={`https://www.youtube.com/watch?v=${quiz.entry.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-2 rounded-sm border border-tango-brass/20 text-tango-cream/70 hover:bg-white/5"
                    >
                      🎬 YouTube에서 열기 →
                    </a>
                    {quiz.entry.sources && quiz.entry.sources.length > 0 && (
                      <button
                        onClick={() => setShowSources(!showSources)}
                        className="text-xs px-3 py-2 rounded-sm border border-tango-brass/20 text-tango-cream/70 hover:bg-white/5"
                      >
                        {showSources ? '✕ 출처 닫기' : '📚 출처'}
                      </button>
                    )}
                  </div>

                  {showSources && quiz.entry.sources && (
                    <div className="bg-tango-shadow/30 border border-tango-brass/15 rounded-sm p-3">
                      <ul className="space-y-0.5">
                        {quiz.entry.sources.map((s, i) => (
                          <li key={i} className="text-[11px]">
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-tango-cream/60 hover:text-tango-brass hover:underline">
                              → {s.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <EditorialButton variant="primary" onClick={newQuiz}>
                  {answer ? '다음 문제 →' : '건너뛰기'}
                </EditorialButton>
              </div>
            </>
          )}

          <div className="text-[11px] text-tango-cream/40 text-center font-serif italic border-t border-tango-brass/10 pt-6">
            현재 DB {ENTRIES.length}곡 — quiz_songs.json에 곡 영상을 추가하면 퀴즈가 풍부해집니다.
          </div>
        </div>
      </div>
    </>
  );
}
