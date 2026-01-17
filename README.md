# UniOS Minecraft Launcher

React + Electron 기반 커스텀 마인크래프트 런처

## 🎮 주요 기능

- **계정 관리**: Microsoft OAuth 로그인, 오프라인 모드 지원
- **게임 실행**: Java 경로 자동 탐색, JVM 옵션 설정
- **버전 관리**: Minecraft 버전 선택 및 설치
- **모드 관리**: 모드팩 설치 및 개별 모드 토글
- **설정**: 메모리, 해상도, JVM 인자 커스터마이징

## 🛠️ 기술 스택

### Frontend

- **React 18** + **TypeScript**
- **TailwindCSS** - 스타일링
- **Zustand** - 상태 관리
- **React Router** - 라우팅

### Desktop

- **Electron** - 데스크톱 앱 쉘
- **IPC** - Renderer ↔ Main 통신

### 아키텍처

- **FSD (Feature-Sliced Design)** 아키텍처 적용

```
src/
├── app/              # 앱 초기화, 프로바이더, 라우팅
├── pages/            # 페이지 컴포넌트
├── widgets/          # 독립적인 UI 블록
├── features/         # 비즈니스 로직
├── entities/         # 비즈니스 엔티티
└── shared/           # 공통 유틸, UI 컴포넌트
```

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run electron:dev

# 프로덕션 빌드
npm run electron:build
```

### 스크립트

| 명령어                   | 설명                           |
| ------------------------ | ------------------------------ |
| `npm run dev`            | Vite 개발 서버 실행            |
| `npm run electron`       | Electron 앱 실행               |
| `npm run electron:dev`   | 개발 서버 + Electron 동시 실행 |
| `npm run build`          | React 앱 빌드                  |
| `npm run electron:build` | 프로덕션 빌드 (설치 파일 생성) |

## 📁 프로젝트 구조

```
unios-minecraft-launcher/
├── electron/                 # Electron 메인 프로세스
│   ├── main.ts              # 메인 진입점
│   ├── preload.ts           # 프리로드 스크립트
│   └── tsconfig.json        # Electron TS 설정
├── src/
│   ├── app/                 # 앱 레이어
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── home/           # 메인 화면
│   │   ├── login/          # 로그인 화면
│   │   ├── settings/       # 설정 화면
│   │   ├── versions/       # 버전 관리
│   │   └── mods/           # 모드 관리
│   ├── widgets/             # 위젯
│   │   ├── sidebar/        # 사이드바
│   │   └── title-bar/      # 타이틀바
│   ├── features/            # 기능 모듈
│   │   ├── auth/           # 인증
│   │   ├── settings/       # 설정
│   │   └── game-launch/    # 게임 실행
│   └── shared/              # 공유 리소스
│       ├── ui/             # UI 컴포넌트
│       ├── lib/            # 유틸리티
│       └── styles/         # 스타일
├── public/                   # 정적 파일
├── index.html               # HTML 진입점
├── vite.config.ts           # Vite 설정
├── tailwind.config.js       # Tailwind 설정
├── tsconfig.json            # TypeScript 설정
└── package.json             # 프로젝트 설정
```

## 🔧 개발 가이드

### 새 페이지 추가

1. `src/pages/[page-name]/` 디렉토리 생성
2. 페이지 컴포넌트 작성
3. `src/app/providers/router.tsx`에 라우트 추가

### 새 기능 추가

1. `src/features/[feature-name]/` 디렉토리 생성
2. `model/store.ts` - Zustand 스토어
3. `ui/` - 기능 관련 UI 컴포넌트
4. `index.ts` - public API export

### IPC 통신

```typescript
// Renderer에서 Main 호출
const result = await window.electronAPI.game.launch(options);

// Main에서 Renderer로 이벤트 전송
mainWindow.webContents.send("game:log", { type: "stdout", data: "..." });

// Renderer에서 이벤트 수신
window.electronAPI.game.onLog((data) => console.log(data));
```

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
