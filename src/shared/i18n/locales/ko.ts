export const ko = {
  common: {
    alert: '알림',
    confirm: '확인',
    cancel: '취소',
    close: '닫기',
    error: '오류',
    success: '성공',
  },
  titlebar: {
    minimize: '최소화',
    maximize: '최대화',
    close: '닫기',
  },
  sidebar: {
    home: '홈',
    versions: '버전',
    mods: '모드',
    settings: '설정',
    logout: '로그아웃',
    serverStatus: '서버 온라인',
    playing: '{{count}}명 접속중',
    account: 'Microsoft 계정',
  },
  home: {
    welcome: "안녕하세요, <span class='text-fairy-600'>{{name}}</span>님! 🌿",
    subtitle: '오늘도 숲속에서의 신나는 모험을 시작해보세요.',
    gameStart: '게임 시작',
    gameStop: '게임 종료',
    verSelect: '버전 선택 필요',
    javaSelect: 'Java 설정 필요',
    serverStatus: '서버 상태',
    quickSettings: '빠른 설정',
    selectedVer: '선택된 버전',
    javaPath: 'Java 경로',
    memory: '할당 메모리',
    logs: '콘솔',
    logTitle: '게임 로그',
    realTimeOutput: '실시간 출력',
    copy: '로그 복사',
    status: {
      idle: '게임을 실행할 준비가 되었습니다.',
      preparing: '필요한 파일을 확인하는 중...',
      launching: '마인크래프트를 켜고 있습니다...',
      running: '현재 숲속을 탐험 중입니다! ✨',
      error: '실행 도중 문제가 발생했습니다.',
    },
    error: {
      title: '오류 발생',
      close: '닫기',
    },
    javaError: {
      title: '마인크래프트 실행 실패 (Java 버전 오류)',
      desc: '현재 설정된 Java 버전으로는 이 버전의 마인크래프트를 실행할 수 없습니다.',
      versionReq: '이 버전(1.21.1)은 Java 21 이상이 필요합니다.',
      action1: '1. Java 21(JDK 21)을 설치해주세요.',
      action2: '2. [설정] 메뉴에서 Java 경로를 변경해주세요.',
    },
  },
  serverInfo: {
    title: '공식 서버',
    desc: 'Unios Official Server',
    online: 'Online',
    offline: 'Offline',
    players: '현재 플레이어',
    version: '서버 버전',
    ping: '핑 (Ping)',
    refresh: '새로고침',
  },
  mods: {
    title: '모드 관리',
    subtitle: '설치된 모드를 관리하고 새로운 모드를 찾아보세요.',
    openFolder: '모드 폴더 열기',
    tabs: {
      mods: '모드',
      shaders: '셰이더',
      discover: '찾기',
    },
    loading: '모드를 불러오는 중...',
    empty: '설치된 모드가 없습니다.',
    emptyHint: '모드 폴더에 .jar 파일을 추가하세요.',
    enabled: '활성화',
    disabled: '비활성화',
    enabledOf: '/',
    modsEnabled: '개 모드 활성화',
    discoverDesc: '아래 사이트에서 원하는 모드를 찾아보세요.',
    modrinthDesc: '오픈소스 모드 플랫폼. 빠르고 가벼운 모드를 찾을 수 있습니다.',
    curseforgeDesc: '가장 큰 마인크래프트 모드 커뮤니티. 다양한 모드를 제공합니다.',
    alerts: {
      noGameDir: '게임 경로가 설정되지 않았습니다.\n설정 페이지에서 경로를 먼저 지정해주세요.',
      noFolder: '모드 폴더를 찾을 수 없습니다.\n\n경로:\n{{path}}\n\n폴더가 존재하지 않습니다.',
      openFail: '모드 폴더를 열 수 없습니다.\n오류: {{error}}',
      unknown: '알 수 없는 오류가 발생했습니다.',
    },
  },
  shaders: {
    openFolder: '셰이더 폴더 열기',
    loading: '셰이더를 불러오는 중...',
    empty: '설치된 셰이더가 없습니다.',
    emptyHint: 'shaderpacks 폴더에 .zip 파일을 추가하세요.',
    shadersEnabled: '개 셰이더 활성화',
    alerts: {
      noFolder: '셰이더 폴더를 찾을 수 없습니다.\n\n경로:\n{{path}}\n\n폴더가 존재하지 않습니다.',
    },
  },
  settings: {
    title: '설정',
    subtitle: '게임 실행 환경을 설정합니다.',
    java: {
      title: 'Java 설정',
      path: 'Java 경로',
      pathSelect: 'Java 경로 선택',
      pathDesc: '시스템에서 감지된 Java 경로 중 하나를 선택하세요.',
      jvmArgs: 'JVM 인자',
      jvmArgsPlaceholder: '-XX:+UseG1GC\n-XX:MaxGCPauseMillis=200',
      jvmArgsDesc: '한 줄에 하나의 인자를 입력하세요.',
      save: '저장',
    },
    memory: {
      title: '메모리 설정',
      maxAlloc: '최대 메모리 할당',
      recommend: '모드팩 사용 시 6GB 이상을 권장합니다.',
      alloc: '할당량',
    },
    display: {
      title: '디스플레이 설정',
      resolution: '해상도',
      fullscreen: '전체화면 모드',
      fullscreenDesc: '게임을 전체화면으로 시작합니다.',
    },
  },
  versions: {
    title: '버전 관리',
    subtitle: '새로운 모험을 위한 버전을 선택하세요.',
    searchPlaceholder: '버전 검색...',
    refresh: '새로고침',
    installing: '{{version}} 설치 중...',
    filters: {
      release: '정식 버전',
      snapshot: '스냅샷',
      installed: '설치됨',
      all: '전체',
    },
    types: {
      release: '정식',
      snapshot: '스냅샷',
      old_beta: '베타',
      old_alpha: '알파',
    },
    selected: {
      title: '현재 선택된 버전',
      deselect: '선택 해제',
    },
    list: {
      loading: '버전 목록을 불러오는 중...',
      empty: '검색 결과가 없습니다.',
      releaseDate: '{{date}} 출시',
      select: '선택',
      selected: '선택됨',
      install: '설치하기',
      installing: '설치 중...',
      downloading: '클라이언트 다운로드 중...',
      delete: '삭제',
      deleting: '삭제 중...',
      deleteConfirm: '정말 {{version}} 버전을 삭제하시겠습니까?',
    },
    alerts: {
      installError: '설치 오류: {{error}}',
      listError: '버전 목록을 가져올 수 없습니다.',
      deleteSuccess: '{{version}} 버전이 삭제되었습니다.',
      deleteError: '삭제 실패: {{error}}',
    },
  },
  login: {
    title: 'Unios Minecraft',
    subtitle: '숲속의 여정이 여기서 시작됩니다',
    microsoft: 'Microsoft 계정으로 로그인',
    or: '또는',
    offline: '오프라인 모드로 플레이',
    offlineMode: {
      label: '플레이어 이름',
      placeholder: 'Steve',
      start: '오프라인으로 시작',
      back: '뒤로 가기',
    },
    termsPrefix: '로그인하면',
    termsLink: '서비스 이용약관',
    termsAnd: '및',
    privacyLink: '개인정보처리방침',
    termsSuffix: '에 동의하게 됩니다.',
  },
  terms: {
    title: '서비스 이용약관',
    back: '돌아가기',
    lastUpdated: '최종 수정일',
    understood: '확인했습니다',
    section1: {
      title: '제1조 (목적)',
      content:
        '이 약관은 Unios Minecraft Launcher(이하 "런처")가 제공하는 서비스의 이용조건 및 절차, 이용자와 런처의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.',
    },
    section2: {
      title: '제2조 (정의)',
      content:
        '본 약관에서 사용하는 용어의 정의는 다음과 같습니다. "서비스"란 런처를 통해 제공되는 마인크래프트 게임 실행, 버전 관리, 모드 관리 등의 기능을 의미합니다. "이용자"란 이 약관에 따라 런처가 제공하는 서비스를 받는 자를 말합니다.',
    },
    section3: {
      title: '제3조 (약관의 효력과 변경)',
      content:
        '이 약관은 런처를 통해 온라인으로 공시함으로써 효력이 발생합니다. 런처는 합리적인 사유가 발생할 경우 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 공지됩니다.',
    },
    section4: {
      title: '제4조 (서비스의 제공)',
      content:
        '런처는 마인크래프트 게임의 다운로드, 설치, 실행을 지원합니다. Microsoft 계정 연동을 통한 정품 인증을 지원하며, 오프라인 모드도 제공합니다. 단, 마인크래프트 게임 자체의 저작권은 Mojang Studios와 Microsoft에 있습니다.',
    },
    section5: {
      title: '제5조 (이용자의 의무)',
      content:
        '이용자는 런처를 불법적인 목적으로 사용해서는 안 됩니다. 런처의 소스코드를 무단으로 복제, 배포, 수정하는 행위를 금지합니다. 다른 이용자의 정상적인 서비스 이용을 방해하는 행위를 금지합니다.',
    },
    section6: {
      title: '제6조 (책임의 제한)',
      content:
        '런처는 무료로 제공되는 소프트웨어이며, 서비스 이용으로 발생하는 어떠한 손해에 대해서도 책임을 지지 않습니다. 마인크래프트 게임 관련 문제는 Mojang Studios의 정책을 따릅니다.',
    },
    section7: {
      title: '제7조 (기타)',
      content:
        '본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다. 런처 사용에 관한 문의사항은 공식 채널을 통해 문의해 주시기 바랍니다.',
    },
  },
  privacy: {
    title: '개인정보처리방침',
    back: '돌아가기',
    lastUpdated: '최종 수정일',
    understood: '확인했습니다',
    section1: {
      title: '제1조 (개인정보의 수집)',
      content:
        'Unios Minecraft Launcher는 서비스 제공을 위해 최소한의 개인정보만을 수집합니다. Microsoft 로그인 시 Microsoft에서 제공하는 계정 정보(사용자 이름, UUID)를 수집합니다.',
    },
    section2: {
      title: '제2조 (수집하는 개인정보 항목)',
      content:
        '• Microsoft 계정 사용자 이름\n• Minecraft UUID\n• 액세스 토큰 (로컬 저장, 암호화)\n\n오프라인 모드 사용 시에는 입력한 사용자 이름만 로컬에 저장됩니다.',
    },
    section3: {
      title: '제3조 (개인정보의 이용 목적)',
      content:
        '수집된 개인정보는 다음 목적으로만 사용됩니다:\n• 마인크래프트 게임 실행 및 인증\n• 멀티플레이어 서버 접속\n• 사용자 식별 및 게임 설정 저장',
    },
    section4: {
      title: '제4조 (개인정보의 보관)',
      content:
        '모든 개인정보는 사용자의 로컬 컴퓨터에만 저장되며, 외부 서버로 전송되지 않습니다. 런처는 별도의 서버를 운영하지 않으며, 사용자 데이터를 수집하거나 저장하지 않습니다.',
    },
    section5: {
      title: '제5조 (제3자 제공)',
      content:
        '런처는 수집한 개인정보를 제3자에게 제공하지 않습니다. 단, 마인크래프트 게임 서버 접속 시 해당 서버 운영자에게 사용자 이름과 UUID가 전달될 수 있습니다.',
    },
    section6: {
      title: '제6조 (개인정보의 파기)',
      content:
        '런처를 삭제하면 로컬에 저장된 모든 개인정보가 함께 삭제됩니다. 사용자는 언제든지 설정 메뉴를 통해 저장된 계정 정보를 삭제할 수 있습니다.',
    },
    section7: {
      title: '제7조 (문의)',
      content: '개인정보 처리에 관한 문의사항은 공식 채널을 통해 문의해 주시기 바랍니다.',
    },
  },
}
