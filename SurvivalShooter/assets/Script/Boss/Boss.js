cc.Class({
  extends: cc.Component,

  properties: {
    anim: cc.Animation,
    skillShoot: cc.Component,
    skillDash: cc.Component,
    hp: 500,
    moveSpeed: 100, // pixels/sec
    hpBar: cc.ProgressBar,
  },

  start() {
    this.canvasSize = cc.winSize;
    this.schedule(this.castSkill, 5); // 5s dùng skill
    this.maxHP = this.hp;
    this.updateHpBar();

    // Tự tìm player (Player, PlayerStage2 hoặc PlayerStage3)
    this.player = cc.find("Canvas").getComponentInChildren("PlayerController");

    if (this.player) {
      this.player = this.player.node;
    } else {
      cc.warn("Không tìm thấy PlayerController");
    }
  },

  update(dt) {
    if (this.player) {
      this.moveTowardPlayer(dt);
    }
  },

  moveTowardPlayer(dt) {
    if (!this.player) return;

    let bossPos = this.node.position;

    let playerWorldPos = this.player.parent.convertToWorldSpaceAR(
      this.player.position
    );
    let playerPos = this.node.parent.convertToNodeSpaceAR(playerWorldPos);

    let dir = playerPos.sub(bossPos);
    let distance = dir.mag();

    if (distance > 5) {
      let move = dir.normalize().mul(this.moveSpeed * dt);
      let newPos = bossPos.add(move);

      let halfWidth = this.node.width / 2;
      let halfHeight = this.node.height / 2;
      let minX = -this.canvasSize.width / 2 + halfWidth;
      let maxX = this.canvasSize.width / 2 - halfWidth;
      let minY = -this.canvasSize.height / 2 + halfHeight;
      let maxY = this.canvasSize.height / 2 - halfHeight;

      newPos.x = Math.max(minX, Math.min(newPos.x, maxX));
      newPos.y = Math.max(minY, Math.min(newPos.y, maxY));

      this.node.setPosition(newPos);
    } else {
      // Gây sát thương khi chạm
      const playerScript = this.player.getComponent("PlayerController");

      if (playerScript && playerScript.takeDamage) {
        playerScript.takeDamage(this.damage || 10);
      }
    }
  },

  castSkill() {
    const skillId = Math.floor(Math.random() * 2);
    this.anim.play("FinalBossIdle");

    switch (skillId) {
      case 0:
        this.skillShoot.shoot();
        break;
      case 1:
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
  },
});
