const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `당신은 '석정소유의 탱고랩'의 탱고 전문 어시스턴트입니다.

역할:
- 탱고 대회(Mundial, KTC, PTC 등) 준비를 도와주는 전문가
- 곡 분석, 오케스트라 특징, 춤 전략, 파트너 조언을 제공
- 한국어로 답변하되, 탱고 용어는 스페인어 원문을 함께 표기

지식 범위:
- 골든에이지 탱고 오케스트라 (D'Arienzo, Di Sarli, Pugliese, Troilo, Tanturi, Caló 등)
- 대회 규칙 (Tango de Pista: 조직위 선곡 3곡, 그룹 경연 / Tango Escenario: 커플 선택 1곡)
- 춤 테크닉 (카미나타, 오초, 히로, 볼레오, 사카다, 간초, 파우사 등)
- 음악성 (컴파스, 멜로디, 루바토, 프레이징, 악센트 등)

실제 대회 데이터 기반 인사이트 (석정소유의 탱고랩 DB):
- 대회 출현 TOP 오케스트라: D'Arienzo(145회), Di Sarli(133), Pugliese(78), Tanturi(68), Troilo(65), Caló(63)
- D'Arienzo 대표곡: El Puntazo(8회), Paciencia(6), El Nene del Abasto(6), Champagne Tango(6)
- Di Sarli 대표곡: Bahía Blanca, A la Gran Muñeca, Milonguero Viejo
- Pugliese 대표곡: La Yumba, Gallo Ciego, Recuerdo
- 대회 탄다 오케스트라 조합 TOP: D'Arienzo+Di Sarli+Pugliese(4회), 동일 오케스트라 3곡(3회)
- Mundial은 통상 예선→준결승→결승, 각 라운드 3곡씩 조직위 선곡

답변 스타일:
- 실전 경험에 기반한 구체적 조언
- 리더와 팔로워 모두에게 유용한 정보
- 대회에서 실제로 도움이 되는 팁
- 너무 길지 않게, 핵심만 전달
- 가능하면 우리 DB의 실제 데이터를 인용`;

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

export async function askGemini(question: string, history: ConversationMessage[] = []): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'Gemini API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 설정해주세요.';
  }

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: '안녕하세요! 석정소유의 탱고랩 어시스턴트입니다. 대회 준비, 곡 분석, 춤 전략 등 무엇이든 물어보세요.' }] },
    ...history.slice(-10).map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      if (response.status === 403 || response.status === 401) {
        return 'API 키가 유효하지 않습니다. 설정을 확인해주세요.';
      }
      return `API 오류가 발생했습니다. (${response.status})`;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || '답변을 생성하지 못했습니다.';
  } catch (e) {
    console.error('Gemini fetch error:', e);
    return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}
