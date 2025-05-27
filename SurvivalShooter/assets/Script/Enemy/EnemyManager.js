// EnemyManager.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        playerNode: cc.Node,
        spawnAreaMin: cc.v2(-400, -300),
        spawnAreaMax: cc.v2(400, 300),
        minDistanceFromPlayer: 100,
        enemiesPerWave: 10
    },
    
    onLoad() {
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // Spawn mỗi 2 giây
        this.currentRound = 1;
        
        cc.game.enemyManager = this;
    },
    
    update(dt) {
        if (!cc.game.gameManager.isPlaying()) return;
        
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemyWave();
            this.spawnTimer = 0;
        }
    },
    
    spawnEnemyWave() {
        for (let i = 0; i < this.enemiesPerWave; i++) {
            let spawnPos = this.getValidSpawnPosition();
            let enemyType = this.getEnemyTypeForCurrentRound();
            this.spawnEnemy(enemyType, spawnPos);
        }
    },
    
    getValidSpawnPosition() {
        let attempts = 0;
        let maxAttempts = 10;
        let spawnPos;
        
        do {
            spawnPos = cc.v2(
                this.spawnAreaMin.x + Math.random() * (this.spawnAreaMax.x - this.spawnAreaMin.x),
                this.spawnAreaMin.y + Math.random() * (this.spawnAreaMax.y - this.spawnAreaMin.y)
            );
            attempts++;
        } while (
            cc.Vec2.distance(spawnPos, this.playerNode.getPosition()) < this.minDistanceFromPlayer &&
            attempts < maxAttempts
        );
        
        return spawnPos;
    },
    
    getEnemyTypeForCurrentRound() {
        switch(this.currentRound) {
            case 1:
                return cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_1;
            case 2:
                return Math.random() < 0.7 ? 
                    cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_1 : 
                    cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_2;
            case 3:
                let rand = Math.random();
                if (rand < 0.1) return cc.find("Constants").getComponent("Constants").ENEMY_TYPE.BOSS;
                else if (rand < 0.5) return cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_2;
                else return cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_1;
            default:
                return cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_1;
        }
    },
    
    spawnEnemy(enemyType, position) {
        let enemy = null;
        let poolTag = "";
        let prefab = null;
        
        switch(enemyType) {
            case cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_1:
                poolTag = cc.find("Constants").getComponent("Constants").POOL_TAG.ENEMY_LV1;
                prefab = cc.game.poolManager.enemyLv1Prefab;
                break;
            case cc.find("Constants").getComponent("Constants").ENEMY_TYPE.LEVEL_2:
                poolTag = cc.find("Constants").getComponent("Constants").POOL_TAG.ENEMY_LV2;
                prefab = cc.game.poolManager.enemyLv2Prefab;
                break;
            case cc.find("Constants").getComponent("Constants").ENEMY_TYPE.BOSS:
                poolTag = cc.find("Constants").getComponent("Constants").POOL_TAG.BOSS;
                prefab = cc.game.poolManager.bossPrefab;
                break;
        }
        
        if (prefab) {
            enemy = cc.game.poolManager.getFromPool(poolTag, prefab);
            enemy.parent = this.node;
            enemy.setPosition(position);
            enemy.getComponent("BaseEnemy").init(this.playerNode);
        }
    },
    
    setCurrentRound(round) {
        this.currentRound = round;
    }
});