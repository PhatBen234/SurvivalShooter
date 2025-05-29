// PlayerSkillHandler.js - Handles skill system
cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
  },

  init(playerModel, playerView, meleeAttackHandler, rangedAttackHandler) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.meleeAttackHandler = meleeAttackHandler;
    this.rangedAttackHandler = rangedAttackHandler;
    this.skillTimer = 0;
  },

  handleSkill(dt) {
    if (!this.canUseSkill(dt)) return;

    this.resetSkillTimer();
    this.playerModel.setCanUseSkill(false);

    const skillType = this.determineSkillType();
    const skillDamage = this.playerModel.getSkillDamage();

    const handler =
      skillType === "melee"
        ? this.meleeAttackHandler
        : this.rangedAttackHandler;

    if (handler?.performSkill) {
      handler.performSkill(() => {
        this.playerModel.setCanUseSkill(true);
      });
    } else {
      this.playerModel.setCanUseSkill(true);
    }
  },

  determineSkillType() {
    const lastAttackType = this.playerModel.getCurrentAttackType();
    if (lastAttackType) return lastAttackType;

    const enemy = this.findClosestEnemy(
      this.playerModel.getRangedAttackRange()
    );
    return enemy ? this.determineAttackType(enemy) : "melee";
  },

  determineAttackType(enemy) {
    const distance = this.node.position.sub(enemy.position).mag();
    const meleeRange = this.playerModel.getMeleeAttackRange();

    if (distance <= meleeRange) {
      const nearbyCount = this.findEnemiesInRange(meleeRange).length;
      return nearbyCount >= 2 ||
        distance <= this.playerModel.getMeleeToRangedThreshold()
        ? "melee"
        : "ranged";
    }
    return "ranged";
  },

  canUseSkill(dt) {
    if (!this.playerModel || !this.playerView) return false;

    this.skillTimer += dt;
    return (
      this.skillTimer >= this.playerModel.getSkillCooldown() &&
      this.playerModel.canUseSkill()
    );
  },

  resetSkillTimer() {
    this.skillTimer = 0;
  },

  applySkillBuff(skillId, amount) {
    if (!this.playerModel || !this.playerView) return;

    const oldSkillDamage = this.playerModel.getSkillDamage();
    this.playerModel.applySkillBuff(skillId, amount);
    const newSkillDamage = this.playerModel.getSkillDamage();

    if (skillId === 5) {
      // Skill Damage buff
      // Log removed for clarity
    }

    this.playerView.updateAllUI();
  },

  // Utility methods
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      const isEnemy =
        ["BaseEnemy", "EnemyLevel2", "BossEnemy"].includes(node.name) ||
        node.group === "enemy";
      const inRange = this.node.position.sub(node.position).mag() <= range;
      return isEnemy && node.isValid && inRange;
    });
  },

  findClosestEnemy(maxRange = 300) {
    const enemies =
      this.canvasNode?.children.filter(
        (node) =>
          ["BaseEnemy", "EnemyLevel2", "BossEnemy"].includes(node.name) ||
          node.group === "enemy"
      ) || [];

    return (
      enemies
        .map((enemy) => ({
          enemy,
          distance: this.node.position.sub(enemy.position).mag(),
        }))
        .filter(({ distance }) => distance <= maxRange)
        .sort((a, b) => a.distance - b.distance)[0]?.enemy || null
    );
  },
});
