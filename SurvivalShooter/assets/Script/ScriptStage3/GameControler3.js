cc.Class({
  extends: cc.Component,

  properties: {
    enemyPrefab: cc.Prefab,
    enemyBatPrefab: cc.Prefab,
    finalBossPrefab: cc.Prefab, // ✅ Thêm Final Boss

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
    this.bossSpawned = false;
    this.bossNode = null;

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

    const timeLeft = Math.max(0, Math.floor(this.gameDuration - this.timer));

    // Cập nhật đồng hồ
    if (this.countdownLabel) {
      this.countdownLabel.string = `Time: ${timeLeft}s`;
      if (timeLeft <= 10) {
        this.countdownLabel.node.color = cc.Color.RED;
      }
    }

    // Spawn boss nếu còn 10s và chưa gọi
    if (!this.bossSpawned && timeLeft <= 10) {
      this.spawnBoss();
    }

    // Đánh dấu hết giờ, ngưng spawn thường
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

    this.spawnOneEnemy(this.enemyPrefab);
    if (this.currentEnemies.length < this.maxEnemies) {
      this.spawnOneEnemy(this.enemyBatPrefab);
    }
  },

  spawnOneEnemy(prefab) {
    const areaSize = this.spawnArea.getContentSize();
    const randomX = (Math.random() - 0.5) * areaSize.width;
    const randomY = (Math.random() - 0.5) * areaSize.height;

    const newEnemy = cc.instantiate(prefab);
    newEnemy.setPosition(cc.v2(randomX, randomY));
    this.spawnArea.addChild(newEnemy);

    const script =
      newEnemy.getComponent("Enemy") ||
      newEnemy.getComponent("EnemyBat") ||
      newEnemy.getComponent("FinalBoss"); // ✅ Boss cũng có init

    if (script && typeof script.init === "function") {
      script.init(this.player);
    }

    this.currentEnemies.push(newEnemy);

    // Ghi lại boss node để kiểm tra sau này
    if (prefab === this.finalBossPrefab) {
      this.bossNode = newEnemy;
    }
  },

  spawnBoss() {
    this.bossSpawned = true;
    this.spawnOneEnemy(this.finalBossPrefab);
    cc.log("[GameController] Final Boss has appeared!");
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

    // Nếu boss đã spawn và đã chết => win
    if (this.bossSpawned && (!this.bossNode || !this.bossNode.isValid)) {
      this.endGame(true);
      return;
    }

    // Nếu chưa có boss, thì game chỉ thắng nếu hết giờ và không còn enemy
    if (!this.bossSpawned && this.timeUp && this.currentEnemies.length === 0) {
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
