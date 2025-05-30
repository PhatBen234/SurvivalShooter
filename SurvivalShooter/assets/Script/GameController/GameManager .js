cc.Class({
  extends: cc.Component,

  properties: {
    uiStageController: cc.Node,
    enemyManager: cc.Node,
    player: cc.Node,

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
    // Game state variables
    this.currentRound = 1;
    this.roundTimer = 90;
    this.totalScore = 0;
    this.isGameActive = false;
    this.bossSpawned = false;
    this.bossDefeated = false;

    // Round settings
    this.ROUND_1_TIME = 1;
    this.ROUND_2_TIME = 1;
    this.ROUND_3_TIME = -1;

    // Register global reference
    cc.game.gameManager = this;

    // Setup audio for current stage
    this.setupStageAudio();
  },

  setupStageAudio() {
    if (!window.AudioManager) {
      console.warn("AudioManager not found in GameManager");
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

    // Start game after getting references
    this.startGame();
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

    // Trigger boss music through AudioManager
    if (window.AudioManager) {
      window.AudioManager.onBossSpawn();
    }

    console.log("Boss spawned and boss music started");
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
        break;
    }

    if (this.enemyManagerComponent) {
      this.enemyManagerComponent.setCurrentRound(roundNumber);
    }

    this.updateRoundUI();
  },

  nextRound() {
    if (this.currentRound < 3) {
      this.startRound(this.currentRound + 1);
    }
  },

  // Called when enemy is destroyed
  onEnemyDestroyed(scorePoints, enemyNode) {
    this.totalScore += scorePoints;

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
        return; 
      }
    }

    if (this.uiController) {
      this.uiController.updateScore(this.totalScore);
    }
  },

  onBossDefeated() {
    if (this.bossDefeated) {
      return;
    }

    this.bossDefeated = true;
    this.totalScore += 1000;

    //Dừng nhạc boss
    if (window.AudioManager) {
      window.AudioManager.onBossDefeated();
    }

    this.onStageComplete();
  },

  onPlayerDeath() {
    this.isGameActive = false;

    if (this.uiController) {
      this.uiController.showResultPanel(false);
    }
  },

  onStageComplete() {
    this.isGameActive = false;

    //Sinh quái
    if (this.enemyManagerComponent) {
      this.enemyManagerComponent.stopSpawning();
    }

    //Hiện victory UI
    if (this.uiController) {
      this.uiController.showResultPanel(true);
    }
  },

  //UI Update
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

  isBossSpawned() {
    return this.bossSpawned;
  },

  isBossDefeated() {
    return this.bossDefeated;
  },

  // Cleanup
  onDestroy() {
  },
});
