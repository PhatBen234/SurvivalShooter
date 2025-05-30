cc.Class({
  extends: cc.Component,

  properties: {
    menuBtnLayout: cc.Node,
    stageChose: cc.Node,
    homeBtn: cc.Node,
    settingLayout: cc.Node,

    stage1Button: cc.Button,
    stage2Button: cc.Button,
    stage3Button: cc.Button,

    // Audio clips for different stages
    mainMenuMusic: {
      default: null,
      type: cc.AudioClip,
    },
    stage1Music: {
      default: null,
      type: cc.AudioClip,
    },
    stage2Music: {
      default: null,
      type: cc.AudioClip,
    },
    stage3Music: {
      default: null,
      type: cc.AudioClip,
    },
    bossStage1Music: {
      default: null,
      type: cc.AudioClip,
    },
    bossStage2Music: {
      default: null,
      type: cc.AudioClip,
    },
    bossStage3Music: {
      default: null,
      type: cc.AudioClip,
    },

    volumeSlider: {
      default: null,
      type: cc.Slider,
    },
  },

  onLoad() {
    console.log("MenuScript onLoad started");

    // Initialize AudioManager if not already done
    if (!window.AudioManager) {
      console.error("AudioManager not found!");
      return;
    }

    // Initialize AudioManager
    window.AudioManager.init();

    // Set audio clips to AudioManager
    this.setupAudioClips();

    // Setup UI
    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
    this.settingLayout.active = false;

    // Setup volume slider
    this.setupVolumeSlider();

    // Start scene music
    window.AudioManager.onSceneStart('MainMenu');
  },

  setupAudioClips() {
    const audioClips = {
      mainMenu: this.mainMenuMusic,
      stage1: this.stage1Music,
      stage2: this.stage2Music,
      stage3: this.stage3Music,
      bossStage1: this.bossStage1Music,
      bossStage2: this.bossStage2Music,
      bossStage3: this.bossStage3Music
    };

    window.AudioManager.setAudioClips(audioClips);
    console.log("Audio clips set to AudioManager");
  },

  setupVolumeSlider() {
    if (this.volumeSlider) {
      // Set slider value to current master volume
      const currentVolume = window.AudioManager.getMasterVolume();
      this.volumeSlider.progress = currentVolume;

      // Listen for slide events
      this.volumeSlider.node.on("slide", this.onVolumeChanged, this);
      console.log("Volume slider setup complete, current volume:", currentVolume);
    } else {
      console.warn("Volume slider not assigned!");
    }
  },

  onVolumeChanged() {
    if (!this.volumeSlider) return;

    const volume = this.volumeSlider.progress;
    console.log("Volume changed to:", volume);

    // Update master volume through AudioManager
    window.AudioManager.setMasterVolume(volume);
  },

  // === MENU NAVIGATION ===
  onPlayClick() {
    this.menuBtnLayout.active = false;
    this.stageChose.active = true;
    this.homeBtn.active = true;
  },

  onStage1Click() {
    cc.director.loadScene("Stage1");
  },

  onStage2Click() {
    cc.director.loadScene("Stage2");
  },

  onStage3Click() {
    cc.director.loadScene("BossStage");
  },

  onSettingsClick() {
    this.settingLayout.active = true;
  },

  onGoBackClick() {
    this.settingLayout.active = false;
  },

  onHomeClick() {
    cc.director.loadScene("MainMenu");
  },

  onExitClick() {
    if (cc.sys.isNative) {
      cc.game.end();
    } else {
      console.log("Browser cannot exit via code");
    }
  },

  // === CLEANUP ===
  onDestroy() {
  },
});