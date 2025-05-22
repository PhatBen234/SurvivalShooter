cc.Class({
  extends: cc.Component,

  properties: {
    hp: 500,
    moveSpeed: 100,
    damage: 10,

    hpBar: cc.ProgressBar,
    skillShoot: cc.Component,
    skillDash: cc.Component,
  },

  start() {
    this.canvasSize = cc.winSize;
    this.maxHP = this.hp;
    this.updateHpBar();

    this.schedule(this.castSkill, 5); // Dùng skill mỗi 5 giây

    // Tự tìm player
    this.player =
      cc.find("Canvas").getComponentInChildren("Player") ||
      cc.find("Canvas").getComponentInChildren("PlayerStage2") ||
      cc.find("Canvas").getComponentInChildren("PlayerStage3");

    if (this.player) {
      this.player = this.player.node;
    } else {
      cc.warn("Không tìm thấy Player!");
    }
  },

  update(dt) {
    if (this.player && this.player.isValid) {
      this.moveTowardPlayer(dt);
    }
  },

  moveTowardPlayer(dt) {
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
      const playerScript =
        this.player.getComponent("Player") ||
        this.player.getComponent("PlayerStage2") ||
        this.player.getComponent("PlayerStage3");

      if (playerScript && playerScript.takeDamage) {
        playerScript.takeDamage(this.damage);
      }
    }
  },

  castSkill() {
    const id = Math.floor(Math.random() * 2);
    if (id === 0 && this.skillShoot) this.skillShoot.shoot();
    else if (id === 1 && this.skillDash) this.skillDash.dash();
  },

  takeDamage(amount) {
    this.hp -= amount;
    this.updateHpBar();

    if (this.hp <= 0) {
      this.onDeath();
    }
  },

  updateHpBar() {
    if (this.hpBar) {
      this.hpBar.progress = this.hp / this.maxHP;
    }
  },

  onDeath() {
    this.node.destroy();
  },
});
