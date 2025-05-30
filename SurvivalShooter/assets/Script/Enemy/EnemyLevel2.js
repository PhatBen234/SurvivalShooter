cc.Class({
    extends: require("BaseEnemy"),

    properties: {
        skillPrefabs: [cc.Prefab], // Gán từ Inspector
        skillInterval: 5,          // Thời gian giữa các kỹ năng (cooldown)
    },

    onLoad() {
        this._super();
        this.nextSkillTime = 0;
    },

    update(dt) {
        this._super(dt);

        this.nextSkillTime -= dt;
        if (this.nextSkillTime <= 0 && this.skillPrefabs.length > 0) {
            this.castRandomSkill();
            this.nextSkillTime = this.skillInterval;
        }
    },

    castRandomSkill() {
        if (!this.skillPrefabs || this.skillPrefabs.length === 0) {
            cc.error("[EnemyLevel2] Không có skillPrefabs!");
            return;
        }

        let prefab = this.skillPrefabs[Math.floor(Math.random() * this.skillPrefabs.length)];
        
        if (!prefab) {
            cc.error("[EnemyLevel2] skillPrefab là null!");
            return;
        }

        let skill = cc.instantiate(prefab);
        skill.setPosition(this.node.position);
        this.node.parent.addChild(skill);

        // Thử tìm component skill khác nhau
        let skillComponent = skill.getComponent("SkillShoot") || 
                            skill.getComponent("SkillDash");
        
        if (skillComponent && skillComponent.init) {
            skillComponent.init(this.node);
            cc.log("[EnemyLevel2] Đã cast skill thành công:", skill.name);
        } else {
            cc.error("[EnemyLevel2] Không tìm thấy component skill hoặc method init!");
            // Vẫn giữ skill node, có thể nó tự hoạt động
        }
    },
});
//Todo: Skill quái chưa random và khá đồng thời, làm sao để giảm lượng skill gây ra để tránh lag máy    