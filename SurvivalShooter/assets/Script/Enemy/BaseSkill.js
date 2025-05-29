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
        // Override trong các subclass để thực hiện skill
        cc.warn("BaseSkill: execute() should be overridden in subclass");
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
        // Cleanup khi skill bị hủy
        this.unscheduleAllCallbacks();
    }
});