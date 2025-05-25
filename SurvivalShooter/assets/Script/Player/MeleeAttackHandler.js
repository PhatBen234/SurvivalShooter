// MeleeAttackHandler.js - Xử lý tấn công tầm gần
cc.Class({
  extends: cc.Component,

  properties: {
    // Sẽ được init từ PlayerController
    playerModel: null,
    playerView: null,
    canvasNode: null,
  },

  // Khởi tạo từ PlayerController
  init(playerModel, playerView, canvasNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
  },

  // Thực hiện tấn công tầm gần
  performAttack(onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    // Play melee attack animation
    this.playerView.playMeleeAttackAnimation(() => {
      this.executeMeleeDamage();
      if (onFinishCallback) {
        onFinishCallback();
      }
    });
  },

  // Thực hiện damage cho tất cả enemy trong tầm
  executeMeleeDamage() {
    if (!this.playerModel || !this.canvasNode) return;

    const damage = this.playerModel.calculateDamage();
    const enemies = this.findEnemiesInRange(
      this.playerModel.getMeleeAttackRange()
    );

    enemies.forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      if (enemyScript?.takeDamage) {
        enemyScript.takeDamage(damage);
      }
    });
  },

  // Tìm enemies trong tầm tấn công tầm gần
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    const enemies = this.canvasNode.children.filter(
      (node) =>
        (node.name === "Enemy" ||
          node.group === "enemy" ||
          node.name === "FinalBoss" ||
          node.group === "finalBoss") &&
        node.isValid
    );

    return enemies.filter((enemy) => {
      const dist = this.node.position.sub(enemy.position).mag();
      return dist <= range;
    });
  },
});
