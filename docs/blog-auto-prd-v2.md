# Blog AutoPilot PRD v2

작성일: 2026-07-10  
대상 저장소: `jisoyu30-arch/TangoLab`  
문서 목적: All About Tango 블로그 운영을 위한 AI 초안 생성, 사진/영상 추천, 네이버 블로그 자동 작성 보조 기능의 개발 범위를 정의한다.

---

## 1. 한 줄 정의

**Blog AutoPilot**은 사용자가 주제와 메모만 입력해도 AI가 블로그 초안을 만들고, 글에 어울리는 사진과 영상을 추천하며, 네이버 블로그 에디터에 제목, 본문, 미디어, 태그를 자동 입력하도록 돕는 **하담 전용 블로그 자동 편집실**이다.

이 시스템의 목표는 완전 무인 발행이 아니라, **자동 작성 + 자동 세팅 + 사람의 최종 승인**이다.

---

## 2. 배경과 문제 정의

하담의 탱고 블로그는 단순 홍보 채널이 아니라 입문자를 위한 탱고 매거진에 가깝다. 글의 성격은 정보, 역사, 수업 복습, 개인 에세이, 사진 기록이 섞여 있다.

현재 블로그 운영에서 반복되는 부담은 다음과 같다.

1. 매일 올릴 주제를 정하는 데 시간이 든다.
2. 사진이나 영상이 없으면 글이 밋밋해진다.
3. 자료를 모으고 출처를 확인하는 과정이 번거롭다.
4. 네이버 블로그 에디터에 제목, 본문, 사진, 태그를 옮기는 과정이 반복 작업이다.
5. 자동화가 너무 강하면 품질 저하, 저작권 문제, 플랫폼 리스크가 생길 수 있다.

따라서 이 시스템은 글을 대신 공개하는 기계가 아니라, 글감을 다듬고, 미디어를 골라주고, 네이버 편집창까지 차려주는 **보조작가 겸 편집비서**로 설계한다.

---

## 3. 외부 서비스 사실 확인

### 3.1 네이버 블로그 API

네이버 공식 개발자 문서에서 확인되는 블로그 관련 Open API는 **블로그 검색 API**이다. 문서상 이 API는 네이버 검색의 블로그 검색 결과를 XML 또는 JSON으로 반환하는 REST API이며, HTTP 메서드는 `GET`이다. 요청 URL도 `https://openapi.naver.com/v1/search/blog.json` 또는 `.xml`이다.

따라서 이 PRD에서는 네이버 블로그 자동 작성을 **공식 글쓰기 API 연동**이 아니라 **브라우저 자동화 기반 자동 입력 기능**으로 정의한다.

참고 URL:
- https://developers.naver.com/docs/serviceapi/search/blog/blog.md

### 3.2 Pexels API

Pexels API는 사진과 영상을 포함한 콘텐츠 라이브러리에 프로그래밍 방식으로 접근할 수 있는 RESTful JSON API이다. 사진 검색 엔드포인트는 `GET https://api.pexels.com/v1/search`, 영상 검색 엔드포인트는 `GET https://api.pexels.com/v1/videos/search`이다. API 요청에는 `Authorization` 헤더가 필요하다.

Pexels는 API 사용 시 Pexels 링크 표시를 요구하고, 가능하면 사진작가 크레딧을 표시하라고 안내한다. 기본 제한은 시간당 200회, 월 20,000회이다.

참고 URL:
- https://www.pexels.com/api/documentation/

### 3.3 Playwright

Playwright는 Chromium, WebKit, Firefox를 자동화할 수 있는 브라우저 자동화 도구다. 공식 문서 기준으로 headless/headed 모드를 지원하고, Windows, Linux, macOS 환경에서 실행 가능하다.

이 PRD에서는 네이버 블로그 자동 작성 보조 기능의 1차 후보 기술로 Playwright를 사용한다.

참고 URL:
- https://playwright.dev/docs/intro

---

## 4. 제품 원칙

### 4.1 기본 원칙

