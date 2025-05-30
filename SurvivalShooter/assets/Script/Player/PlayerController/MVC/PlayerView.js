cc.Class({
  extends: cc.Component,

  properties: {
    // Animation components
    walkAnim: cc.Animation,
    meleeAttackAnim: cc.Animation,
    rangedAttackAnim: cc.Animation,

    // UI Labels
    hpLabel: cc.Label,
    hpBar: cc.ProgressBar,
    attackLabel: cc.Label,
    critLabel: cc.Label,
    ultimateSprite: cc.Node,
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,

    // Sort Layer settings
    playerSortLayer: {
      default: 1000,
      tooltip: "Sort layer cho player (càng cao càng đè lên trên)",
    },
    dynamicSorting: {
      default: true,
      tooltip: "Tự động điều chỉnh sort order theo vị trí Y",
    },
    sortOffset: {
      default: 0,
      tooltip: "Offset thêm cho sort order",
    },

    // References
    playerModel: null,
    meleeSkillNode: null,
    rangedSkillNode: null,
    ultimateSkillNode: null,
  },

  onLoad() {
    this.setAnimationActive(this.walkAnim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    this.deactivateSkillNodes();

    // Thiết lập sort layer ban đầu
    this.initializeSortLayer();
  },

  start() {
    // Cập nhật sort layer liên tục nếu bật dynamic sorting
    if (this.dynamicSorting) {
      this.schedule(this.updateSortLayer, 0.1); // Cập nhật mỗi 0.1 giây
    }
  },

  // === SORT LAYER METHODS ===
  initializeSortLayer() {
    // Thiết lập zIndex cho node chính
    this.node.zIndex = this.playerSortLayer;

    // Thiết lập cho các animation nodes
    if (this.walkAnim && this.walkAnim.node) {
      this.walkAnim.node.zIndex = this.playerSortLayer + 1;
    }
    if (this.meleeAttackAnim && this.meleeAttackAnim.node) {
      this.meleeAttackAnim.node.zIndex = this.playerSortLayer + 1;
    }
    if (this.rangedAttackAnim && this.rangedAttackAnim.node) {
      this.rangedAttackAnim.node.zIndex = this.playerSortLayer + 1;
    }

    // Thiết lập cho skill nodes
    this.updateSkillNodesSortLayer();
  },

  updateSortLayer() {
    if (!this.dynamicSorting) return;

    // Tính toán sort order dựa trên vị trí Y (càng thấp càng gần camera)
    // Công thức: baseLayer - positionY + offset
    const baseOrder =
      this.playerSortLayer - Math.floor(this.node.y) + this.sortOffset;

    this.node.zIndex = baseOrder;

    // Cập nhật cho các animation nodes
    if (this.walkAnim && this.walkAnim.node) {
      this.walkAnim.node.zIndex = baseOrder + 1;
    }
    if (this.meleeAttackAnim && this.meleeAttackAnim.node) {
      this.meleeAttackAnim.node.zIndex = baseOrder + 1;
    }
    if (this.rangedAttackAnim && this.rangedAttackAnim.node) {
      this.rangedAttackAnim.node.zIndex = baseOrder + 1;
    }

    // Cập nhật skill effects luôn ở trên cùng
    this.updateSkillNodesSortLayer(baseOrder + 10);
  },

  updateSkillNodesSortLayer(baseOrder = null) {
    const order = baseOrder || this.playerSortLayer + 10;

    if (this.meleeSkillNode) {
      this.meleeSkillNode.zIndex = order + 1;
    }
    if (this.rangedSkillNode) {
      this.rangedSkillNode.zIndex = order + 1;
    }
    if (this.ultimateSkillNode) {
      this.ultimateSkillNode.zIndex = order + 2; // Ultimate effect ở trên cùng
    }
  },

  setSortLayer(newLayer) {
    this.playerSortLayer = newLayer;
    this.initializeSortLayer();
  },

  setDynamicSorting(enabled) {
    this.dynamicSorting = enabled;

    if (enabled) {
      this.schedule(this.updateSortLayer, 0.1);
    } else {
      this.unschedule(this.updateSortLayer);
      this.initializeSortLayer(); // Reset về sort layer cố định
    }
  },

  // Force update sort layer (gọi khi player di chuyển)
  forceUpdateSortLayer() {
    if (this.dynamicSorting) {
      this.updateSortLayer();
    }
  },

  // === ANIMATION METHODS ===
  playWalkAnimation() {
    this.playAnimationIfNotPlaying(this.walkAnim, "Soldier");
  },

  stopWalkAnimation() {
    this.stopAnimationIfPlaying(this.walkAnim, "Soldier");
  },

  playMeleeAttackAnimation(onFinished) {
    this.playAttackAnimation(this.meleeAttackAnim, "SoldierAttack", onFinished);
  },

  playRangedAttackAnimation(onFinished) {
    this.playAttackAnimation(this.rangedAttackAnim, "ArrowAttack", onFinished);
  },

  playAttackAnimation(animComponent, animName, onFinished) {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(animComponent, true);

    const animState = animComponent.getAnimationState(animName);
    if (animState) {
      animComponent.play(animName);
      if (onFinished) animState.once("finished", onFinished);
    } else {
      onFinished?.();
    }
  },

  playSkillAnimation(skillType, onFinished) {
    const skillNode =
      skillType === "melee" ? this.meleeSkillNode : this.rangedSkillNode;
    const animName = skillType === "melee" ? "SkillSplash" : "MCSkillArrow";

    if (!skillNode) return onFinished?.();

    skillNode.setPosition(cc.v2(0, 0));
    skillNode.setScale(
      skillType === "melee" ? 1 : this.getRangedSkillScaleX(skillNode),
      1
    );
    skillNode.active = true;

    // Đảm bảo skill effect luôn ở trên
    this.updateSkillNodesSortLayer();

    const anim = skillNode.getComponent(cc.Animation);
    const animState = anim?.getAnimationState(animName);

    if (animState) {
      anim.play(animName);
      anim.once("finished", () => {
        skillNode.active = false;
        onFinished?.();
      });
    } else {
      skillNode.active = false;
      onFinished?.();
    }
  },

  playUltimateAnimation(onFinished) {
    if (!this.ultimateSkillNode) return onFinished?.();

    this.ultimateSkillNode.setPosition(cc.v2(0, 0));
    this.ultimateSkillNode.setScale(1.5, 1.5);
    this.ultimateSkillNode.active = true;

    // Ultimate effect luôn ở trên cùng
    this.updateSkillNodesSortLayer();

    const anim = this.ultimateSkillNode.getComponent(cc.Animation);
    const animState = anim?.getAnimationState("Ultimate");

    if (animState) {
      anim.play("Ultimate");
      anim.once("finished", () => {
        this.ultimateSkillNode.active = false;
        onFinished?.();
      });
    } else {
      this.ultimateSkillNode.active = false;
      onFinished?.();
    }
  },

  getRangedSkillScaleX(skillNode) {
    const canvasSize = this.node.parent.getContentSize();
    const skillSize = skillNode.getContentSize();
    return canvasSize.width / skillSize.width;
  },

  finishAttackAnimation() {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.walkAnim, true);
  },

  setAllAttackAnimationsOff() {
    [this.walkAnim, this.meleeAttackAnim, this.rangedAttackAnim].forEach(
      (anim) => this.setAnimationActive(anim, false)
    );
  },

  setAnimationActive(animationComponent, isActive) {
    if (!animationComponent || !animationComponent.node) return;
    animationComponent.node.active = isActive;
    if (!isActive) animationComponent.stop();
  },

  playAnimationIfNotPlaying(animComp, animName) {
    const state = animComp?.getAnimationState(animName);
    if (state && !state.isPlaying) animComp.play(animName);
  },

  stopAnimationIfPlaying(animComp, animName) {
    const state = animComp?.getAnimationState(animName);
    if (state && state.isPlaying) animComp.stop(animName);
  },

  // === UI & EFFECTS ===
  showDamageEffect() {
    this.node.runAction(cc.sequence(cc.fadeTo(0.1, 100), cc.fadeTo(0.1, 255)));
  },

  updatePlayerScale(direction) {
    if (direction.x !== 0) {
      this.node.scaleX = direction.x > 0 ? 1 : -1;
      // Cập nhật sort layer khi thay đổi hướng
      this.forceUpdateSortLayer();
    }
  },

  updateHpUI() {
    if (this.hpLabel && this.playerModel) {
      this.hpLabel.string = `HP: ${this.playerModel.getCurrentHp()}/${this.playerModel.getMaxHp()}`;
    }
    const progress =
      this.playerModel.getCurrentHp() / this.playerModel.getMaxHp();
    if (this.hpBar) this.hpBar.progress = progress;
  },

  updateStatsUI() {
    if (!this.playerModel) return;

    this.attackLabel.string = `Atk: ${this.playerModel.getBaseAttack()}`;
    this.critLabel.string = `Crit: ${Math.floor(
      this.playerModel.getCriticalRate() * 100
    )}%`;
    this.updateUltimateUI();
  },

  updateUltimateUI() {
    if (!this.ultimateSprite || !this.playerModel) return;

    this.ultimateSprite.active = true;
    const hasUltimate = this.playerModel.hasUltimateSkill();

    if (!hasUltimate) {
      this.ultimateSprite.active = false;
      return;
    }

    const handler = this.node.getComponent("UltimateSkillHandler");

    if (this.playerModel.canUseUltimate() && !handler?.isUltimateOnCooldown) {
      // Đổi thành sprite frame của ultimate skill
    } else {
      const cooldown = handler?.getRemainingCooldown() || 0;
      // Đổi thành sprite frame của ultimate skill cooldown
    }
  },

  updateExpUI() {
    if (!this.playerModel) return;

    const progress =
      this.playerModel.getCurrentExp() / this.playerModel.getExpToNextLevel();
    if (this.expBar) this.expBar.progress = progress;
    if (this.levelLabel)
      this.levelLabel.string = `Lv: ${this.playerModel.getLevel()}`;
  },

  updateAllUI() {
    this.updateHpUI();
    this.updateStatsUI();
    this.updateExpUI();
  },

  // === SETUP ===
  setPlayerModel(model) {
    this.playerModel = model;
    this.updateAllUI();
  },

  setSkillNodes(melee, ranged, ultimate = null) {
    this.meleeSkillNode = melee;
    this.rangedSkillNode = ranged;
    this.ultimateSkillNode = ultimate;
    this.deactivateSkillNodes();
    this.updateSkillNodesSortLayer();
  },

  deactivateSkillNodes() {
    if (this.meleeSkillNode) this.meleeSkillNode.active = false;
    if (this.rangedSkillNode) this.rangedSkillNode.active = false;
    if (this.ultimateSkillNode) this.ultimateSkillNode.active = false;
  },

  onDestroy() {
    // Dọn dẹp schedule khi component bị destroy
    this.unschedule(this.updateSortLayer);
  },
});
