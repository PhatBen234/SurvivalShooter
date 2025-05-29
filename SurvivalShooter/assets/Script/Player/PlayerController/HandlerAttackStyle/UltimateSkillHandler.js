cc.Class({
  extends: cc.Component,

  properties: {
    playerModel: null,
    playerView: null,
    canvasNode: null,
  },

  init(playerModel, playerView, canvasNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;

    this.ultimateStartTime = 0;
    this.ultimateCooldownTime = 10;
    this.isUltimateOnCooldown = false;
  },

  calculateUltimateDamage() {
    let damage = this.playerModel.getSkillDamage() * 4;
    let isCritical = Math.random() < this.playerModel.getCriticalRate();
    if (isCritical) {
      damage *= 2;
    }
    return { damage, isCritical };
  },

  update(dt) {
    this.updateUltimateCooldown();

    if (this.playerView?.updateUltimateUI) {
      this.playerView.updateUltimateUI();
    }
  },

  updateUltimateCooldown() {
    if (!this.isUltimateOnCooldown) return;

    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - this.ultimateStartTime;

    if (elapsedTime >= this.ultimateCooldownTime) {
      this.playerModel.setCanUseUltimate(true);
      this.isUltimateOnCooldown = false;
      this.ultimateStartTime = 0;
    }
  },

  getRemainingCooldown() {
    if (!this.isUltimateOnCooldown) return 0;

    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - this.ultimateStartTime;
    return Math.max(0, this.ultimateCooldownTime - elapsedTime);
  },

  shouldTriggerUltimate() {
    return (
      this.playerModel?.hasUltimateSkill() &&
      this.playerModel.canUseUltimate() &&
      !this.isUltimateOnCooldown &&
      this.findEnemiesInRange(400).length > 0
    );
  },

  performUltimateSkill(onFinishCallback) {
    if (!this.shouldTriggerUltimate()) {
      onFinishCallback?.();
      return;
    }

    this.startUltimateCooldown();

    this.playerView.playUltimateAnimation(() => {
      this.executeUltimateDamage();
      onFinishCallback?.();
    });
  },

  startUltimateCooldown() {
    this.playerModel.setCanUseUltimate(false);
    this.isUltimateOnCooldown = true;
    this.ultimateStartTime = Date.now() / 1000;
  },

  executeUltimateDamage() {
    const damageInfo = this.calculateUltimateDamage();
    const enemies = this.findEnemiesInRange(500);

    enemies.forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("BaseEnemy") ||
        enemy.getComponent("EnemyLevel2") ||
        enemy.getComponent("BossEnemy");
      enemyScript?.takeDamage?.(damageInfo.damage, damageInfo.isCritical);
    });
  },

  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      if (!node.isValid) return false;

      const isEnemy =
        ["BaseEnemy", "EnemyLevel2", "BossEnemy"].includes(node.name) ||
        node.group === "enemy";

      if (!isEnemy) return false;

      return this.node.position.sub(node.position).mag() <= range;
    });
  },

  getUltimateStatus() {
    const remainingCooldown = this.getRemainingCooldown();

    return {
      hasUltimate: this.playerModel?.hasUltimateSkill() || false,
      canUse: this.playerModel?.canUseUltimate() && !this.isUltimateOnCooldown,
      cooldown: remainingCooldown,
      cooldownProgress: this.isUltimateOnCooldown
        ? (this.ultimateCooldownTime - remainingCooldown) /
          this.ultimateCooldownTime
        : 1,
    };
  },

  forceUltimate(onFinishCallback) {
    if (!this.playerModel?.hasUltimateSkill()) {
      onFinishCallback?.();
      return;
    }

    this.isUltimateOnCooldown = false;
    this.playerModel.setCanUseUltimate(true);

    this.performUltimateSkill(onFinishCallback);
  },

  resetUltimateCooldown() {
    this.isUltimateOnCooldown = false;
    this.ultimateStartTime = 0;
    this.playerModel?.setCanUseUltimate(true);
  },
});