1. 사용자가 최종 통제권을 가진다.
2. 공개 발행 기본값은 꺼둔다.
3. 초안은 반드시 검수함을 거친다.
4. 외부 사진/영상은 출처와 라이선스를 저장한다.
5. 네이버 계정 비밀번호는 저장하지 않는다.
6. 자동화 실패 시 복붙 모드로 안전하게 전환한다.
7. 저작권 위험이 있는 미디어는 기본 차단한다.
8. 블로그 품질을 해치는 반복 문구, 과장 문구, 중복 제목을 경고한다.

### 4.2 금지할 기능

- 사용자의 승인 없는 공개 발행
- 타 블로그/기사/인스타그램/유튜브 썸네일 무단 저장 후 재업로드
- 네이버 계정 비밀번호 저장
- CAPTCHA, 2단계 인증, 보안 절차 우회
- 플랫폼 이용약관 위반을 전제로 한 자동화
- 저작권 불명 미디어 자동 삽입

---

## 5. 사용자 시나리오

### 5.1 시나리오 A: 글감 하나로 자동 초안 생성

사용자가 다음처럼 입력한다.

```txt
디살리 악단을 초급 탱고 수강생에게 소개하는 글. 첫 수업 때 계속 들었던 음악이라는 점을 넣고 싶음.
```

시스템은 다음을 생성한다.

- 제목 후보 5개
- 게시판 추천: `Tango Archivo`
- 글 유형 추천: `입문자용 정보글`
- 본문 초안
- 사진/영상 검색 키워드
- 추천 태그
- 출처 필요 문장 표시
- 네이버 블로그 입력용 본문

### 5.2 시나리오 B: 사진이 없을 때 적합한 미디어 추천

사용자가 사진을 올리지 않아도 시스템이 다음 후보를 검색한다.

- Pexels 사진
- Pexels 영상
- 직접 생성 이미지 후보
- 위키미디어 등 공개 라이선스 후보, v2 이후

사용자는 후보 중 마음에 드는 사진과 영상을 선택한다. 시스템은 선택한 미디어의 출처 문구를 자동 생성한다.

### 5.3 시나리오 C: 네이버 블로그 자동 입력

사용자가 `네이버에 자동 입력` 버튼을 누른다.

시스템은 로컬 브라우저 자동화 러너를 실행한다.

1. 네이버 블로그 글쓰기 화면을 연다.
2. 사용자가 직접 로그인한다. 이미 로그인되어 있으면 그대로 진행한다.
3. 제목을 입력한다.
4. 본문을 입력한다.
5. 선택한 사진/영상을 업로드한다.
6. 태그를 입력한다.
7. 카테고리를 선택한다.
8. 기본값으로 임시저장 또는 비공개 저장한다.
9. 공개 발행은 사용자의 명시적 확인이 있을 때만 시도한다.

---

## 6. 게시판별 콘텐츠 전략

| 게시판 | 성격 | 자동화 톤 |
|---|---|---|
| 다이어리 | 수업 후기, 연습 기록, 개인 감상 | 다정하고 솔직한 기록체 |
| La Vida en Tango | 탱고 생활 에세이 | 장면 중심, 사유 중심 |
| Tango Archivo | 악단, 역사, 예절, 음악 정보 | 입문자용 매거진 톤 |
| Tango Postcard | 사진/영상 중심 짧은 포스트 | 짧고 이미지가 살아나는 문장 |

---

## 7. 주요 기능 범위

## 7.1 Blog Auto Dashboard

### 기능

- 오늘 생성할 글 수 표시
- 검수 대기 글 수 표시
- 발행 준비 글 수 표시
- 최근 발행 기록 표시
- 주제 큐 표시
- 사진/영상 추천 대기 글 표시
- 네이버 자동 입력 실패 로그 표시

### 완료 조건

- `/blog-auto` 페이지에서 전체 현황 확인 가능
- 상태별 필터 가능
- 모바일에서도 카드형으로 확인 가능

---

## 7.2 Topic Queue

### 기능

- 주제 입력
- 게시판 선택
- 글 유형 선택
- 메모 입력
- 참고 링크 입력
- 직접 사진/영상 업로드
- 외부 미디어 검색 여부 선택
- 우선순위 설정
- 예약 초안 생성일 설정

### 데이터 필드

