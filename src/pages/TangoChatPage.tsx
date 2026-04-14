import { useState, useRef, useEffect, useCallback } from 'react';
import { askGemini } from '../lib/gemini';
import type { ConversationMessage } from '../lib/gemini';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pairId: string;
}

const STORAGE_KEY = 'tango_chat_messages';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m: Record<string, unknown>) => ({
      ...m,
      timestamp: new Date(m.timestamp as string),
    }));
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function TangoChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 메시지 변경 시 로컬 스토리지에 저장
  const updateMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages(prev => {
      const next = updater(prev);
      saveMessages(next);
      return next;
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    const pairId = `pair_${Date.now()}`;
    const now = new Date();

    // 사용자 메시지 즉시 추가
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: now,
      pairId,
    };
    updateMessages(prev => [...prev, userMsg]);

    try {
      const history: ConversationMessage[] = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role === 'user' ? 'user' as const : 'model' as const, text: m.content }));
      const reply = await askGemini(text, history);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        pairId,
      };
      updateMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: '죄송합니다, 오류가 발생했어요. 다시 시도해주세요.',
        timestamp: new Date(),
        pairId,
      };
      updateMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (pairId: string) => {
    updateMessages(prev => prev.filter(m => m.pairId !== pairId));
  };

  const handleClearAll = () => {
    if (!confirm('모든 대화를 삭제하시겠습니까?')) return;
    updateMessages(() => []);
  };

  const formatTime = (ts: Date) => {
    return `${ts.getMonth() + 1}/${ts.getDate()} ${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <>
      <header className="h-14 border-b border-secretary-gold/20 flex items-center justify-between px-5 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300">탱고 Q&A</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{messages.length > 0 ? `${messages.length}개 저장됨` : ''}</span>
          {messages.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-secretary-gold/20 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
              💃
            </div>
            <div className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white/10 text-gray-200 rounded-bl-md">
              안녕하세요! 탱고랩 Q&A입니다. 대회 준비, 곡 분석, 오케스트라 특징, 춤 전략 등 탱고에 관한 질문을 해주세요.
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-secretary-gold/20 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
                💃
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-secretary-gold text-secretary-dark rounded-br-md'
                  : 'bg-white/10 text-gray-200 rounded-bl-md'
              }`}>
                {msg.content}
              </div>
              <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
                {msg.pairId && (
                  <button
                    onClick={() => handleDelete(msg.pairId)}
                    className="text-[10px] text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="이 Q&A 삭제"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-secretary-gold/20 flex items-center justify-center text-sm mr-2 mt-1">💃</div>
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl rounded-bl-md text-gray-400 text-sm">생각 중...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-secretary-gold/20 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="탱고에 대해 무엇이든 물어보세요..."
            className="flex-1 bg-white/5 border border-secretary-gold/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-secretary-gold text-secretary-dark rounded-xl text-sm font-semibold hover:bg-secretary-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </>
  );
}
