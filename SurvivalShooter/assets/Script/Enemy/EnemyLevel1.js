// EnemyLevel1.js
cc.Class({
    extends: require("BaseEnemy"),
    
    properties: {
        maxHp: {
            default: 50,
            override: true
        },
        damage: {
            default: 10,
            override: true
        },
        speed: {
            default: 80,
            override: true
        },
        scoreValue: {
            default: 10,
            override: true
        }
    },
    
    returnToPool() {
        cc.game.poolManager.putToPool(
            cc.find("Constants").getComponent("Constants").POOL_TAG.ENEMY_LV1,
            this.node
        );
    }
});