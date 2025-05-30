//Singleton AudioManager quản lý toàn cục âm thanh trong game 
window.AudioManager = {
  //Âm lượng chung
  masterVolume: 1.0,
  
  //ID các bài nhạc đang phát
  currentBGM: null,
  currentBossMusic: null,
  
  //Trạng thái nhạc
  isBossMode: false,
  previousBGM: null,
  currentStage: null,
  
  //Gán audio từng Stage
  audioClips: {
    mainMenu: null,
    stage1: null,
    stage2: null,
    stage3: null,
    bossStage1: null,
    bossStage2: null,
    bossStage3: null
  },
  
  //Khởi tạo AudioManager
  init() {
    //Load volume từ localStorage
    const savedVolume = cc.sys.localStorage.getItem("masterVolume");
    if (savedVolume !== null) {
      this.masterVolume = parseFloat(savedVolume);
    }
    
    cc.log("AudioManager initialized with volume:", this.masterVolume);
  },
  
  //Đặt audio clips (gọi từ scene khi load)
  setAudioClips(clips) {
    Object.assign(this.audioClips, clips);
    cc.log("Audio clips loaded:", Object.keys(clips));
  },
  
  //Thiết lập âm lượng chung
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    //Lưu vào localStorage
    cc.sys.localStorage.setItem("masterVolume", this.masterVolume.toString());
    
    //Cập nhật âm lượng cho tất cả nhạc đang phát
    if (this.currentBGM !== null) {
      cc.audioEngine.setVolume(this.currentBGM, this.masterVolume);
    }
    
    if (this.currentBossMusic !== null) {
      cc.audioEngine.setVolume(this.currentBossMusic, this.masterVolume);
    }
  },
  
  //Lấy âm lượng hiện tại
  getMasterVolume() {
    return this.masterVolume;
  },
  
  //Phát nhạc theo từng stage
  playStageMusic(stageName) {
    const audioClip = this.audioClips[stageName];
    if (!audioClip) {
      return;
    }
    
    this.currentStage = stageName;
    this.playBGM(audioClip);
  },
  
  // Phát nhạc boss theo stage hiện tại
  playBossMusic() {
    let bossAudioKey = null;
    
    switch (this.currentStage) {
      case 'stage1':
        bossAudioKey = 'bossStage1';
        break;
      case 'stage2':
        bossAudioKey = 'bossStage2';
        break;
      case 'stage3':
        bossAudioKey = 'bossStage3';
        break;
    }
    
    const audioClip = this.audioClips[bossAudioKey];
    if (!audioClip) {
      return;
    }
    
    this.playBossMusicClip(audioClip);
  },
  
  //Phát nhạc BGM
  playBGM(audioClip, loop = true) {
    if (!audioClip) return null;
    
    //Dừng nhạc nền hiện tại nếu có (nhưng không phải nhạc boss)
    if (this.currentBGM !== null && !this.isBossMode) {
      cc.audioEngine.stop(this.currentBGM);
    }
    
    //Phát nhạc mới
    this.currentBGM = cc.audioEngine.play(audioClip, loop, this.masterVolume);
    cc.log(`Playing BGM: ${audioClip.name || 'Unknown'}`);
    
    return this.currentBGM;
  },
  
  //Dừng nhạc nền
  stopBGM() {
    if (this.currentBGM !== null) {
      cc.audioEngine.stop(this.currentBGM);
      this.currentBGM = null;
    }
  },
  
  //Phát nhạc boss
  playBossMusicClip(audioClip, loop = true) {
    if (!audioClip) return null;
    
    //Lưu nhạc nền hiện tại để khôi phục sau
    if (!this.isBossMode && this.currentBGM !== null) {
      this.previousBGM = this.currentBGM;
      cc.audioEngine.pause(this.currentBGM);
    }
    
    //Dừng nhạc boss cũ ở màn trước (nếu có)
    this.stopBossMusicOnly();
    
    // Phát nhạc boss
    this.currentBossMusic = cc.audioEngine.play(audioClip, loop, this.masterVolume);
    this.isBossMode = true;
    return this.currentBossMusic;
  },
  
  //Dừng nhạc boss và khôi phục nhạc nền
  stopBossMusic() {
    this.stopBossMusicOnly();
    
    //Khôi phục nhạc nền nếu có
    if (this.isBossMode && this.previousBGM !== null) {
      cc.audioEngine.resume(this.previousBGM);
      this.currentBGM = this.previousBGM;
      this.previousBGM = null;
    }
    
    this.isBossMode = false;
  },
  
  //Dừng chỉ nhạc boss (không khôi phục BGM)
  stopBossMusicOnly() {
    if (this.currentBossMusic !== null) {
      cc.audioEngine.stop(this.currentBossMusic);
      this.currentBossMusic = null;
    }
  },
  
  //Phát âm thanh hiệu ứng
  playSFX(audioClip, volume = 1.0) {
    if (!audioClip) return null;
    
    const finalVolume = this.masterVolume * volume;
    return cc.audioEngine.playEffect(audioClip, false, finalVolume);
  },
  
  // Scene transition methods
  onSceneStart(sceneName) {
    
    // Phát nhạc tương ứng với scene
    switch (sceneName) {
      case 'MainMenu':
        this.currentStage = null;
        this.isBossMode = false;
        this.playStageMusic('mainMenu');
        break;
      case 'Stage1':
        this.currentStage = 'stage1';
        this.isBossMode = false;
        this.playStageMusic('stage1');
        break;
      case 'Stage2':
        this.currentStage = 'stage2';
        this.isBossMode = false;
        this.playStageMusic('stage2');
        break;
      case 'BossStage':
        this.currentStage = 'stage3';
        this.isBossMode = false;
        this.playStageMusic('stage3');
        break;
    }
  },
  
  //Gọi khi boss spawn
  onBossSpawn() {
    if (!this.isBossMode) {
      this.playBossMusic();
    }
  },
  
  // Gọi khi boss bị đánh bại
  onBossDefeated() {
    if (this.isBossMode) {
      this.stopBossMusic();
    }
  },
  
  // Dừng tất cả âm thanh
  stopAll() {
    cc.audioEngine.stopAll();
    this.currentBGM = null;
    this.currentBossMusic = null;
    this.previousBGM = null;
    this.isBossMode = false;
  },
  
  // Tạm dừng tất cả
  pauseAll() {
    cc.audioEngine.pauseAll();
  },
  
  // Tiếp tục tất cả
  resumeAll() {
    cc.audioEngine.resumeAll();
  },
  
  // Kiểm tra trạng thái
  isPlayingBossMusic() {
    return this.isBossMode;
  },
  
  getCurrentStage() {
    return this.currentStage;
  }
};