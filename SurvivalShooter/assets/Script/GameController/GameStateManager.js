// GameStateManager.js - Quản lý trạng thái và logic game
cc.Class({
  extends: cc.Component,

  properties: {},

  onLoad() {
    // Game state variables
    this.currentRound = 1;
    this.roundTimer = 90;
    this.totalScore = 0;
    this.isGameActive = false;
    this.bossSpawned = false;
    this.bossDefeated = false;

    // Round settings
    this.ROUND_1_TIME = 60;
    this.ROUND_2_TIME = 60;
    this.ROUND_3_TIME = -1;

    // Register global reference
    cc.game.gameStateManager = this;
  },

  start() {
    this.startGame();
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
        break;
    }

    if (cc.game.enemyManager) {
      cc.game.enemyManager.setCurrentRound(roundNumber);
    }

    this.updateRoundUI();
  },

  nextRound() {
    if (this.currentRound < 3) {
      this.startRound(this.currentRound + 1);
    }
  },

  spawnBossNow() {
    if (cc.game.enemyManager) {
      cc.game.enemyManager.forceBossSpawn();
    }

    // Trigger boss music through AudioManager
    if (window.AudioManager) {
      window.AudioManager.onBossSpawn();
    }

    console.log("Boss spawned and boss music started");
  },

  checkPlayerDeath() {
    const player = cc.game.gameManager?.player;
    const playerScript = player?.getComponent("PlayerModel");

    if (playerScript && playerScript._currentHp <= 0) {
      this.onPlayerDeath();
    }
  },

  onPlayerDeath() {
    this.isGameActive = false;

    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.showResultPanel(false); // Game over
    }
  },

  onStageComplete() {
    this.isGameActive = false;

    // Stop enemy spawning
    if (cc.game.enemyManager) {
      cc.game.enemyManager.stopSpawning();
    }

    // Show victory
    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.showResultPanel(true); // Victory
    }
  },

  // UI Update methods
  updateUI() {
    this.updateRoundUI();
    this.updateTimerUI();
    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.updateScore(this.totalScore);
    }
  },

  updateRoundUI() {
    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.updateRound(this.currentRound);
    }
  },

  updateTimerUI() {
    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.updateTimer(this.roundTimer);
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

  isBossSpawned() {
    return this.bossSpawned;
  },

  isBossDefeated() {
    return this.bossDefeated;
  },
});
