// AudioManager.js - Singleton để quản lý âm thanh toàn game
window.AudioManager = {
  // Âm lượng chung
  masterVolume: 1.0,
  
  // ID các bài nhạc đang phát
  currentBGM: null,
  currentBossMusic: null,
  
  // Trạng thái nhạc
  isBossMode: false,
  previousBGM: null,
  
  // Khởi tạo AudioManager
  init() {
    cc.log("AudioManager initialized");
  },
  
  // Đặt âm lượng chung
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Cập nhật âm lượng cho tất cả nhạc đang phát
    if (this.currentBGM !== null) {
      cc.audioEngine.setVolume(this.currentBGM, this.masterVolume);
    }
    
    if (this.currentBossMusic !== null) {
      cc.audioEngine.setVolume(this.currentBossMusic, this.masterVolume);
    }
    
    cc.log(`Master volume set to: ${this.masterVolume}`);
  },
  
  // Phát nhạc nền
  playBGM(audioClip, loop = true) {
    if (!audioClip) return null;
    
    // Dừng nhạc nền hiện tại nếu có
    this.stopBGM();
    
    // Phát nhạc mới
    this.currentBGM = cc.audioEngine.play(audioClip, loop, this.masterVolume);
    cc.log(`Playing BGM: ${audioClip.name}`);
    
    return this.currentBGM;
  },
  
  // Dừng nhạc nền
  stopBGM() {
    if (this.currentBGM !== null) {
      cc.audioEngine.stop(this.currentBGM);
      this.currentBGM = null;
    }
  },
  
  // Phát nhạc boss
  playBossMusic(audioClip, loop = true) {
    if (!audioClip) return null;
    
    // Lưu nhạc nền hiện tại để khôi phục sau
    if (!this.isBossMode && this.currentBGM !== null) {
      this.previousBGM = this.currentBGM;
      cc.audioEngine.pause(this.currentBGM); // Tạm dừng thay vì dừng
    }
    
    // Dừng nhạc boss cũ nếu có
    this.stopBossMusic();
    
    // Phát nhạc boss
    this.currentBossMusic = cc.audioEngine.play(audioClip, loop, this.masterVolume);
    this.isBossMode = true;
    
    cc.log(`Playing Boss Music: ${audioClip.name}`);
    return this.currentBossMusic;
  },
  
  // Dừng nhạc boss và khôi phục nhạc nền
  stopBossMusic() {
    if (this.currentBossMusic !== null) {
      cc.audioEngine.stop(this.currentBossMusic);
      this.currentBossMusic = null;
    }
    
    // Khôi phục nhạc nền nếu có
    if (this.isBossMode && this.previousBGM !== null) {
      cc.audioEngine.resume(this.previousBGM);
      this.currentBGM = this.previousBGM;
      this.previousBGM = null;
    }
    
    this.isBossMode = false;
    cc.log("Boss music stopped, BGM restored");
  },
  
  // Phát âm thanh hiệu ứng
  playSFX(audioClip, volume = 1.0) {
    if (!audioClip) return null;
    
    const finalVolume = this.masterVolume * volume;
    return cc.audioEngine.playEffect(audioClip, false, finalVolume);
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
  }
};