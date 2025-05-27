cc.Class({
  extends: cc.Component,

  properties: {
    // Animation components - kéo từ editor
    walkAnim: cc.Animation,
    meleeAttackAnim: cc.Animation,
    rangedAttackAnim: cc.Animation,

    // Skill nodes - kéo từ editor
    meleeSkillNode: cc.Node,
    rangedSkillNode: cc.Node,
    ultimateSkillNode: cc.Node,

    // UI Labels
    hpLabel: cc.Label,
    attackLabel: cc.Label,
    critLabel: cc.Label,
    expRangeLabel: cc.Label,
    attackRangeLabel: cc.Label,
    skillDamageLabel: cc.Label,
    ultimateLabel: cc.Label,
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,

    // References
    playerModel: null,
    animationController: null, // Reference đến PlayerAnimationController
  },

  onLoad() {
    // Validate animation components first
    if (!this.walkAnim || !this.meleeAttackAnim || !this.rangedAttackAnim) {
      console.error("Missing animation components in PlayerView:", {
        walkAnim: !!this.walkAnim,
        meleeAttackAnim: !!this.meleeAttackAnim,
        rangedAttackAnim: !!this.rangedAttackAnim,
      });
      return;
    }

    // Lấy reference đến animation controller
    this.animationController = this.node.getComponent("HandlerAnimation");

    if (!this.animationController) {
      console.error("HandlerAnimation component not found on node");
      return;
    }

    // Setup animation controller trong nextTick để đảm bảo tất cả đã ready
    this.scheduleOnce(() => {
      this.initializeAnimationController();
    }, 0);
  },

  initializeAnimationController() {
    if (!this.animationController) return;

    // Truyền các animation components trước
    this.animationController.setAnimationComponents(
      this.walkAnim,
      this.meleeAttackAnim,
      this.rangedAttackAnim
    );

    // Sau đó truyền skill nodes
    this.animationController.setSkillNodes(
      this.meleeSkillNode,
      this.rangedSkillNode,
      this.ultimateSkillNode
    );

    // Log status để debug
    this.animationController.logStatus();

    console.log("PlayerView: Animation controller initialized successfully");
  },

  // === UI UPDATE METHODS ===
  updateHpUI() {
    if (this.hpLabel && this.playerModel) {
      this.hpLabel.string = `HP: ${this.playerModel.getCurrentHp()}`;
    }
  },

  updateStatsUI() {
    if (!this.playerModel) return;

    if (this.attackLabel) {
      this.attackLabel.string = `Atk: ${this.playerModel.getBaseAttack()}`;
    }
    if (this.skillDamageLabel) {
      this.skillDamageLabel.string = `Skill: ${this.playerModel.getSkillDamage()}`;
    }
    if (this.critLabel) {
      this.critLabel.string = `Crit: ${Math.floor(
        this.playerModel.getCriticalRate() * 100
      )}%`;
    }
    if (this.expRangeLabel) {
      this.expRangeLabel.string = `EXP Range: ${this.playerModel.getExpPickupRange()}`;
    }
    if (this.attackRangeLabel) {
      this.attackRangeLabel.string = `Melee: ${this.playerModel.getMeleeAttackRange()} | Archer: ${this.playerModel.getRangedAttackRange()}`;
    }

    this.updateUltimateUI();
  },

  updateUltimateUI() {
    if (!this.ultimateLabel || !this.playerModel) return;

    const label = this.ultimateLabel;
    const hasUltimate = this.playerModel.hasUltimateSkill();

    if (!hasUltimate) {
      label.string = "Ultimate: LOCKED";
      label.node.color = cc.Color.GRAY;
      return;
    }

    const handler = this.node.getComponent("UltimateSkillHandler");

    if (this.playerModel.canUseUltimate() && !handler?.isUltimateOnCooldown) {
      label.string = "Ultimate: READY";
      label.node.color = cc.Color.GREEN;
    } else {
      const cooldown = handler?.getRemainingCooldown() || 0;
      label.string = `Ultimate: COOLDOWN (${Math.ceil(cooldown)}s)`;
      label.node.color = cc.Color.YELLOW;
    }
  },

  updateExpUI() {
    if (!this.playerModel) return;

    if (this.expBar) {
      const progress =
        this.playerModel.getCurrentExp() / this.playerModel.getExpToNextLevel();
      this.expBar.progress = progress;
    }

    if (this.levelLabel) {
      this.levelLabel.string = `Lv: ${this.playerModel.getLevel()}`;
    }
  },

  updateAllUI() {
    this.updateHpUI();
    this.updateStatsUI();
    this.updateExpUI();
  },

  // === ANIMATION DELEGATE METHODS ===
  // Các method này delegate việc xử lý animation sang AnimationController
  playWalkAnimation() {
    if (!this.animationController?.isReady()) {
      console.warn("Animation controller not ready for walk animation");
      return;
    }
    this.animationController.playWalkAnimation();
  },

  stopWalkAnimation() {
    if (!this.animationController?.isReady()) {
      console.warn("Animation controller not ready for stop walk animation");
      return;
    }
    this.animationController.stopWalkAnimation();
  },

  playMeleeAttackAnimation(onFinished) {
    if (!this.animationController?.isReady()) {
      console.warn("Animation controller not ready for melee attack animation");
      onFinished?.();
      return;
    }
    this.animationController.playMeleeAttackAnimation(onFinished);
  },

  playRangedAttackAnimation(onFinished) {
    if (!this.animationController?.isReady()) {
      console.warn(
        "Animation controller not ready for ranged attack animation"
      );
      onFinished?.();
      return;
    }
    this.animationController.playRangedAttackAnimation(onFinished);
  },

  playSkillAnimation(skillType, onFinished) {
    if (!this.animationController?.isReady()) {
      console.warn("Animation controller not ready for skill animation");
      onFinished?.();
      return;
    }
    this.animationController.playSkillAnimation(skillType, onFinished);
  },

  playUltimateAnimation(onFinished) {
    if (!this.animationController?.isReady()) {
      console.warn("Animation controller not ready for ultimate animation");
      onFinished?.();
      return;
    }
    this.animationController.playUltimateAnimation(onFinished);
  },

  finishAttackAnimation() {
    if (!this.animationController?.isReady()) {
      console.warn(
        "Animation controller not ready for finish attack animation"
      );
      return;
    }
    this.animationController.finishAttackAnimation();
  },

  showDamageEffect() {
    if (!this.animationController) {
      console.warn("Animation controller not available for damage effect");
      return;
    }
    this.animationController.showDamageEffect();
  },

  updatePlayerScale(direction) {
    if (!this.animationController) {
      console.warn("Animation controller not available for scale update");
      return;
    }
    this.animationController.updatePlayerScale(direction);
  },

  // === SETUP METHODS ===
  setPlayerModel(model) {
    this.playerModel = model;
    this.updateAllUI();
  },

  // Deprecated - không cần method này nữa
  setSkillNodes(melee, ranged, ultimate = null) {
    console.warn("setSkillNodes is deprecated, skill nodes are set in onLoad");
  },

  // === DEBUG METHODS ===
  logViewStatus() {
    console.log("PlayerView Status:", {
      walkAnim: !!this.walkAnim,
      meleeAttackAnim: !!this.meleeAttackAnim,
      rangedAttackAnim: !!this.rangedAttackAnim,
      meleeSkillNode: !!this.meleeSkillNode,
      rangedSkillNode: !!this.rangedSkillNode,
      ultimateSkillNode: !!this.ultimateSkillNode,
      animationControllerExists: !!this.animationController,
      animationControllerReady: this.animationController?.isReady() || false,
    });
  },
});
