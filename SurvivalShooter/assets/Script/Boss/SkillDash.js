cc.Class({
    extends: cc.Component,

    properties: {
        speed: 1000,
        duration: 0.3
    },

    dash() {
        let boss = this.node.parent;
        let dir = cc.v2(Math.random() - 0.5, Math.random() - 0.5).normalize(); // hướng random
        let target = boss.position.add(dir.mul(200));
        boss.runAction(cc.sequence(
            cc.moveTo(this.duration, target),
            cc.callFunc(() => {
                // kết thúc dash có thể reset animation
            })
        ));
    }
});
