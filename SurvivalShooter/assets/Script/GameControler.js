cc.Class({
    extends: cc.Component,

    properties: {
        enemyPrefab: cc.Prefab,
        player: cc.Node,
        spawnArea: cc.Node,
        maxEnemies: 10,
        spawnInterval: 3,

        countdownLabel: cc.Label, // Label đếm thời gian
        resultLabel: cc.Label,    // Label hiện YOU WIN / LOSE
    },

    onLoad () {
        this.currentEnemies = [];
        this.timer = 0;
        this.gameDuration = 60; // 60s
        this.gameEnded = false;

        this.schedule(this.spawnEnemy, this.spawnInterval);

        // Ẩn kết quả ban đầu
        if (this.resultLabel) {
            this.resultLabel.node.active = false;
        }
    },

    update(dt) {
        if (this.gameEnded) return;

        this.timer += dt;

        // Cập nhật label thời gian
        if (this.countdownLabel) {
            let timeLeft = Math.max(0, Math.floor(this.gameDuration - this.timer));
            this.countdownLabel.string = `Time: ${timeLeft}s`;

            // Đổi màu khi gần hết giờ
            if (timeLeft <= 10) {
                this.countdownLabel.node.color = cc.Color.RED;
            }
        }

        // Kiểm tra điều kiện kết thúc
        if (this.timer >= this.gameDuration) {
            this.endGame();
        }
    },

    spawnEnemy () {
        this.cleanUpEnemies();

        if (this.gameEnded) return;
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

    endGame() {
    this.gameEnded = true;

    // Dừng mọi schedule (bao gồm spawnEnemy)
    this.unscheduleAllCallbacks();

    // Xoá hoặc ẩn toàn bộ enemy còn lại
    this.cleanUpEnemies();
    this.currentEnemies.forEach(enemy => {
        if (enemy && enemy.isValid) {
            enemy.destroy(); // hoặc enemy.active = false;
        }
    });

    // Ẩn player (nếu muốn dừng hoàn toàn game)
    if (this.player && this.player.isValid) {
        this.player.active = false;
    }

    // Hiện kết quả cuối
    if (this.currentEnemies.length === 0) {
        this.showResult(true);  // YOU WIN
    } else {
        this.showResult(false); // YOU LOSE
    }
},


    showResult(isWin) {
        if (this.resultLabel) {
            this.resultLabel.node.active = true;
            this.resultLabel.string = isWin ? "🎉 YOU WIN!" : "😢 YOU LOSE!";
            this.resultLabel.node.color = isWin ? cc.Color.GREEN : cc.Color.RED;
        }
    }
});
