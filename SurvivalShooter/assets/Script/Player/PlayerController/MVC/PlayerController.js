cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
    arrowPrefab: cc.Prefab,
    skillManager: cc.Node,

    // Skill nodes
    meleeSkillNode: cc.Node, // MCSkill node
    rangedSkillNode: cc.Node, // MCSkillArrow node
    ultimateSkillNode: cc.Node, // MCUltimate node
  },

  onLoad() {
    this.initComponents();
    this.initHandlers();
  },

  onDestroy() {
    // Input handler will handle its own cleanup
  },

  update(dt) {
    this.movementHandler?.handleMovement?.(dt);
    this.combatHandler?.handleAutoAttack?.(dt);
    this.skillHandler?.handleSkill?.(dt);
    this.ultimateHandler?.update?.(dt); // Update ultimate cooldown
    this.expHandler?.collectNearbyExp?.(dt);

    // Auto-trigger ultimate when available
    this.handleAutoUltimate();
  },

  // === INITIALIZATION ===
  initComponents() {
    this.playerModel = this.getComponent("PlayerModel");
    this.playerView = this.getComponent("PlayerView");
    this.meleeAttackHandler = this.getComponent("MeleeAttackHandler");
    this.rangedAttackHandler = this.getComponent("RangedAttackHandler");

    if (this.playerView) {
      this.playerView.setPlayerModel(this.playerModel);
      // FIX: Pass ALL skill nodes including ultimateSkillNode to PlayerView
      this.playerView.setSkillNodes(
        this.meleeSkillNode,
        this.rangedSkillNode,
        this.ultimateSkillNode // <-- This was missing!
      );
    }

    // Initialize attack handlers with skill nodes
    this.meleeAttackHandler?.init(
      this.playerModel,
      this.playerView,
      this.canvasNode,
      this.meleeSkillNode
    );
    this.rangedAttackHandler?.init(
      this.playerModel,
      this.playerView,
      this.canvasNode,
      this.arrowPrefab,
      this.rangedSkillNode
    );
  },

  initHandlers() {
    // Initialize input handler
    this.inputHandler = this.getComponent("PlayerInputHandler");
    if (!this.inputHandler) {
      this.inputHandler = this.addComponent("PlayerInputHandler");
    }

    // Initialize movement handler
    this.movementHandler = this.getComponent("PlayerMovementHandler");
    if (!this.movementHandler) {
      this.movementHandler = this.addComponent("PlayerMovementHandler");
    }
    this.movementHandler.canvasNode = this.canvasNode;
    this.movementHandler.init(
      this.playerModel,
      this.playerView,
      this.inputHandler
    );

    // Initialize combat handler
    this.combatHandler = this.getComponent("PlayerCombatHandler");
    if (!this.combatHandler) {
      this.combatHandler = this.addComponent("PlayerCombatHandler");
    }
    this.combatHandler.canvasNode = this.canvasNode;
    this.combatHandler.init(
      this.playerModel,
      this.playerView,
      this.meleeAttackHandler,
      this.rangedAttackHandler,
      this.inputHandler
    );

    // Initialize skill handler
    this.skillHandler = this.getComponent("PlayerSkillHandler");
    if (!this.skillHandler) {
      this.skillHandler = this.addComponent("PlayerSkillHandler");
    }
    this.skillHandler.canvasNode = this.canvasNode;
    this.skillHandler.init(
      this.playerModel,
      this.playerView,
      this.meleeAttackHandler,
      this.rangedAttackHandler
    );

    // Initialize ultimate skill handler
    this.ultimateHandler = this.getComponent("UltimateSkillHandler");
    if (!this.ultimateHandler) {
      this.ultimateHandler = this.addComponent("UltimateSkillHandler");
    }
    this.ultimateHandler.init(
      this.playerModel,
      this.playerView, // Pass PlayerView so it can call animation methods
      this.canvasNode,
      this.ultimateSkillNode
    );

    // Initialize exp handler
    this.expHandler = this.getComponent("PlayerExpHandler");
    if (!this.expHandler) {
      this.expHandler = this.addComponent("PlayerExpHandler");
    }
    this.expHandler.canvasNode = this.canvasNode;
    this.expHandler.skillManager = this.skillManager;
    this.expHandler.init(this.playerModel, this.playerView);
  },

  // === AUTO ULTIMATE HANDLING ===
  handleAutoUltimate() {
    if (!this.ultimateHandler || !this.playerModel) return;

    // Auto-trigger ultimate when available and enemies are nearby
    if (this.ultimateHandler.shouldTriggerUltimate()) {
      cc.log("[PlayerController] Auto-triggering Ultimate Skill!");
      this.ultimateHandler.performUltimateSkill(() => {
        cc.log("[PlayerController] Ultimate Skill completed!");
      });
    }
  },

  // Rest of the methods remain the same...
  gainExp(amount) {
    this.expHandler?.gainExp?.(amount);
  },

  takeDamage(amount) {
    this.combatHandler?.takeDamage?.(amount);
  },

  applySkillBuff(skillId, amount) {
    this.skillHandler?.applySkillBuff?.(skillId, amount);

    if (skillId === 6) {
      cc.log(
        "[PlayerController] Ultimate Skill unlocked! Auto-trigger enabled."
      );
    }
  },

  triggerUltimate() {
    if (this.ultimateHandler) {
      this.ultimateHandler.forceUltimate(() => {
        cc.log("[PlayerController] Manual Ultimate Skill completed!");
      });
    }
  },

  getUltimateStatus() {
    return (
      this.ultimateHandler?.getUltimateStatus() || {
        hasUltimate: false,
        canUse: false,
        cooldown: 0,
      }
    );
  },

  getBaseAttack() {
    return this.playerModel?.getBaseAttack() || 0;
  },

  getSkillDamage() {
    return this.playerModel?.getSkillDamage() || 0;
  },

  getRangedAttackRange() {
    return this.playerModel?.getRangedAttackRange() || 0;
  },

  getMeleeAttackRange() {
    return this.playerModel?.getMeleeAttackRange() || 0;
  },

  getExpPickupRange() {
    return this.playerModel?.getExpPickupRange() || 0;
  },

  getCriticalRate() {
    return this.playerModel?.getCriticalRate() || 0;
  },

  getAttackRange() {
    cc.warn(
      "[PlayerController] getAttackRange is deprecated. Use getRangedAttackRange instead."
    );
    return this.getRangedAttackRange();
  },

  findEnemiesInRange(range) {
    return this.combatHandler?.findEnemiesInRange?.(range) || [];
  },

  findClosestEnemy(maxRange = 300) {
    return this.combatHandler?.findClosestEnemy?.(maxRange) || null;
  },
});
