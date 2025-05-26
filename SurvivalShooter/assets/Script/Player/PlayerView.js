// PlayerView.js - Updated với skill riêng biệt
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
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,

    // References
    playerModel: null,
    meleeSkillNode: null, // MCSkill node
    rangedSkillNode: null, // MCSkillArrow node
  },

  onLoad() {
    // Khởi tạo animation states
    this.setAnimationActive(this.walkAnim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    // Initialize skill nodes
    if (this.meleeSkillNode) {
      this.meleeSkillNode.active = false;
    }
    if (this.rangedSkillNode) {
      this.rangedSkillNode.active = false;
    }
  },

  // === ANIMATION METHODS ===
  playWalkAnimation() {
    if (!this.walkAnim) return;

    if (!this.walkAnim.getAnimationState("Soldier").isPlaying) {
      this.walkAnim.play("Soldier");
    }
  },

  stopWalkAnimation() {
    if (!this.walkAnim) return;

    if (this.walkAnim.getAnimationState("Soldier").isPlaying) {
      this.walkAnim.stop("Soldier");
    }
  },

  playMeleeAttackAnimation(onFinished) {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.meleeAttackAnim, true);

    const attackState = this.meleeAttackAnim.getAnimationState("SoldierAttack");
    if (attackState && onFinished) {
      this.meleeAttackAnim.play("SoldierAttack");
      attackState.once("finished", onFinished);
    } else {
      if (onFinished) onFinished();
    }
  },

  playRangedAttackAnimation(onFinished) {
    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.rangedAttackAnim, true);

    const attackState = this.rangedAttackAnim.getAnimationState("ArrowAttack");
    if (attackState && onFinished) {
      this.rangedAttackAnim.play("ArrowAttack");
      attackState.once("finished", onFinished);
    } else {
      if (onFinished) onFinished();
    }
  },

  // === SKILL ANIMATION METHODS - Updated to handle both skill types ===
  playSkillAnimation(skillType, onFinished) {
    const skillNode =
      skillType === "melee" ? this.meleeSkillNode : this.rangedSkillNode;
    const animName = skillType === "melee" ? "SkillSplash" : "MCSkillArrow";

    if (!skillNode) {
      console.warn(`[PlayerView] ${skillType} skill node not found`);
      if (onFinished) onFinished();
      return;
    }

    skillNode.setPosition(cc.v2(0, 0));
    skillNode.active = true;

    const anim = skillNode.getComponent(cc.Animation);
    if (anim && anim.getAnimationState(animName)) {
      anim.play(animName);
      anim.once("finished", () => {
        skillNode.active = false;
        if (onFinished) onFinished();
      });
    } else {
      console.warn(
        `[PlayerView] Animation '${animName}' not found on skill node`
      );
      skillNode.active = false;
      if (onFinished) onFinished();
    }
  },

  // Backward compatibility - old method
  playSkillAnimation_Old(onFinished) {
    // Default to melee skill for backward compatibility
    this.playSkillAnimation("melee", onFinished);
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
    if (!isActive) {
      animationComponent.stop();
    }
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
    if (!this.playerModel || !this.hpLabel) return;
    this.hpLabel.string = `HP: ${this.playerModel.getCurrentHp()}`;
  },

  updateStatsUI() {
    if (!this.playerModel) return;

    if (this.attackLabel) {
      this.attackLabel.string = `Atk: ${this.playerModel.getBaseAttack()}`;
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
      this.attackRangeLabel.string = `Melee: ${this.playerModel.getMeleeAttackRange()} | Ranged: ${this.playerModel.getRangedAttackRange()}`;
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

  // New method to set skill nodes from PlayerController
  setSkillNodes(meleeSkillNode, rangedSkillNode) {
    this.meleeSkillNode = meleeSkillNode;
    this.rangedSkillNode = rangedSkillNode;

    // Make sure they start inactive
    if (this.meleeSkillNode) {
      this.meleeSkillNode.active = false;
    }
    if (this.rangedSkillNode) {
      this.rangedSkillNode.active = false;
    }
  },
});
