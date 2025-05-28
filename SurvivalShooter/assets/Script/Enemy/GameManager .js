cc.Class({
  extends: cc.Component,

  properties: {
    // UI Controllers
    uiStageController: cc.Node,
    enemyManager: cc.Node,
  },

  onLoad() {
    // Game state variables
    this.currentRound = 1;
    this.roundTimer = 90; // 1p30s = 90 seconds
    this.totalScore = 0;
    this.isGameActive = false;

    // Round settings
    this.ROUND_1_TIME = 5; // 1 minute 30 seconds
    this.ROUND_2_TIME = 5; // 1 minute 30 seconds
    this.ROUND_3_TIME = -1; // Unlimited time

    // Register global reference
    cc.game.gameManager = this;

    console.log("GameManager loaded");
  },

  start() {
    // Get references in start() to ensure other components are loaded
    if (this.uiStageController) {
      this.uiController = this.uiStageController.getComponent('UIStageController');
      console.log("UI Controller found:", !!this.uiController);
    }

    if (this.enemyManager) {
      this.enemyManagerComponent = this.enemyManager.getComponent('EnemyManager');
      console.log("Enemy Manager found:", !!this.enemyManagerComponent);
    }

    // Initialize audio for current stage
    this.initializeStageAudio();

    // Start game after getting references
    this.startGame();
  },

  initializeStageAudio() {
    // Get current scene name and extract stage number
    let sceneName = cc.director.getScene().name;
    let stageNumber = 1;

    if (sceneName.startsWith("Stage")) {
      stageNumber = parseInt(sceneName.replace("Stage", "")) || 1;
    } else if (sceneName === "BossStage") {
      stageNumber = 3;
    }

    // Tell AudioManager to play stage background music
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      audioManager.playStageBackgroundMusic(stageNumber);
    }
  },

  startGame() {
    this.currentRound = 1;
    this.roundTimer = this.ROUND_1_TIME;
    this.totalScore = 0;
    this.isGameActive = true;

    // Start first round
    this.startRound(1);

    // Update UI
    this.updateUI();
  },

  update(dt) {
    if (!this.isGameActive) return;

    // Update timer for round 1 and 2 only
    if (this.currentRound <= 2 && this.roundTimer > 0) {
      this.roundTimer -= dt;

      if (this.roundTimer <= 0) {
        this.nextRound();
      }

      // Update timer UI
      this.updateTimerUI();
    }
  },

  startRound(roundNumber) {
    this.currentRound = roundNumber;

    // Set timer for round
    switch (roundNumber) {
      case 1:
        this.roundTimer = this.ROUND_1_TIME;
        break;
      case 2:
        this.roundTimer = this.ROUND_2_TIME;
        break;
      case 3:
        this.roundTimer = this.ROUND_3_TIME;
        // *** AUDIO: Chuyển sang nhạc boss khi vào round 3 ***
        this.switchToBossMusic();
        break;
    }

    // Notify enemy manager about current round
    if (this.enemyManagerComponent) {
      this.enemyManagerComponent.setCurrentRound(roundNumber);
    }

    // Notify audio manager about round change
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      audioManager.onRoundChanged(roundNumber);
    }

    // Update round UI
    this.updateRoundUI();

    console.log(`Started Round ${roundNumber}`);
  },

  switchToBossMusic() {
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      // Get current stage number
      let sceneName = cc.director.getScene().name;
      let stageNumber = 1;

      if (sceneName.startsWith("Stage")) {
        stageNumber = parseInt(sceneName.replace("Stage", "")) || 1;
      } else if (sceneName === "BossStage") {
        stageNumber = 3;
      }

      audioManager.playBossMusic(stageNumber);
      console.log(`Switched to boss music for stage ${stageNumber}`);
    }
  },

  nextRound() {
    if (this.currentRound < 3) {
      this.startRound(this.currentRound + 1);
    }
  },

  // Called when enemy is destroyed
  onEnemyDestroyed(scorePoints) {
    this.totalScore += scorePoints;

    // Fire event to UI controller to update score
    if (this.uiController) {
      this.uiController.updateScore(this.totalScore);
    }
  },

  // Called when player dies
  onPlayerDeath() {
    this.isGameActive = false;

    // Fire event to UI controller to show game over
    if (this.uiController) {
      this.uiController.showResultPanel(false); // false = game over
    }
  },

  // Called when stage is completed (can be triggered by boss death or other conditions)
  onStageComplete() {
    this.isGameActive = false;

    // Fire event to UI controller to show victory
    if (this.uiController) {
      this.uiController.showResultPanel(true); // true = victory
    }
  },

  // UI Update methods
  updateUI() {
    this.updateRoundUI();
    this.updateTimerUI();
    if (this.uiController) {
      this.uiController.updateScore(this.totalScore);
    }
  },

  updateRoundUI() {
    if (this.uiController) {
      this.uiController.updateRound(this.currentRound);
    }
  },

  updateTimerUI() {
    if (this.uiController) {
      this.uiController.updateTimer(this.roundTimer);
    }
  },

  // Getter methods
  getCurrentRound() {
    return this.currentRound;
  },

  getRoundTimer() {
    return this.roundTimer;
  },

  getTotalScore() {
    return this.totalScore;
  },

  isPlaying() {
    return this.isGameActive;
  },

  // === AUDIO INTEGRATION METHODS ===

  // Method để pause game và hiển thị pause panel với volume slider
  pauseGame() {
    this.isGameActive = false;
    // Pause game logic here
    // Show pause panel with volume control
  },

  resumeGame() {
    this.isGameActive = true;
    // Resume game logic here
  },

  // Method để get AudioManager reference dễ dàng
  getAudioManager() {
    return cc.AudioManager && cc.AudioManager.getInstance();
  },
  // Add this improved method to your GameManager.js

  // Called when enemy is destroyed
  onEnemyDestroyed(scorePoints) {
    // Validate scorePoints to prevent NaN
    const validScore = Number(scorePoints) || 0;

    console.log("Adding score:", validScore, "Current total:", this.totalScore);

    // Check if current totalScore is valid
    if (isNaN(this.totalScore)) {
      console.warn("Total score was NaN, resetting to 0");
      this.totalScore = 0;
    }

    this.totalScore += validScore;

    console.log("New total score:", this.totalScore);

    // Fire event to UI controller to update score
    if (this.uiController) {
      this.uiController.updateScore(this.totalScore);
    }
  },

  // Called when stage is completed (can be triggered by boss death or other conditions)
  onStageComplete() {
    console.log("Stage completion triggered, current game state:", this.isGameActive);

    if (!this.isGameActive) {
      console.log("Game already inactive, skipping completion");
      return; // Prevent multiple calls
    }

    this.isGameActive = false;

    console.log("Showing victory panel with score:", this.totalScore);

    // Fire event to UI controller to show victory
    if (this.uiController) {
      this.uiController.showResultPanel(true); // true = victory
    } else {
      console.error("UI Controller not found when trying to show result panel");
    }
  },
});