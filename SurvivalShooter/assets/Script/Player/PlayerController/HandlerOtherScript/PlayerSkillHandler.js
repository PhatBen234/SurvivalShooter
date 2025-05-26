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

    // Determine skill type based on last attack type or current situation
    const skillType = this.determineSkillType();

    // Log skill usage for debugging
    const skillDamage = this.playerModel.getSkillDamage();
    cc.log(
      `[PlayerSkillHandler] Using ${skillType} skill with base damage: ${skillDamage}`
    );

    // Delegate skill execution to the appropriate handler
    const handler =
      skillType === "melee"
        ? this.meleeAttackHandler
        : this.rangedAttackHandler;

    if (handler && handler.performSkill) {
      handler.performSkill(() => {
        this.playerModel.setCanUseSkill(true);
        cc.log(`[PlayerSkillHandler] ${skillType} skill finished`);
      });
    } else {
      cc.warn(`[PlayerSkillHandler] No ${skillType} attack handler found`);
      this.playerModel.setCanUseSkill(true);
    }
  },

  determineSkillType() {
    // Use last attack type if available
    const lastAttackType = this.playerModel.getCurrentAttackType();
    if (lastAttackType) {
      return lastAttackType;
    }

    // Otherwise, determine based on closest enemy
    const enemy = this.findClosestEnemy(
      this.playerModel.getRangedAttackRange()
    );
    if (!enemy) return "melee"; // Default to melee if no enemy

    return this.determineAttackType(enemy);
  },

  determineAttackType(enemy) {
    const both = this.meleeAttackHandler && this.rangedAttackHandler;
    if (!both) {
      return this.meleeAttackHandler ? "melee" : "ranged";
    }

    const distance = this.node.position.sub(enemy.position).mag();
    const meleeRange = this.playerModel.getMeleeAttackRange();

    if (distance <= meleeRange) {
      const nearbyCount = this.findEnemiesInRange(meleeRange).length;
      if (
        nearbyCount >= 2 ||
        distance <= this.playerModel.getMeleeToRangedThreshold()
      ) {
        return "melee";
      }
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

    // Log skill buff application
    if (skillId === 5) {
      // Skill Damage buff
      cc.log(
        `[PlayerSkillHandler] Skill Damage buff applied: ${oldSkillDamage} -> ${newSkillDamage}`
      );
    }

    this.playerView.updateAllUI();
  },

  // Utility methods
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      const isEnemy =
        ["Enemy", "FinalBoss"].includes(node.name) ||
        ["enemy", "finalBoss"].includes(node.group);
      const inRange = this.node.position.sub(node.position).mag() <= range;
      return isEnemy && node.isValid && inRange;
    });
  },

  findClosestEnemy(maxRange = 300) {
    const enemies =
      this.canvasNode?.children.filter(
        (node) =>
          ["Enemy", "FinalBoss"].includes(node.name) ||
          ["enemy", "finalBoss"].includes(node.group)
      ) || [];

    return (
      enemies
        .map((enemy) => ({
          enemy,
          distance: this.node.position.sub(enemy.position).mag(),
        }))
        .filter(({ distance }) => distance <= maxRange && distance < Infinity)
        .sort((a, b) => a.distance - b.distance)[0]?.enemy || null
    );
  },
});
