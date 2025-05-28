// AudioManager.js - Singleton quản lý toàn bộ âm thanh trong game
cc.Class({
    extends: cc.Component,

    properties: {
        // Main Menu Music
        mainMenuMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Main Menu Music"
        },

        // Stage Background Music (Round 1 & 2)
        stage1BackgroundMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Stage 1 Background"
        },
        stage2BackgroundMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Stage 2 Background"
        },
        stage3BackgroundMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Stage 3 Background"
        },

        // Boss Music (Round 3)
        stage1BossMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Stage 1 Boss Music"
        },
        stage2BossMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Stage 2 Boss Music"
        },
        stage3BossMusic: {
            default: null,
            type: cc.AudioClip,
            displayName: "Stage 3 Boss Music"
        },

        // Fade settings
        fadeTime: {
            default: 2.0,
            displayName: "Fade Transition Time (seconds)"
        }
    },

    // FIXED: Proper static methods definition
    statics: {
        _instance: null,
        
        getInstance() {
            return cc.AudioManager._instance;
        },
        
        setInstance(instance) {
            cc.AudioManager._instance = instance;
        }
    },

    onLoad() {
        console.log("AudioManager onLoad called");
        
        // FIXED: Improved singleton pattern
        if (cc.AudioManager && cc.AudioManager.getInstance()) {
            console.log("AudioManager instance already exists, destroying duplicate");
            this.node.destroy();
            return;
        }
        
        // Set up global reference - FIXED
        if (!cc.AudioManager) {
            cc.AudioManager = this.constructor; // Reference to the class itself
        }
        cc.AudioManager.setInstance(this);
        
        // Don't destroy on load để giữ AudioManager qua các scene
        cc.game.addPersistRootNode(this.node);
        
        // Initialize audio system
        this.initializeAudio();
        
        console.log("✅ AudioManager initialized as singleton");
    },

    start() {
        // Ensure AudioManager is properly initialized after all scenes are loaded
        this.scheduleOnce(() => {
            console.log("AudioManager post-initialization check");
            this.verifyAudioSystem();
        }, 0.1);
    },

    verifyAudioSystem() {
        console.log("=== AUDIO SYSTEM VERIFICATION ===");
        console.log("Available audio clips:");
        console.log("- Main Menu:", !!this.mainMenuMusic);
        console.log("- Stage 1 BG:", !!this.stage1BackgroundMusic);
        console.log("- Stage 1 Boss:", !!this.stage1BossMusic);
        console.log("- Stage 2 BG:", !!this.stage2BackgroundMusic);
        console.log("- Stage 2 Boss:", !!this.stage2BossMusic);
        console.log("- Stage 3 BG:", !!this.stage3BackgroundMusic);
        console.log("- Stage 3 Boss:", !!this.stage3BossMusic);
        console.log("Current volume:", this.masterVolume);
        console.log("=== END VERIFICATION ===");
    },

    initializeAudio() {
        // Current audio state
        this.currentMusicID = -1;
        this.currentMusicType = null; // 'menu', 'background', 'boss'
        this.currentStage = 0;
        this.isFading = false;
        
        // Volume settings - Load from localStorage hoặc default
        this.masterVolume = parseFloat(cc.sys.localStorage.getItem("game_master_volume")) || 1.0;
        
        // FIXED: Rebuild music mapping trong start() để đảm bảo properties đã loaded
        this.rebuildMusicMap();
        
        console.log("Audio system initialized with volume:", this.masterVolume);
    },

    // NEW: Method to rebuild music mapping
    rebuildMusicMap() {
        this.musicMap = {
            menu: this.mainMenuMusic,
            stage1: {
                background: this.stage1BackgroundMusic,
                boss: this.stage1BossMusic
            },
            stage2: {
                background: this.stage2BackgroundMusic,
                boss: this.stage2BossMusic
            },
            stage3: {
                background: this.stage3BackgroundMusic,
                boss: this.stage3BossMusic
            }
        };
        console.log("Music map rebuilt");
    },

    // === MAIN MUSIC CONTROL METHODS ===
    
    playMenuMusic() {
        console.log("🎵 Attempting to play menu music");
        this.rebuildMusicMap(); // Ensure music map is current
        this.playMusic(this.mainMenuMusic, 'menu');
    },

    playStageBackgroundMusic(stageNumber) {
        console.log(`🎵 Attempting to play stage ${stageNumber} background music`);
        this.rebuildMusicMap(); // Ensure music map is current
        this.currentStage = stageNumber;
        let music = this.getStageMusic(stageNumber, 'background');
        if (music) {
            this.playMusic(music, 'background');
        } else {
            console.error(`❌ No background music found for stage ${stageNumber}`);
        }
    },

    playBossMusic(stageNumber) {
        console.log(`🎵 Attempting to play stage ${stageNumber} boss music`);
        this.rebuildMusicMap(); // Ensure music map is current
        this.currentStage = stageNumber || this.currentStage;
        let music = this.getStageMusic(this.currentStage, 'boss');
        if (music) {
            this.fadeToNewMusic(music, 'boss');
        } else {
            console.error(`❌ No boss music found for stage ${this.currentStage}`);
        }
    },

    // === INTERNAL MUSIC METHODS ===
    
    getStageMusic(stageNumber, type) {
        let stageKey = `stage${stageNumber}`;
        console.log(`Looking for music: ${stageKey}.${type}`);
        
        if (this.musicMap && this.musicMap[stageKey] && this.musicMap[stageKey][type]) {
            console.log(`✅ Found music: ${this.musicMap[stageKey][type].name || 'Unknown'}`);
            return this.musicMap[stageKey][type];
        }
        
        console.error(`❌ Music not found: ${stageKey}.${type}`);
        return null;
    },

    playMusic(audioClip, musicType) {
        if (!audioClip) {
            console.error(`❌ No audio clip provided for type: ${musicType}`);
            return;
        }

        console.log(`🎵 Playing ${musicType} music: ${audioClip.name || 'Unknown'}`);

        // Stop current music
        this.stopCurrentMusic();

        // FIXED: Add delay to ensure audio engine is ready
        this.scheduleOnce(() => {
            // Play new music with proper volume
            this.currentMusicID = cc.audioEngine.play(audioClip, true, this.masterVolume);
            this.currentMusicType = musicType;

            if (this.currentMusicID === -1) {
                console.error(`❌ Failed to play ${musicType} music:`, audioClip.name);
            } else {
                console.log(`✅ Successfully playing ${musicType} music:`, audioClip.name, "ID:", this.currentMusicID, "Volume:", this.masterVolume);
            }
        }, 0.1);
    },

    fadeToNewMusic(newAudioClip, newMusicType) {
        if (this.isFading) {
            console.log("Already fading, skipping...");
            return;
        }
        
        if (!newAudioClip) {
            console.error(`❌ No audio clip provided for fade to type: ${newMusicType}`);
            return;
        }

        console.log(`🎵 Fading to ${newMusicType} music: ${newAudioClip.name}`);
        this.isFading = true;
        
        // If no current music, just play new music
        if (this.currentMusicID === -1) {
            this.playMusic(newAudioClip, newMusicType);
            this.isFading = false;
            return;
        }

        // Fade out current music
        this.fadeOutCurrentMusic(() => {
            // Then play new music
            this.playMusic(newAudioClip, newMusicType);
            this.isFading = false;
        });
    },

    fadeOutCurrentMusic(callback) {
        if (this.currentMusicID === -1) {
            if (callback) callback();
            return;
        }

        console.log("🔉 Fading out current music...");

        // Create fade out effect
        let fadeSteps = 20;
        let stepTime = this.fadeTime / fadeSteps;
        let volumeStep = this.masterVolume / fadeSteps;
        let currentVolume = this.masterVolume;
        let currentMusicID = this.currentMusicID;

        let fadeInterval = setInterval(() => {
            currentVolume -= volumeStep;
            
            if (currentVolume <= 0 || currentMusicID !== this.currentMusicID) {
                // Fade complete or music changed
                clearInterval(fadeInterval);
                if (currentMusicID === this.currentMusicID) {
                    cc.audioEngine.stop(currentMusicID);
                    this.currentMusicID = -1;
                }
                console.log("✅ Fade out complete");
                if (callback) callback();
            } else {
                // Continue fading
                cc.audioEngine.setVolume(currentMusicID, Math.max(0, currentVolume));
            }
        }, stepTime * 1000);
    },

    stopCurrentMusic() {
        if (this.currentMusicID !== -1) {
            console.log("⏹️ Stopping current music, ID:", this.currentMusicID);
            cc.audioEngine.stop(this.currentMusicID);
            this.currentMusicID = -1;
            this.currentMusicType = null;
        }
    },

    // === VOLUME CONTROL - FIXED ===
    
    setMasterVolume(volume) {
        console.log(`🔊 Setting master volume from ${this.masterVolume} to ${volume}`);
        
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Apply to current playing music IMMEDIATELY
        if (this.currentMusicID !== -1) {
            cc.audioEngine.setVolume(this.currentMusicID, this.masterVolume);
            console.log(`✅ Applied volume ${this.masterVolume} to current music ID: ${this.currentMusicID}`);
        }
        
        // Save to localStorage
        cc.sys.localStorage.setItem("game_master_volume", this.masterVolume.toString());
        console.log(`💾 Saved volume to localStorage: ${this.masterVolume}`);
    },

    getMasterVolume() {
        return this.masterVolume;
    },

    // === SCENE MANAGEMENT - IMPROVED ===
    
    onSceneChanged(sceneName) {
        console.log(`🎬 Scene changed to: ${sceneName}`);
        
        // Rebuild music map to ensure current properties
        this.rebuildMusicMap();
        
        // Delay music playback to ensure scene is fully loaded
        this.scheduleOnce(() => {
            if (sceneName === "MainMenu") {
                this.playMenuMusic();
            } else if (sceneName.startsWith("Stage")) {
                // Extract stage number from scene name
                let stageNum = parseInt(sceneName.replace("Stage", "")) || 1;
                this.playStageBackgroundMusic(stageNum);
            } else if (sceneName === "BossStage") {
                this.playStageBackgroundMusic(3);
            }
        }, 0.2);
    },

    // === UTILITY METHODS ===
    
    getCurrentMusicInfo() {
        return {
            musicType: this.currentMusicType,
            stage: this.currentStage,
            volume: this.masterVolume,
            isPlaying: this.currentMusicID !== -1,
            musicID: this.currentMusicID
        };
    },

    // Method để GameManager gọi khi chuyển round
    onRoundChanged(roundNumber) {
        console.log(`🎮 Round changed to: ${roundNumber}`);
        if (roundNumber === 3) {
            // Round 3 = Boss round, chuyển sang nhạc boss
            this.playBossMusic(this.currentStage);
        }
        // Round 1, 2 giữ nguyên nhạc nền
    },

    // NEW: Force reinitialize (for debugging)
    forceReinitialize() {
        console.log("🔄 Force reinitializing AudioManager...");
        this.stopCurrentMusic();
        this.initializeAudio();
        this.verifyAudioSystem();
    },

    // === CLEANUP ===
    
    onDestroy() {
        console.log("🗑️ AudioManager cleanup");
        this.stopCurrentMusic();
        if (cc.AudioManager && cc.AudioManager.getInstance() === this) {
            cc.AudioManager.setInstance(null);
        }
    }
});