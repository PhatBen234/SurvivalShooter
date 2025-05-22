cc.Class({
  extends: cc.Component,

  properties: {
    // HP & di chuyển
    maxHp: 100,
    currentHp: 100,
    speed: 200,
    canvasNode: cc.Node,

    // Animation
    anim: cc.Animation,
    meleeAttackAnim: cc.Animation, // animation cận chiến
    rangedAttackAnim: cc.Animation, // animation tầm xa
    arrowPrefab: cc.Prefab,

    // Attack stats
    baseAttack: 10, // Tấn công cơ bản
    criticalRate: 0.1, // Tỉ lệ chí mạng (10%)
    meleeAttackRange: 100, // Tầm tấn công cận chiến
    attackRange: 300, // Tầm tấn công tầm xa (đồng bộ với SkillManager)

    // Khoảng cách tối thiểu để ưu tiên ranged attack
    meleeToRangedThreshold: 120, // Nếu > 120 thì ưu tiên bắn cung

    // EXP & Level
    level: 1,
    currentExp: 0,
    expToNextLevel: 50,
    expPickupRange: 100, // Tầm hút exp
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,

    // UI Label
    hpLabel: cc.Label,
    attackLabel: cc.Label,
    critLabel: cc.Label,
    expRangeLabel: cc.Label,
    attackRangeLabel: cc.Label,

    // Kỹ năng
    skillNode: cc.Node,
    skillCooldown: 4,
    skillManager: cc.Node,

    // Auto attack
    attackInterval: 2,
  },

  onLoad() {
    this.currentHp = this.maxHp;
    this.updateAllUI();

    this.keyPressed = {};
    this.lastDir = cc.v2(0, 0);

    this.attackTimer = 0;
    this.isAttacking = false;
    this.currentAttackType = null; // 'melee' hoặc 'ranged'

    this.skillTimer = 0;
    this.canUseSkill = true;

    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

    this.setAnimationActive(this.anim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    if (this.skillNode) this.skillNode.active = false;
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

  // --- INPUT HANDLING ---
  onKeyDown(event) {
    this.keyPressed[event.keyCode] = true;
  },

  onKeyUp(event) {
    this.keyPressed[event.keyCode] = false;
  },

  // --- MOVEMENT ---
  getInputDirection() {
    let dir = cc.v2(0, 0);
    if (this.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
    if (this.keyPressed[cc.macro.KEY.d]) dir.x += 1;
    if (this.keyPressed[cc.macro.KEY.w]) dir.y += 1;
    if (this.keyPressed[cc.macro.KEY.s]) dir.y -= 1;
    return dir;
  },

  handleMovement(dt) {
    if (!this.anim) return;

    let dir = this.getInputDirection();

    if (!dir.equals(this.lastDir)) {
      this.lastDir = dir.clone();
    }

    if (dir.mag() > 0) {
      dir = dir.normalize();

      this.node.scaleX = dir.x !== 0 ? (dir.x > 0 ? 1 : -1) : this.node.scaleX;

      let pos = this.node.getPosition();
      pos = pos.add(dir.mul(this.speed * dt));
      pos = this.clampPositionToCanvas(pos);

      this.node.setPosition(pos);

      if (
        !this.isAttacking &&
        !this.anim.getAnimationState("Soldier").isPlaying
      ) {
        this.anim.play("Soldier");
      }
    } else {
      if (
        !this.isAttacking &&
        this.anim.getAnimationState("Soldier").isPlaying
      ) {
        this.anim.stop("Soldier");
      }
    }
  },

  // --- ATTACK ---
  handleAutoAttack(dt) {
    this.attackTimer += dt;
    if (this.attackTimer < this.attackInterval || this.isAttacking) return;

    // Tìm kẻ địch gần nhất trong toàn bộ tầm tấn công
    const closestEnemy = this.findClosestEnemy(this.attackRange);
    if (!closestEnemy) return;

    const distanceToEnemy = this.node.position.sub(closestEnemy.position).mag();

    // Quyết định loại tấn công dựa trên khoảng cách
    let attackType = "ranged"; // Mặc định là ranged

    if (distanceToEnemy <= this.meleeAttackRange) {
      // Kiểm tra xem có nhiều enemy gần không để quyết định dùng melee
      const nearbyEnemies = this.findEnemiesInRange(this.meleeAttackRange);
      if (nearbyEnemies.length >= 2) {
        attackType = "melee"; // Nếu có >= 2 enemy gần thì dùng melee
      } else if (distanceToEnemy <= this.meleeToRangedThreshold) {
        attackType = "melee"; // Nếu chỉ có 1 enemy nhưng đủ gần thì vẫn melee
      }
    }

    this.performAttack(attackType, closestEnemy);
  },

  performAttack(attackType, target) {
    this.attackTimer = 0;
    this.isAttacking = true;
    this.currentAttackType = attackType;

    // Tắt tất cả animation trước
    this.setAnimationActive(this.anim, false);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    if (attackType === "melee") {
      this.performMeleeAttack();
    } else {
      this.performRangedAttack(target);
    }
  },

  performMeleeAttack() {
    this.setAnimationActive(this.meleeAttackAnim, true);

    const attackState = this.meleeAttackAnim.getAnimationState("SoldierAttack");
    if (attackState) {
      this.meleeAttackAnim.play("SoldierAttack");
      attackState.once("finished", () => {
        this.executeMeleeDamage();
        this.finishAttack();
      });
    } else {
      this.executeMeleeDamage();
      this.finishAttack();
    }
  },

  performRangedAttack(target) {
    this.setAnimationActive(this.rangedAttackAnim, true);

    const rangedAttackState =
      this.rangedAttackAnim.getAnimationState("ArrowAttack");
    if (rangedAttackState) {
      this.rangedAttackAnim.play("ArrowAttack");
      rangedAttackState.once("finished", () => {
        this.executeRangedDamage(target);
        this.finishAttack();
      });
    } else {
      this.executeRangedDamage(target);
      this.finishAttack();
    }
  },

  executeMeleeDamage() {
    let damage = this.baseAttack;
    if (Math.random() < this.criticalRate) damage *= 2;

    const enemies = this.findEnemiesInRange(this.meleeAttackRange);
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
    this.isAttacking = false;
    this.currentAttackType = null;

    // Tắt tất cả animation tấn công
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    // Bật lại animation đi bộ
    this.setAnimationActive(this.anim, true);

    // Kiểm tra xem có đang di chuyển không để play animation phù hợp
    let dir = this.getInputDirection();
    if (dir.mag() > 0 && !this.anim.getAnimationState("Soldier").isPlaying) {
      this.anim.play("Soldier");
    } else if (dir.mag() === 0) {
      this.anim.stop("Soldier");
    }
  },

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

  spawnArrowToTarget(target) {
    if (!this.arrowPrefab || !target) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    this.canvasNode.addChild(arrow);
    arrow.setPosition(this.node.position);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript && arrowScript.init) {
      let damage = this.baseAttack;
      if (Math.random() < this.criticalRate) damage *= 2;
      arrowScript.init(target, damage);
    }
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

  // --- SKILL ---
  handleSkill(dt) {
    if (!this.skillNode) return;

    this.skillTimer += dt;
    if (this.skillTimer < this.skillCooldown || !this.canUseSkill) return;

    this.skillTimer = 0;
    this.canUseSkill = false;

    this.skillNode.setPosition(cc.v2(0, 0));
    this.skillNode.active = true;

    const anim = this.skillNode.getComponent(cc.Animation);
    if (anim && anim.getAnimationState("SkillSplash")) {
      anim.play("SkillSplash");
      anim.once("finished", () => {
        this.skillNode.active = false;
        this.canUseSkill = true;
        this.skillDamageArea();
      });
    } else {
      this.skillNode.active = false;
      this.canUseSkill = true;
    }
  },

  skillDamageArea() {
    const SKILL_RANGE = 200;
    const SKILL_DAMAGE = 20;

    if (!this.canvasNode) return;

    const enemies = this.canvasNode.children.filter(
      (node) =>
        (node.name === "Enemy" ||
          node.group === "enemy" ||
          node.name === "FinalBoss" ||
          node.group === "finalBoss") &&
        node.isValid
    );

    enemies.forEach((enemy) => {
      const dist = this.node.position.sub(enemy.position).mag();
      if (dist <= SKILL_RANGE) {
        const enemyScript =
          enemy.getComponent("Enemy") || enemy.getComponent("Boss");
        if (enemyScript?.takeDamage) enemyScript.takeDamage(SKILL_DAMAGE);
      }
    });
  },

  // --- EXP SYSTEM ---
  gainExp(amount) {
    this.currentExp += amount;
    this.tryLevelUp();
    this.updateExpUI();
  },

  tryLevelUp() {
    while (this.currentExp >= this.expToNextLevel) {
      this.currentExp -= this.expToNextLevel;
      this.level++;
      this.applyLevelUp();
    }
  },

  applyLevelUp() {
    this.maxHp += 20;
    this.currentHp = this.maxHp;

    this.baseAttack += 5;
    this.expPickupRange += 10;
    this.criticalRate += 0.05;
    this.meleeAttackRange += 10;
    this.attackRange += 15;
    this.meleeToRangedThreshold += 10; // Tăng ngưỡng chuyển đổi
    this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);

    this.updateAllUI();

    if (this.skillManager) {
      let skillMgrScript = this.skillManager.getComponent("SkillManager");
      if (skillMgrScript) {
        skillMgrScript.onLevelUp();
      }
    }
  },

  collectNearbyExp(dt) {
    if (!this.canvasNode) return;

    const EXP_GROUP = "exp";
    const expNodes = this.canvasNode.children.filter(
      (node) => node.group === EXP_GROUP || node.name === "Exp"
    );

    const playerPos = this.node.position;
    const speed = 300;

    expNodes.forEach((expNode) => {
      if (!expNode || !expNode.isValid) return;

      const expPos = expNode.position;
      const dist = playerPos.sub(expPos).mag();

      if (dist <= this.expPickupRange) {
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

  // --- HP ---
  takeDamage(amount) {
    this.currentHp -= amount;
    if (this.currentHp < 0) this.currentHp = 0;
    this.updateHpLabel();
    this.node.runAction(cc.sequence(cc.fadeTo(0.1, 100), cc.fadeTo(0.1, 255)));
  },

  // --- UI UPDATE HELPERS ---
  updateHpLabel() {
    if (this.hpLabel) {
      this.hpLabel.string = `HP: ${this.currentHp}`;
    }
  },

  updateStatsLabel() {
    if (this.attackLabel) this.attackLabel.string = `Atk: ${this.baseAttack}`;
    if (this.critLabel)
      this.critLabel.string = `Crit: ${Math.floor(this.criticalRate * 100)}%`;
    if (this.expRangeLabel)
      this.expRangeLabel.string = `EXP Range: ${this.expPickupRange}`;
    if (this.attackRangeLabel)
      this.attackRangeLabel.string = `Melee: ${this.meleeAttackRange} | Archer: ${this.attackRange}`;
  },

  updateExpUI() {
    if (this.expBar)
      this.expBar.progress = this.currentExp / this.expToNextLevel;
    if (this.levelLabel) this.levelLabel.string = `Lv: ${this.level}`;
  },

  updateAllUI() {
    this.updateHpLabel();
    this.updateStatsLabel();
    this.updateExpUI();
  },

  setAnimationActive(animationComponent, isActive) {
    if (!animationComponent || !animationComponent.node) return;
    animationComponent.node.active = isActive;
    if (!isActive) animationComponent.stop();
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
