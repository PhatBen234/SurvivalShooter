cc.Class({
  extends: cc.Component,

  properties: {
    menuBtnLayout: cc.Node,
    stageChose: cc.Node,
    homeBtn: cc.Node,
    settingLayout: cc.Node,

    music: {
      default: null,
      type: cc.AudioClip,
    },
    volumeSlider: {
      default: null,
      type: cc.Slider,
    },

    //Pause Menu
    pauseMenu: cc.Node,

    //Result Menu
    resultMenu: cc.Node,
    resultLabel: cc.Label, // Label hiển thị kết quả (WIN/FAIL)
    nextStageBtn: cc.Node, // Nút Next Stage
  },

  onLoad() {
    console.log("MenuScript onLoad started");

    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
    this.settingLayout.active = false;

    //Pause Menu
    this.pauseMenu.active = false;

    //Result Menu
    this.resultMenu.active = false;

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

  // === PAUSE MENU ===
  onPauseClick() {
    this.pauseMenu.active = true;
    cc.director.pause();
  },

  onResumeClick() {
    this.pauseMenu.active = false;
    cc.director.resume();
  },

  onRestartClick() {
    this.pauseMenu.active = false;
    this.resultMenu.active = false;
    const currentScene = cc.director.getScene().name;

    cc.director.resume();

    if (currentScene === "Stage1") {
      cc.director.loadScene("Stage1");
    } else if (currentScene === "Stage2") {
      cc.director.loadScene("Stage2");
    } else {
      cc.director.loadScene("BossStage");
    }
  },

  // === RESULT MENU ===
  showResultPanel(isWin) {
    this.resultMenu.active = true;
    cc.director.pause();

    if (this.resultLabel) {
      if (isWin) {
        this.resultLabel.string = "🎉 VICTORY! 🎉";
        this.resultLabel.node.color = cc.Color.GREEN;
      } else {
        this.resultLabel.string = "💀 GAME OVER 💀";
        this.resultLabel.node.color = cc.Color.RED;
      }
    }
    const currentScene = cc.director.getScene().name;
    if (currentScene === "BossStage") {
      this.nextStageBtn.active = !isWin;
    }
    if (this.nextStageBtn) {
      this.nextStageBtn.active = isWin;
    }
  },

  onClickNextStage() {
    const currentScene = cc.director.getScene().name;
    cc.director.resume();

    if (currentScene === "Stage1") {
      cc.director.loadScene("Stage2");
    } else if (currentScene === "Stage2") {
      cc.director.loadScene("BossStage");
    } else if (currentScene === "BossStage") {
      cc.director.loadScene("MainMenu");
    }
  },

  onResultHomeClick() {
    cc.director.resume();
    cc.director.loadScene("MainMenu");
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
