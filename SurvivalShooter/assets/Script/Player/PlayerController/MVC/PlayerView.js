// PlayerView.js - Updated with skillDamage UI integration
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
    skillDamageLabel: cc.Label, // New UI element for skill damage
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

  // === SKILL ANIMATION METHODS - Enhanced with better logging ===
  playSkillAnimation(skillType, onFinished) {
    const skillNode =
      skillType === "melee" ? this.meleeSkillNode : this.rangedSkillNode;
    const animName = skillType === "melee" ? "SkillSplash" : "MCSkillArrow";

    if (!skillNode) {
      cc.warn(`[PlayerView] ${skillType} skill node not found`);
      if (onFinished) onFinished();
      return;
    }

    // Log skill animation start
    const skillDamage = this.playerModel?.getSkillDamage() || 0;
    cc.log(
      `[PlayerView] Playing ${skillType} skill animation with skill damage: ${skillDamage}`
    );

    // Set position và scale dựa trên skill type
    if (skillType === "melee") {
      // Melee skill: centered on player
      skillNode.setPosition(cc.v2(0, 0));
      skillNode.setScale(1, 1);
    } else {
      // Ranged skill: horizontal line across screen
      this.setupRangedSkillDisplay(skillNode);
    }

    skillNode.active = true;

    const anim = skillNode.getComponent(cc.Animation);
    if (anim && anim.getAnimationState(animName)) {
      anim.play(animName);
      anim.once("finished", () => {
        skillNode.active = false;
        cc.log(`[PlayerView] ${skillType} skill animation finished`);
        if (onFinished) onFinished();
      });
    } else {
      cc.warn(`[PlayerView] Animation '${animName}' not found on skill node`);
      skillNode.active = false;
      if (onFinished) onFinished();
    }
  },

  setupRangedSkillDisplay(skillNode) {
    // Get canvas size for full screen width
    const canvasSize = this.node.parent.getContentSize();
    const skillNodeSize = skillNode.getContentSize();

    // Position at player's Y position, centered horizontally
    skillNode.setPosition(cc.v2(0, 0));

    // Scale to cover full screen width
    const scaleX = canvasSize.width / skillNodeSize.width;
    const scaleY = 1; // Keep original height or adjust as needed

    skillNode.setScale(scaleX, scaleY);

    cc.log(
      `[PlayerView] Ranged skill scaled to: ${scaleX}x${scaleY}, Canvas: ${canvasSize.width}x${canvasSize.height}`
    );
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

  // === UI UPDATE METHODS - Enhanced with skillDamage ===
  updateHpUI() {
    if (!this.playerModel || !this.hpLabel) return;
    this.hpLabel.string = `HP: ${this.playerModel.getCurrentHp()}`;
  },

  updateStatsUI() {
    if (!this.playerModel) return;

    // Update attack damage
    if (this.attackLabel) {
      this.attackLabel.string = `Atk: ${this.playerModel.getBaseAttack()}`;
    }

    // Update skill damage - NEW
    if (this.skillDamageLabel) {
      this.skillDamageLabel.string = `Skill: ${this.playerModel.getSkillDamage()}`;
    }

    // Update critical rate
    if (this.critLabel) {
      this.critLabel.string = `Crit: ${Math.floor(
        this.playerModel.getCriticalRate() * 100
      )}%`;
    }

    // Update pickup range
    if (this.expRangeLabel) {
      this.expRangeLabel.string = `EXP Range: ${this.playerModel.getExpPickupRange()}`;
    }

    // Update attack ranges
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

  // === SKILL DAMAGE SPECIFIC UI UPDATES ===
  updateSkillDamageUI() {
    if (!this.playerModel || !this.skillDamageLabel) return;

    const skillDamage = this.playerModel.getSkillDamage();
    this.skillDamageLabel.string = `Skill: ${skillDamage}`;

    // Visual feedback for skill damage changes
    this.skillDamageLabel.node.runAction(
      cc.sequence(cc.scaleTo(0.1, 1.2), cc.scaleTo(0.1, 1.0))
    );
  },

  // Enhanced method to show skill damage notifications
  showSkillDamageIncrease(oldValue, newValue) {
    if (!this.skillDamageLabel) return;

    // Update the label
    this.updateSkillDamageUI();

    // Show floating text or effect
    const increase = newValue - oldValue;
    cc.log(
      `[PlayerView] Skill damage increased by ${increase}: ${oldValue} -> ${newValue}`
    );

    // Could implement floating text here
    // this.showFloatingText(`+${increase} Skill DMG`, cc.Color.YELLOW);
  },

  // === SETUP ===
  setPlayerModel(model) {
    this.playerModel = model;
    this.updateAllUI();
  },

  // Enhanced method to set skill nodes with better initialization
  setSkillNodes(meleeSkillNode, rangedSkillNode) {
    this.meleeSkillNode = meleeSkillNode;
    this.rangedSkillNode = rangedSkillNode;

    // Make sure they start inactive
    if (this.meleeSkillNode) {
      this.meleeSkillNode.active = false;
      cc.log("[PlayerView] Melee skill node initialized");
    }
    if (this.rangedSkillNode) {
      this.rangedSkillNode.active = false;
      cc.log("[PlayerView] Ranged skill node initialized");
    }
  },

  // === DEBUG/UTILITY METHODS ===
  logCurrentStats() {
    if (!this.playerModel) return;

    cc.log(`[PlayerView] Current Stats:
      HP: ${this.playerModel.getCurrentHp()}/${this.playerModel.getMaxHp()}
      Attack: ${this.playerModel.getBaseAttack()}
      Skill Damage: ${this.playerModel.getSkillDamage()}
      Crit Rate: ${Math.floor(this.playerModel.getCriticalRate() * 100)}%
      Level: ${this.playerModel.getLevel()}
      EXP: ${this.playerModel.getCurrentExp()}/${this.playerModel.getExpToNextLevel()}
    `);
  },

  // Method to handle skill buff visual feedback
  onSkillBuffApplied(skillId, amount) {
    if (skillId === 5) {
      // Skill Damage buff
      this.updateSkillDamageUI();
      cc.log(`[PlayerView] Skill damage buff applied: +${amount}`);
    } else {
      this.updateStatsUI();
    }
  },
});
