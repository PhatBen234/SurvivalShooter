// PlayerController.js - Xử lý toàn bộ game logic
cc.Class({
  extends: cc.Component,

  properties: {
    // References
    canvasNode: cc.Node,
    arrowPrefab: cc.Prefab,
    skillManager: cc.Node,

    // Components
    playerModel: null,
    playerView: null,
  },

  onLoad() {
    // Khởi tạo components
    this.playerModel = this.getComponent("PlayerModel");
    this.playerView = this.getComponent("PlayerView");

    if (this.playerView) {
      this.playerView.setPlayerModel(this.playerModel);
    }

    // Input handling
    this.keyPressed = {};
    this.attackTimer = 0;
    this.skillTimer = 0;

    // Event listeners
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  onDestroy() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  update(dt) {
    this.handleMovement(dt);
    this.handleAutoAttack(dt);
    this.handleSkill(dt);
    this.collectNearbyExp(dt);
  },

  // === INPUT HANDLING ===
  onKeyDown(event) {
    this.keyPressed[event.keyCode] = true;
  },

  onKeyUp(event) {
    this.keyPressed[event.keyCode] = false;
  },

  getInputDirection() {
    let dir = cc.v2(0, 0);
    if (this.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
    if (this.keyPressed[cc.macro.KEY.d]) dir.x += 1;
    if (this.keyPressed[cc.macro.KEY.w]) dir.y += 1;
    if (this.keyPressed[cc.macro.KEY.s]) dir.y -= 1;
    return dir;
  },

  // === MOVEMENT LOGIC ===
  handleMovement(dt) {
    if (!this.playerModel || !this.playerView) return;

    const dir = this.getInputDirection();
    const lastDir = this.playerModel.getLastDirection();

    // Update direction in model
    if (!dir.equals(lastDir)) {
      this.playerModel.setLastDirection(dir);
    }

    if (dir.mag() > 0) {
      // Normalize and move
      const normalizedDir = dir.normalize();

      // Update player scale through view
      this.playerView.updatePlayerScale(normalizedDir);

      // Calculate new position
      let pos = this.node.getPosition();
      pos = pos.add(normalizedDir.mul(this.playerModel.getSpeed() * dt));
      pos = this.clampPositionToCanvas(pos);
      this.node.setPosition(pos);

      // Play walk animation if not attacking
      if (!this.playerModel.isAttacking()) {
        this.playerView.playWalkAnimation();
      }
    } else {
      // Stop walk animation if not attacking
      if (!this.playerModel.isAttacking()) {
        this.playerView.stopWalkAnimation();
      }
    }
  },

  // === ATTACK LOGIC ===
  handleAutoAttack(dt) {
    if (!this.playerModel) return;

    this.attackTimer += dt;

    if (
      this.attackTimer < this.playerModel.getAttackInterval() ||
      this.playerModel.isAttacking()
    ) {
      return;
    }

    // Find closest enemy
    const closestEnemy = this.findClosestEnemy(
      this.playerModel.getAttackRange()
    );
    if (!closestEnemy) return;

    // Determine attack type
    const attackType = this.determineAttackType(closestEnemy);
    this.performAttack(attackType, closestEnemy);
  },

  determineAttackType(enemy) {
    const distanceToEnemy = this.node.position.sub(enemy.position).mag();

    if (distanceToEnemy <= this.playerModel.getMeleeAttackRange()) {
      // Check if there are multiple enemies nearby for melee
      const nearbyEnemies = this.findEnemiesInRange(
        this.playerModel.getMeleeAttackRange()
      );

      if (nearbyEnemies.length >= 2) {
        return "melee";
      } else if (
        distanceToEnemy <= this.playerModel.getMeleeToRangedThreshold()
      ) {
        return "melee";
      }
    }

    return "ranged";
  },

  performAttack(attackType, target) {
    if (!this.playerModel || !this.playerView) return;

    this.attackTimer = 0;
    this.playerModel.setAttacking(true);
    this.playerModel.setCurrentAttackType(attackType);

    if (attackType === "melee") {
      this.playerView.playMeleeAttackAnimation(() => {
        this.executeMeleeDamage();
        this.finishAttack();
      });
    } else {
      this.playerView.playRangedAttackAnimation(() => {
        this.executeRangedDamage(target);
        this.finishAttack();
      });
    }
  },

  executeMeleeDamage() {
    const damage = this.playerModel.calculateDamage();
    const enemies = this.findEnemiesInRange(
      this.playerModel.getMeleeAttackRange()
    );

    enemies.forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      if (enemyScript?.takeDamage) {
        enemyScript.takeDamage(damage);
      }
    });
  },

  executeRangedDamage(target) {
    if (!target || !target.isValid) return;
    this.spawnArrowToTarget(target);
  },

  finishAttack() {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.setAttacking(false);
    this.playerModel.setCurrentAttackType(null);
    this.playerView.finishAttackAnimation();

    // Handle movement animation after attack
    const dir = this.getInputDirection();
    if (dir.mag() > 0) {
      this.playerView.playWalkAnimation();
    } else {
      this.playerView.stopWalkAnimation();
    }
  },

  // === SKILL LOGIC ===
  handleSkill(dt) {
    if (!this.playerModel || !this.playerView) return;

    this.skillTimer += dt;

    if (
      this.skillTimer < this.playerModel.getSkillCooldown() ||
      !this.playerModel.canUseSkill()
    ) {
      return;
    }

    this.skillTimer = 0;
    this.playerModel.setCanUseSkill(false);

    this.playerView.playSkillAnimation(() => {
      this.playerModel.setCanUseSkill(true);
      this.skillDamageArea();
    });
  },

  skillDamageArea() {
    const SKILL_RANGE = 200;
    const SKILL_DAMAGE = 20;

    const enemies = this.findEnemiesInRange(SKILL_RANGE);
    enemies.forEach((enemy) => {
      const enemyScript =
        enemy.getComponent("Enemy") || enemy.getComponent("Boss");
      if (enemyScript?.takeDamage) {
        enemyScript.takeDamage(SKILL_DAMAGE);
      }
    });
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

    // Notify skill manager
    if (this.skillManager) {
      const skillMgrScript = this.skillManager.getComponent("SkillManager");
      if (skillMgrScript) {
        skillMgrScript.onLevelUp();
      }
    }
  },

  collectNearbyExp(dt) {
    if (!this.canvasNode || !this.playerModel) return;

    const EXP_GROUP = "exp";
    const expNodes = this.canvasNode.children.filter(
      (node) => node.group === EXP_GROUP || node.name === "Exp"
    );

    const playerPos = this.node.position;
    const speed = 300;
    const pickupRange = this.playerModel.getExpPickupRange();

    expNodes.forEach((expNode) => {
      if (!expNode || !expNode.isValid) return;

      const expPos = expNode.position;
      const dist = playerPos.sub(expPos).mag();

      if (dist <= pickupRange) {
        const direction = playerPos.sub(expPos).normalize();
        const moveDist = speed * dt;
        const newPos = expPos.add(direction.mul(moveDist));
        expNode.setPosition(newPos);

        if (newPos.sub(playerPos).mag() < 10) {
          const expScript = expNode.getComponent("Exp");
          if (expScript?.getAmount) {
            this.gainExp(expScript.getAmount());
          }
          expNode.destroy();
        }
      }
    });
  },

  // === DAMAGE HANDLING ===
  takeDamage(amount) {
    if (!this.playerModel || !this.playerView) return;

    const newHp = this.playerModel.getCurrentHp() - amount;
    this.playerModel.setCurrentHp(newHp);

    this.playerView.updateHpUI();
    this.playerView.showDamageEffect();
  },

  // === PUBLIC METHODS FOR EXTERNAL ACCESS ===
  applySkillBuff(skillId, amount) {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.applySkillBuff(skillId, amount);
    this.playerView.updateAllUI();
  },

  // Getter methods for external access (like SkillManager)
  getBaseAttack() {
    return this.playerModel ? this.playerModel.getBaseAttack() : 0;
  },

  getAttackRange() {
    return this.playerModel ? this.playerModel.getAttackRange() : 0;
  },

  getExpPickupRange() {
    return this.playerModel ? this.playerModel.getExpPickupRange() : 0;
  },

  getCriticalRate() {
    return this.playerModel ? this.playerModel.getCriticalRate() : 0;
  },

  // === UTILITY METHODS ===
  findEnemiesInRange(range) {
    if (!this.canvasNode) return [];

    const enemies = this.canvasNode.children.filter(
      (node) =>
        (node.name === "Enemy" ||
          node.group === "enemy" ||
          node.name === "FinalBoss" ||
          node.group === "finalBoss") &&
        node.isValid
    );

    return enemies.filter((enemy) => {
      const dist = this.node.position.sub(enemy.position).mag();
      return dist <= range;
    });
  },

  findClosestEnemy(maxRange = 300) {
    if (!this.canvasNode) return null;

    const enemies = this.canvasNode.children.filter(
      (node) =>
        (node.name === "Enemy" ||
          node.group === "enemy" ||
          node.name === "FinalBoss" ||
          node.group === "finalBoss") &&
        node.isValid
    );

    let closest = null;
    let minDist = Infinity;

    enemies.forEach((enemy) => {
      const dist = this.node.position.sub(enemy.position).mag();
      if (dist < minDist && dist <= maxRange) {
        closest = enemy;
        minDist = dist;
      }
    });

    return closest;
  },

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

  clampPositionToCanvas(pos) {
    if (!this.canvasNode) return pos;

    const canvasSize = this.canvasNode.getContentSize();
    const nodeSize = this.node.getContentSize();

    const limitX = canvasSize.width / 2 - nodeSize.width - 12;
    const limitY = canvasSize.height / 2 - nodeSize.height - 12;

    const clampedX = Math.min(Math.max(pos.x, -limitX), limitX);
    const clampedY = Math.min(Math.max(pos.y, -limitY), limitY);

    return cc.v2(clampedX, clampedY);
  },
});
