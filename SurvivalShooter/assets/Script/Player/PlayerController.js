// PlayerController.js - Main Controller với skill riêng biệt
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
    this.initInput();
  },

  onDestroy() {
    this.destroyInput();
  },

  update(dt) {
    this.handleMovement(dt);
    this.handleAutoAttack(dt);
    this.handleSkill(dt);
    this.collectNearbyExp(dt);
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

    // Initialize attack handlers
    this.meleeAttackHandler?.init(
      this.playerModel,
      this.playerView,
      this.canvasNode
    );
    this.rangedAttackHandler?.init(
      this.playerModel,
      this.playerView,
      this.canvasNode,
      this.arrowPrefab
    );
  },

  initInput() {
    this.keyPressed = {};
    this.attackTimer = 0;
    this.skillTimer = 0;

    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  destroyInput() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  // === INPUT ===
  onKeyDown(event) {
    this.keyPressed[event.keyCode] = true;
  },
  onKeyUp(event) {
    this.keyPressed[event.keyCode] = false;
  },

  getInputDirection() {
    const keys = cc.macro.KEY;
    let dir = cc.v2(0, 0);
    if (this.keyPressed[keys.a]) dir.x -= 1;
    if (this.keyPressed[keys.d]) dir.x += 1;
    if (this.keyPressed[keys.w]) dir.y += 1;
    if (this.keyPressed[keys.s]) dir.y -= 1;
    return dir;
  },

  // === MOVEMENT ===
  handleMovement(dt) {
    if (!this.playerModel || !this.playerView) return;

    const dir = this.getInputDirection();
    this.updateDirection(dir);

    if (dir.mag() > 0) {
      this.movePlayer(dir.normalize(), dt);
      this.playMovementAnimation();
    } else {
      this.stopMovementAnimation();
    }
  },

  updateDirection(dir) {
    if (!dir.equals(this.playerModel.getLastDirection())) {
      this.playerModel.setLastDirection(dir);
    }
  },

  movePlayer(normalizedDir, dt) {
    this.playerView.updatePlayerScale(normalizedDir);

    let pos = this.node.getPosition();
    pos = pos.add(normalizedDir.mul(this.playerModel.getSpeed() * dt));
    this.node.setPosition(this.clampPositionToCanvas(pos));
  },

  playMovementAnimation() {
    if (!this.playerModel.isAttacking()) {
      this.playerView.playWalkAnimation();
    }
  },

  stopMovementAnimation() {
    if (!this.playerModel.isAttacking()) {
      this.playerView.stopWalkAnimation();
    }
  },

  // === ATTACK ===
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
    const both = this.meleeAttackHandler && this.rangedAttackHandler;
    if (!both) {
      return this.meleeAttackHandler ? "melee" : "ranged";
    }

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

    const dir = this.getInputDirection();
    if (dir.mag() > 0) {
      this.playerView.playWalkAnimation();
    } else {
      this.playerView.stopWalkAnimation();
    }
  },

  // === SKILL SYSTEM - Updated to use different skills based on attack type ===
  handleSkill(dt) {
    if (!this.canUseSkill(dt)) return;

    this.resetSkillTimer();
    this.playerModel.setCanUseSkill(false);

    // Determine skill type based on last attack type or current situation
    const skillType = this.determineSkillType();

    this.playerView.playSkillAnimation(skillType, () => {
      this.playerModel.setCanUseSkill(true);
      this.executeSkillDamage(skillType);
    });
  },

  determineSkillType() {
    // Use last attack type if available
    const lastAttackType = this.playerModel.getCurrentAttackType();
    if (lastAttackType) {
      return lastAttackType;
    }

    // Otherwise, determine based on closest enemy
    const enemy = this.findClosestEnemy(
      this.playerModel.getRangedAttackRange()
    );
    if (!enemy) return "melee"; // Default to melee if no enemy

    return this.determineAttackType(enemy);
  },

  canUseSkill(dt) {
    if (!this.playerModel || !this.playerView) return false;

    this.skillTimer += dt;
    return (
      this.skillTimer >= this.playerModel.getSkillCooldown() &&
      this.playerModel.canUseSkill()
    );
  },

  resetSkillTimer() {
    this.skillTimer = 0;
  },

  executeSkillDamage(skillType) {
    const SKILL_DAMAGE = 20;

    if (skillType === "melee") {
      // Melee skill: damage all enemies in circular range
      const MELEE_SKILL_RANGE = 200;
      this.findEnemiesInRange(MELEE_SKILL_RANGE).forEach((enemy) => {
        const script =
          enemy.getComponent("Enemy") || enemy.getComponent("Boss");
        script?.takeDamage?.(SKILL_DAMAGE);
      });
    } else {
      // Ranged skill: damage all enemies in horizontal line across screen
      this.executeHorizontalLineAttack(SKILL_DAMAGE);
    }
  },

  executeHorizontalLineAttack(damage) {
    if (!this.canvasNode) return;

    const playerY = this.node.position.y;
    const LINE_HEIGHT = 80; // Chiều cao của vùng tấn công

    // Tìm tất cả enemy trong hàng ngang
    const enemiesInLine = this.canvasNode.children.filter((node) => {
      const isEnemy =
        ["Enemy", "FinalBoss"].includes(node.name) ||
        ["enemy", "finalBoss"].includes(node.group);

      if (!isEnemy || !node.isValid) return false;

      const enemyY = node.position.y;
      const yDiff = Math.abs(enemyY - playerY);

      return yDiff <= LINE_HEIGHT / 2;
    });

    // Gây damage cho tất cả enemy trong hàng
    enemiesInLine.forEach((enemy) => {
      const script = enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      script?.takeDamage?.(damage);
    });
  },

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

  // === EXP SYSTEM ===
  gainExp(amount) {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.addExp(amount);
    this.tryLevelUp();
    this.playerView.updateExpUI();
  },

  tryLevelUp() {
    while (
      this.playerModel.getCurrentExp() >= this.playerModel.getExpToNextLevel()
    ) {
      this.playerModel.subtractExp(this.playerModel.getExpToNextLevel());
      this.playerModel.levelUp();
      this.applyLevelUp();
    }
  },

  applyLevelUp() {
    this.playerModel.applyLevelUpBenefits();
    this.playerView.updateAllUI();

    const skillMgrScript = this.skillManager?.getComponent("SkillManager");
    skillMgrScript?.onLevelUp();
  },

  collectNearbyExp(dt) {
    if (!this.canvasNode || !this.playerModel) return;

    const expNodes = this.getExpNodes();
    const playerPos = this.node.position;
    const speed = 300;
    const pickupRange = this.playerModel.getExpPickupRange();

    expNodes.forEach((expNode) => {
      if (!expNode?.isValid) return;

      const distance = playerPos.sub(expNode.position).mag();
      if (distance <= pickupRange) {
        this.moveExpToPlayer(expNode, playerPos, speed * dt);
      }
    });
  },

  getExpNodes() {
    return this.canvasNode.children.filter(
      (node) => node.group === "exp" || node.name === "Exp"
    );
  },

  moveExpToPlayer(expNode, playerPos, moveDistance) {
    const direction = playerPos.sub(expNode.position).normalize();
    const newPos = expNode.position.add(direction.mul(moveDistance));
    expNode.setPosition(newPos);

    if (newPos.sub(playerPos).mag() < 10) {
      const expScript = expNode.getComponent("Exp");
      if (expScript?.getAmount) {
        this.gainExp(expScript.getAmount());
      }
      expNode.destroy();
    }
  },

  // === DAMAGE ===
  takeDamage(amount) {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.setCurrentHp(this.playerModel.getCurrentHp() - amount);
    this.playerView.updateHpUI();
    this.playerView.showDamageEffect();
  },

  // === PUBLIC API ===
  applySkillBuff(skillId, amount) {
    if (!this.playerModel || !this.playerView) return;
    this.playerModel.applySkillBuff(skillId, amount);
    this.playerView.updateAllUI();
  },

  getBaseAttack() {
    return this.playerModel?.getBaseAttack() || 0;
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

  // === UTILITIES ===
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    return this.canvasNode.children.filter((node) => {
      const isEnemy =
        ["Enemy", "FinalBoss"].includes(node.name) ||
        ["enemy", "finalBoss"].includes(node.group);
      const inRange = this.node.position.sub(node.position).mag() <= range;
      return isEnemy && node.isValid && inRange;
    });
  },

  findClosestEnemy(maxRange = 300) {
    const enemies =
      this.canvasNode?.children.filter(
        (node) =>
          ["Enemy", "FinalBoss"].includes(node.name) ||
          ["enemy", "finalBoss"].includes(node.group)
      ) || [];

    return (
      enemies
        .map((enemy) => ({
          enemy,
          distance: this.node.position.sub(enemy.position).mag(),
        }))
        .filter(({ distance }) => distance <= maxRange && distance < Infinity)
        .sort((a, b) => a.distance - b.distance)[0]?.enemy || null
    );
  },

  clampPositionToCanvas(pos) {
    if (!this.canvasNode) return pos;

    const canvasSize = this.canvasNode.getContentSize();
    const nodeSize = this.node.getContentSize();
    const limitX = canvasSize.width / 2 - nodeSize.width - 12;
    const limitY = canvasSize.height / 2 - nodeSize.height - 12;

    return cc.v2(
      Math.min(Math.max(pos.x, -limitX), limitX),
      Math.min(Math.max(pos.y, -limitY), limitY)
    );
  },
});
