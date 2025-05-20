cc.Class({
  extends: cc.Component,

  properties: {
    speed: 100,
    damage: 1,

    spriteNode: cc.Node, // trỏ tới node con Sprite
    hpLabel: cc.Label, // node Label hiển thị máu
    maxHp: 10, // máu tối đa

    expPrefab: cc.Prefab, // Prefab EXP cần spawn
    expAmount: 20, // Lượng EXP rơi ra
  },

  onLoad() {
    this.hp = this.maxHp;
    this.updateHpLabel();
  },

  update(dt) {
    if (!this.player || !this.player.isValid) return;

    let dir = this.player.position.sub(this.node.position);
    let distance = dir.mag();

    // Lật enemy theo hướng di chuyển
    this.node.scaleX = dir.x > 0 ? 1 : -1;

    // Giữ label không bị lật
    if (this.hpLabel && this.hpLabel.node) {
      this.hpLabel.node.scaleX = 1 / this.node.scaleX;
    }

    if (distance > 5) {
      let move = dir.normalize().mul(this.speed * dt);
      this.node.position = this.node.position.add(move);
    } else {
      let playerScript =
        this.player.getComponent("Player") ||
        this.player.getComponent("PlayerStage2");
      if (playerScript) {
        playerScript.takeDamage(this.damage);
      }

      // this.node.destroy(); // nếu là kamikaze thì bật lại dòng này
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
      this.onDeath(); // ✅ GỌI onDeath để spawn EXP
    } else {
      this.updateHpLabel();
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

      // Gán lượng exp nếu có script
      const expScript = exp.getComponent("Exp");
      if (expScript) {
        expScript.expAmount = this.expAmount;

        // Gán player hút exp (nếu cần)
        expScript.targetPlayer = this.player;
      }
    }

    this.node.destroy();
  },
});
