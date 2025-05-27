cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
    arrowPrefab: cc.Prefab,
    skillManager: cc.Node,

    meleeSkillNode: cc.Node,
    rangedSkillNode: cc.Node,
    ultimateSkillNode: cc.Node,
  },

  onLoad() {
    this.initComponents();
    this.initHandlers();
  },

  onDestroy() {
    // No cleanup needed here
  },

  update(dt) {
    this.movementHandler?.handleMovement?.(dt);
    this.combatHandler?.handleAutoAttack?.(dt);
    this.skillHandler?.handleSkill?.(dt);
    this.ultimateHandler?.update?.(dt);
    this.expHandler?.collectNearbyExp?.(dt);
    this.autoTriggerUltimate();
  },

  // === Initialization ===
  initComponents() {
    this.playerModel = this.getComponent("PlayerModel");
    this.playerView = this.getComponent("PlayerView");
    this.meleeAttackHandler = this.getComponent("MeleeAttackHandler");
    this.rangedAttackHandler = this.getComponent("RangedAttackHandler");

    this.playerView?.setPlayerModel(this.playerModel);
    this.playerView?.setSkillNodes(
      this.meleeSkillNode,
      this.rangedSkillNode,
      this.ultimateSkillNode
    );

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
    this.inputHandler =
      this.getComponent("PlayerInputHandler") ||
      this.addComponent("PlayerInputHandler");

    this.movementHandler =
      this.getComponent("PlayerMovementHandler") ||
      this.addComponent("PlayerMovementHandler");
    this.movementHandler.canvasNode = this.canvasNode;
    this.movementHandler.init(
      this.playerModel,
      this.playerView,
      this.inputHandler
    );

    this.combatHandler =
      this.getComponent("PlayerCombatHandler") ||
      this.addComponent("PlayerCombatHandler");
    this.combatHandler.canvasNode = this.canvasNode;
    this.combatHandler.init(
      this.playerModel,
      this.playerView,
      this.meleeAttackHandler,
      this.rangedAttackHandler,
      this.inputHandler
    );

    this.skillHandler =
      this.getComponent("PlayerSkillHandler") ||
      this.addComponent("PlayerSkillHandler");
    this.skillHandler.canvasNode = this.canvasNode;
    this.skillHandler.init(
      this.playerModel,
      this.playerView,
      this.meleeAttackHandler,
      this.rangedAttackHandler
    );

    this.ultimateHandler =
      this.getComponent("UltimateSkillHandler") ||
      this.addComponent("UltimateSkillHandler");
    this.ultimateHandler.init(
      this.playerModel,
      this.playerView,
      this.canvasNode
    );

    this.expHandler =
      this.getComponent("PlayerExpHandler") ||
      this.addComponent("PlayerExpHandler");
    this.expHandler.canvasNode = this.canvasNode;
    this.expHandler.skillManager = this.skillManager;
    this.expHandler.init(this.playerModel, this.playerView);
  },

  // === Ultimate Handling ===
  autoTriggerUltimate() {
    if (this.ultimateHandler?.shouldTriggerUltimate()) {
      this.ultimateHandler.performUltimateSkill();
    }
  },

  triggerUltimate() {
    this.ultimateHandler?.forceUltimate();
  },

  // === Public API ===
  gainExp(amount) {
    this.expHandler?.gainExp?.(amount);
  },

  takeDamage(amount) {
    this.combatHandler?.takeDamage?.(amount);
  },

  applySkillBuff(skillId, amount) {
    this.skillHandler?.applySkillBuff?.(skillId, amount);
  },

  // === Getters ===
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

  // Deprecated
  getAttackRange() {
    return this.getRangedAttackRange();
  },

  // === Combat Utilities ===
  findEnemiesInRange(range) {
    return this.combatHandler?.findEnemiesInRange?.(range) || [];
  },

  findClosestEnemy(maxRange = 300) {
    return this.combatHandler?.findClosestEnemy?.(maxRange) || null;
  },
});
