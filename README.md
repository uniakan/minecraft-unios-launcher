# Unios Minecraft Launcher

지인들과 함께 플레이하기 위한 커스텀 마인크래프트 런처

## 주요 기능

- **Microsoft 로그인**: Device Code Flow를 통한 안전한 인증
- **오프라인 모드**: Microsoft 계정 없이도 플레이 가능
- **버전 관리**: Minecraft 버전 설치/삭제/선택
- **모드 관리**: 설치된 모드 확인 및 활성화/비활성화 토글
- **셰이더 관리**: shaderpacks 폴더의 셰이더 관리
- **서버 상태**: hardy-unios-server.uniakan.com 서버 실시간 상태 확인
- **설정**: Java 경로, 메모리 할당, 해상도, JVM 인자 설정

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **TailwindCSS** - 스타일링
- **Zustand** - 상태 관리
- **React Router** - 라우팅

### Desktop
- **Electron** - 데스크톱 앱
- **IPC** - Renderer ↔ Main 프로세스 통신

### 아키텍처
- **FSD (Feature-Sliced Design)**

```
src/
├── app/              # 앱 초기화, 프로바이더, 라우팅
├── pages/            # 페이지 컴포넌트
├── widgets/          # 독립적인 UI 블록
├── features/         # 비즈니스 로직
├── entities/         # 비즈니스 엔티티
└── shared/           # 공통 유틸, UI 컴포넌트
```

## 시작하기

### 사전 요구사항
- Node.js 18+
- npm

### 설치 및 실행

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
| `npm run electron:dev`   | 개발 서버 + Electron 동시 실행 |
| `npm run build`          | React 앱 빌드                  |
| `npm run electron:build` | 프로덕션 빌드 (설치 파일 생성) |

## 프로젝트 구조

```
unios-minecraft-launcher/
├── electron/                 # Electron 메인 프로세스
│   ├── main.ts              # 메인 진입점
│   └── preload.ts           # 프리로드 스크립트
├── src/
│   ├── app/                 # 앱 레이어
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── home/           # 메인 화면
│   │   ├── login/          # 로그인 화면
│   │   ├── settings/       # 설정 화면
│   │   ├── versions/       # 버전 관리
│   │   └── mods/           # 모드/셰이더 관리
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
│       ├── i18n/           # 다국어 (한국어/영어)
│       └── styles/         # 스타일
└── public/                   # 정적 파일
```

## 사용 방법

1. **로그인**: Microsoft 계정으로 로그인하거나 오프라인 모드 선택
2. **버전 설치**: 버전 페이지에서 원하는 Minecraft 버전 설치
3. **설정**: Java 경로와 메모리 설정 확인
4. **모드/셰이더**: 모드 페이지에서 파일 관리
5. **게임 시작**: 홈 화면에서 "게임 시작" 클릭

## 제작자

**Hardy**
Email: hardyjumpit@gmail.com
