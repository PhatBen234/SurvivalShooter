cc.Class({
  extends: cc.Component,

  properties: {
    speed: 600,
    target: null,
    damage: 0,
  },

  init(target, damage) {
    this.target = target;
    this.damage = damage;
  },

  update(dt) {
    if (!this.target || !this.target.isValid) {
      this.node.destroy();
      return;
    }

    const dir = this.target.position.sub(this.node.position).normalize();
    this.node.position = this.node.position.add(dir.mul(this.speed * dt));

    if (this.node.position.sub(this.target.position).mag() < 20) {
      const enemyScript =
        this.target.getComponent("Enemy") || this.target.getComponent("Boss");
      if (enemyScript?.takeDamage) enemyScript.takeDamage(this.damage);
      this.node.destroy();
    }
  },
});
