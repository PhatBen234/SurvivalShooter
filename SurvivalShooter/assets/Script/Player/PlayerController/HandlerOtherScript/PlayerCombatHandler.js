// PlayerCombatHandler.js - Handles auto attack and combat logic
cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
  },

  init(
    playerModel,
    playerView,
    meleeAttackHandler,
    rangedAttackHandler,
    inputHandler
  ) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.meleeAttackHandler = meleeAttackHandler;
    this.rangedAttackHandler = rangedAttackHandler;
    this.inputHandler = inputHandler;
    this.attackTimer = 0;
  },

  handleAutoAttack(dt) {
    if (!this.canAttack(dt)) return;

    const enemy = this.findClosestEnemy(
      this.playerModel.getRangedAttackRange()
    );
    if (!enemy) return;

    const attackType = this.determineAttackType(enemy);
    this.performAttack(attackType, enemy);
  },

  canAttack(dt) {
    if (!this.playerModel) return false;

    this.attackTimer += dt;
    return (
      this.attackTimer >= this.playerModel.getAttackInterval() &&
      !this.playerModel.isAttacking()
    );
  },

  determineAttackType(enemy) {
    const distance = this.node.position.sub(enemy.position).mag();
    const meleeRange = this.playerModel.getMeleeAttackRange();

    if (distance <= meleeRange) {
      const nearbyCount = this.findEnemiesInRange(meleeRange).length;
      if (
        nearbyCount >= 2 ||
        distance <= this.playerModel.getMeleeToRangedThreshold()
      ) {
        return "melee";
      }
    }
    return "ranged";
  },

  performAttack(attackType, target) {
    if (!this.playerModel || !this.playerView) return;

    this.resetAttackTimer();
    this.setAttackState(attackType);

    const handler =
      attackType === "melee"
        ? this.meleeAttackHandler
        : this.rangedAttackHandler;
    if (!handler) return;

    const callback = () => this.finishAttack();
    attackType === "melee"
      ? handler.performAttack(callback)
      : handler.performAttack(target, callback);
  },

  resetAttackTimer() {
    this.attackTimer = 0;
  },

  setAttackState(attackType) {
    this.playerModel.setAttacking(true);
    this.playerModel.setCurrentAttackType(attackType);
  },

  finishAttack() {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.setAttacking(false);
    this.playerModel.setCurrentAttackType(null);
    this.playerView.finishAttackAnimation();

    const dir = this.inputHandler.getInputDirection();
    dir.mag() > 0
      ? this.playerView.playWalkAnimation()
      : this.playerView.stopWalkAnimation();
  },

  takeDamage(amount) {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.setCurrentHp(this.playerModel.getCurrentHp() - amount);
    this.playerView.updateHpUI();
    this.playerView.showDamageEffect();
  },

  // Utility methods
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      const isEnemy =
        ["BaseEnemy", "EnemyLevel2"].includes(node.name) ||
        node.group === "enemy";
      const inRange = this.node.position.sub(node.position).mag() <= range;
      return isEnemy && node.isValid && inRange;
    });
  },

  findClosestEnemy(maxRange = 300) {
    const enemies =
      this.canvasNode?.children.filter(
        (node) =>
          ["BaseEnemy", "EnemyLevel2"].includes(node.name) ||
          node.group === "enemy"
      ) || [];

    return (
      enemies
        .map((enemy) => ({
          enemy,
          distance: this.node.position.sub(enemy.position).mag(),
        }))
        .filter(({ distance }) => distance <= maxRange)
        .sort((a, b) => a.distance - b.distance)[0]?.enemy || null
    );
  },
});
