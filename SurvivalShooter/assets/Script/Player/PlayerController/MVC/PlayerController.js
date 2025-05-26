// PlayerController.js - Refactored main controller that coordinates all handlers
cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
    arrowPrefab: cc.Prefab,
    skillManager: cc.Node,

    // Skill nodes
    meleeSkillNode: cc.Node, // MCSkill node
    rangedSkillNode: cc.Node, // MCSkillArrow node
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
    this.expHandler?.collectNearbyExp?.(dt);
  },

  // === INITIALIZATION ===
  initComponents() {
    this.playerModel = this.getComponent("PlayerModel");
    this.playerView = this.getComponent("PlayerView");
    this.meleeAttackHandler = this.getComponent("MeleeAttackHandler");
    this.rangedAttackHandler = this.getComponent("RangedAttackHandler");

    if (this.playerView) {
      this.playerView.setPlayerModel(this.playerModel);
      // Pass skill nodes to PlayerView
      this.playerView.setSkillNodes(this.meleeSkillNode, this.rangedSkillNode);
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

    // Initialize exp handler
    this.expHandler = this.getComponent("PlayerExpHandler");
    if (!this.expHandler) {
      this.expHandler = this.addComponent("PlayerExpHandler");
    }
    this.expHandler.canvasNode = this.canvasNode;
    this.expHandler.skillManager = this.skillManager;
    this.expHandler.init(this.playerModel, this.playerView);
  },

  // === DELEGATED METHODS ===
  // Experience system
  gainExp(amount) {
    this.expHandler?.gainExp?.(amount);
  },

  // Damage system
  takeDamage(amount) {
    this.combatHandler?.takeDamage?.(amount);
  },

  // Skill system
  applySkillBuff(skillId, amount) {
    this.skillHandler?.applySkillBuff?.(skillId, amount);
  },

  // === PUBLIC API ===
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

  // === LEGACY UTILITY METHODS (for backward compatibility) ===
  findEnemiesInRange(range) {
    return this.combatHandler?.findEnemiesInRange?.(range) || [];
  },

  findClosestEnemy(maxRange = 300) {
    return this.combatHandler?.findClosestEnemy?.(maxRange) || null;
  },
});
