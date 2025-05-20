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
  },

  onLoad() {
    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
    this.settingLayout.active = false;

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

  onSettingsClick() {
    this.settingLayout.active = true;
  },

  onGoBackClick() {
    this.settingLayout.active = false;
  },

  onHomeClick() {
    this.menuBtnLayout.active = true;
    this.stageChose.active = false;
    this.homeBtn.active = false;
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
});
