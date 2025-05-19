const EnemyType = require("EnemyType");

cc.Class({
    extends: cc.Component,

    properties: {
        speed: 100,
        damage: 1,
        enemyTypes: {
            default: [],
            type: [EnemyType],
        },

        spriteNode: cc.Node, // trỏ tới node con Sprite
    },

    onLoad () {
        if (this.enemyTypes.length > 0 && this.spriteNode) {
            // Random 1 loại enemy
            const randIndex = Math.floor(Math.random() * this.enemyTypes.length);
            const selectedType = this.enemyTypes[randIndex];

            // Gán sprite
            const sprite = this.spriteNode.getComponent(cc.Sprite);
            if (sprite && selectedType.spriteFrame) {
                sprite.spriteFrame = selectedType.spriteFrame;
            }

            // Gán & play animation clip
            const anim = this.spriteNode.getComponent(cc.Animation);
            if (anim && selectedType.animationClip) {
                // Nếu clip chưa tồn tại thì add vào
                if (!anim.getClips().includes(selectedType.animationClip)) {
                    anim.addClip(selectedType.animationClip);
                }

                anim.play(selectedType.animationClip.name);
            }
        }
    },

    update(dt) {
        if (!this.player || !this.player.isValid) return;

        let dir = this.player.position.sub(this.node.position);
        let distance = dir.mag();

        // ✅ Lật sprite theo hướng x
        this.node.scaleX = dir.x > 0 ? 1 : -1;

        if (distance > 5) {
            let move = dir.normalize().mul(this.speed * dt);
            this.node.position = this.node.position.add(move);
        } else {
            let playerScript = this.player.getComponent("Player");
            if (playerScript) {
                playerScript.takeDamage(this.damage);
            }
            //this.node.destroy();
        }
    },

    init(playerNode) {
        this.player = playerNode;
    }
});
