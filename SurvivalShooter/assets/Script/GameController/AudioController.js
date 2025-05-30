// AudioController.js - Quản lý âm thanh cho stage
cc.Class({
  extends: cc.Component,

  properties: {
    // Audio clips for current stage
    stageMusic: {
      default: null,
      type: cc.AudioClip,
    },
    bossMusicStage1: {
      default: null,
      type: cc.AudioClip,
    },
    bossMusicStage2: {
      default: null,
      type: cc.AudioClip,
    },
    bossMusicStage3: {
      default: null,
      type: cc.AudioClip,
    },
  },

  onLoad() {
    // Register global reference  
    cc.game.audioController = this;
    
    // Setup audio for current stage
    this.setupStageAudio();
  },

  setupStageAudio() {
    if (!window.AudioManager) {
      console.warn("AudioManager not found in AudioController");
      return;
    }

    const currentScene = cc.director.getScene().name;

    // Setup audio clips based on current scene
    const audioClips = {};

    switch (currentScene) {
      case "Stage1":
        if (this.stageMusic) audioClips.stage1 = this.stageMusic;
        if (this.bossMusicStage1) audioClips.bossStage1 = this.bossMusicStage1;
        break;
      case "Stage2":
        if (this.stageMusic) audioClips.stage2 = this.stageMusic;
        if (this.bossMusicStage2) audioClips.bossStage2 = this.bossMusicStage2;
        break;
      case "BossStage":
        if (this.stageMusic) audioClips.stage3 = this.stageMusic;
        if (this.bossMusicStage3) audioClips.bossStage3 = this.bossMusicStage3;
        break;
    }

    // Update AudioManager with stage-specific clips
    if (Object.keys(audioClips).length > 0) {
      window.AudioManager.setAudioClips(audioClips);
    }

    // Start stage music
    window.AudioManager.onSceneStart(currentScene);
  },

  // Cleanup
  onDestroy() {
    // AudioManager will handle cleanup automatically
    console.log("AudioController destroyed");
  },
});