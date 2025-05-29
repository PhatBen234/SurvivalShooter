cc.Class({
  extends: cc.Component,

  properties: {
    uiStageController: cc.Node,
    enemyManager: cc.Node,
    player: cc.Node,
  },

  onLoad() {
    // Game state variables
    this.currentRound = 1;
    this.roundTimer = 90;
    this.totalScore = 0;
    this.isGameActive = false;
    this.bossSpawned = false;
    this.bossDefeated = false;

    // Round settings
    this.ROUND_1_TIME = 1; // 1 minute 30 seconds
    this.ROUND_2_TIME = 1; // 1 minute 30 seconds
    this.ROUND_3_TIME = -1; // Unlimited time for boss round

    // Register global reference
    cc.game.gameManager = this;

    console.log("GameManager loaded");
  },

  start() {
    // Get references in start() to ensure other components are loaded
    if (this.uiStageController) {
      this.uiController =
        this.uiStageController.getComponent("UIStageController");
      console.log("UI Controller found:", !!this.uiController);
    }

    if (this.enemyManager) {
      this.enemyManagerComponent =
        this.enemyManager.getComponent("EnemyManager");
      console.log("Enemy Manager found:", !!this.enemyManagerComponent);
    }

    if (this.player) {
      this.playerScript = this.player.getComponent("PlayerModel");
      console.log("Player Script found:", !!this.playerScript);
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
    this.bossSpawned = false;
    this.bossDefeated = false;

    this.startRound(1);
    this.updateUI();
  },

  update(dt) {
    if (!this.isGameActive) return;

    this.checkPlayerDeath();

    // Update timer for round 1 and 2 only
    if (this.currentRound <= 2 && this.roundTimer > 0) {
      this.roundTimer -= dt;

      if (this.roundTimer <= 0) {
        this.nextRound();
      }

      this.updateTimerUI();
    }

    // Check for boss spawn in round 3
    if (
      this.currentRound === 3 &&
      !this.bossSpawned &&
      this.roundTimer === -1
    ) {
      this.scheduleOnce(() => {
        this.spawnBossNow();
      }, 2.0);
      this.bossSpawned = true;
    }
  },

  spawnBossNow() {
    if (this.enemyManagerComponent) {
      this.enemyManagerComponent.forceBossSpawn();
    }
  },

  checkPlayerDeath() {
    if (this.playerScript && this.playerScript._currentHp <= 0) {
      this.onPlayerDeath();
    }
  },

  startRound(roundNumber) {
    this.currentRound = roundNumber;

    switch (roundNumber) {
      case 1:
        this.roundTimer = this.ROUND_1_TIME;
        break;
      case 2:
        this.roundTimer = this.ROUND_2_TIME;
        break;
      case 3:
        this.roundTimer = this.ROUND_3_TIME;
        this.bossSpawned = false;
        // Switch to boss music when entering round 3
        this.switchToBossMusic();
        break;
    }

    if (this.enemyManagerComponent) {
      this.enemyManagerComponent.setCurrentRound(roundNumber);
    }

    // Notify audio manager about round change
    let audioManager = cc.AudioManager && cc.AudioManager.getInstance();
    if (audioManager) {
      audioManager.onRoundChanged(roundNumber);
    }

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

  // Called when enemy is destroyed - Enhanced version with boss detection
  onEnemyDestroyed(scorePoints, enemyNode) {
    // Validate scorePoints to prevent NaN
    const validScore = Number(scorePoints) || 0;

    console.log("Adding score:", validScore, "Current total:", this.totalScore);

    // Check if current totalScore is valid
    if (isNaN(this.totalScore)) {
      console.warn("Total score was NaN, resetting to 0");
      this.totalScore = 0;
    }

    this.totalScore += validScore;

    // Boss detection in round 3
    if (enemyNode && this.currentRound === 3) {
      let isBoss = false;

      // Check by node name
      if (
        enemyNode.name &&
        (enemyNode.name.toLowerCase().includes("finalboss") ||
          enemyNode.name.toLowerCase().includes("boss"))
      ) {
        isBoss = true;
      }

      // Check by BossEnemy component
      if (enemyNode.getComponent("BossEnemy")) {
        isBoss = true;
      }

      // Check isBoss flag in enemy components
      let enemyComponents = [
        enemyNode.getComponent("BossEnemy"),
        enemyNode.getComponent("EnemyLevel2"),
        enemyNode.getComponent("BaseEnemy"),
      ];

      for (let component of enemyComponents) {
        if (component && component.isBoss === true) {
          isBoss = true;
          break;
        }
      }

      if (isBoss) {
        this.onBossDefeated();
        return; // Don't update normal score UI for boss
      }
    }

    console.log("New total score:", this.totalScore);

    // Normal enemy - update score UI
    if (this.uiController) {
      this.uiController.updateScore(this.totalScore);
    }
  },

  onBossDefeated() {
    if (this.bossDefeated) {
      return; // Prevent multiple calls
    }

    this.bossDefeated = true;
    this.totalScore += 1000; // Bonus score for defeating boss
    console.log("Boss defeated! Bonus score added. Total:", this.totalScore);
    this.onStageComplete();
  },

  onPlayerDeath() {
    this.isGameActive = false;

    if (this.uiController) {
      this.uiController.showResultPanel(false); // Game over
    }
  },

  onStageComplete() {
    console.log(
      "Stage completion triggered, current game state:",
      this.isGameActive
    );

    if (!this.isGameActive) {
      console.log("Game already inactive, skipping completion");
      return; // Prevent multiple calls
    }

    this.isGameActive = false;

    // Stop enemy spawning
    if (this.enemyManagerComponent) {
      this.enemyManagerComponent.stopSpawning();
    }

    console.log("Showing victory panel with score:", this.totalScore);

    // Show victory
    if (this.uiController) {
      this.uiController.showResultPanel(true); // Victory
    } else {
      console.error("UI Controller not found when trying to show result panel");
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

  isBossSpawned() {
    return this.bossSpawned;
  },

  isBossDefeated() {
    return this.bossDefeated;
  },
});
