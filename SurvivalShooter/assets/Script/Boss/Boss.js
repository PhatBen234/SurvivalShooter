cc.Class({
    extends: cc.Component,

    properties: {
        anim: cc.Animation,
        skillShoot: cc.Component,
        skillDash: cc.Component,
        skillMeteor: cc.Component,
    },

    start() {
        this.schedule(this.castSkill, 5); // 5s dùng 1 skill ngẫu nhiên
    },

    castSkill() {
        const skillId = Math.floor(Math.random() * 3);
        switch (skillId) {
            case 0:
                this.anim.play("FinalBossIdle");
                this.skillShoot.shoot();
                break;
            case 1:
                this.anim.play("dFinalBossIdleash");
                this.skillDash.dash();
                break;
            case 2:
                this.anim.play("FinalBossIdle");
                this.skillMeteor.cast();
                break;
        }
    }
});
