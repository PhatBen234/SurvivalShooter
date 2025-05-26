// RangedAttackHandler.js - Xử lý tấn công và skill tầm xa với skillDamage
cc.Class({
  extends: cc.Component,

  properties: {
    // Sẽ được init từ PlayerController
    playerModel: null,
    playerView: null,
    canvasNode: null,
    arrowPrefab: null,
    rangedSkillNode: null,
  },

  // Khởi tạo từ PlayerController
  init(playerModel, playerView, canvasNode, arrowPrefab, rangedSkillNode) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
    this.arrowPrefab = arrowPrefab;
    this.rangedSkillNode = rangedSkillNode;
  },

  // === RANGED ATTACK ===
  // Thực hiện tấn công tầm xa
  performAttack(target, onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    // Play ranged attack animation
    this.playerView.playRangedAttackAnimation(() => {
      this.executeRangedDamage(target);
      if (onFinishCallback) {
        onFinishCallback();
      }
    });
  },

  // Thực hiện damage tầm xa bằng cách spawn arrow
  executeRangedDamage(target) {
    if (!target || !target.isValid) return;
    this.spawnArrowToTarget(target);
  },

  // Spawn arrow bay về phía target
  spawnArrowToTarget(target) {
    if (!this.arrowPrefab || !target || !this.canvasNode) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    this.canvasNode.addChild(arrow);
    arrow.setPosition(this.node.position);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript && arrowScript.init) {
      const damage = this.playerModel.calculateDamage();
      arrowScript.init(target, damage);
    }
  },

  // === RANGED SKILL ===
  // Thực hiện skill tầm xa - Horizontal line attack
  performSkill(onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    // Play ranged skill animation
    this.playerView.playSkillAnimation("ranged", () => {
      this.executeRangedSkillDamage();
      if (onFinishCallback) {
        onFinishCallback();
      }
    });
  },

  // Thực hiện damage skill tầm xa - Horizontal line attack
  executeRangedSkillDamage() {
    if (!this.playerModel || !this.canvasNode) return;

    // Sử dụng skillDamage từ PlayerModel thay vì hardcode
    const BASE_SKILL_DAMAGE = this.playerModel.getSkillDamage();
    const RANGED_SKILL_MULTIPLIER = 2; // Ranged skill damage = skillDamage * 2

    // Có thể áp dụng crit cho skill damage
    const skillDamage =
      this.playerModel.calculateSkillDamage() * RANGED_SKILL_MULTIPLIER;

    this.executeHorizontalLineAttack(skillDamage);

    // Hiển thị visual effect nếu có skill node
    this.showRangedSkillEffect();

    // Log để debug
    const enemiesInLine = this.getEnemiesInHorizontalLine();
    cc.log(
      `[RangedAttackHandler] Skill damage dealt: ${skillDamage} to ${enemiesInLine.length} enemies`
    );
  },

  // Tấn công theo đường ngang
  executeHorizontalLineAttack(damage) {
    if (!this.canvasNode) return;

    const enemiesInLine = this.getEnemiesInHorizontalLine();

    // Gây damage cho tất cả enemy trong hàng
    enemiesInLine.forEach((enemy) => {
      const script = enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      script?.takeDamage?.(damage);
    });
  },

  // Helper method để tìm enemies trong horizontal line
  getEnemiesInHorizontalLine() {
    if (!this.canvasNode) return [];

    const playerY = this.node.position.y;
    const LINE_HEIGHT = 80; // Chiều cao của vùng tấn công

    // Tìm tất cả enemy trong hàng ngang
    return this.canvasNode.children.filter((node) => {
      const isEnemy =
        ["Enemy", "FinalBoss"].includes(node.name) ||
        ["enemy", "finalBoss"].includes(node.group);

      if (!isEnemy || !node.isValid) return false;

      const enemyY = node.position.y;
      const yDiff = Math.abs(enemyY - playerY);

      return yDiff <= LINE_HEIGHT / 2;
    });
  },

  // Hiển thị effect cho ranged skill
  showRangedSkillEffect() {
    if (!this.rangedSkillNode) return;

    // Có thể implement visual effect tại đây
    // Ví dụ: animation cho horizontal line effect
    // this.rangedSkillNode.runAction(cc.sequence(
    //   cc.scaleTo(0.1, 1.0, 2.0), // Scale horizontally
    //   cc.scaleTo(0.1, 1.0, 1.0)
    // ));
  },

  // === SKILL ARROW SYSTEM (Alternative implementation) ===
  // Thay vì horizontal line, có thể spawn nhiều arrows với skill damage
  executeSkillArrowAttack() {
    if (!this.canvasNode) return;

    // Tìm tất cả enemies trong range
    const enemies = this.findEnemiesInSkillRange();

    // Tính skill damage
    const BASE_SKILL_DAMAGE = this.playerModel.getSkillDamage();
    const ARROW_SKILL_MULTIPLIER = 1.5; // Arrow skill damage = skillDamage * 1.5
    const skillDamage =
      this.playerModel.calculateSkillDamage() * ARROW_SKILL_MULTIPLIER;

    // Spawn arrow cho từng enemy
    enemies.forEach((enemy, index) => {
      // Delay một chút giữa các arrows để tạo hiệu ứng
      this.scheduleOnce(() => {
        this.spawnSkillArrowToTarget(enemy, skillDamage);
      }, index * 0.1);
    });

    cc.log(
      `[RangedAttackHandler] Skill arrows fired: ${enemies.length} with damage: ${skillDamage} each`
    );
  },

  // Tìm enemies trong skill range (có thể khác với attack range)
  findEnemiesInSkillRange() {
    if (!this.canvasNode) return [];

    const SKILL_RANGE = this.playerModel.getRangedAttackRange() * 1.5; // Skill có range lớn hơn
    const enemies = this.canvasNode.children.filter(
      (node) =>
        (["Enemy", "FinalBoss"].includes(node.name) ||
          ["enemy", "finalBoss"].includes(node.group)) &&
        node.isValid
    );

    return enemies.filter((enemy) => {
      const dist = this.node.position.sub(enemy.position).mag();
      return dist <= SKILL_RANGE;
    });
  },

  // Spawn skill arrow với damage cao hơn
  spawnSkillArrowToTarget(target, damage) {
    if (!this.arrowPrefab || !target || !this.canvasNode) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    this.canvasNode.addChild(arrow);
    arrow.setPosition(this.node.position);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript && arrowScript.init) {
      arrowScript.init(target, damage);
    }
  },
});