```ts
interface BlogTopic {
  id: string;
  title_seed: string;
  memo: string;
  category: BlogCategory;
  content_type: BlogContentType;
  source_urls: string[];
  user_media_ids: string[];
  allow_external_media: boolean;
  priority: 'low' | 'normal' | 'high';
  scheduled_draft_at?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 7.3 AI Draft Generator

### 기능

- 제목 후보 생성
- 본문 구조 생성
- 도입부 후보 생성
- 본문 초안 작성
- 소제목 생성
- 태그 추천
- 이미지/영상 삽입 위치 추천
- 하담 문체 프리셋 적용
- 출처 필요 문장 표시
- 네이버 블로그용 일반 텍스트 출력

### 출력 JSON 예시

```json
{
  "title_candidates": ["디살리는 왜 첫 수업에 잘 어울릴까"],
  "selected_title": "디살리는 왜 첫 수업에 잘 어울릴까",
  "category": "tango_archivo",
  "body_markdown": "...",
  "naver_export_text": "...",
  "tags": ["아르헨티나탱고", "디살리", "탱고입문"],
  "media_search_queries": ["Carlos Di Sarli tango", "Argentine tango orchestra", "Buenos Aires milonga"],
  "media_slots": [
    {
      "position": "after_intro",
      "type": "image",
      "purpose": "악단 분위기 이미지"
    }
  ],
  "warnings": ["역사 정보는 출처 확인 필요"]
}
```

---

## 7.4 Media Finder

### 기능

- 글 주제에서 사진/영상 검색어 자동 생성
- Pexels 사진 검색
- Pexels 영상 검색
- 미디어 후보 카드 표시
- 미디어 미리보기
- 작가명, 원본 URL, 라이선스, 출처 문구 저장
- 선택한 미디어를 Draft에 연결
- 위험 미디어 차단

### 1차 지원 소스

| 소스 | 지원 범위 | 비고 |
|---|---|---|
| 사용자 직접 업로드 | 사진/영상 | 최우선 |
| Pexels | 사진/영상 | API 키 필요, 출처 표시 필요 |
| AI 생성 이미지 | 이미지 | 생성형 이미지 표시 여부 검토 |

### 2차 지원 소스

| 소스 | 지원 범위 | 비고 |
|---|---|---|
| Unsplash | 사진 | API 정책 검토 후 |
| Pixabay | 사진/영상 | API 정책 검토 후 |
| Wikimedia Commons | 사진 | 라이선스 복잡도 높음 |

### 금지 소스

- 타 블로그 이미지 무단 저장
- 뉴스 이미지 무단 저장
- 인스타그램 이미지 무단 저장
- 유튜브 썸네일 무단 저장
- 공연 영상 무단 다운로드

---

## 7.5 Media Library

### 기능

- 사용자가 올린 사진/영상 저장
- 외부 API에서 선택한 사진/영상 메타데이터 저장
- 출처 문구 자동 생성
- 사용한 글과 연결
- 중복 사용 기록 표시

### 데이터 모델

```ts
interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  source: 'user_upload' | 'pexels' | 'unsplash' | 'pixabay' | 'wikimedia' | 'generated';
  title?: string;
  preview_url: string;
  download_url?: string;
  source_url?: string;
  creator_name?: string;
  creator_url?: string;
  license_name?: string;
  license_url?: string;
  usage_status: 'safe' | 'needs_credit' | 'risky' | 'blocked';
  credit_text?: string;
  selected: boolean;
  created_at: string;
}
```

---

## 7.6 Review Inbox

### 상태값

```ts
type DraftStatus =
  | 'queued'
  | 'generating'
  | 'media_pending'
  | 'review'
  | 'needs_edit'
  | 'ready_for_naver'
  | 'naver_filled'
  | 'private_saved'
  | 'published'
  | 'archived'
  | 'failed';
