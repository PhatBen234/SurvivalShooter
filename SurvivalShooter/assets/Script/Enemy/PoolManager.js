// PoolManager.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        enemyLv1Prefab: [cc.Prefab],
        enemyLv2Prefab: [cc.Prefab],
        bossPrefab: cc.Prefab,
        damageLabelPrefab: cc.Prefab,
        fireballPrefab: cc.Prefab,
        icePrefab: cc.Prefab,
        lightningPrefab: cc.Prefab,
    },
    
    onLoad() {
        this.pools = {};
        this.initPools();
        
        // Singleton pattern
        cc.game.poolManager = this;
    },
    
    initPools() {
        // Tạo pool cho từng loại object
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.ENEMY_LV1, this.enemyLv1Prefab, 20);
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.ENEMY_LV2, this.enemyLv2Prefab, 15);
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.BOSS, this.bossPrefab, 5);
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.DAMAGE_LABEL, this.damageLabelPrefab, 30);
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_FIREBALL, this.fireballPrefab, 10);
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_ICE, this.icePrefab, 10);
        this.createPool(cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_LIGHTNING, this.lightningPrefab, 10);
    },
    
    createPool(tag, prefab, initialCount) {
        this.pools[tag] = new cc.NodePool();
        
        // Tạo sẵn một số object
        for (let i = 0; i < initialCount; i++) {
            let node = cc.instantiate(prefab);
            this.pools[tag].put(node);
        }
    },
    
    getFromPool(tag, prefab) {
        let node = null;
        if (this.pools[tag] && this.pools[tag].size() > 0) {
            node = this.pools[tag].get();
        } else {
            node = cc.instantiate(prefab);
        }
        return node;
    },
    
    putToPool(tag, node) {
        if (this.pools[tag]) {
            this.pools[tag].put(node);
        }
    }
});