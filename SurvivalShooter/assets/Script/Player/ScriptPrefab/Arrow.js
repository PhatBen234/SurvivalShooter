cc.Class({
  extends: cc.Component,

  properties: {
    speed: 600,
    target: null,
    damage: 0,
    isCritical: false, // Thêm property để track critical
  },

  init(target, damage, isCritical = false) {
    this.target = target;
    this.damage = damage;
    this.isCritical = isCritical;
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
        this.target.getComponent("BaseEnemy") ||
        this.target.getComponent("EnemyLevel2") ||
        this.target.getComponent("BossEnemy");

      // Truyền cả damage và isCritical vào takeDamage
      if (enemyScript?.takeDamage) {
        enemyScript.takeDamage(this.damage, this.isCritical);
      }

      this.node.destroy();
    }
  },
});
