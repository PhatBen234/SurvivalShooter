cc.Class({
  extends: cc.Component,

  properties: {
    speed: 100,
    damage: 1,

    spriteNode: cc.Node,
    hpLabel: cc.Label,
    maxHp: 10,

    expPrefab: cc.Prefab,
    expAmount: 20,
  },

  onLoad() {
    this.hp = this.maxHp;
    this.updateHpLabel();

    // Tự tìm PlayerController trong Canvas
    const playerComponent = cc
      .find("Canvas")
      .getComponentInChildren("PlayerController");
    if (playerComponent) {
      this.player = playerComponent.node;
    } else {
      cc.warn("Enemy: Không tìm thấy Player!");
    }
  },

  update(dt) {
    if (!this.player || !this.player.isValid) return;

    const dir = this.player.position.sub(this.node.position);
    const distance = dir.mag();

    // Lật hướng enemy theo hướng di chuyển
    this.node.scaleX = dir.x > 0 ? 1 : -1;

    // Giữ label không bị lật
    if (this.hpLabel && this.hpLabel.node) {
      this.hpLabel.node.scaleX = 1 / this.node.scaleX;
    }

    if (distance > 5) {
      const move = dir.normalize().mul(this.speed * dt);
      this.node.position = this.node.position.add(move);
    } else {
      const playerScript = this.player.getComponent("PlayerController");
      if (playerScript && playerScript.takeDamage) {
        playerScript.takeDamage(this.damage);
      }
      // Nếu là enemy cảm tử
      // this.node.destroy();
    }
  },

  // Hỗ trợ truyền player từ ngoài
  init(playerNode) {
    this.player = playerNode;
  },

  takeDamage(amount) {
    this.hp -= amount;
    this.updateHpLabel();

    if (this.hp <= 0) {
      this.onDeath();
    }
  },

  updateHpLabel() {
    if (this.hpLabel) {
      this.hpLabel.string = this.hp.toString();
    }
  },

  onDeath() {
    if (this.expPrefab) {
      const exp = cc.instantiate(this.expPrefab);
      exp.setPosition(this.node.getPosition());
      this.node.parent.addChild(exp);

      const expScript = exp.getComponent("Exp");
      if (expScript) {
        expScript.expAmount = this.expAmount;
        expScript.targetPlayer = this.player;
      }
    }

    this.node.destroy();
  },
});