```

### 기능

- 초안 카드 목록
- 상태별 필터
- 게시판별 필터
- 미디어 유무 필터
- 네이버 자동 입력 가능 여부 표시
- 품질 경고 표시
- 문단별 재작성 버튼

---

## 7.7 Naver Editor Automator

### 핵심 정의

네이버 블로그 자동 작성은 공식 API가 아니라 **브라우저 자동화 기반 자동 입력 기능**이다.

### 1차 구현 방식

- Playwright 기반 로컬 러너
- 사용자의 PC에서 실행
- 네이버 비밀번호 저장 금지
- 사용자가 직접 로그인
- 로그인 세션은 브라우저 프로필에 맡김
- 자동화 실패 시 복붙 모드로 전환

### 2차 구현 후보

- Chrome Extension 기반 콘텐츠 스크립트
- Electron 또는 Tauri 데스크톱 앱
- Localhost Bridge: TangoLab 웹 UI가 로컬 러너와 통신

### 자동 입력 항목

- 제목
- 본문
- 이미지
- 영상
- 태그
- 카테고리
- 공개/비공개/임시저장 상태

### 기본 발행 모드

```ts
type PublishMode =
  | 'copy_only'
  | 'auto_fill'
  | 'save_draft'
  | 'save_private'
  | 'publish_after_approval';
```

기본값은 `save_draft` 또는 `save_private`로 둔다.

---

## 7.8 Publish Safety Guard

### 발행 전 체크

- 외부 미디어 출처 누락
- 저작권 위험 미디어 포함
- AI 생성 이미지 표시 필요 여부
- 출처 없는 역사/사실 단정
- 과장 광고 문구
- 중복 제목
- 너무 짧은 본문
- 너무 많은 태그
- 공개 발행 확인 여부

### 차단 규칙

아래 조건에서는 공개 발행 버튼을 비활성화한다.

1. `usage_status`가 `blocked`인 미디어 포함
2. 출처가 필요한 외부 미디어의 `credit_text` 없음
3. 네이버 자동 입력 중 오류가 발생했는데 사용자가 확인하지 않음
4. 공개 발행 확인 모달에서 사용자가 동의하지 않음

---

## 8. 전체 시스템 흐름

```txt
[주제 입력]
  ↓
[AI 초안 생성]
  ↓
[사진/영상 검색어 생성]
  ↓
[Media Finder 후보 검색]
  ↓
[사용자 미디어 선택]
  ↓
[출처/라이선스 저장]
  ↓
[품질/리스크 체크]
  ↓
[검수함 저장]
  ↓
[네이버 자동 입력]
  ↓
[임시저장 또는 비공개 저장]
  ↓
[사용자 최종 확인]
  ↓
[공개 발행]
```

---

## 9. 추천 아키텍처

### 9.1 MVP 구조

현재 TangoLab는 React 기반 대시보드 구조이므로 1차는 기존 앱에 `/blog-auto` 페이지를 추가한다.

```txt
TangoLab
└── src
    ├── pages
    │   └── BlogAutoPage.tsx
    ├── components
    │   └── blog
    │       ├── BlogDashboard.tsx
    │       ├── TopicQueue.tsx
    │       ├── DraftEditor.tsx
    │       ├── ReviewInbox.tsx
    │       ├── MediaFinder.tsx
    │       ├── MediaLibrary.tsx
    │       ├── NaverExportPanel.tsx
    │       └── PublishSafetyGuard.tsx
    ├── hooks
    │   └── useBlogAutoStore.ts
    ├── prompts
    │   └── blog
    │       ├── system.md
    │       ├── tango-archivo.md
    │       ├── la-vida-en-tango.md
    │       ├── diary.md
    │       └── postcard.md
    └── data
        └── blog_style_profile.json
```

### 9.2 자동 입력 러너 구조

React 브라우저 앱은 보안상 사용자의 다른 브라우저 탭을 직접 조작할 수 없다. 따라서 네이버 자동 입력 기능은 별도 로컬 러너가 필요하다.

```txt
TangoLab Web UI
  ↓ localhost API
Local Naver Runner
  ↓ Playwright
Naver Blog Editor
```

### 9.3 로컬 러너 후보 구조

```txt
blog-runner
├── package.json
├── playwright.config.ts
├── src
│   ├── index.ts
│   ├── naver
│   │   ├── openEditor.ts
│   │   ├── fillTitle.ts
│   │   ├── fillBody.ts
│   │   ├── uploadMedia.ts
│   │   ├── setTags.ts
│   │   ├── saveDraft.ts
│   │   └── publishAfterApproval.ts
│   └── server
│       └── localhostBridge.ts
└── README.md
```

---

## 10. 데이터 모델

```ts
type BlogCategory =
  | 'diary'
  | 'la_vida_en_tango'
  | 'tango_archivo'
  | 'tango_postcard';

