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
    let isCritical = Math.random() < this.playerModel.getCriticalRate();
    if (isCritical) {
      damage *= 2; //neu crit ba qua thi chinh o day, nhung cung chi target 1 muc tieu
    }
    return { damage, isCritical };
  },

  // Tính damage cho ranged skill
  calculateRangedSkillDamage() {
    let damage = this.playerModel.getSkillDamage();
    let isCritical = Math.random() < this.playerModel.getCriticalRate();
    if (isCritical) {
      damage *= 2;
    }
    return { damage, isCritical };
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

    const damageInfo = this.calculateRangedDamage();
    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript?.init) {
      arrowScript.init(target, damageInfo.damage, damageInfo.isCritical);
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

    const damageInfo = this.calculateRangedSkillDamage();
    const skillDamage = damageInfo.damage * 2;
    this.executeHorizontalLineAttack(skillDamage, damageInfo.isCritical);
    this.showRangedSkillEffect();
  },

  executeHorizontalLineAttack(damage, isCritical) {
    this.getEnemiesInHorizontalLine().forEach((enemy) => {
      const script =
        enemy.getComponent("BaseEnemy") ||
        enemy.getComponent("EnemyLevel2") ||
        enemy.getComponent("BossEnemy");
      script?.takeDamage?.(damage, isCritical);
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

    const damageInfo = this.calculateRangedSkillDamage();
    const skillDamage = damageInfo.damage * 2;
    this.findEnemiesInSkillRange().forEach((enemy, index) => {
      this.scheduleOnce(
        () =>
          this.spawnSkillArrowToTarget(
            enemy,
            skillDamage,
            damageInfo.isCritical
          ),
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

  spawnSkillArrowToTarget(target, damage, isCritical) {
    if (!this.arrowPrefab || !target || !this.canvasNode) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    arrow.setPosition(this.node.position);
    this.canvasNode.addChild(arrow);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript?.init) {
      arrowScript.init(target, damage, isCritical);
    }
  },
});
