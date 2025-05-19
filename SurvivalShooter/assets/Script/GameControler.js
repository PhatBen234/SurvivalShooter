cc.Class({
    extends: cc.Component,

    properties: {
        enemyPrefab: cc.Prefab,
        player: cc.Node,
        spawnArea: cc.Node,
        maxEnemies: 10,
        spawnInterval: 3,

        countdownLabel: cc.Label,
        resultLabel: cc.Label,
    },

    onLoad () {
        this.currentEnemies = [];
        this.timer = 0;
        this.gameDuration = 60;
        this.timeUp = false;
        this.gameEnded = false;

        this.schedule(this.spawnEnemy, this.spawnInterval);

        if (this.resultLabel) {
            this.resultLabel.node.active = false;
        }

        // Theo dõi HP của player
        if (this.player) {
            this.playerScript = this.player.getComponent("Player");
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
            this.unschedule(this.spawnEnemy); // Ngưng spawn
        }

        // Luôn kiểm tra trạng thái win/lose
        this.checkGameState();
    },

    spawnEnemy () {
        this.cleanUpEnemies();

        if (this.gameEnded || this.timeUp) return;
        if (this.currentEnemies.length >= this.maxEnemies) return;

        let areaSize = this.spawnArea.getContentSize();
        let randomX = (Math.random() - 0.5) * areaSize.width;
        let randomY = (Math.random() - 0.5) * areaSize.height;

        let newEnemy = cc.instantiate(this.enemyPrefab);
        newEnemy.setPosition(cc.v2(randomX, randomY));
        this.spawnArea.addChild(newEnemy);

        let enemyScript = newEnemy.getComponent("Enemy");
        if (enemyScript) {
            enemyScript.init(this.player);
        }

        this.currentEnemies.push(newEnemy);
    },

    cleanUpEnemies () {
        this.currentEnemies = this.currentEnemies.filter(e => e && e.isValid);
    },

    checkGameState() {
        this.cleanUpEnemies();

        // Nếu player chết
        if (this.playerScript && this.playerScript.currentHp <= 0) {
            this.endGame(false); // YOU LOSE
            return;
        }

        // Nếu hết giờ và tiêu diệt hết enemy → thắng
        if (this.timeUp && this.currentEnemies.length === 0) {
            this.endGame(true); // YOU WIN
        }
    },

    endGame(isWin) {
        this.gameEnded = true;
        this.unscheduleAllCallbacks();

        // Ẩn player
        if (this.player && this.player.isValid) {
            this.player.active = false;
        }

        // Hiện kết quả cuối
        this.showResult(isWin);
    },

    showResult(isWin) {
        if (this.resultLabel) {
            this.resultLabel.node.active = true;
            this.resultLabel.string = isWin ? "🎉 YOU WIN!" : "😢 YOU LOSE!";
            this.resultLabel.node.color = isWin ? cc.Color.GREEN : cc.Color.RED;
        }
    }
});
