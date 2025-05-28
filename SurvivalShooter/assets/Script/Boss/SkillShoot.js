// cc.Class({
//     extends: cc.Component,

//     properties: {
//         bulletPrefab: cc.Prefab,
//         shootCount: 36,
//         damage: 20,
//         speed: 300,
//     },

//     init(owner) {
//         this.owner = owner;
//         // Tự động bắn khi được khởi tạo
//         this.shoot();
//     },

//     shoot() {
        
//         for (let i = 0; i < this.shootCount; i++) {
//             if (!this.bulletPrefab) {
//                 return;
//             }

//             let bullet = cc.instantiate(this.bulletPrefab);
//             this.node.parent.addChild(bullet);
            
//             let angle = (360 / this.shootCount) * i;
//             let bulletComponent = bullet.getComponent('Bullet');
            
//             if (bulletComponent) {
//                 // Truyền damage từ skill sang bullet
//                 bulletComponent.damage = this.damage;
//                 bulletComponent.init(this.node.getPosition(), angle);
//             } 
//         }

//         // Tự hủy skill sau khi bắn xong
//         this.scheduleOnce(() => {
//             if (this.node && this.node.isValid) {
//                 this.node.destroy();
//             }
//         }, 0.1);
//     }
// });

cc.Class({
    extends: require('BaseSkill'),

    properties: {
        bulletPrefab: cc.Prefab,
        shootCount: 36,
    },

    execute() {
        // Override từ BaseSkill để thực hiện skill bắn
        this.shoot();
    },

    shoot() {
        if (!this.bulletPrefab) {
            cc.warn("[SkillShoot] Bullet prefab not found");
            this.destroySkill();
            return;
        }

        cc.log(`[SkillShoot] Bắn ${this.shootCount} viên đạn với damage: ${this.damage}, speed: ${this.speed}`);
        
        // Lấy vị trí bắn từ owner (enemy/boss)
        let shootPos = this.owner ? this.owner.position : this.node.position;
        
        for (let i = 0; i < this.shootCount; i++) {
            let bullet = cc.instantiate(this.bulletPrefab);
            this.node.parent.addChild(bullet);
            
            // Tính góc bắn đều xung quanh
            let angle = (360 / this.shootCount) * i;
            let bulletComponent = bullet.getComponent('Bullet');
            
            if (bulletComponent) {
                // Truyền damage và speed từ BaseSkill sang bullet
                bulletComponent.init(shootPos, angle, this.damage, this.speed);
            } else {
                cc.warn("[SkillShoot] Bullet component not found on prefab");
            }
        }

        // Tự hủy skill sau khi bắn xong
        this.destroySkill();
    }
});