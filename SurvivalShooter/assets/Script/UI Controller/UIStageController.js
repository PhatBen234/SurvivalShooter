// UIStageController.js - Updated with Volume Control
cc.Class({
    extends: cc.Component,

    properties: {
        // Pause Menu
        pauseMenu: cc.Node,
        volumeSlider: cc.Slider, // Added volume slider for pause menu

        // Result Menu
        resultMenu: cc.Node,
        resultLabel: cc.Label,
        nextStageBtn: cc.Node,
        finalScoreLabel: cc.Label,

        // Game UI Elements
        scoreLabel: cc.Label,
        roundLabel: cc.Label,
        timerLabel: cc.Label,
    },

    onLoad() {
        // Initialize menus
        this.pauseMenu.active = false;
        this.resultMenu.active = false;
        
        // Initialize UI labels
        this.initializeUI();

        // Setup volume slider
        this.setupVolumeSlider();

        //Setp max round
        this.maxRound = 3; // Assuming 3 rounds in total
    },

    setupVolumeSlider() {
        if (this.volumeSlider && window.AudioManager) {
            // Set slider value to current master volume
            const currentVolume = window.AudioManager.getMasterVolume();
            this.volumeSlider.progress = currentVolume;

            // Listen for slide events
            this.volumeSlider.node.on("slide", this.onVolumeChanged, this);
            console.log("Stage volume slider setup complete, current volume:", currentVolume);
        } else {
            if (!this.volumeSlider) {
                console.warn("Volume slider not assigned in UIStageController!");
            }
            if (!window.AudioManager) {
                console.warn("AudioManager not found in UIStageController!");
            }
        }
    },

    onVolumeChanged() {
        if (!this.volumeSlider || !window.AudioManager) return;

        const volume = this.volumeSlider.progress;
        console.log("Stage volume changed to:", volume);

        // Update master volume through AudioManager
        window.AudioManager.setMasterVolume(volume);
    },

    initializeUI() {
        // Initialize score
        if (this.scoreLabel) {
            this.scoreLabel.string = "Score: 0";
        }
        
        // Initialize round
        if (this.roundLabel) {
            this.roundLabel.string = 'Round: 1/${this.maxRound}';
        }
        
        // Initialize timer
        if (this.timerLabel) {
            this.timerLabel.string = "Time: 01:30";
        }
    },

    // === GAME UI UPDATES ===
    updateScore(score) {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${score}`;
        }
    },

    updateRound(round) {
        if (this.roundLabel) {
            this.roundLabel.string = `Round: ${round}/${this.maxRound}`;
        }
    },

    updateTimer(timeLeft) {
        if (this.timerLabel) {
            if (timeLeft < 0) {
                // Round 3 - no time limit
                this.timerLabel.string = "No Time Limit";
            } else {
                // Format time as MM:SS
                let minutes = Math.floor(timeLeft / 60);
                let seconds = Math.floor(timeLeft % 60);
                let formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                this.timerLabel.string = `Time: ${formattedTime}`;
            }
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
        
        // Resume audio
        if (window.AudioManager) {
            window.AudioManager.resumeAll();
        }
    },

    onRestartClick() {
        this.pauseMenu.active = false;
        this.resultMenu.active = false;
        const currentScene = cc.director.getScene().name;

        cc.director.resume();
        
        // Resume audio before scene change
        if (window.AudioManager) {
            window.AudioManager.resumeAll();
        }
        
        cc.director.loadScene(currentScene);
    },

    // === RESULT MENU ===
    showResultPanel(isWin) {
        this.resultMenu.active = true;
        cc.director.pause();

        if (this.resultLabel) {
            if (isWin) {
                this.resultLabel.string = "YOU WON ";
            } else {
                this.resultLabel.string = "GAME OVER";
            }
            this.finalScoreLabel.string = `Final Score: ${this.scoreLabel.string.split(": ")[1]}`;
        }

        // Show/hide next stage button based on result
        if (this.nextStageBtn) {
            const currentScene = cc.director.getScene().name;
            
            if (isWin && currentScene !== "BossStage") {
                // Show next stage button if won and not boss stage
                this.nextStageBtn.active = true;
            } else {
                // Hide next stage button if lost or it's boss stage
                this.nextStageBtn.active = false;
            }
        }
    },

    onClickNextStage() {
        const currentScene = cc.director.getScene().name;

        
        // Resume audio before scene change
        if (window.AudioManager) {
            window.AudioManager.resumeAll();
        }

        // Navigate to next stage
        if (currentScene === "Stage1") {
            cc.director.loadScene("Stage2");
        } else if (currentScene === "Stage2") {
            cc.director.loadScene("BossStage");
        } else if (currentScene === "BossStage") {
            // Boss stage completed, return to main menu
            cc.director.loadScene("MainMenu");
        }
        cc.director.resume();
    },

    onResultHomeClick() {
        // Resume audio before scene change
        if (window.AudioManager) {
            window.AudioManager.resumeAll();
        }       
        cc.director.loadScene("MainMenu");
        cc.director.resume();
    },

    // === UTILITY METHODS ===
    
    // Format time helper method
    formatTime(seconds) {
        if (seconds < 0) return "∞";
        
        let minutes = Math.floor(seconds / 60);
        let secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Get current scene name helper
    getCurrentSceneName() {
        return cc.director.getScene().name;
    }
});