type BlogContentType =
  | 'essay'
  | 'info'
  | 'lesson_note'
  | 'review'
  | 'postcard'
  | 'announcement';

interface BlogDraft {
  id: string;
  topic_id: string;
  title: string;
  subtitle?: string;
  category: BlogCategory;
  content_type: BlogContentType;
  body_markdown: string;
  naver_export_text: string;
  tags: string[];
  media_assets: MediaAsset[];
  media_plan: MediaSlot[];
  status: DraftStatus;
  publish_mode: PublishMode;
  quality_score?: number;
  warnings: string[];
  naver_result?: NaverPublishResult;
  created_at: string;
  updated_at: string;
}

interface MediaSlot {
  id: string;
  position: 'cover' | 'after_intro' | 'middle' | 'before_conclusion' | 'end';
  type: 'image' | 'video';
  purpose: string;
  media_asset_id?: string;
}

interface NaverPublishResult {
  status: 'not_started' | 'opened' | 'filled' | 'draft_saved' | 'private_saved' | 'published' | 'failed';
  url?: string;
  error_message?: string;
  executed_at?: string;
}
```

---

## 11. UI 설계

### 11.1 `/blog-auto` 메인

```txt
┌────────────────────────────────────────┐
│ Blog AutoPilot                         │
│ All About Tango 자동 편집실            │
├────────────────────────────────────────┤
│ 주제 큐 7 | 검수 대기 3 | 미디어 필요 2 │
│ 네이버 입력 준비 1 | 비공개 저장 1     │
├────────────────────────────────────────┤
│ [새 주제 입력]                         │
│ 주제 / 게시판 / 메모 / 링크 / 미디어    │
│ [AI 초안 만들기] [사진·영상 찾기]       │
├────────────────────────────────────────┤
│ 검수함                                 │
│ [초안 카드] [초안 카드] [초안 카드]     │
└────────────────────────────────────────┘
```

### 11.2 초안 편집 화면

```txt
┌──────────────────────────────┐
│ 제목                         │
│ 게시판 / 상태 / 발행 모드     │
├──────────────────────────────┤
│ 본문 에디터                  │
├──────────────────────────────┤
│ 사진/영상 추천               │
│ [Pexels 후보] [직접 업로드]   │
├──────────────────────────────┤
│ 품질 체크                    │
│ - 출처 필요 2개              │
│ - 외부 이미지 출처 있음       │
├──────────────────────────────┤
│ [저장] [네이버 자동 입력]     │
│ [비공개 저장] [공개 발행 준비]│
└──────────────────────────────┘
```

---

## 12. 프롬프트 설계

### 12.1 공통 시스템 프롬프트

```md
너는 하담의 탱고 블로그 보조작가다.

목표:
- 탱고를 잘 모르는 입문자도 읽을 수 있게 쓴다.
- 지나친 전문용어는 풀어서 설명한다.
- 홍보보다 호기심을 먼저 만든다.
- 글은 매거진처럼 단정하고, 개인 경험은 따뜻하게 넣는다.
- 감동을 강요하지 않는다.
- 역사적 사실은 출처 확인이 필요하다고 표시한다.
- 사진과 영상은 저작권 안전성을 고려해 추천한다.

금지:
- 허위 정보 생성
- 출처 없는 역사 단정
- 과장된 광고 문구
- 타인의 글을 베껴 재작성
- 타인의 이미지나 영상을 무단 사용하라고 제안하기
- 매 글마다 수업 홍보로 끝내기
```

### 12.2 미디어 검색 프롬프트

```md
입력된 블로그 주제와 본문 초안을 바탕으로 사진/영상 검색어를 생성한다.

