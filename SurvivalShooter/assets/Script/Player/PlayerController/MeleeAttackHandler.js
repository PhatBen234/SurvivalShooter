// MeleeAttackHandler.js - Xử lý tấn công và skill tầm gần
cc.Class({
  extends: cc.Component,

  properties: {
    // Sẽ được init từ PlayerController
    playerModel: null,
    playerView: null,
    canvasNode: null,
    meleeSkillNode: null,
  },

  // Khởi tạo từ PlayerController
  init(playerModel, playerView, canvasNode, meleeSkillNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
    this.meleeSkillNode = meleeSkillNode;
  },

  // === MELEE ATTACK ===
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

  // === MELEE SKILL ===
  // Thực hiện skill tầm gần - Circular AOE attack
  performSkill(onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    // Play melee skill animation
    this.playerView.playSkillAnimation("melee", () => {
      this.executeMeleeSkillDamage();
      if (onFinishCallback) {
        onFinishCallback();
      }
    });
  },

  // Thực hiện damage skill tầm gần - AOE circular
  executeMeleeSkillDamage() {
    if (!this.playerModel || !this.canvasNode) return;

    const SKILL_DAMAGE = 40;
    const MELEE_SKILL_RANGE = 200;

    // Tìm tất cả enemies trong vùng circular
    const enemies = this.findEnemiesInRange(MELEE_SKILL_RANGE);

    // Gây damage cho tất cả enemies trong range
    enemies.forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      if (enemyScript?.takeDamage) {
        enemyScript.takeDamage(SKILL_DAMAGE);
      }
    });

    // Hiển thị visual effect nếu có skill node
    this.showMeleeSkillEffect();
  },

  // Hiển thị effect cho melee skill
  showMeleeSkillEffect() {
    if (!this.meleeSkillNode) return;

    // Có thể implement visual effect tại đây
    // Ví dụ: animation cho circular attack effect
    // this.meleeSkillNode.runAction(cc.sequence(
    //   cc.scaleTo(0.1, 1.5),
    //   cc.scaleTo(0.1, 1.0)
    // ));
  },

  // === UTILITIES ===
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
