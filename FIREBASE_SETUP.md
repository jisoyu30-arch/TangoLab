# Firebase 설정 가이드 (작가님 전용)

## ✅ 이미 완료된 것
- Firebase 프로젝트 생성 (`tango-lab-ac184`)
- Web App 등록
- 코드에 설정값 반영

## 🔐 추가로 해주실 2가지

### 1. Google 로그인 활성화

1. Firebase 콘솔 → 왼쪽 메뉴 **"Authentication"** 클릭
2. **"시작하기"** 버튼 클릭
3. **"Sign-in method"** 탭 → **"Google"** 클릭
4. **"사용 설정"** 토글 ON
5. 프로젝트 지원 이메일 선택 → **저장**

### 2. Firestore Database 생성 + 보안 규칙

1. Firebase 콘솔 → 왼쪽 메뉴 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. 위치: **asia-northeast3 (서울)** 선택 (한국에서 가장 빠름)
4. **"프로덕션 모드에서 시작"** 선택 → 다음 → 사용 설정
5. 생성되면 상단 **"규칙"** 탭 클릭
6. 기존 내용 전부 지우고 아래 내용으로 교체:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자별 데이터: 본인만 읽기/쓰기 가능
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 훈련 상태 (기존 기능) — 로그인 없이 허용 (나중에 타이트하게)
    match /training_states/{docId} {
      allow read, write: if true;
    }

    // 채팅 (기존 기능)
    match /chat_messages/{docId} {
      allow read, write: if true;
    }
  }
}
```

7. **"게시"** 버튼 클릭

### 3. Firebase Storage 설정 (영상 직접 업로드용)

1. Firebase 콘솔 → **"Storage"** 클릭
2. **"시작하기"** → **"프로덕션 모드"** 선택 → 위치 선택 → 완료
3. **"규칙"** 탭 → 아래로 교체:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 본인 폴더만 읽기/쓰기 가능
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. **"게시"** 클릭

**Storage 무료 한도**: 5GB 저장 + 1GB 다운로드/일 + 20K 업로드/일

### 4. 완료!

이제 TangoLab에서 **"Google로 로그인"** 버튼을 누르면:
- 휴대폰, PC, 태블릿 어디서든 같은 데이터 사용 가능
- 오프라인에서도 작동 (다시 연결되면 자동 동기화)
- 본인만 본인 데이터 접근 가능 (보안)

## 🆓 무료 한도

Spark 플랜 무료 한도:
- Firestore: 1GB 저장 + 50,000 읽기/일 + 20,000 쓰기/일
- Authentication: 무제한 (기본)

작가님 사용 규모 기준 **평생 무료**일 가능성이 매우 높습니다.

## ⚠️ 주의사항

- `apiKey`는 브라우저에 노출되지만 **보안 규칙**으로 데이터 접근을 제어하므로 안전합니다
- 만약 본인 계정으로만 써야 한다면, 규칙에 `&& request.auth.token.email == "jisoyu30@gmail.com"` 추가 가능
