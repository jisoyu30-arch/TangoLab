# Firestore 보안 규칙 업데이트 가이드

즐겨찾기, 공유 메모판 등 새 기능이 작동하려면 규칙을 업데이트해야 합니다.

## 전체 규칙 (교체하세요)

Firebase Console → Firestore Database → 규칙 탭에서 **전체 교체 후 게시**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 커플 공유 데이터 (훈련, 대회, 즐겨찾기, 메모 전부)
    match /couples/{coupleId}/{document=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.email in ['jisoyu30@gmail.com', 'unijoon@gmail.com'];
    }

    // 사용자별 데이터 (백업용)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 훈련 상태 (기존 기능)
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

## Storage 규칙 (이미 설정됨, 확인용)

Firebase Console → Storage → 규칙:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /couples/{coupleId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.email in ['jisoyu30@gmail.com', 'unijoon@gmail.com'];
    }
  }
}
```

## 새로 추가된 데이터 경로

우리 코드가 사용하는 Firestore 경로:
- `couples/tango-couple/data/training` — 수업/연습/대회 기록
- `couples/tango-couple/data/favorites` — 즐겨찾기 (곡/악단/탄다)
- `couples/tango-couple/data/sharedNotes` — 공유 메모판

위 규칙에서 `match /couples/{coupleId}/{document=**}`가 전부 커버합니다.
