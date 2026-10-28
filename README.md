# 사내 전체 게시판

그룹웨어에서 직원이 전 직원에게 공유한 게시글을 확인하고, 자신이 작성한 글을 수정하는 예제입니다. 로그인 사용자는 **김동현**으로 고정되어 있습니다. 회사명은 예시로 한빛 그룹웨어를 사용합니다.

## 실행

Node.js 22 이상이 필요합니다. 프로젝트 루트에서 설치합니다.

```sh
npm install
```

터미널 두 개에서 각각 실행하세요.

```sh
# 터미널 1: 목업 백엔드 (4000)
npm run dev:backend
```

```sh
# 터미널 2: Next.js 프론트엔드 (3000)
npm run dev
```

[사내 전체 게시판](http://127.0.0.1:3000/board)을 여세요. 기존 서버가 실행 중이면 종료 후 다시 시작하세요.

## 업무 흐름

- `/board`: 전체 게시글 목록입니다. 내 글에만 빠른 수정 버튼이 표시됩니다.
- `/board/articles/101`: 내 글의 제목·본문·작성자·수정일을 확인합니다.
- `/board/articles/101/edit`: 전체 편집 화면입니다. 기본은 저장 알림 후 상세 이동이며, ‘저장 후 이 화면에서 계속 편집’을 선택하면 화면에 머무릅니다.
- 빠른 수정: 목록 위에 팝업을 열어 수정합니다. URL을 유지하고 저장 요청 종료 후 목록을 다시 조회합니다.
- 다른 직원의 글은 조회만 가능합니다. 백엔드도 다른 직원의 글 수정 요청에 403을 반환합니다.

두 편집 방법은 같은 게시글과 `PUT /api/articles/:id`를 사용합니다. **모든 저장은 공개 게시글에 즉시 반영**됩니다. 비공개 임시 저장이나 초안 기능은 없습니다.

## 읽을 코드

```text
frontend/src/
  app/
    board/page.tsx                         # 게시글 목록
    board/articles/[id]/page.tsx           # 게시글 상세
    board/articles/[id]/edit/page.tsx      # 조회·작성자 확인 → 편집기에 전달
  features/articles/
    article.ts                            # 게시글·사용자 타입
    getArticle.ts                         # 백엔드에서 게시글·목록·사용자 조회
    ArticleEditor.tsx                     # 전체 편집 + 계속 편집 체크박스
    QuickEditButton.tsx                   # 목록에서 팝업 열기 + 목록 갱신
    PopupEditor.tsx                       # 빠른 수정 폼
    article-api.ts                        # HTTP 수정 요청과 응답 상태 검사
    useSaveArticle.ts                     # 저장 실행·진행 상태·중복 호출 방지
    formatDate.ts                         # 한국 시간 기준 수정일 표시
backend/
  articles.seed.json                      # Git으로 관리하는 초기 샘플
  articles.json                           # 로컬 영구 저장소 (Git 제외)
  server.mjs                              # 서버 시작
  routes.mjs                              # URL·HTTP 메서드 → 처리 함수 연결
  article-handlers.mjs                    # 조회·수정 요청, 권한·입력 확인
  article-store.mjs                       # 게시글 JSON 저장·조회
  http.mjs                                # JSON 응답·요청 본문 읽기
```

초기 데이터 조회는 Server Component가 HTTP로 수행하고, 입력·저장은 Client Component에서 처리합니다. 브라우저의 `/api` 요청은 Next.js 설정을 통해 백엔드로 전달됩니다. 서버 데이터는 별도로 캐시하지 않습니다.

## 목업 API

| 메서드 | 주소 | 응답 |
| --- | --- | --- |
| GET | `/api/me` | 고정 로그인 사용자 김동현 |
| GET | `/api/articles` | 게시글 목록 |
| GET | `/api/articles/:id` | 게시글 상세, 없으면 404 |
| PUT | `/api/articles/:id` | 내 글 수정, 성공 시 본문 없는 204 |

수정 본문은 `{ "title": "제목", "body": "본문" }`입니다. 작성자와 작성일은 바뀌지 않고 수정일만 갱신됩니다. 공백 제목은 400, 다른 사람의 글 수정은 403을 반환합니다.

게시글은 `backend/articles.json`에 저장합니다. PUT 요청이 성공하면 제목·본문·수정일이 이 파일에 기록되므로 **새로고침하거나 백엔드를 재시작해도 유지**됩니다. 파일 기록이 실패하면 500을 반환하고 조회용 메모리도 변경하지 않습니다. 서버가 종료된 상태에서는 이 JSON 파일을 직접 편집할 수도 있습니다.

`backend/articles.seed.json`은 초기 샘플로 Git에 커밋합니다. `backend/articles.json`은 실행 중 바뀌는 로컬 데이터이므로 Git에서 제외합니다. 백엔드는 저장 파일이 없는 첫 실행에만 초기 샘플을 복사하며, 이미 저장된 데이터는 덮어쓰지 않습니다. 샘플 변경은 별도로 커밋할 수 있고 기존 로컬 데이터에 자동으로 반영되지는 않습니다.

초기화가 필요하면 백엔드를 종료하고 `articles.json`을 다른 이름으로 백업한 뒤 다시 실행하세요. 새로운 저장 파일이 샘플에서 생성되며 백업은 직접 복원할 수 있습니다.

로그인 기능을 실제로 구현한 것은 아니며 `/api/me`와 서버의 작성자 검사는 고정 사용자 기준으로 동작합니다.

## 지연·실패 재현

화면에 실습 패널을 넣지 않고 백엔드 환경 변수로만 제공합니다. 백엔드를 종료한 뒤 **백엔드용 PowerShell 터미널**에서 설정하고 다시 실행하세요.

```powershell
# 저장 응답을 2초 지연
$env:SAVE_DELAY_MS = "2000"
$env:SAVE_STATUS = "204"
npm run dev:backend
```

```powershell
# 저장 시 500 반환 (게시글은 수정하지 않습니다)
$env:SAVE_DELAY_MS = "0"
$env:SAVE_STATUS = "500"
npm run dev:backend
```

정상 동작으로 돌아갈 때는 서버를 종료하고 `SAVE_DELAY_MS`를 `0`, `SAVE_STATUS`를 `204`로 설정한 뒤 다시 시작하세요. 네트워크 실패는 브라우저 개발자 도구의 Network Offline으로 재현할 수 있습니다.

## 현재 저장 구조

입력 상태·제목 검증·토스트·화면 이동과 팝업 닫기는 각 편집 화면이 담당합니다. `article-api.ts`는 React에 의존하지 않고 PUT 요청과 응답 상태 검사만 수행합니다.

`useSaveArticle()`은 입력값을 받아 저장하고 `success`, `error`, `already-saving`을 반환합니다. state는 화면의 저장 중 표시, ref는 같은 훅 인스턴스의 즉시 중복 호출 차단에 사용합니다. 이미 저장 중인 호출은 추가 요청이나 토스트 없이 무시합니다. 성공·실패 후에는 잠금을 해제해 재시도할 수 있습니다.

전체 편집은 성공 후 상세로 이동하거나 계속 편집할 수 있습니다. 팝업은 성공 시에만 닫히며 실패하면 입력을 유지합니다. 저장 중 Esc로 팝업을 닫을 수 있고, 닫힌 팝업의 늦은 응답은 새 팝업의 안내나 닫기에 영향을 주지 않습니다. 팝업 닫기가 서버에 이미 전달된 저장의 취소를 보장하지는 않습니다.

## 확인 명령

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

테스트는 별도 목업 백엔드(4100)와 프론트엔드(3100)를 실행하고 종료합니다. 브라우저 테스트는 `backend/.data-test/articles.json`, 백엔드 테스트는 임시 폴더의 JSON을 사용하므로 실제 `backend/articles.json`은 변경하지 않습니다. 테스트용 저장 파일도 없으면 `articles.seed.json`에서 생성합니다.

브라우저 테스트는 정상 저장·계속 편집·빠른 수정·작성자 권한과 함께 공백 제목 검증, 즉시 중복 호출 시 단일 요청, 저장 중 입력 잠금, 500·네트워크 실패 후 재시도, 닫힌 팝업의 늦은 응답 무시를 확인합니다. 백엔드 테스트는 최초 샘플 복사, 서버 재시작 후 데이터 유지와 파일 기록 실패를 확인합니다.

## 프론트엔드 코드 스타일

`sweet-commerce`의 Prettier 기준을 적용했습니다. 줄 너비 100자, 들여쓰기 2칸, JSX 속성은 한 줄에 하나씩 표시합니다. 이 프로젝트는 일반 CSS를 사용하므로 Tailwind 정렬 플러그인은 포함하지 않습니다.

프로젝트 루트 또는 `frontend` 폴더에서 다음 명령을 사용할 수 있습니다. 루트 명령도 프론트엔드만 대상으로 실행됩니다.

```sh
npm run format        # 코드 포맷 적용
npm run format:check  # 포맷 검사
npm run lint          # Next.js·React·TypeScript 코드 검사
```

ESLint와 Prettier가 충돌하지 않도록 `eslint-config-prettier`를 적용했습니다. 생성된 파일과 빌드·테스트 결과물은 검사 대상에서 제외합니다.

WebStorm에서 저장할 때도 적용하려면 Settings → Languages & Frameworks → JavaScript → Prettier에서 자동 설정을 선택하고 **Run on save**를 켜세요. 프론트엔드의 `.prettierrc.json`을 사용하도록 설정하면 됩니다.

백엔드의 PUT 처리 흐름은 `server.mjs` → `routes.mjs` → `article-handlers.mjs`의 `handleUpdateArticle()` → `article-store.mjs`의 `updateArticle()` 순서입니다. 수정 동작을 읽으려면 `handleUpdateArticle()`부터 보시면 됩니다.
