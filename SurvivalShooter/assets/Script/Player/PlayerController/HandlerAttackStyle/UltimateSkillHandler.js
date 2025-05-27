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

    if (
      !this.playerModel.canUseUltimate() &&
      this.playerModel.hasUltimateSkill()
    ) {
      this.ultimateTimer += dt;

      if (this.ultimateTimer >= this.ultimateCooldownTime) {
        this.playerModel.setCanUseUltimate(true);
        this.ultimateTimer = 0;
        cc.log("[UltimateSkillHandler] Ultimate skill ready!");
      }
    }
  },

  shouldTriggerUltimate() {
    if (!this.playerModel) return false;

    return (
      this.playerModel.hasUltimateSkill() &&
      this.playerModel.canUseUltimate() &&
      this.findEnemiesInRange(400).length > 0
    );
  },

  performUltimateSkill(onFinishCallback) {
    if (!this.playerModel || !this.playerView) {
      if (onFinishCallback) onFinishCallback();
      return;
    }

    if (!this.shouldTriggerUltimate()) {
      if (onFinishCallback) onFinishCallback();
      return;
    }

    cc.log("[UltimateSkillHandler] Performing Ultimate Skill!");

    this.playerModel.setCanUseUltimate(false);
    this.ultimateTimer = 0;

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

    this.ultimateSkillNode.setPosition(cc.v2(0, 0));
    this.ultimateSkillNode.setScale(1, 1);
    this.ultimateSkillNode.active = true;

    const anim = this.ultimateSkillNode.getComponent(cc.Animation);

    if (anim && anim.getAnimationState("Ultimate")) {
      cc.log("[UltimateSkillHandler] Playing Ultimate animation");
      anim.play("Ultimate");

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
    const ultimateRange = 500;

    cc.log(
      `[UltimateSkillHandler] Ultimate damage: ${ultimateDamage}, Range: ${ultimateRange}`
    );

    const enemies = this.findEnemiesInRange(ultimateRange);

    cc.log(
      `[UltimateSkillHandler] Found ${enemies.length} enemies in ultimate range`
    );

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

    // Removed: this.showUltimateEffect();
  },

  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      if (!node.isValid) return false;

      const isEnemy =
        ["Enemy", "FinalBoss"].includes(node.name) ||
        ["enemy", "finalBoss"].includes(node.group);

      if (!isEnemy) return false;

      const distance = this.node.position.sub(node.position).mag();
      return distance <= range;
    });
  },

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
