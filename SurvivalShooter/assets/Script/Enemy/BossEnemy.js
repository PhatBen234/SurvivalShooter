// Boss.js
cc.Class({
    extends: require("EnemyLevel2"),
    
    properties: {
        maxHp: {
            default: 300,
            override: true
        },
        damage: {
            default: 30,
            override: true
        },
        speed: {
            default: 50,
            override: true
        },
        scoreValue: {
            default: 100,
            override: true
        },
        skillCooldown: {
            default: 2.0, // Boss sử dụng skill thường xuyên hơn
            override: true
        }
    },
    
    returnToPool() {
        cc.game.poolManager.putToPool(
            cc.find("Constants").getComponent("Constants").POOL_TAG.BOSS,
            this.node
        );
    }
});