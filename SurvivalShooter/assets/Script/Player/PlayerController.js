// PlayerController.js - Logic xử lý từ code gốc
cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
    skillManager: cc.Node,
    // Reference tới model và view
    playerModel: null, // sẽ get component PlayerModel
    playerView: null, // sẽ get component PlayerView
  },

  onLoad() {
    // Get components
    this.playerModel = this.getComponent("PlayerModel");
    this.playerView = this.getComponent("PlayerView");

    this.playerView.updateAllUI(this.playerModel);

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

  // --- INPUT HANDLING ---
  onKeyDown(event) {
    this.playerModel.keyPressed[event.keyCode] = true;
  },

  onKeyUp(event) {
    this.playerModel.keyPressed[event.keyCode] = false;
  },

  // --- MOVEMENT ---
  getInputDirection() {
    let dir = cc.v2(0, 0);
    if (this.playerModel.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
    if (this.playerModel.keyPressed[cc.macro.KEY.d]) dir.x += 1;
    if (this.playerModel.keyPressed[cc.macro.KEY.w]) dir.y += 1;
    if (this.playerModel.keyPressed[cc.macro.KEY.s]) dir.y -= 1;
    return dir;
  },

  handleMovement(dt) {
    if (!this.playerView.anim) return;

    let dir = this.getInputDirection();

    if (!dir.equals(this.playerModel.lastDir)) {
      this.playerModel.lastDir = dir.clone();
    }

    if (dir.mag() > 0) {
      dir = dir.normalize();

      this.node.scaleX = dir.x !== 0 ? (dir.x > 0 ? 1 : -1) : this.node.scaleX;

      let pos = this.node.getPosition();
      pos = pos.add(dir.mul(this.playerModel.speed * dt));
      pos = this.playerView.clampPositionToCanvas(pos, this.canvasNode);

      this.node.setPosition(pos);

      if (
        !this.playerModel.isAttacking &&
        !this.playerView.anim.getAnimationState("Soldier").isPlaying
      ) {
        this.playerView.anim.play("Soldier");
      }
    } else {
      if (
        !this.playerModel.isAttacking &&
        this.playerView.anim.getAnimationState("Soldier").isPlaying
      ) {
        this.playerView.anim.stop("Soldier");
      }
    }
  },

  // --- ATTACK ---
  handleAutoAttack(dt) {
    this.playerModel.attackTimer += dt;
    if (
      this.playerModel.attackTimer < this.playerModel.attackInterval ||
      this.playerModel.isAttacking
    )
      return;

    // Tìm kẻ địch gần nhất trong toàn bộ tầm tấn công
    const closestEnemy = this.findClosestEnemy(this.playerModel.attackRange);
    if (!closestEnemy) return;

    const distanceToEnemy = this.node.position.sub(closestEnemy.position).mag();

    // Quyết định loại tấn công dựa trên khoảng cách
    let attackType = "ranged"; // Mặc định là ranged

    if (distanceToEnemy <= this.playerModel.meleeAttackRange) {
      // Kiểm tra xem có nhiều enemy gần không để quyết định dùng melee
      const nearbyEnemies = this.findEnemiesInRange(
        this.playerModel.meleeAttackRange
      );
      if (nearbyEnemies.length >= 2) {
        attackType = "melee"; // Nếu có >= 2 enemy gần thì dùng melee
      } else if (distanceToEnemy <= this.playerModel.meleeToRangedThreshold) {
        attackType = "melee"; // Nếu chỉ có 1 enemy nhưng đủ gần thì vẫn melee
      }
    }

    this.performAttack(attackType, closestEnemy);
  },

  performAttack(attackType, target) {
    this.playerModel.attackTimer = 0;
    this.playerModel.isAttacking = true;
    this.playerModel.currentAttackType = attackType;

    // Tắt tất cả animation trước
    this.playerView.setAnimationActive(this.playerView.anim, false);
    this.playerView.setAnimationActive(this.playerView.meleeAttackAnim, false);
    this.playerView.setAnimationActive(this.playerView.rangedAttackAnim, false);

    if (attackType === "melee") {
      this.performMeleeAttack();
    } else {
      this.performRangedAttack(target);
    }
  },

  performMeleeAttack() {
    this.playerView.setAnimationActive(this.playerView.meleeAttackAnim, true);

    const attackState =
      this.playerView.meleeAttackAnim.getAnimationState("SoldierAttack");
    if (attackState) {
      this.playerView.meleeAttackAnim.play("SoldierAttack");
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
    this.playerView.setAnimationActive(this.playerView.rangedAttackAnim, true);

    const rangedAttackState =
      this.playerView.rangedAttackAnim.getAnimationState("ArrowAttack");
    if (rangedAttackState) {
      this.playerView.rangedAttackAnim.play("ArrowAttack");
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
    let damage = this.playerModel.baseAttack;
    if (Math.random() < this.playerModel.criticalRate) damage *= 2;

    const enemies = this.findEnemiesInRange(this.playerModel.meleeAttackRange);
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
    this.playerView.spawnArrowToTarget(
      target,
      this.canvasNode,
      this.playerModel
    );
  },

  finishAttack() {
    this.playerModel.isAttacking = false;
    this.playerModel.currentAttackType = null;

    // Tắt tất cả animation tấn công
    this.playerView.setAnimationActive(this.playerView.meleeAttackAnim, false);
    this.playerView.setAnimationActive(this.playerView.rangedAttackAnim, false);

    // Bật lại animation đi bộ
    this.playerView.setAnimationActive(this.playerView.anim, true);

    // Kiểm tra xem có đang di chuyển không để play animation phù hợp
    let dir = this.getInputDirection();
    if (
      dir.mag() > 0 &&
      !this.playerView.anim.getAnimationState("Soldier").isPlaying
    ) {
      this.playerView.anim.play("Soldier");
    } else if (dir.mag() === 0) {
      this.playerView.anim.stop("Soldier");
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
    if (!this.playerView.skillNode) return;

    this.playerModel.skillTimer += dt;
    if (
      this.playerModel.skillTimer < this.playerModel.skillCooldown ||
      !this.playerModel.canUseSkill
    )
      return;

    this.playerModel.skillTimer = 0;
    this.playerModel.canUseSkill = false;

    this.playerView.skillNode.setPosition(cc.v2(0, 0));
    this.playerView.skillNode.active = true;

    const anim = this.playerView.skillNode.getComponent(cc.Animation);
    if (anim && anim.getAnimationState("SkillSplash")) {
      anim.play("SkillSplash");
      anim.once("finished", () => {
        this.playerView.skillNode.active = false;
        this.playerModel.canUseSkill = true;
        this.skillDamageArea();
      });
    } else {
      this.playerView.skillNode.active = false;
      this.playerModel.canUseSkill = true;
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

      if (dist <= this.playerModel.expPickupRange) {
        const direction = playerPos.sub(expPos).normalize();
        const moveDist = speed * dt;
        const newPos = expPos.add(direction.mul(moveDist));
        expNode.setPosition(newPos);

        if (newPos.sub(playerPos).mag() < 10) {
          const expScript = expNode.getComponent("Exp");
          if (expScript?.getAmount) {
            this.playerModel.gainExp(expScript.getAmount());
          }
          expNode.destroy();
        }
      }
    });

    this.playerView.updateExpUI(this.playerModel);
  },

  takeDamage(amount) {
    this.playerModel.takeDamage(amount);
    this.playerView.updateHpLabel(this.playerModel);
    this.node.runAction(cc.sequence(cc.fadeTo(0.1, 100), cc.fadeTo(0.1, 255)));

    if (this.skillManager) {
      let skillMgrScript = this.skillManager.getComponent("SkillManager");
      if (skillMgrScript) {
        skillMgrScript.onLevelUp();
      }
    }

    this.playerView.updateAllUI(this.playerModel);
  },
});