조건:
- 한국어 검색어 3개
- 영어 검색어 5개
- 너무 특정 인물의 초상권/저작권을 침해할 수 있는 검색어는 피한다.
- 분위기, 사물, 장소, 악기, 춤 장면 중심으로 만든다.
- 예: bandoneon, Buenos Aires street, tango dance floor, vintage orchestra, tango shoes
```

---

## 13. 개발 단계

### Phase 0. 문서화와 기본 UI

- `/blog-auto` 라우트 추가
- BlogAutoPage 생성
- Topic Queue UI 생성
- Review Inbox UI 생성
- LocalStorage 기반 저장소 생성

### Phase 1. AI 초안 생성

- 게시판별 프롬프트 추가
- 초안 생성 UI 연결
- Draft Editor 구현
- 태그 추천
- 네이버 복붙용 Export Panel 구현

### Phase 2. 사진/영상 추천

- Pexels API 키 설정
- 사진 검색
- 영상 검색
- 미디어 후보 카드
- 출처 문구 저장
- Draft에 미디어 연결

### Phase 3. 네이버 자동 입력 러너

- Playwright 러너 생성
- 네이버 글쓰기 화면 열기
- 제목/본문 자동 입력
- 이미지 업로드
- 태그 입력
- 임시저장 또는 비공개 저장
- 실패 시 복붙 모드 전환

### Phase 4. 승인 후 발행

- 공개 발행 확인 모달
- 발행 기록 저장
- 비공개 저장 URL 기록
- 실패 로그 저장
- 발행 전 Safety Guard 강화

### Phase 5. 운영 자동화

- 주간 주제 큐
- 매일 초안 자동 생성
- 예약 검수 알림
- 게시판별 발행 빈도 통계
- 성과 메모 입력

---

## 14. GitHub Issue 분해안

### Epic: Blog AutoPilot v2

```md
## 목표
All About Tango 블로그 운영을 위한 AI 초안 생성, 사진/영상 추천, 네이버 블로그 자동 입력 보조 기능을 구현한다.

## 핵심 플로우
주제 입력 → AI 초안 생성 → 사진/영상 추천 → 검수 → 네이버 자동 입력 → 비공개 저장 → 사용자 승인 후 공개 발행

## 완료 조건
- /blog-auto 페이지 접근 가능
- 주제 큐와 검수함 사용 가능
- 외부 사진/영상 후보 추천 가능
- 선택한 미디어의 출처 문구 저장 가능
- 네이버 블로그 에디터에 제목/본문 자동 입력 가능
- 자동화 실패 시 복붙 모드로 전환 가능
- 공개 발행은 사용자 승인 후에만 가능
```

### Issue 1. `/blog-auto` 라우트 추가

```md
## 작업
- BlogAutoPage 생성
- App 라우트에 /blog-auto 추가
- 사이드바에 Blog Auto 메뉴 추가

## 완료 조건
- /blog-auto 진입 가능
- 기존 TangoLab 기능과 충돌 없음
```

### Issue 2. `useBlogAutoStore` 구현

```md
## 작업
- BlogTopic CRUD
- BlogDraft CRUD
- MediaAsset CRUD
- DraftStatus 변경
- LocalStorage 저장

## 완료 조건
- 주제/초안/미디어가 새로고침 후에도 유지됨
```

### Issue 3. AI Draft Generator UI 구현

```md
## 작업
- 초안 생성 버튼
- 제목 후보 표시
- 본문 초안 생성 결과 저장
- 태그 추천 표시
- 네이버용 텍스트 생성

## 완료 조건
- 주제 입력 후 초안 생성 가능
```

### Issue 4. Media Finder 구현

```md
## 작업
- 미디어 검색어 자동 생성
- Pexels 사진 검색
- Pexels 영상 검색
- 후보 카드 표시
- 선택한 미디어를 Draft에 연결

## 완료 조건
- 글 주제에 맞는 사진/영상 후보가 표시됨
```

### Issue 5. 미디어 출처/라이선스 패널 구현

```md
## 작업
- creator_name 저장
- source_url 저장
- credit_text 생성
- usage_status 표시
- blocked 미디어 차단

## 완료 조건
- 외부 미디어 사용 시 출처 문구가 자동 생성됨
```

### Issue 6. Review Inbox 구현

```md
## 작업
- 상태별 초안 목록
- 게시판별 필터
- 미디어 필요 필터
- 네이버 입력 준비 상태 표시

