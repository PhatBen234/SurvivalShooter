cc.Class({
    extends: cc.Component,

    properties: {
        speed: 400,
        direction: 0,
    },

    init(pos, angle) {
        this.node.setPosition(pos);
        this.direction = angle;
    },

    update(dt) {
        let rad = cc.misc.degreesToRadians(this.direction);
        let dx = Math.cos(rad) * this.speed * dt;
        let dy = Math.sin(rad) * this.speed * dt;
        this.node.x += dx;
        this.node.y += dy;
    }
});
