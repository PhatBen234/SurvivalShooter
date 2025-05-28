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

    music: {
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

    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
    this.settingLayout.active = false;

    // Thiết lập volume slider trước
    this.setupVolumeSlider();

    // Thử phát nhạc ngay lập tức
    this.playBackgroundMusic();

    // Backup: Thử phát nhạc sau khi user tương tác (do browser policy)
    this.setupUserInteractionListener();
  },

  setupVolumeSlider() {
    if (this.volumeSlider) {
      // Đặt âm lượng mặc định là 100%
      this.volumeSlider.progress = 1.0;

      // Lắng nghe sự kiện slide
      this.volumeSlider.node.on("slide", this.onVolumeChanged, this);
      console.log("Volume slider setup complete, default volume: 1.0");
    } else {
      console.warn("Volume slider not assigned!");
    }
  },

  playBackgroundMusic() {
    console.log("Attempting to play background music...");

    if (!this.music) {
      console.error("❌ Music asset not assigned to MenuScript!");
      return;
    }

    console.log("Music asset found:", this.music.name);

    // Dừng nhạc cũ nếu có
    if (this.currentAudioID !== undefined && this.currentAudioID !== -1) {
      cc.audioEngine.stop(this.currentAudioID);
    }

    // Phát nhạc nền (loop = true, volume = 1.0)
    this.currentAudioID = cc.audioEngine.play(this.music, true, 1.0);

    if (this.currentAudioID === -1) {
      console.error("❌ Failed to play background music");
      this.musicPlayFailed = true;
    } else {
      console.log("✅ Background music playing with ID:", this.currentAudioID);
      this.musicPlayFailed = false;
    }
  },

  setupUserInteractionListener() {
    // Lắng nghe click đầu tiên để phát nhạc (browser policy)
    this.node.once(
      cc.Node.EventType.TOUCH_START,
      () => {
        if (
          this.musicPlayFailed ||
          this.currentAudioID === -1 ||
          this.currentAudioID === undefined
        ) {
          console.log("Retrying music playback after user interaction...");
          this.playBackgroundMusic();
        }
      },
      this
    );
  },

  onVolumeChanged() {
    if (!this.volumeSlider) return;

    const volume = this.volumeSlider.progress;
    console.log("Volume changed to:", volume);

    // Điều chỉnh âm lượng nếu nhạc đang phát
    if (this.currentAudioID !== undefined && this.currentAudioID !== -1) {
      cc.audioEngine.setVolume(this.currentAudioID, volume);
      console.log("Applied volume to audio ID:", this.currentAudioID);
    } else {
      console.warn("No valid audio ID to adjust volume");
      // Thử phát nhạc lại nếu chưa có
      this.playBackgroundMusic();
      if (this.currentAudioID !== undefined && this.currentAudioID !== -1) {
        cc.audioEngine.setVolume(this.currentAudioID, volume);
      }
    }
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
    // Dừng nhạc khi component bị hủy
    if (this.currentAudioID !== undefined && this.currentAudioID !== -1) {
      cc.audioEngine.stop(this.currentAudioID);
      console.log("Stopped background music on destroy");
    }
  },
});