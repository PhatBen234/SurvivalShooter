cc.Class({
  extends: cc.Component,

  properties: {
    // Animation components
    walkAnim: cc.Animation,
    meleeAttackAnim: cc.Animation,
    rangedAttackAnim: cc.Animation,

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
    meleeSkillNode: null,
    rangedSkillNode: null,
    ultimateSkillNode: null,
  },

  onLoad() {
    this.setAnimationActive(this.walkAnim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    this.deactivateSkillNodes();
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
    if (direction.x !== 0) this.node.scaleX = direction.x > 0 ? 1 : -1;
  },

  updateHpUI() {
    if (this.hpLabel && this.playerModel) {
      this.hpLabel.string = `HP: ${this.playerModel.getCurrentHp()}`;
    }
  },

  updateStatsUI() {
    if (!this.playerModel) return;

    this.attackLabel.string = `Atk: ${this.playerModel.getBaseAttack()}`;
    this.skillDamageLabel.string = `Skill: ${this.playerModel.getSkillDamage()}`;
    this.critLabel.string = `Crit: ${Math.floor(
      this.playerModel.getCriticalRate() * 100
    )}%`;
    this.expRangeLabel.string = `EXP Range: ${this.playerModel.getExpPickupRange()}`;
    this.attackRangeLabel.string = `Melee: ${this.playerModel.getMeleeAttackRange()} | Archer: ${this.playerModel.getRangedAttackRange()}`;

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
  },

  deactivateSkillNodes() {
    if (this.meleeSkillNode) this.meleeSkillNode.active = false;
    if (this.rangedSkillNode) this.rangedSkillNode.active = false;
    if (this.ultimateSkillNode) this.ultimateSkillNode.active = false;
  },
});
