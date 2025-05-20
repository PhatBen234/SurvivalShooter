cc.Class({
    extends: cc.Component,

    properties: {
        speed: 600,
        targetPos: cc.v2()
    },

    fallTo(target) {
        this.targetPos = target;
    },

    update(dt) {
        if (!this.targetPos) return;
        let dir = this.targetPos.sub(this.node.position).normalize();
        this.node.x += dir.x * this.speed * dt;
        this.node.y += dir.y * this.speed * dt;

        if (this.node.position.fuzzyEquals(this.targetPos, 10)) {
            // Gây sát thương / nổ
            this.node.destroy();
        }
    }
});