## 완료 조건
- 검수 대기/미디어 필요/네이버 준비 상태를 한눈에 볼 수 있음
```

### Issue 7. Naver Export Panel 구현

```md
## 작업
- 제목 복사
- 본문 복사
- 태그 복사
- 전체 복사
- 이미지/영상 삽입 순서 안내

## 완료 조건
- 자동 입력 실패 시에도 복붙 발행 가능
```

### Issue 8. Playwright 기반 Naver Runner 설계

```md
## 작업
- 로컬 러너 패키지 구조 생성
- 네이버 글쓰기 화면 열기
- 로그인 세션 처리 방식 문서화
- 제목/본문 입력 함수 작성

## 완료 조건
- 로컬 브라우저에서 네이버 글쓰기 화면을 열고 제목/본문 입력 가능
```

### Issue 9. 네이버 미디어 업로드 자동화

```md
## 작업
- 이미지 업로드 자동화
- 영상 업로드 자동화 시도
- 실패 시 링크/복붙 안내
- 업로드 결과 로그 저장

## 완료 조건
- 이미지 1개 이상 자동 업로드 가능
- 실패 시 fallback 제공
```

### Issue 10. 비공개 저장과 승인 후 공개 발행

```md
## 작업
- publish_mode 추가
- 비공개 저장 버튼
- 공개 발행 확인 모달
- 발행 결과 저장

## 완료 조건
- 기본값은 비공개 저장
- 공개 발행은 사용자가 명시적으로 승인해야 가능
```

---

## 15. 보안과 계정 관리

### 원칙

- 네이버 아이디/비밀번호 저장 금지
- API 키는 `.env.local` 또는 서버 환경 변수에 저장
- Pexels API 키는 클라이언트 번들에 노출하지 않는 구조 권장
- 자동화 로그에는 비밀번호, 쿠키, 세션 값을 저장하지 않음
- 사용자가 직접 로그인한 브라우저 세션을 활용

### 위험 요소

| 위험 | 대응 |
|---|---|
| 네이버 UI 변경 | selector fallback, 실패 시 복붙 모드 |
| 로그인 만료 | 사용자에게 직접 로그인 요청 |
| 보안 인증 발생 | 우회 금지, 사용자 직접 처리 |
| 미디어 업로드 실패 | 본문 링크 삽입 또는 수동 업로드 안내 |
| API rate limit | 요청 캐시, 검색 횟수 제한 |

---

## 16. 성공 기준

### MVP 성공 기준

- 주제 1개로 블로그 초안 생성 가능
- 글에 맞는 사진/영상 후보 추천 가능
- 선택 미디어의 출처 문구 저장 가능
- 초안을 검수함에서 수정 가능
- 네이버 복붙용 텍스트 출력 가능

### v1 성공 기준

- 네이버 블로그 글쓰기 화면에 제목/본문 자동 입력 가능
- 이미지 1개 이상 자동 첨부 가능
- 태그 자동 입력 가능
- 임시저장 또는 비공개 저장 가능

### v2 성공 기준

- 사진/영상 포함 글을 네이버에 자동 세팅 가능
- 공개 발행 전 Safety Guard 작동
- 사용자가 승인한 경우에만 공개 발행 가능
- 실패 로그와 fallback이 안정적으로 작동

---

## 17. 최종 결론

Blog AutoPilot v2는 단순한 글쓰기 자동화가 아니라, 하담의 탱고 블로그를 매일 굴러가게 만드는 작은 편집국이다.

AI는 글감을 정리하고, 사진과 영상을 찾아오고, 네이버 편집창까지 차린다.  
하담은 마지막에 문장의 온도와 공개 여부를 결정한다.

이 구조가 가장 안전하고 오래 간다.

기술 방향은 다음 순서가 적합하다.

```txt
/blog-auto 페이지 추가
  ↓
AI 초안 + 검수함
  ↓
사진/영상 추천
  ↓
네이버 복붙 패널
  ↓
Playwright 자동 입력 러너
  ↓
비공개 저장
  ↓
승인 후 공개 발행
```
