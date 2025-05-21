cc.Class({
    extends: cc.Component,

    properties: {
        bulletPrefab: cc.Prefab,
        shootCount: 36
    },

    shoot() {
        for (let i = 0; i < this.shootCount; i++) {
            let bullet = cc.instantiate(this.bulletPrefab);
            this.node.parent.addChild(bullet);
            let angle = (360 / this.shootCount) * i;
            bullet.getComponent('Bullet').init(this.node.getPosition(), angle);
        }
    }
});
