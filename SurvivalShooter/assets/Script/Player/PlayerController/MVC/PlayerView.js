// PlayerView.js - Updated with Ultimate Skill support
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
    ultimateLabel: cc.Label, // New label for ultimate status
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,

    // References
    playerModel: null,
    meleeSkillNode: null,
    rangedSkillNode: null,
    ultimateSkillNode: null, // New reference for ultimate skill node
  },

  onLoad() {
    this.setAnimationActive(this.walkAnim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    if (this.meleeSkillNode) this.meleeSkillNode.active = false;
    if (this.rangedSkillNode) this.rangedSkillNode.active = false;
    if (this.ultimateSkillNode) this.ultimateSkillNode.active = false;
  },

  // === ANIMATION METHODS ===
  playWalkAnimation() {
    if (!this.walkAnim) return;
    const state = this.walkAnim.getAnimationState("Soldier");
    if (state && !state.isPlaying) {
      this.walkAnim.play("Soldier");
    }
  },

  stopWalkAnimation() {
    if (!this.walkAnim) return;
    const state = this.walkAnim.getAnimationState("Soldier");
    if (state && state.isPlaying) {
      this.walkAnim.stop("Soldier");
    }
  },

  playMeleeAttackAnimation(onFinished) {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.meleeAttackAnim, true);

    const attackState = this.meleeAttackAnim.getAnimationState("SoldierAttack");
    if (attackState) {
      this.meleeAttackAnim.play("SoldierAttack");
      if (onFinished) attackState.once("finished", onFinished);
    } else if (onFinished) {
      onFinished();
    }
  },

  playRangedAttackAnimation(onFinished) {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.rangedAttackAnim, true);

    const attackState = this.rangedAttackAnim.getAnimationState("ArrowAttack");
    if (attackState) {
      this.rangedAttackAnim.play("ArrowAttack");
      if (onFinished) attackState.once("finished", onFinished);
    } else if (onFinished) {
      onFinished();
    }
  },

  // === SKILL ANIMATION METHODS ===
  playSkillAnimation(skillType, onFinished) {
    const skillNode =
      skillType === "melee" ? this.meleeSkillNode : this.rangedSkillNode;
    const animName = skillType === "melee" ? "SkillSplash" : "MCSkillArrow";

    if (!skillNode) {
      if (onFinished) onFinished();
      return;
    }

    if (skillType === "melee") {
      skillNode.setPosition(cc.v2(0, 0));
      skillNode.setScale(1, 1);
    } else {
      this.setupRangedSkillDisplay(skillNode);
    }

    skillNode.active = true;
    const anim = skillNode.getComponent(cc.Animation);

    if (anim && anim.getAnimationState(animName)) {
      anim.play(animName);
      anim.once("finished", () => {
        skillNode.active = false;
        if (onFinished) onFinished();
      });
    } else {
      skillNode.active = false;
      if (onFinished) onFinished();
    }
  },

  // === ULTIMATE SKILL ANIMATION ===
  playUltimateAnimation(onFinished) {
    if (!this.ultimateSkillNode) {
      cc.warn("[PlayerView] Ultimate skill node not found!");
      if (onFinished) onFinished();
      return;
    }

    // Position ultimate effect at player center
    this.ultimateSkillNode.setPosition(cc.v2(0, 0));
    this.ultimateSkillNode.setScale(1.5, 1.5); // Make it bigger for ultimate
    this.ultimateSkillNode.active = true;

    const anim = this.ultimateSkillNode.getComponent(cc.Animation);

    if (anim && anim.getAnimationState("Ultimate")) {
      cc.log("[PlayerView] Playing Ultimate animation");
      anim.play("Ultimate");
      anim.once("finished", () => {
        this.ultimateSkillNode.active = false;
        cc.log("[PlayerView] Ultimate animation finished");
        if (onFinished) onFinished();
      });
    } else {
      cc.warn("[PlayerView] Ultimate animation state not found!");
      this.ultimateSkillNode.active = false;
      if (onFinished) onFinished();
    }
  },

  setupRangedSkillDisplay(skillNode) {
    const canvasSize = this.node.parent.getContentSize();
    const skillNodeSize = skillNode.getContentSize();

    skillNode.setPosition(cc.v2(0, 0));
    const scaleX = canvasSize.width / skillNodeSize.width;
    skillNode.setScale(scaleX, 1);
  },

  finishAttackAnimation() {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.walkAnim, true);
  },

  setAllAttackAnimationsOff() {
    this.setAnimationActive(this.walkAnim, false);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);
  },

  setAnimationActive(animationComponent, isActive) {
    if (!animationComponent || !animationComponent.node) return;
    animationComponent.node.active = isActive;
    if (!isActive) animationComponent.stop();
  },

  // === VISUAL EFFECTS ===
  showDamageEffect() {
    this.node.runAction(cc.sequence(cc.fadeTo(0.1, 100), cc.fadeTo(0.1, 255)));
  },

  updatePlayerScale(direction) {
    if (direction.x !== 0) {
      this.node.scaleX = direction.x > 0 ? 1 : -1;
    }
  },

  // === UI UPDATE METHODS ===
  updateHpUI() {
    if (this.playerModel && this.hpLabel) {
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

    // Update ultimate UI
    this.updateUltimateUI();
  },

  updateUltimateUI() {
    if (!this.ultimateLabel || !this.playerModel) return;

    if (this.playerModel.hasUltimateSkill()) {
      const canUse = this.playerModel.canUseUltimate();
      this.ultimateLabel.string = canUse
        ? "Ultimate: READY"
        : "Ultimate: COOLDOWN";
      this.ultimateLabel.node.color = canUse ? cc.Color.GREEN : cc.Color.YELLOW;
    } else {
      this.ultimateLabel.string = "Ultimate: LOCKED";
      this.ultimateLabel.node.color = cc.Color.GRAY;
    }
  },

  updateExpUI() {
    if (!this.playerModel) return;

    if (this.expBar) {
      this.expBar.progress =
        this.playerModel.getCurrentExp() / this.playerModel.getExpToNextLevel();
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

  // === SETUP ===
  setPlayerModel(model) {
    this.playerModel = model;
    this.updateAllUI();
  },

  setSkillNodes(meleeSkillNode, rangedSkillNode, ultimateSkillNode = null) {
    this.meleeSkillNode = meleeSkillNode;
    this.rangedSkillNode = rangedSkillNode;
    this.ultimateSkillNode = ultimateSkillNode;

    if (this.meleeSkillNode) this.meleeSkillNode.active = false;
    if (this.rangedSkillNode) this.rangedSkillNode.active = false;
    if (this.ultimateSkillNode) this.ultimateSkillNode.active = false;
  },
});
