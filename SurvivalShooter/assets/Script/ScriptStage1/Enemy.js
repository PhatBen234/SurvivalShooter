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

    // Tự tìm player nếu chưa có
    this.player =
      cc.find("Canvas").getComponentInChildren("Player") ||
      cc.find("Canvas").getComponentInChildren("PlayerStage2") ||
      cc.find("Canvas").getComponentInChildren("PlayerController") ||
      cc.find("Canvas").getComponentInChildren("PlayerStage3");

    if (this.player) {
      this.player = this.player.node;
    } else {
      cc.warn("Enemy: Không tìm thấy Player!");
    }
  },

  update(dt) {
    if (!this.player || !this.player.isValid) return;

    let dir = this.player.position.sub(this.node.position);
    let distance = dir.mag();

    // Lật enemy
    this.node.scaleX = dir.x > 0 ? 1 : -1;

    // Giữ label không bị lật
    if (this.hpLabel && this.hpLabel.node) {
      this.hpLabel.node.scaleX = 1 / this.node.scaleX;
    }

    if (distance > 5) {
      let move = dir.normalize().mul(this.speed * dt);
      this.node.position = this.node.position.add(move);
    } else {
      const playerScript =
        this.player.getComponent("Player") ||
        this.player.getComponent("PlayerStage2") ||
        this.player.getComponent("PlayerController") ||
        this.player.getComponent("PlayerStage3");

      if (playerScript && playerScript.takeDamage) {
        playerScript.takeDamage(this.damage);
      }
      // Nếu enemy là kamikaze thì bật dòng dưới:
      // this.node.destroy();
    }
  },

  // Nếu bạn vẫn muốn hỗ trợ truyền player từ ngoài thì giữ lại
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
