cc.Class({
    extends: cc.Component,

    properties: {
        damage: 20,
        speed: 300,
    },

    init(owner) {
        this.owner = owner;
        // Gọi hàm execute sau khi init
        this.execute();
    },

    execute() {
    },

    destroySkill() {
        // Hủy skill node an toàn
        this.scheduleOnce(() => {
            if (this.node && this.node.isValid) {
                this.node.destroy();
            }
        }, 0.1);
    },

    onDestroy() {
        this.unscheduleAllCallbacks();
    }
});