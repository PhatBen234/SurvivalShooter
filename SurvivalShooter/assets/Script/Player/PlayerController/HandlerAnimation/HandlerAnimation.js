cc.Class({
  extends: cc.Component,

  properties: {
    // Không cần properties nữa, nhận từ View
  },

  onLoad() {
    // Animation components và skill nodes sẽ được set từ View
    this.walkAnim = null;
    this.meleeAttackAnim = null;
    this.rangedAttackAnim = null;
    this.meleeSkillNode = null;
    this.rangedSkillNode = null;
    this.ultimateSkillNode = null;

    // Flag to check if components are initialized
    this.isInitialized = false;
  },

  // === BASIC ANIMATION METHODS ===
  playWalkAnimation() {
    if (!this.isInitialized || !this.walkAnim) {
      console.warn("Walk animation not initialized");
      return;
    }
    this.playAnimationIfNotPlaying(this.walkAnim, "Soldier");
  },

  stopWalkAnimation() {
    if (!this.isInitialized || !this.walkAnim) {
      console.warn("Walk animation not initialized");
      return;
    }
    this.stopAnimationIfPlaying(this.walkAnim, "Soldier");
  },

  playMeleeAttackAnimation(onFinished) {
    if (!this.isInitialized || !this.meleeAttackAnim) {
      console.warn("Melee attack animation not initialized");
      onFinished?.();
      return;
    }
    this.playAttackAnimation(this.meleeAttackAnim, "SoldierAttack", onFinished);
  },

  playRangedAttackAnimation(onFinished) {
    if (!this.isInitialized || !this.rangedAttackAnim) {
      console.warn("Ranged attack animation not initialized");
      onFinished?.();
      return;
    }
    this.playAttackAnimation(this.rangedAttackAnim, "ArrowAttack", onFinished);
  },

  // === ATTACK ANIMATION LOGIC ===
  playAttackAnimation(animComponent, animName, onFinished) {
    if (!animComponent) {
      console.warn(`Animation component is null for ${animName}`);
      onFinished?.();
      return;
    }

    this.setAllAttackAnimationsOff();
    this.setAnimationActive(animComponent, true);

    const animState = animComponent.getAnimationState(animName);
    if (animState) {
      animComponent.play(animName);
      if (onFinished) {
        // Remove any existing listeners to prevent multiple callbacks
        animState.off("finished");
        animState.once("finished", onFinished);
      }
    } else {
      console.warn(`Animation state not found: ${animName}`);
      onFinished?.();
    }
  },

  finishAttackAnimation() {
    if (!this.isInitialized) return;

    this.setAllAttackAnimationsOff();
    this.setAnimationActive(this.walkAnim, true);
  },

  setAllAttackAnimationsOff() {
    if (!this.isInitialized) return;

    [this.walkAnim, this.meleeAttackAnim, this.rangedAttackAnim].forEach(
      (anim) => {
        if (anim) {
          this.setAnimationActive(anim, false);
        }
      }
    );
  },

  // === SKILL ANIMATION METHODS ===
  playSkillAnimation(skillType, onFinished) {
    if (!this.isInitialized) {
      console.warn("Skill animations not initialized");
      onFinished?.();
      return;
    }

    const skillNode =
      skillType === "melee" ? this.meleeSkillNode : this.rangedSkillNode;
    const animName = skillType === "melee" ? "SkillSplash" : "MCSkillArrow";

    if (!skillNode) {
      console.warn(`Skill node not found for type: ${skillType}`);
      return onFinished?.();
    }

    skillNode.setPosition(cc.v2(0, 0));
    skillNode.setScale(
      skillType === "melee" ? 1 : this.getRangedSkillScaleX(skillNode),
      1
    );
    skillNode.active = true;

    const anim = skillNode.getComponent(cc.Animation);
    if (!anim) {
      console.warn(`Animation component not found on skill node: ${skillType}`);
      skillNode.active = false;
      onFinished?.();
      return;
    }

    const animState = anim.getAnimationState(animName);
    if (animState) {
      anim.play(animName);
      anim.off("finished"); // Remove existing listeners
      anim.once("finished", () => {
        skillNode.active = false;
        onFinished?.();
      });
    } else {
      console.warn(`Skill animation state not found: ${animName}`);
      skillNode.active = false;
      onFinished?.();
    }
  },

  playUltimateAnimation(onFinished) {
    if (!this.isInitialized || !this.ultimateSkillNode) {
      console.warn("Ultimate animation not initialized");
      return onFinished?.();
    }

    this.ultimateSkillNode.setPosition(cc.v2(0, 0));
    this.ultimateSkillNode.setScale(1.5, 1.5);
    this.ultimateSkillNode.active = true;

    const anim = this.ultimateSkillNode.getComponent(cc.Animation);
    if (!anim) {
      console.warn("Ultimate animation component not found");
      this.ultimateSkillNode.active = false;
      onFinished?.();
      return;
    }

    const animState = anim.getAnimationState("Ultimate");
    if (animState) {
      anim.play("Ultimate");
      anim.off("finished"); // Remove existing listeners
      anim.once("finished", () => {
        this.ultimateSkillNode.active = false;
        onFinished?.();
      });
    } else {
      console.warn("Ultimate animation state not found");
      this.ultimateSkillNode.active = false;
      onFinished?.();
    }
  },

  // === UTILITY METHODS ===
  getRangedSkillScaleX(skillNode) {
    if (!skillNode || !this.node.parent) return 1;

    const canvasSize = this.node.parent.getContentSize();
    const skillSize = skillNode.getContentSize();
    return skillSize.width > 0 ? canvasSize.width / skillSize.width : 1;
  },

  setAnimationActive(animationComponent, isActive) {
    if (!animationComponent || !animationComponent.node) return;

    animationComponent.node.active = isActive;
    if (!isActive) {
      animationComponent.stop();
    }
  },

  playAnimationIfNotPlaying(animComp, animName) {
    if (!animComp) {
      console.warn(`Animation component is null for ${animName}`);
      return;
    }

    const state = animComp.getAnimationState(animName);
    if (state && !state.isPlaying) {
      animComp.play(animName);
    } else if (!state) {
      console.warn(`Animation state not found: ${animName}`);
    }
  },

  stopAnimationIfPlaying(animComp, animName) {
    if (!animComp) return;

    const state = animComp.getAnimationState(animName);
    if (state && state.isPlaying) {
      animComp.stop(animName);
    }
  },

  // === VISUAL EFFECTS ===
  showDamageEffect() {
    if (!this.node) return;

    this.node.runAction(cc.sequence(cc.fadeTo(0.1, 100), cc.fadeTo(0.1, 255)));
  },

  updatePlayerScale(direction) {
    if (!this.node || !direction) return;

    if (direction.x !== 0) {
      this.node.scaleX = direction.x > 0 ? 1 : -1;
    }
  },

  // === SETUP METHODS ===
  setAnimationComponents(walkAnim, meleeAttackAnim, rangedAttackAnim) {
    // Validate inputs
    if (!walkAnim || !meleeAttackAnim || !rangedAttackAnim) {
      console.error("Missing animation components:", {
        walkAnim: !!walkAnim,
        meleeAttackAnim: !!meleeAttackAnim,
        rangedAttackAnim: !!rangedAttackAnim,
      });
      return;
    }

    this.walkAnim = walkAnim;
    this.meleeAttackAnim = meleeAttackAnim;
    this.rangedAttackAnim = rangedAttackAnim;

    // Initialize animations
    this.setAnimationActive(this.walkAnim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    console.log("Animation components set successfully");
  },

  setSkillNodes(melee, ranged, ultimate = null) {
    this.meleeSkillNode = melee;
    this.rangedSkillNode = ranged;
    this.ultimateSkillNode = ultimate;

    this.deactivateSkillNodes();

    // Mark as initialized after both animations and skills are set
    this.isInitialized = true;
    console.log("Skill nodes set successfully, controller initialized");
  },

  deactivateSkillNodes() {
    if (this.meleeSkillNode) this.meleeSkillNode.active = false;
    if (this.rangedSkillNode) this.rangedSkillNode.active = false;
    if (this.ultimateSkillNode) this.ultimateSkillNode.active = false;
  },

  // === VALIDATION METHODS ===
  isReady() {
    return (
      this.isInitialized &&
      this.walkAnim &&
      this.meleeAttackAnim &&
      this.rangedAttackAnim
    );
  },

  logStatus() {
    console.log("Animation Controller Status:", {
      isInitialized: this.isInitialized,
      walkAnim: !!this.walkAnim,
      meleeAttackAnim: !!this.meleeAttackAnim,
      rangedAttackAnim: !!this.rangedAttackAnim,
      meleeSkillNode: !!this.meleeSkillNode,
      rangedSkillNode: !!this.rangedSkillNode,
      ultimateSkillNode: !!this.ultimateSkillNode,
    });
  },
});
