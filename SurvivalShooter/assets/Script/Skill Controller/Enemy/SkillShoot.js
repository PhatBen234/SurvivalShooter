cc.Class({
    extends: require('BaseSkill'),

    properties: {
        bulletPrefab: cc.Prefab,
        shootCount: 36,
    },

    execute() {
        this.shoot();
    },

    shoot() {
        if (!this.bulletPrefab) {
            this.destroySkill();
            return;
        }
     
        // Lấy vị trí bắn từ owner (enemy/boss)
        let shootPos = this.owner ? this.owner.position : this.node.position;
        
        for (let i = 0; i < this.shootCount; i++) {
            let bullet = cc.instantiate(this.bulletPrefab);
            this.node.parent.addChild(bullet);
            
            // Tính góc bắn tỏa đều xung quanh với góc 360 độ
            let angle = (360 / this.shootCount) * i;
            let bulletComponent = bullet.getComponent('Bullet');
            
            if (bulletComponent) {
                // Truyền damage và speed từ BaseSkill sang bullet
                bulletComponent.init(shootPos, angle, this.damage, this.speed);
            }
        }

        this.destroySkill();
    }
});