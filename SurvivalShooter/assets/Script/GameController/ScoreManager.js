// ScoreManager.js - Quản lý điểm số và phát hiện boss
cc.Class({
  extends: cc.Component,

  properties: {},

  onLoad() {
    // Register global reference
    cc.game.scoreManager = this;
  },

  // Called when enemy is destroyed
  onEnemyDestroyed(scorePoints, enemyNode) {
    if (!cc.game.gameStateManager) return;

    cc.game.gameStateManager.totalScore += scorePoints;

    // Boss detection in round 3
    if (enemyNode && cc.game.gameStateManager.currentRound === 3) {
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
        return; // Don't update normal score UI here
      }
    }

    // Normal enemy - update score UI
    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.updateScore(
        cc.game.gameStateManager.totalScore
      );
    }
  },

  onBossDefeated() {
    if (cc.game.gameStateManager.bossDefeated) {
      return; // Prevent multiple calls
    }

    cc.game.gameStateManager.bossDefeated = true;

    // Add bonus score for defeating boss
    cc.game.gameStateManager.totalScore += 1000;

    // Update UI with final score BEFORE ending game
    if (cc.game.gameManager?.uiController) {
      cc.game.gameManager.uiController.updateScore(
        cc.game.gameStateManager.totalScore
      );
    }

    // Stop boss music and restore stage music
    if (window.AudioManager) {
      window.AudioManager.onBossDefeated();
    }

    console.log(
      "Boss defeated, final score:",
      cc.game.gameStateManager.totalScore
    );

    // Delay stage completion to ensure UI updates first
    this.scheduleOnce(() => {
      cc.game.gameStateManager.onStageComplete();
    }, 0.1); // Small delay to ensure score UI updates
  },
});
