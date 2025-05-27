// UltimateSkillHandler.js - Handles Ultimate Skill system
cc.Class({
  extends: cc.Component,

  properties: {
    playerModel: null,
    playerView: null,
    canvasNode: null,
    ultimateSkillNode: null, // MCUltimate node reference
  },

  init(playerModel, playerView, canvasNode, ultimateSkillNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
    this.ultimateSkillNode = ultimateSkillNode;

    // Initialize ultimate skill node
    if (this.ultimateSkillNode) {
      this.ultimateSkillNode.active = false;
    }

    // Ultimate skill timer
    this.ultimateTimer = 0;
    this.ultimateCooldownTime = 15; // 15 seconds cooldown

    cc.log("[UltimateSkillHandler] Initialized");
  },

  // Tính damage cho ultimate skill
  calculateUltimateDamage() {
    let damage = this.playerModel.getSkillDamage() * 4;
    if (Math.random() < this.playerModel.getCriticalRate()) {
      damage *= 2;
    }
    return damage;
  },

  update(dt) {
    this.updateUltimateCooldown(dt);
  },

  updateUltimateCooldown(dt) {
    if (!this.playerModel) return;

    // Update cooldown timer
    if (
      !this.playerModel.canUseUltimate() &&
      this.playerModel.hasUltimateSkill()
    ) {
      this.ultimateTimer += dt;

      // Reset cooldown when timer reaches limit
      if (this.ultimateTimer >= this.ultimateCooldownTime) {
        this.playerModel.setCanUseUltimate(true);
        this.ultimateTimer = 0;
        cc.log("[UltimateSkillHandler] Ultimate skill ready!");
      }
    }
  },

  // Check if ultimate can be triggered (every 15 seconds when unlocked)
  shouldTriggerUltimate() {
    if (!this.playerModel) return false;

    return (
      this.playerModel.hasUltimateSkill() &&
      this.playerModel.canUseUltimate() &&
      this.findEnemiesInRange(400).length > 0
    ); // Only trigger if enemies nearby
  },

  // Perform ultimate skill
  performUltimateSkill(onFinishCallback) {
    if (!this.playerModel || !this.playerView) {
      if (onFinishCallback) onFinishCallback();
      return;
    }

    // Check if can use ultimate
    if (!this.shouldTriggerUltimate()) {
      if (onFinishCallback) onFinishCallback();
      return;
    }

    cc.log("[UltimateSkillHandler] Performing Ultimate Skill!");

    // Set ultimate on cooldown
    this.playerModel.setCanUseUltimate(false);
    this.ultimateTimer = 0;

    // Play ultimate animation
    this.playUltimateAnimation(() => {
      this.executeUltimateDamage();
      if (onFinishCallback) onFinishCallback();
    });
  },

  playUltimateAnimation(onFinished) {
    if (!this.ultimateSkillNode) {
      cc.warn("[UltimateSkillHandler] Ultimate skill node not found!");
      if (onFinished) onFinished();
      return;
    }

    // Position ultimate effect at player center
    this.ultimateSkillNode.setPosition(cc.v2(0, 0));
    this.ultimateSkillNode.setScale(1, 1);
    this.ultimateSkillNode.active = true;

    const anim = this.ultimateSkillNode.getComponent(cc.Animation);

    if (anim && anim.getAnimationState("Ultimate")) {
      cc.log("[UltimateSkillHandler] Playing Ultimate animation");
      anim.play("Ultimate");

      // Listen for animation finish
      anim.once("finished", () => {
        this.ultimateSkillNode.active = false;
        cc.log("[UltimateSkillHandler] Ultimate animation finished");
        if (onFinished) onFinished();
      });
    } else {
      cc.warn("[UltimateSkillHandler] Ultimate animation not found!");
      this.ultimateSkillNode.active = false;
      if (onFinished) onFinished();
    }
  },

  executeUltimateDamage() {
    if (!this.canvasNode) return;

    const ultimateDamage = this.calculateUltimateDamage();
    const ultimateRange = 500; // Large range for ultimate

    cc.log(
      `[UltimateSkillHandler] Ultimate damage: ${ultimateDamage}, Range: ${ultimateRange}`
    );

    // Find all enemies in ultimate range
    const enemies = this.findEnemiesInRange(ultimateRange);

    cc.log(
      `[UltimateSkillHandler] Found ${enemies.length} enemies in ultimate range`
    );

    // Deal damage to all enemies in range
    enemies.forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      if (enemyScript && enemyScript.takeDamage) {
        enemyScript.takeDamage(ultimateDamage);
        cc.log(
          `[UltimateSkillHandler] Dealt ${ultimateDamage} ultimate damage to ${enemy.name}`
        );
      }
    });

    // Visual feedback
    this.showUltimateEffect();
  },

  showUltimateEffect() {
    // Add screen shake or other visual effects
    if (this.canvasNode) {
      this.canvasNode.runAction(
        cc.sequence(
          cc.moveBy(0.05, cc.v2(5, 0)),
          cc.moveBy(0.05, cc.v2(-10, 0)),
          cc.moveBy(0.05, cc.v2(5, 0)),
          cc.moveBy(0.05, cc.v2(0, 0))
        )
      );
    }

    cc.log("[UltimateSkillHandler] Ultimate visual effects applied");
  },

  // Utility method to find enemies in range
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      if (!node.isValid) return false;

      // Check if node is an enemy
      const isEnemy =
        ["Enemy", "FinalBoss"].includes(node.name) ||
        ["enemy", "finalBoss"].includes(node.group);

      if (!isEnemy) return false;

      // Check distance
      const distance = this.node.position.sub(node.position).mag();
      return distance <= range;
    });
  },

  // Public method to check ultimate status
  getUltimateStatus() {
    if (!this.playerModel)
      return { hasUltimate: false, canUse: false, cooldown: 0 };

    return {
      hasUltimate: this.playerModel.hasUltimateSkill(),
      canUse: this.playerModel.canUseUltimate(),
      cooldown: this.ultimateCooldownTime - this.ultimateTimer,
      cooldownProgress: this.ultimateTimer / this.ultimateCooldownTime,
    };
  },

  // Method to manually trigger ultimate (for testing or special cases)
  forceUltimate(onFinishCallback) {
    if (!this.playerModel.hasUltimateSkill()) {
      cc.warn(
        "[UltimateSkillHandler] Cannot force ultimate - skill not unlocked"
      );
      if (onFinishCallback) onFinishCallback();
      return;
    }

    cc.log("[UltimateSkillHandler] Force triggering ultimate skill");
    this.performUltimateSkill(onFinishCallback);
  },
});
