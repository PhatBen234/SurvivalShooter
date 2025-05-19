cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        currentHp: 100,
        hpLabel: cc.Label // Label để hiển thị máu
    },

    onLoad () {
        this.currentHp = this.maxHp;
        this.updateHpLabel();
    },

    takeDamage (amount) {
        this.currentHp -= amount;
        if (this.currentHp < 0) this.currentHp = 0;
        this.updateHpLabel();
    },

    updateHpLabel () {
        if (this.hpLabel) {
            this.hpLabel.string = "HP: " + this.currentHp;
        }
    }
});
