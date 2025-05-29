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
    let isCritical = Math.random() < this.playerModel.getCriticalRate();
    if (isCritical) {
      damage *= 2;
    }
    return { damage, isCritical };
  },

  // Tính damage cho melee skill
  calculateMeleeSkillDamage() {
    let damage = this.playerModel.getSkillDamage();
    let isCritical = Math.random() < this.playerModel.getCriticalRate();
    if (isCritical) {
      damage *= 2;
    }
    return { damage, isCritical };
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

    const damageInfo = this.calculateMeleeDamage();
    this.findEnemiesInRange(this.playerModel.getMeleeAttackRange()).forEach(
      (enemy) => {
        const enemyScript =
          enemy.getComponent("BaseEnemy") ||
          enemy.getComponent("EnemyLevel2") ||
          enemy.getComponent("BossEnemy");
        enemyScript?.takeDamage?.(damageInfo.damage, damageInfo.isCritical);
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

    const damageInfo = this.calculateMeleeSkillDamage();
    const skillDamage = damageInfo.damage * 3;
    this.findEnemiesInRange(200).forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("BaseEnemy") ||
        enemy.getComponent("EnemyLevel2") ||
        enemy.getComponent("BossEnemy");
      enemyScript?.takeDamage?.(skillDamage, damageInfo.isCritical);
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
        (!["BaseEnemy", "EnemyLevel2", "BossEnemy"].includes(node.name) &&
          node.group !== "enemy")
      ) {
        return false;
      }
      return this.node.position.sub(node.position).mag() <= range;
    });
  },
});