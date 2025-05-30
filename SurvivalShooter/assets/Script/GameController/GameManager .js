// GameManager.js - Main coordinator (Refactored)
cc.Class({
  extends: cc.Component,

  properties: {
    uiStageController: cc.Node,
    enemyManager: cc.Node,
    player: cc.Node,
    gameStateManager: cc.Node,
    scoreManager: cc.Node,
    audioController: cc.Node,
  },

  onLoad() {
    // Register global reference
    cc.game.gameManager = this;
  },

  start() {
    // Get references in start() to ensure other components are loaded
    if (this.uiStageController) {
      this.uiController =
        this.uiStageController.getComponent("UIStageController");
    }

    if (this.enemyManager) {
      this.enemyManagerComponent =
        this.enemyManager.getComponent("EnemyManager");
    }

    if (this.player) {
      this.playerScript = this.player.getComponent("PlayerModel");
    }

    // Get manager components
    if (this.gameStateManager) {
      this.gameState = this.gameStateManager.getComponent("GameStateManager");
    }

    if (this.scoreManager) {
      this.score = this.scoreManager.getComponent("ScoreManager");
    }

    if (this.audioController) {
      this.audio = this.audioController.getComponent("AudioController");
    }
  },

  // Delegation methods for backward compatibility
  getCurrentRound() {
    return cc.game.gameStateManager?.getCurrentRound() || 1;
  },

  getRoundTimer() {
    return cc.game.gameStateManager?.getRoundTimer() || 0;
  },

  getTotalScore() {
    return cc.game.gameStateManager?.getTotalScore() || 0;
  },

  isPlaying() {
    return cc.game.gameStateManager?.isPlaying() || false;
  },

  isBossSpawned() {
    return cc.game.gameStateManager?.isBossSpawned() || false;
  },

  isBossDefeated() {
    return cc.game.gameStateManager?.isBossDefeated() || false;
  },

  onEnemyDestroyed(scorePoints, enemyNode) {
    if (cc.game.scoreManager) {
      cc.game.scoreManager.onEnemyDestroyed(scorePoints, enemyNode);
    }
  },

  // Cleanup
  onDestroy() {
    console.log("GameManager destroyed");
  },
});
