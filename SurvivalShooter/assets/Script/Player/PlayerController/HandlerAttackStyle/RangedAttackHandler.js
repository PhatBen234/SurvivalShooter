cc.Class({
  extends: cc.Component,

  properties: {
    playerModel: null,
    playerView: null,
    canvasNode: null,
    arrowPrefab: null,
    rangedSkillNode: null,
  },

  init(playerModel, playerView, canvasNode, arrowPrefab, rangedSkillNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
    this.arrowPrefab = arrowPrefab;
    this.rangedSkillNode = rangedSkillNode;
  },

  // Tính damage cho ranged attack
  calculateRangedDamage() {
    let damage = this.playerModel.getBaseAttack();
    if (Math.random() < this.playerModel.getCriticalRate()) {
      damage *= 2;
    }
    return damage;
  },

  // Tính damage cho ranged skill
  calculateRangedSkillDamage() {
    let damage = this.playerModel.getSkillDamage();
    if (Math.random() < this.playerModel.getCriticalRate()) {
      damage *= 2;
    }
    return damage;
  },

  performAttack(target, onFinishCallback) {
    if (!this.playerModel || !this.playerView || !target?.isValid) return;

    this.playerView.playRangedAttackAnimation(() => {
      this.spawnArrowToTarget(target);
      onFinishCallback?.();
    });
  },

  spawnArrowToTarget(target) {
    if (!this.arrowPrefab || !this.canvasNode) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    arrow.setPosition(this.node.position);
    this.canvasNode.addChild(arrow);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript?.init) {
      arrowScript.init(target, this.calculateRangedDamage());
    }
  },

  performSkill(onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    this.playerView.playSkillAnimation("ranged", () => {
      this.executeRangedSkillDamage();
      onFinishCallback?.();
    });
  },

  executeRangedSkillDamage() {
    if (!this.playerModel || !this.canvasNode) return;

    const skillDamage = this.calculateRangedSkillDamage() * 2;
    this.executeHorizontalLineAttack(skillDamage);
    this.showRangedSkillEffect();
  },

  executeHorizontalLineAttack(damage) {
    this.getEnemiesInHorizontalLine().forEach((enemy) => {
      const script =
        enemy.getComponent("BaseEnemy") ||
        enemy.getComponent("EnemyLevel2") ||
        enemy.getComponent("BossEnemy");
      script?.takeDamage?.(damage);
    });
  },

  getEnemiesInHorizontalLine() {
    if (!this.canvasNode) return [];

    const playerY = this.node.position.y;
    const LINE_HEIGHT = 80;

    return this.canvasNode.children.filter((node) => {
      if (
        !node.isValid ||
        (!["BaseEnemy", "EnemyLevel2", "BossEnemy"].includes(node.name) &&
          node.group !== "enemy")
      ) {
        return false;
      }
      return Math.abs(node.position.y - playerY) <= LINE_HEIGHT / 2;
    });
  },

  showRangedSkillEffect() {
    if (!this.rangedSkillNode) return;
    // Implement visual effect if needed
  },

  executeSkillArrowAttack() {
    if (!this.canvasNode) return;

    const skillDamage = this.calculateRangedSkillDamage() * 2;
    this.findEnemiesInSkillRange().forEach((enemy, index) => {
      this.scheduleOnce(
        () => this.spawnSkillArrowToTarget(enemy, skillDamage),
        index * 0.1
      );
    });
  },

  findEnemiesInSkillRange() {
    if (!this.canvasNode) return [];

    const SKILL_RANGE = this.playerModel.getRangedAttackRange() * 1.5;
    return this.canvasNode.children.filter((node) => {
      if (
        !node.isValid ||
        (!["BaseEnemy", "EnemyLevel2", "BossEnemy"].includes(node.name) &&
          node.group !== "enemy")
      ) {
        return false;
      }
      return this.node.position.sub(node.position).mag() <= SKILL_RANGE;
    });
  },

  spawnSkillArrowToTarget(target, damage) {
    if (!this.arrowPrefab || !target || !this.canvasNode) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    arrow.setPosition(this.node.position);
    this.canvasNode.addChild(arrow);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript?.init) {
      arrowScript.init(target, damage);
    }
  },
});
