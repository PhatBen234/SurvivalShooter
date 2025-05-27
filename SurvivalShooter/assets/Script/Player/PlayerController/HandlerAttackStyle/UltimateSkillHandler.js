// UltimateSkillHandler.js - Fixed Ultimate Skill system with accurate timing
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

    // Ultimate skill timer - Sử dụng timestamp thực tế
    this.ultimateStartTime = 0;
    this.ultimateCooldownTime = 15; // 15 seconds cooldown
    this.isUltimateOnCooldown = false;

    // Debug timing
    this.lastLogTime = 0;
    this.debugInterval = 1; // Log mỗi giây để kiểm tra

    cc.log("[UltimateSkillHandler] Initialized with 15s cooldown");
  },

  calculateUltimateDamage() {
    let damage = this.playerModel.getSkillDamage() * 4;
    if (Math.random() < this.playerModel.getCriticalRate()) {
      damage *= 2;
    }
    return damage;
  },

  update(dt) {
    // CHỈ COMPONENT NÀY XỬ LÝ THỜI GIAN
    this.updateUltimateCooldown();

    // Cập nhật UI ultimate sau khi tính cooldown
    if (this.playerView && this.playerView.updateUltimateUI) {
      this.playerView.updateUltimateUI();
    }

    // Debug timing (optional - có thể xóa sau khi fix)
    this.debugTiming();
  },

  updateUltimateCooldown() {
    if (!this.playerModel || !this.isUltimateOnCooldown) return;

    // Sử dụng thời gian thực tế thay vì dt tích lũy
    const currentTime = Date.now() / 1000; // Convert to seconds
    const elapsedTime = currentTime - this.ultimateStartTime;

    if (elapsedTime >= this.ultimateCooldownTime) {
      this.playerModel.setCanUseUltimate(true);
      this.isUltimateOnCooldown = false;
      this.ultimateStartTime = 0;
      cc.log(
        "[UltimateSkillHandler] Ultimate skill ready after " +
          elapsedTime.toFixed(2) +
          "s!"
      );
    }
  },

  // Getter cho remaining cooldown time
  getRemainingCooldown() {
    if (!this.isUltimateOnCooldown) return 0;

    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - this.ultimateStartTime;
    const remaining = Math.max(0, this.ultimateCooldownTime - elapsedTime);

    return remaining;
  },

  shouldTriggerUltimate() {
    if (!this.playerModel) return false;

    return (
      this.playerModel.hasUltimateSkill() &&
      this.playerModel.canUseUltimate() &&
      !this.isUltimateOnCooldown &&
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

    // Bắt đầu cooldown ngay lập tức
    this.startUltimateCooldown();

    // Let PlayerView handle the animation
    this.playerView.playUltimateAnimation(() => {
      // Execute damage after animation completes
      this.executeUltimateDamage();
      if (onFinishCallback) onFinishCallback();
    });
  },

  startUltimateCooldown() {
    this.playerModel.setCanUseUltimate(false);
    this.isUltimateOnCooldown = true;
    this.ultimateStartTime = Date.now() / 1000; // Lưu timestamp hiện tại

    cc.log(
      "[UltimateSkillHandler] Started cooldown at: " + this.ultimateStartTime
    );
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

    const remainingCooldown = this.getRemainingCooldown();

    return {
      hasUltimate: this.playerModel.hasUltimateSkill(),
      canUse: this.playerModel.canUseUltimate() && !this.isUltimateOnCooldown,
      cooldown: remainingCooldown,
      cooldownProgress: this.isUltimateOnCooldown
        ? (this.ultimateCooldownTime - remainingCooldown) /
          this.ultimateCooldownTime
        : 1,
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

    // Reset cooldown state khi force
    this.isUltimateOnCooldown = false;
    this.playerModel.setCanUseUltimate(true);

    this.performUltimateSkill(onFinishCallback);
  },

  // Debug function - có thể xóa sau khi fix
  debugTiming() {
    const currentTime = Date.now() / 1000;

    if (
      currentTime - this.lastLogTime >= this.debugInterval &&
      this.isUltimateOnCooldown
    ) {
      const remaining = this.getRemainingCooldown();
      cc.log(`[DEBUG] Ultimate cooldown remaining: ${remaining.toFixed(1)}s`);
      this.lastLogTime = currentTime;
    }
  },

  // Reset cooldown (for debugging)
  resetUltimateCooldown() {
    this.isUltimateOnCooldown = false;
    this.ultimateStartTime = 0;
    this.playerModel.setCanUseUltimate(true);
    cc.log("[UltimateSkillHandler] Ultimate cooldown reset");
  },
});
