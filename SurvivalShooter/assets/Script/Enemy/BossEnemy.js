cc.Class({
    extends: require("EnemyLevel2"),

    properties: {
        hpBar: cc.ProgressBar,
    },

    onLoad() {
        this._super(); // Call the parent class's onLoad method

        // Lưu lại scale gốc của HP bar
        if (this.hpBar) {
            this.originalHpBarScaleX = this.hpBar.node.scaleX;
        }

        this.updateHpBar();
    },

    update(dt) {
        this._super(dt); // Call the parent class's update method

        // Keep HP bar upright based on boss sprite's scale
        this.keepHpBarUpright();
    },

    //Override the base class method to update HP bar
    takeDamage(amount, isCritical = false) {
        this._super(amount, isCritical);
        this.updateHpBar();
    },

    updateHpBar() {
        if (this.hpBar && this.maxHp > 0) {
            // Tính toán tỷ lệ HP còn lại (0.0 - 1.0)
            let hpRatio = Math.max(0, this.hp / this.maxHp);
            this.hpBar.progress = hpRatio;
        }
    },

    keepHpBarUpright() {
        if (!this.hpBar) return;
        
        // Nếu boss sprite bị flip (scaleX âm), thì flip ngược lại HP bar
        if (this.node.scaleX < 0) {
            this.hpBar.node.scaleX = -Math.abs(this.originalHpBarScaleX);
        } else {
            this.hpBar.node.scaleX = Math.abs(this.originalHpBarScaleX);
        }
    },
});