// EnemyLevel2.js
cc.Class({
    extends: require("EnemyLevel1"),
    
    properties: {
        maxHp: {
            default: 80,
            override: true
        },
        damage: {
            default: 15,
            override: true
        },
        speed: {
            default: 70,
            override: true
        },
        scoreValue: {
            default: 20,
            override: true
        },
        skillCooldown: 3.0, // 3 giây sử dụng skill một lần
        skillPrefabs: [cc.Prefab] // Mảng các skill prefab
    },
    
    onLoad() {
        this._super();
        this.skillTimer = 0;
        this.availableSkills = [
            cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_FIREBALL,
            cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_ICE,
            cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_LIGHTNING
        ];
    },
    
    update(dt) {
        this._super(dt);
        
        if (this.isDead) return;
        
        // Cập nhật skill timer
        this.skillTimer += dt;
        if (this.skillTimer >= this.skillCooldown) {
            this.useRandomSkill();
            this.skillTimer = 0;
        }
    },
    
    useRandomSkill() {
        if (this.availableSkills.length === 0) return;
        
        let randomIndex = Math.floor(Math.random() * this.availableSkills.length);
        let skillTag = this.availableSkills[randomIndex];
        
        this.castSkill(skillTag);
    },
    
    castSkill(skillTag) {
        let skillNode = null;
        let prefab = null;
        
        switch(skillTag) {
            case cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_FIREBALL:
                prefab = cc.game.poolManager.fireballPrefab;
                break;
            case cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_ICE:
                prefab = cc.game.poolManager.icePrefab;
                break;
            case cc.find("Constants").getComponent("Constants").POOL_TAG.SKILL_LIGHTNING:
                prefab = cc.game.poolManager.lightningPrefab;
                break;
        }
        
        if (prefab) {
            skillNode = cc.game.poolManager.getFromPool(skillTag, prefab);
            skillNode.parent = this.node.parent;
            skillNode.setPosition(this.node.getPosition());
            skillNode.getComponent("BaseSkill").init(this.player);
        }
    },
    
    returnToPool() {
        cc.game.poolManager.putToPool(
            cc.find("Constants").getComponent("Constants").POOL_TAG.ENEMY_LV2,
            this.node
        );
    }
});