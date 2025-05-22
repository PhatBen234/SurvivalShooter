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
    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
    this.settingLayout.active = false;

    //Pause Menu
    this.pauseMenu.active = false;

    //Result Menu
    this.resultMenu.active = false;

    // Phát nhạc lặp lại và lưu lại ID để điều chỉnh âm lượng
    this.audioID = cc.audioEngine.play(this.music, true, 1);

    // Đặt max của thanh slider là 1 (max volume = 1)
    if (this.volumeSlider) {
      this.volumeSlider.progress = 1;
      this.volumeSlider.node.on("slide", this.onVolumeChanged, this);
    }
  },

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
      cc.log("Trình duyệt không thể thoát qua code.");
    }
  },

  onVolumeChanged() {
    const volume = this.volumeSlider.progress;
    cc.audioEngine.setVolume(this.audioID, volume);
  },

  //Pause Menu
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
    if (currentScene === "Stage1") {
      cc.director.resume();
      cc.director.loadScene("Stage1");
    }
    else if (currentScene === "Stage2") {
      cc.director.resume();
      cc.director.loadScene("Stage2");
    }
    else {
      cc.director.resume();
      cc.director.loadScene("BossStage");
    }
  },
  
  //Result Menu
  showResultPanel(isWin) {
    // Hiển thị result menu
    this.resultMenu.active = true;
    
    // Tạm dừng game
    cc.director.pause();
    
    // Cập nhật label kết quả
    if (this.resultLabel) {
      if (isWin) {
        this.resultLabel.string = "🎉 VICTORY! 🎉";
        this.resultLabel.node.color = cc.Color.GREEN;
      } else {
        this.resultLabel.string = "💀 GAME OVER 💀";
        this.resultLabel.node.color = cc.Color.RED;
      }
    }
    
    // Hiển thị/ẩn nút Next Stage dựa trên kết quả
    if (this.nextStageBtn) {
      this.nextStageBtn.active = isWin; // Chỉ hiện khi thắng
    }
  },

  onClickNextStage() {
    const currentScene = cc.director.getScene().name;
    
    // Resume game trước khi chuyển scene
    cc.director.resume();

    if (currentScene === "Stage1") {
      cc.director.loadScene("Stage2");
    }
    else if (currentScene === "Stage2") {
      cc.director.loadScene("BossStage");
    }
    else if (currentScene === "BossStage") {
      // Nếu đã hoàn thành boss stage, về main menu
      cc.director.loadScene("MainMenu");
    }
  },

  // Hàm để đóng result panel và về main menu (khi thua)
  onResultHomeClick() {
    cc.director.resume();
    cc.director.loadScene("MainMenu");
  },
});