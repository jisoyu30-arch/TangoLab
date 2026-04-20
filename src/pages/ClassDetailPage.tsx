// 수업 상세 페이지 (편집/영상/메모)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useTrainingStore } from '../hooks/useTrainingStore';
import { VideoUploader } from '../components/VideoUploader';

export function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classes, updateClass, deleteClass } = useTrainingStore();
  const cls = classes.find(c => c.id === id);

  const [draft, setDraft] = useState(cls);
  const [topicInput, setTopicInput] = useState('');
  const [takeawayInput, setTakeawayInput] = useState('');

  useEffect(() => {
    if (cls) setDraft(cls);
  }, [cls]);

  if (!cls || !draft) {
    return (
      <>
        <PageHeader title="수업 상세" onBack={() => navigate('/training')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">수업 기록을 찾을 수 없습니다.</p>
        </div>
      </>
    );
  }

  const save = (patch: any) => {
    updateClass(cls.id, patch);
  };

  const handleDelete = () => {
    if (confirm(`"${cls.title}" 수업을 삭제하시겠습니까?`)) {
      deleteClass(cls.id);
      navigate('/training');
    }
  };

  const addTopic = () => {
    if (!topicInput.trim()) return;
    const newTopics = [...cls.topics, topicInput.trim()];
    save({ topics: newTopics });
    setTopicInput('');
  };

  const removeTopic = (i: number) => {
    save({ topics: cls.topics.filter((_, idx) => idx !== i) });
  };

  const addTakeaway = () => {
    if (!takeawayInput.trim()) return;
    save({ key_takeaways: [...cls.key_takeaways, takeawayInput.trim()] });
    setTakeawayInput('');
  };

  const removeTakeaway = (i: number) => {
    save({ key_takeaways: cls.key_takeaways.filter((_, idx) => idx !== i) });
  };

  return (
    <>
      <PageHeader
        title={cls.title || '수업 상세'}
        onBack={() => navigate('/training')}
        right={
          <button onClick={handleDelete} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1">삭제</button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-5 space-y-4">

          {/* 기본 정보 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5 space-y-3">
            <input
              type="text"
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              onBlur={() => save({ title: draft.title })}
              placeholder="수업 제목"
              className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-white/10 pb-2 focus:border-tango-brass/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">날짜</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={e => setDraft({ ...draft, date: e.target.value })}
                  onBlur={() => save({ date: draft.date })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">시간 (분)</label>
                <input
                  type="number"
                  value={draft.duration_minutes}
                  onChange={e => setDraft({ ...draft, duration_minutes: Number(e.target.value) || 0 })}
                  onBlur={() => save({ duration_minutes: draft.duration_minutes })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">강사</label>
                <input
                  type="text"
                  value={draft.instructor}
                  onChange={e => setDraft({ ...draft, instructor: e.target.value })}
                  onBlur={() => save({ instructor: draft.instructor })}
                  placeholder="지아님, 또도땅고..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">파트너</label>
                <input
                  type="text"
                  value={draft.partner || ''}
                  onChange={e => setDraft({ ...draft, partner: e.target.value })}
                  onBlur={() => save({ partner: draft.partner || null })}
                  placeholder="신랑, 지아님..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">장소</label>
                <input
                  type="text"
                  value={draft.location}
                  onChange={e => setDraft({ ...draft, location: e.target.value })}
                  onBlur={() => save({ location: draft.location })}
                  placeholder="또도땅고, 집..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>
            </div>
          </div>

          {/* 수업 주제 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">수업 주제</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {cls.topics.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-tango-brass/15 text-tango-brass rounded-full">
                  {t}
                  <button onClick={() => removeTopic(i)} className="ml-1 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTopic()}
                placeholder="예: 피보테, 오초, 핸드포지션..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <button onClick={addTopic} className="px-4 bg-tango-brass/20 text-tango-brass rounded-lg text-sm font-medium hover:bg-tango-brass/30 min-h-[36px]">+</button>
            </div>
          </div>

          {/* 영상 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">수업 영상</h3>
            <VideoUploader
              videoUrl={cls.video_url}
              onChange={(url) => save({ video_url: url })}
            />
          </div>

          {/* 핵심 배운 점 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">💡 핵심 배운 점</h3>
            <div className="space-y-2 mb-3">
              {cls.key_takeaways.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-200 bg-tango-brass/5 rounded-lg px-3 py-2">
                  <span className="text-tango-brass">•</span>
                  <span className="flex-1">{t}</span>
                  <button onClick={() => removeTakeaway(i)} className="text-gray-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={takeawayInput}
                onChange={e => setTakeawayInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTakeaway()}
                placeholder="오늘 꼭 기억할 것..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <button onClick={addTakeaway} className="px-4 bg-tango-brass/20 text-tango-brass rounded-lg text-sm font-medium hover:bg-tango-brass/30 min-h-[36px]">+</button>
            </div>
          </div>

          {/* 상세 메모 */}
          <div className="bg-white/5 border border-tango-brass/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">상세 메모</h3>
            <textarea
              value={draft.notes}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              onBlur={() => save({ notes: draft.notes })}
              placeholder="수업 내용 정리, 문제점, 다음에 신경쓸 점..."
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}
