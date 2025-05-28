cc.Class({
  extends: cc.Component,

  properties: {
    playerModel: null,
    playerView: null,
    canvasNode: null,
    meleeSkillNode: null,
  },

  init(playerModel, playerView, canvasNode, meleeSkillNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
    this.meleeSkillNode = meleeSkillNode;
  },

  // Tính damage cho melee attack
  calculateMeleeDamage() {
    let damage = this.playerModel.getBaseAttack();
    if (Math.random() < this.playerModel.getCriticalRate()) {
      damage *= 2;
    }
    return damage;
  },

  // Tính damage cho melee skill
  calculateMeleeSkillDamage() {
    let damage = this.playerModel.getSkillDamage();
    if (Math.random() < this.playerModel.getCriticalRate()) {
      damage *= 2;
    }
    return damage;
  },

  performAttack(onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    this.playerView.playMeleeAttackAnimation(() => {
      this.executeMeleeDamage();
      onFinishCallback?.();
    });
  },

  executeMeleeDamage() {
    if (!this.canvasNode) return;

    const damage = this.calculateMeleeDamage();
    this.findEnemiesInRange(this.playerModel.getMeleeAttackRange()).forEach(
      (enemy) => {
        const enemyScript =
          enemy.getComponent("Enemy") || enemy.getComponent("Boss");
        enemyScript?.takeDamage?.(damage);
      }
    );
  },

  performSkill(onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    this.playerView.playSkillAnimation("melee", () => {
      this.executeMeleeSkillDamage();
      onFinishCallback?.();
    });
  },

  executeMeleeSkillDamage() {
    if (!this.canvasNode) return;

    const skillDamage = this.calculateMeleeSkillDamage() * 3;
    this.findEnemiesInRange(200).forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      enemyScript?.takeDamage?.(skillDamage);
    });

    this.showMeleeSkillEffect();
  },

  showMeleeSkillEffect() {
    if (!this.meleeSkillNode) return;
    // Implement visual effect if needed
  },

  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      if (
        !node.isValid ||
        (!["Enemy", "FinalBoss"].includes(node.name) &&
          !["enemy", "finalBoss"].includes(node.group))
      ) {
        return false;
      }
      return this.node.position.sub(node.position).mag() <= range;
    });
  },
});
