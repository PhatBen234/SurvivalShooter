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
        hpLabel: cc.Label,   // node Label hiển thị máu
        maxHp: 10,           // máu tối đa
    },

    onLoad () {
        // Random loại enemy và gán sprite + animation
        if (this.enemyTypes.length > 0 && this.spriteNode) {
            const randIndex = Math.floor(Math.random() * this.enemyTypes.length);
            const selectedType = this.enemyTypes[randIndex];

            const sprite = this.spriteNode.getComponent(cc.Sprite);
            if (sprite && selectedType.spriteFrame) {
                sprite.spriteFrame = selectedType.spriteFrame;
            }

            const anim = this.spriteNode.getComponent(cc.Animation);
            if (anim && selectedType.animationClip) {
                if (!anim.getClips().includes(selectedType.animationClip)) {
                    anim.addClip(selectedType.animationClip);
                }
                anim.play(selectedType.animationClip.name);
            }
        }

        // Gán máu ban đầu và cập nhật label
        this.hp = this.maxHp;
        this.updateHpLabel();
    },

    update(dt) {
        if (!this.player || !this.player.isValid) return;

        let dir = this.player.position.sub(this.node.position);
        let distance = dir.mag();

        // Lật enemy theo hướng di chuyển
        this.node.scaleX = dir.x > 0 ? 1 : -1;

        // Di chuyển hoặc tấn công
        if (distance > 5) {
            let move = dir.normalize().mul(this.speed * dt);
            this.node.position = this.node.position.add(move);
        } else {
            let playerScript = this.player.getComponent("Player");
            if (playerScript) {
                playerScript.takeDamage(this.damage);
            }
            // Có thể destroy enemy nếu là kiểu kamikaze
            // this.node.destroy();
        }
    },

    init(playerNode) {
        this.player = playerNode;
    },

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.updateHpLabel();
            this.node.destroy(); // Enemy chết
        } else {
            this.updateHpLabel();
        }
    },

    updateHpLabel() {
        if (this.hpLabel) {
            this.hpLabel.string = this.hp.toString();
        }
    },
});
