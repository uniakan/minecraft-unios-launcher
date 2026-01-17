export const en = {
  common: {
    alert: 'Alert',
    confirm: 'OK',
    cancel: 'Cancel',
    close: 'Close',
    error: 'Error',
    success: 'Success',
  },
  titlebar: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close',
  },
  sidebar: {
    home: 'Home',
    versions: 'Versions',
    mods: 'Mods',
    settings: 'Settings',
    logout: 'Log out',
    serverStatus: 'Server Online',
    playing: '{{count}} Online',
    account: 'Microsoft Account',
  },
  home: {
    welcome: "Welcome back, <span class='text-fairy-600'>{{name}}</span>! 🌿",
    subtitle: 'Ready to start your adventure in the forest?',
    gameStart: 'Play',
    gameStop: 'Stop',
    verSelect: 'Select Version',
    javaSelect: 'Java Required',
    serverStatus: 'Server Status',
    quickSettings: 'Quick Settings',
    selectedVer: 'Version',
    javaPath: 'Java Path',
    memory: 'Memory',
    logs: 'Console',
    logTitle: 'Game Logs',
    realTimeOutput: 'Real-time Output',
    copy: 'Copy Logs',
    status: {
      idle: 'Ready to start your adventure.',
      preparing: 'Verifying game files...',
      launching: 'Starting Minecraft...',
      running: 'Exploring the forest! ✨',
      error: 'An error occurred during launch.',
    },
    error: {
      title: 'Error',
      close: 'Close',
    },
    javaError: {
      title: 'Launch Failed (Java Version Error)',
      desc: 'The current Java version cannot run this Minecraft version.',
      versionReq: 'This version (1.21.1) requires Java 21 or higher.',
      action1: '1. Please install Java 21 (JDK 21).',
      action2: '2. Change the Java path in Settings.',
    },
  },
  serverInfo: {
    title: 'Official Server',
    desc: 'Unios Official Server',
    online: 'Online',
    offline: 'Offline',
    players: 'Players',
    version: 'Version',
    ping: 'Ping',
    refresh: 'Refresh',
  },
  mods: {
    title: 'Mod Management',
    subtitle: 'Manage installed mods and discover new ones.',
    openFolder: 'Open Mods Folder',
    tabs: {
      mods: 'Mods',
      shaders: 'Shaders',
      discover: 'Discover',
    },
    loading: 'Loading mods...',
    empty: 'No mods installed.',
    emptyHint: 'Add .jar files to the mods folder.',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enabledOf: '/',
    modsEnabled: 'mods enabled',
    discoverDesc: 'Find mods from the sites below.',
    modrinthDesc: 'Open-source mod platform. Find fast and lightweight mods.',
    curseforgeDesc: 'The largest Minecraft mod community with diverse mods.',
    alerts: {
      noGameDir: 'Game directory is not set.\nPlease set the directory in Settings page first.',
      noFolder: 'Mods folder not found.\n\nPath:\n{{path}}\n\nFolder does not exist.',
      openFail: 'Could not open mods folder.\nError: {{error}}',
      unknown: 'An unknown error occurred.',
    },
  },
  shaders: {
    openFolder: 'Open Shaders Folder',
    loading: 'Loading shaders...',
    empty: 'No shaders installed.',
    emptyHint: 'Add .zip files to the shaderpacks folder.',
    shadersEnabled: 'shaders enabled',
    alerts: {
      noFolder: 'Shaders folder not found.\n\nPath:\n{{path}}\n\nFolder does not exist.',
    },
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure game launch environment.',
    java: {
      title: 'Java Settings',
      path: 'Java Path',
      pathSelect: 'Select Java Path',
      pathDesc: 'Select one of the detected Java paths.',
      jvmArgs: 'JVM Arguments',
      jvmArgsPlaceholder: '-XX:+UseG1GC\n-XX:MaxGCPauseMillis=200',
      jvmArgsDesc: 'Enter one argument per line.',
      save: 'Save',
    },
    memory: {
      title: 'Memory Settings',
      maxAlloc: 'Max Memory Allocation',
      recommend: '6GB or more is recommended for modpacks.',
      alloc: 'Allocation',
    },
    display: {
      title: 'Display Settings',
      resolution: 'Resolution',
      fullscreen: 'Fullscreen Mode',
      fullscreenDesc: 'Launch the game in fullscreen mode.',
    },
  },
  versions: {
    title: 'Version Management',
    subtitle: 'Choose a version for your new adventure.',
    searchPlaceholder: 'Search versions...',
    refresh: 'Refresh',
    installing: 'Installing {{version}}...',
    filters: {
      release: 'Releases',
      snapshot: 'Snapshots',
      installed: 'Installed',
      all: 'All',
    },
    types: {
      release: 'Release',
      snapshot: 'Snapshot',
      old_beta: 'Beta',
      old_alpha: 'Alpha',
    },
    selected: {
      title: 'Selected Version',
      deselect: 'Deselect',
    },
    list: {
      loading: 'Loading version list...',
      empty: 'No versions found.',
      releaseDate: 'Released on {{date}}',
      select: 'Select',
      selected: 'Selected',
      install: 'Install',
      installing: 'Installing...',
      downloading: 'Downloading client...',
      delete: 'Delete',
      deleting: 'Deleting...',
      deleteConfirm: 'Are you sure you want to delete version {{version}}?',
    },
    alerts: {
      installError: 'Install Error: {{error}}',
      listError: 'Could not fetch version list.',
      deleteSuccess: 'Version {{version}} deleted successfully.',
      deleteError: 'Delete failed: {{error}}',
    },
  },
  login: {
    title: 'Unios Minecraft',
    subtitle: 'Your journey in the forest begins here',
    microsoft: 'Sign in with Microsoft',
    or: 'OR',
    offline: 'Play Offline',
    offlineMode: {
      label: 'Player Name',
      placeholder: 'Steve',
      start: 'Start Offline',
      back: 'Back',
    },
    termsPrefix: 'By logging in, you agree to our',
    termsLink: 'Terms of Service',
    termsAnd: 'and',
    privacyLink: 'Privacy Policy',
    termsSuffix: '.',
  },
  terms: {
    title: 'Terms of Service',
    back: 'Go Back',
    lastUpdated: 'Last Updated',
    understood: 'I Understand',
    section1: {
      title: 'Article 1 (Purpose)',
      content:
        'These Terms govern the conditions and procedures for using the services provided by Unios Minecraft Launcher (hereinafter "Launcher"), as well as the rights, obligations, and responsibilities of users and the Launcher.',
    },
    section2: {
      title: 'Article 2 (Definitions)',
      content:
        '"Service" refers to the functions provided through the Launcher, including Minecraft game execution, version management, and mod management. "User" refers to any person who uses the services provided by the Launcher in accordance with these Terms.',
    },
    section3: {
      title: 'Article 3 (Effectiveness and Modification of Terms)',
      content:
        'These Terms become effective when posted online through the Launcher. The Launcher may modify the Terms when reasonable grounds arise, and modified Terms will be announced through notices.',
    },
    section4: {
      title: 'Article 4 (Provision of Services)',
      content:
        'The Launcher supports downloading, installing, and running Minecraft games. It supports authentication through Microsoft account integration and also provides offline mode. However, the copyright of the Minecraft game itself belongs to Mojang Studios and Microsoft.',
    },
    section5: {
      title: 'Article 5 (User Obligations)',
      content:
        "Users must not use the Launcher for illegal purposes. Unauthorized copying, distribution, or modification of the Launcher source code is prohibited. Actions that interfere with other users' normal use of the service are prohibited.",
    },
    section6: {
      title: 'Article 6 (Limitation of Liability)',
      content:
        "The Launcher is provided as free software, and we are not responsible for any damages arising from the use of the service. Issues related to the Minecraft game follow Mojang Studios' policies.",
    },
    section7: {
      title: 'Article 7 (Miscellaneous)',
      content:
        'Matters not specified in these Terms shall be governed by relevant laws and commercial practices. For inquiries regarding Launcher usage, please contact us through official channels.',
    },
  },
  privacy: {
    title: 'Privacy Policy',
    back: 'Go Back',
    lastUpdated: 'Last Updated',
    understood: 'I Understand',
    section1: {
      title: 'Article 1 (Collection of Personal Information)',
      content:
        'Unios Minecraft Launcher collects only minimal personal information necessary for service provision. When logging in with Microsoft, we collect account information (username, UUID) provided by Microsoft.',
    },
    section2: {
      title: 'Article 2 (Types of Personal Information Collected)',
      content:
        '• Microsoft account username\n• Minecraft UUID\n• Access token (stored locally, encrypted)\n\nWhen using offline mode, only the entered username is stored locally.',
    },
    section3: {
      title: 'Article 3 (Purpose of Using Personal Information)',
      content:
        'Collected personal information is used only for the following purposes:\n• Minecraft game execution and authentication\n• Multiplayer server connection\n• User identification and game settings storage',
    },
    section4: {
      title: 'Article 4 (Storage of Personal Information)',
      content:
        "All personal information is stored only on the user's local computer and is not transmitted to external servers. The Launcher does not operate separate servers and does not collect or store user data.",
    },
    section5: {
      title: 'Article 5 (Disclosure to Third Parties)',
      content:
        'The Launcher does not provide collected personal information to third parties. However, when connecting to Minecraft game servers, your username and UUID may be transmitted to the server operator.',
    },
    section6: {
      title: 'Article 6 (Destruction of Personal Information)',
      content:
        'When the Launcher is deleted, all personal information stored locally is also deleted. Users can delete stored account information at any time through the settings menu.',
    },
    section7: {
      title: 'Article 7 (Contact)',
      content: 'For inquiries regarding personal information processing, please contact us through official channels.',
    },
  },
}
