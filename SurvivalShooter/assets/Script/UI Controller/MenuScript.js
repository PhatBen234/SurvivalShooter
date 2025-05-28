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
    
    volumeSlider: {
      default: null,
      type: cc.Slider,
    },
  },

  onLoad() {
    console.log("MenuScript onLoad started");

    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
    this.settingLayout.active = false;

    // FIXED: Setup volume slider với delay để đảm bảo AudioManager đã sẵn sàng
    this.scheduleOnce(() => {
      this.setupVolumeSlider();
      this.initializeMenuAudio();
    }, 0.1);

    console.log("MenuScript initialization complete");
  },

  start() {
    // Additional setup in start() to ensure all components are ready
    this.scheduleOnce(() => {
      this.verifyAudioSetup();
    }, 0.2);
  },

  verifyAudioSetup() {
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      console.log("✅ AudioManager verified in MenuScript");
      let info = audioManager.getCurrentMusicInfo();
      console.log("Current audio info:", info);
    } else {
      console.error("❌ AudioManager not available in MenuScript");
      // Retry after delay
      this.scheduleOnce(() => {
        this.verifyAudioSetup();
      }, 1.0);
    }
  },

  initializeMenuAudio() {
    // Get AudioManager instance with retry mechanism
    this.attemptAudioInitialization(0);
  },

  attemptAudioInitialization(attempt) {
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      // Tell AudioManager we're in menu scene
      audioManager.onSceneChanged("MainMenu");
      console.log("✅ Menu audio initialized through AudioManager");
    } else {
      attempt++;
      if (attempt < 5) {
        console.warn(`AudioManager not found, retry attempt ${attempt}/5`);
        this.scheduleOnce(() => {
          this.attemptAudioInitialization(attempt);
        }, 0.5);
      } else {
        console.error("❌ Failed to initialize AudioManager after 5 attempts");
      }
    }
  },

  setupVolumeSlider() {
    if (!this.volumeSlider) {
      console.warn("❌ Volume slider not assigned!");
      return;
    }

    console.log("🎚️ Setting up volume slider...");

    // Get current volume from AudioManager
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      let currentVolume = audioManager.getMasterVolume();
      this.volumeSlider.progress = currentVolume;
      console.log(`✅ Volume slider setup with AudioManager volume: ${currentVolume}`);
    } else {
      // Fallback to saved volume or default
      let savedVolume = parseFloat(cc.sys.localStorage.getItem("game_master_volume")) || 1.0;
      this.volumeSlider.progress = savedVolume;
      console.log(`⚠️ Volume slider setup with saved volume: ${savedVolume} (AudioManager not available)`);
    }

    // FIXED: Proper event listener setup
    this.volumeSlider.node.on("slide", this.onVolumeChanged, this);
    console.log("✅ Volume slider event listener attached");

    // Also listen to slider events for real-time updates
    this.volumeSlider.node.on(cc.Node.EventType.TOUCH_MOVE, this.onVolumeChanged, this);
  },

  // FIXED: Improved volume change handler
  onVolumeChanged(event) {
    if (!this.volumeSlider) {
      console.warn("Volume slider not available");
      return;
    }

    const volume = this.volumeSlider.progress;
    console.log(`🔊 Volume slider changed to: ${volume}`);

    // Update AudioManager volume immediately
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      audioManager.setMasterVolume(volume);
      console.log("✅ Applied volume through AudioManager");
      
      // Verify the change
      let newVolume = audioManager.getMasterVolume();
      console.log(`Verified new volume: ${newVolume}`);
    } else {
      // Fallback: Save to localStorage for when AudioManager is available
      cc.sys.localStorage.setItem("game_master_volume", volume.toString());
      console.warn("⚠️ AudioManager not available, saved volume to localStorage");
    }
  },

  // === MENU NAVIGATION ===
  onPlayClick() {
    this.menuBtnLayout.active = false;
    this.stageChose.active = true;
    this.homeBtn.active = true;
  },

  onStage1Click() {
    console.log("Loading Stage1...");
    cc.director.loadScene("Stage1");
  },

  onStage2Click() {
    console.log("Loading Stage2...");
    cc.director.loadScene("Stage2");
  },

  onStage3Click() {
    console.log("Loading BossStage...");
    cc.director.loadScene("BossStage");
  },

  onSettingsClick() {
    this.settingLayout.active = true;
    // Refresh volume slider when opening settings
    this.refreshVolumeSlider();
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

  // === UTILITY METHODS FOR AUDIO ===
  
  refreshVolumeSlider() {
    if (!this.volumeSlider) return;

    let audioManager = this.getAudioManager();
    if (audioManager) {
      let currentVolume = audioManager.getMasterVolume();
      this.volumeSlider.progress = currentVolume;
      console.log(`🔄 Refreshed volume slider to: ${currentVolume}`);
    }
  },
  
  getAudioManager() {
    return cc.AudioManager && cc.AudioManager.getInstance();
  },

  // Method để test audio system
  testAudioSystem() {
    let audioManager = this.getAudioManager();
    if (audioManager) {
      console.log("=== AUDIO SYSTEM TEST ===");
      let info = audioManager.getCurrentMusicInfo();
      console.log("Current Audio Info:", info);
      audioManager.verifyAudioSystem();
      console.log("=== END AUDIO TEST ===");
      return info;
    }
    console.error("AudioManager not available for testing");
    return null;
  },

  // NEW: Method to force reinitialize audio (for debugging)
  reinitializeAudio() {
    let audioManager = this.getAudioManager();
    if (audioManager) {
      audioManager.forceReinitialize();
      this.refreshVolumeSlider();
      console.log("🔄 Audio system reinitialized");
    }
  },

  // === CLEANUP ===
  onDestroy() {
    // Clean up event listeners
    if (this.volumeSlider && this.volumeSlider.node) {
      this.volumeSlider.node.off("slide", this.onVolumeChanged, this);
      this.volumeSlider.node.off(cc.Node.EventType.TOUCH_MOVE, this.onVolumeChanged, this);
    }
    console.log("MenuScript cleanup complete");
  },
});