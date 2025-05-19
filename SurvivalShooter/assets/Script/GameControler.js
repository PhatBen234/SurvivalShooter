cc.Class({
    extends: cc.Component,

    properties: {
        enemyPrefab: cc.Prefab,
        player: cc.Node,
        spawnArea: cc.Node, // thường là Canvas
        maxEnemies: 10,
        spawnInterval: 3
    },

    onLoad () {
        this.currentEnemies = [];
        this.schedule(this.spawnEnemy, this.spawnInterval);
    },

    spawnEnemy () {
        // Giới hạn số lượng enemy
        this.cleanUpEnemies();
        if (this.currentEnemies.length >= this.maxEnemies) return;

        // Tạo vị trí ngẫu nhiên trong Canvas
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
    }
});
