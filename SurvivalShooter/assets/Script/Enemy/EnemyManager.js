cc.Class({
  extends: cc.Component,

  properties: {
    spawnInterval: 3,
    enemiesPerWave: 5,
    enemyLv1Prefabs: [cc.Prefab],
    enemyLv2Prefabs: [cc.Prefab],
    bossEnemyPrefab: cc.Prefab,
    player: cc.Node,
    canvas: cc.Node,
  },

  onLoad() {
    this.timer = 0;
    this.currentRound = 1;
    this.isActive = false;
    this.bossSpawned = false;
    this.initRoundSettings();
    cc.game.enemyManager = this;
  },

  initRoundSettings() {
    this.roundSettings = {
      1: {
        spawnInterval: 3,
        enemiesPerWave: 5,
        allowLv1: true,
        allowLv2: false,
        allowBoss: false,
      },
      2: {
        spawnInterval: 2.5,
        enemiesPerWave: 7,
        allowLv1: true,
        allowLv2: true,
        allowBoss: false,
      },
      3: {
        spawnInterval: 2,
        enemiesPerWave: 10,
        allowLv1: true,
        allowLv2: true,
        allowBoss: true,
      },
    };
  },

  update(dt) {
    if (!this.isActive || !cc.game.gameManager?.isPlaying()) return;

    this.timer += dt;
    if (this.timer >= this.spawnInterval) {
      this.spawnWave();
      this.timer = 0;
    }
  },

  setCurrentRound(roundNumber) {
    this.currentRound = roundNumber;
    this.isActive = true;
    this.bossSpawned = false;

    const settings = this.roundSettings[roundNumber];
    if (settings) {
      this.spawnInterval = settings.spawnInterval;
      this.enemiesPerWave = settings.enemiesPerWave;
    }
  },

  spawnWave() {
    if (!this.canvas) return;

    const settings = this.roundSettings[this.currentRound];
    if (!settings) return;

    let enemiesToSpawn = this.enemiesPerWave;
    if (this.currentRound === 3 && this.bossSpawned) {
      enemiesToSpawn = Math.floor(this.enemiesPerWave * 0.6);
    }

    for (let i = 0; i < enemiesToSpawn; i++) {
      this.spawnSingleEnemy();
    }
  },

  forceBossSpawn() {
    if (!this.bossSpawned && this.currentRound === 3) {
      this.spawnBoss();
      this.bossSpawned = true;
    }
  },

  spawnSingleEnemy() {
    const settings = this.roundSettings[this.currentRound];
    if (!settings) return;

    let availablePrefabs = [];
    if (settings.allowLv1 && this.enemyLv1Prefabs?.length > 0) {
      availablePrefabs = availablePrefabs.concat(this.enemyLv1Prefabs);
    }
    if (settings.allowLv2 && this.enemyLv2Prefabs?.length > 0) {
      availablePrefabs = availablePrefabs.concat(this.enemyLv2Prefabs);
    }

    if (availablePrefabs.length === 0) return;

    const prefab =
      availablePrefabs[Math.floor(Math.random() * availablePrefabs.length)];
    if (!prefab) return;

    const enemy = cc.instantiate(prefab);
    if (!enemy) return;

    enemy.name = `Enemy_${this.currentRound}_${Date.now()}`;
    enemy.setPosition(this.getRandomSpawnPosition());
    this.canvas.addChild(enemy);

    const enemyComponent =
      enemy.getComponent("BaseEnemy") ||
      enemy.getComponent("EnemyBase") ||
      enemy.getComponent("Enemy");

    if (enemyComponent && this.player) {
      enemyComponent.setTarget?.(this.player) ||
        (enemyComponent.target = this.player);

      if (this.currentRound > 1 && enemyComponent.scaleDifficulty) {
        enemyComponent.scaleDifficulty(1 + (this.currentRound - 1) * 0.3);
      }
    }
  },

  spawnBoss() {
    if (!this.bossEnemyPrefab) return;

    const boss = cc.instantiate(this.bossEnemyPrefab);
    if (!boss) return;

    boss.name = "FinalBoss";
    boss.setPosition(cc.v2(0, 100));
    this.canvas.addChild(boss);

    const bossComponent =
      boss.getComponent("BossEnemy") ||
      boss.getComponent("BaseEnemy") ||
      boss.getComponent("EnemyBase") ||
      boss.getComponent("EnemyLevel2");

    if (bossComponent && this.player) {
      bossComponent.setTarget?.(this.player) ||
        (bossComponent.target = this.player);
      bossComponent.isBoss = true;
      bossComponent.scaleDifficulty?.(2.0);
    }

    this.spawnInterval *= 1.5;
  },

  getRandomSpawnPosition() {
    if (!this.canvas) return cc.v2(0, 0);

    const canvasSize = this.canvas.getContentSize();
    const side = Math.floor(Math.random() * 4);
    const positions = [
      cc.v2(
        Math.random() * canvasSize.width - canvasSize.width / 2,
        canvasSize.height / 2
      ),
      cc.v2(
        canvasSize.width / 2,
        Math.random() * canvasSize.height - canvasSize.height / 2
      ),
      cc.v2(
        Math.random() * canvasSize.width - canvasSize.width / 2,
        -canvasSize.height / 2
      ),
      cc.v2(
        -canvasSize.width / 2,
        Math.random() * canvasSize.height - canvasSize.height / 2
      ),
    ];

    return positions[side];
  },

  stopSpawning() {
    this.isActive = false;
  },
  startSpawning() {
    this.isActive = true;
  },

  getCurrentEnemyCount() {
    return this.canvas.children.filter(
      (child) => child.name.includes("Enemy") || child.name.includes("Boss")
    ).length;
  },

  getBossCount() {
    return this.canvas.children.filter((child) => child.name.includes("Boss"))
      .length;
  },

  clearAllEnemies() {
    const enemies = this.canvas.children.filter(
      (child) => child.name.includes("Enemy") || child.name.includes("Boss")
    );
    enemies.forEach((enemy) => enemy.isValid && enemy.destroy());
  },
});
