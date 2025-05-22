cc.Class({
  extends: cc.Component,

  properties: {
    enemyPrefab: cc.Prefab,
    enemyBatPrefab: cc.Prefab, // THÊM prefab thứ 2

    player: cc.Node,
    spawnArea: cc.Node,
    maxEnemies: 10,
    spawnInterval: 3,

    countdownLabel: cc.Label,
    resultLabel: cc.Label,
  },

  onLoad() {
    this.currentEnemies = [];
    this.timer = 0;
    this.gameDuration = 60;
    this.timeUp = false;
    this.gameEnded = false;

    this.schedule(this.spawnEnemy, this.spawnInterval);

    if (this.resultLabel) {
      this.resultLabel.node.active = false;
    }

    if (this.player) {
      this.playerScript = this.player.getComponent("PlayerStage3");
    }
  },

  update(dt) {
    if (this.gameEnded) return;

    this.timer += dt;

    if (this.countdownLabel) {
      let timeLeft = Math.max(0, Math.floor(this.gameDuration - this.timer));
      this.countdownLabel.string = `Time: ${timeLeft}s`;
      if (timeLeft <= 10) {
        this.countdownLabel.node.color = cc.Color.RED;
      }
    }

    if (!this.timeUp && this.timer >= this.gameDuration) {
      this.timeUp = true;
      this.unschedule(this.spawnEnemy);
    }

    this.checkGameState();
  },

  spawnEnemy() {
    this.cleanUpEnemies();

    if (this.gameEnded || this.timeUp) return;
    if (this.currentEnemies.length >= this.maxEnemies) return;

    // Spawn Enemy thường
    if (this.currentEnemies.length < this.maxEnemies) {
      this.spawnOneEnemy(this.enemyPrefab);
    }

    // Spawn EnemyBat
    if (this.currentEnemies.length < this.maxEnemies) {
      this.spawnOneEnemy(this.enemyBatPrefab);
    }
  },

  spawnOneEnemy(prefab) {
    let areaSize = this.spawnArea.getContentSize();
    let randomX = (Math.random() - 0.5) * areaSize.width;
    let randomY = (Math.random() - 0.5) * areaSize.height;

    let newEnemy = cc.instantiate(prefab);
    newEnemy.setPosition(cc.v2(randomX, randomY));
    this.spawnArea.addChild(newEnemy);

    // Gọi init đúng component Enemy hoặc EnemyBat
    let enemyScript =
      newEnemy.getComponent("Enemy") || newEnemy.getComponent("EnemyBat");
    if (enemyScript && typeof enemyScript.init === "function") {
      enemyScript.init(this.player);
    }

    this.currentEnemies.push(newEnemy);
  },

  cleanUpEnemies() {
    this.currentEnemies = this.currentEnemies.filter((e) => e && e.isValid);
  },

  checkGameState() {
    this.cleanUpEnemies();

    if (this.playerScript && this.playerScript.currentHp <= 0) {
      this.endGame(false);
      return;
    }

    if (this.timeUp && this.currentEnemies.length === 0) {
      this.endGame(true);
    }
  },

  endGame(isWin) {
    this.gameEnded = true;
    this.unscheduleAllCallbacks();

    if (this.player && this.player.isValid) {
      this.player.active = false;
    }

    this.showResult(isWin);
  },

  showResult(isWin) {
    if (this.resultLabel) {
      this.resultLabel.node.active = true;
      this.resultLabel.string = isWin ? "🎉 YOU WIN!" : "😢 YOU LOSE!";
      this.resultLabel.node.color = isWin ? cc.Color.GREEN : cc.Color.RED;
    }
  },
});
