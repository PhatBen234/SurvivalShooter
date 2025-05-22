cc.Class({
    extends: cc.Component,

    properties: {
        anim: cc.Animation,
        skillShoot: cc.Component,
        skillDash: cc.Component,
        player: cc.Node,
        hp: 500,
        moveSpeed: 100, // Thêm tốc độ di chuyển (pixels/sec)

        hpBar: cc.ProgressBar,
    },

    start() {
        this.canvasSize = cc.winSize; // Lấy kích thước canvas
        this.schedule(this.castSkill, 5); // 5s dùng 1 skill ngẫu nhiên
        this.maxHP = this.hp; // Lưu lại HP tối đa
        this.updateHpBar();
    },

    update(dt) {
        if (this.player) {
            //cc.log("Boss đang di chuyển về phía player!");
            this.moveTowardPlayer(dt);
        }
        else {
            //cc.log("Boss không có player để di chuyển!");
        }
    },

    init(playerNode) {
        this.player = playerNode;
    },

    moveTowardPlayer(dt) {
    // Nếu chưa có player thì bỏ qua
    if (!this.player) {
        //cc.log("Boss chưa có player!");
        return;
    }

    // Đảm bảo boss và player cùng hệ tọa độ
    let bossPos = this.node.position;

    let playerWorldPos = this.player.parent.convertToWorldSpaceAR(this.player.position);
    let playerPos = this.node.parent.convertToNodeSpaceAR(playerWorldPos);

    // Tính hướng và khoảng cách
    let dir = playerPos.sub(bossPos);
    let distance = dir.mag(); // Độ dài vector = khoảng cách

    if (distance > 5) {
        // Di chuyển về phía player
        let move = dir.normalize().mul(this.moveSpeed * dt);

        let newPos = bossPos.add(move);

        // Giới hạn trong canvas
        let halfWidth = this.node.width / 2;
        let halfHeight = this.node.height / 2;

        let minX = -this.canvasSize.width / 2 + halfWidth;
        let maxX = this.canvasSize.width / 2 - halfWidth;
        let minY = -this.canvasSize.height / 2 + halfHeight;
        let maxY = this.canvasSize.height / 2 - halfHeight;

        newPos.x = Math.max(minX, Math.min(newPos.x, maxX));
        newPos.y = Math.max(minY, Math.min(newPos.y, maxY));

        this.node.setPosition(newPos);

        //cc.log("Boss đang di chuyển về phía player!");
    } else {
        // Nếu tới gần player thì gây sát thương
        let playerScript =
            this.player.getComponent("Player") ||
            this.player.getComponent("PlayerStage2");

        if (playerScript && playerScript.takeDamage) {
            playerScript.takeDamage(this.damage || 10); // Boss gây damage
            //cc.log("Boss đã tấn công Player!");
        }

        // Nếu boss tự huỷ khi chạm player (kiểu kamikaze) thì bỏ comment dòng sau
        // this.node.destroy();
    }
},


    castSkill() {
        const skillId = Math.floor(Math.random() * 2);
        switch (skillId) {
            case 0:
                this.anim.play("FinalBossIdle");
                this.skillShoot.shoot();
                break;
            case 1:
                this.anim.play("FinalBossIdle");
                this.skillDash.dash();
                break;
        }
    },

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        this.updateHpBar();
    },

    updateHpBar() {
        if (this.hpBar) {
            this.hpBar.progress = this.hp / this.maxHP;
        }
    },

    die() {
        this.node.destroy();
    }
});
