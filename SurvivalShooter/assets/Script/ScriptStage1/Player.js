cc.Class({
  extends: cc.Component,

  properties: {
    maxHp: 100,
    currentHp: 100,
    hpLabel: cc.Label,
    anim: cc.Animation,
    attackAnim: cc.Animation,
    speed: 200,
    canvasNode: cc.Node,
    attackInterval: 2,

    skillNode: cc.Node, // Đặt skillNode làm con của Player trong Hierarchy
    skillCooldown: 4, // Thời gian hồi kỹ năng
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,
    attackLabel: cc.Label,
    critLabel: cc.Label,
    rangeLabel: cc.Label,

    level: 1,
    currentExp: 0,
    expToNextLevel: 50, // EXP cần để lên level 2

    baseAttack: 10,
    criticalRate: 0.1, // 10%
    expPickupRange: 100,
  },

  onLoad() {
    this.currentHp = this.maxHp;
    this.updateHpLabel();
    this.updateStatsLabel(); // ← Thêm dòng này
    this.keyPressed = {};
    this.lastDir = cc.v2(0, 0);
    this.attackTimer = 0;
    this.isAttacking = false;

    this.skillTimer = 0;
    this.canUseSkill = true;

    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

    if (this.anim && this.anim.node) this.anim.node.active = true;
    if (this.attackAnim && this.attackAnim.node)
      this.attackAnim.node.active = false;

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
    this.collectNearbyExp();
  },

  takeDamage(amount) {
    this.currentHp -= amount;
    if (this.currentHp < 0) this.currentHp = 0;
    this.updateHpLabel();
  },

  updateHpLabel() {
    if (this.hpLabel) {
      this.hpLabel.string = "HP: " + this.currentHp;
    }
  },
  updateStatsLabel() {
    if (this.attackLabel) {
      this.attackLabel.string = "Atk: " + this.baseAttack;
    }
    if (this.critLabel) {
      this.critLabel.string =
        "Crit: " + Math.floor(this.criticalRate * 100) + "%";
    }
    if (this.rangeLabel) {
      this.rangeLabel.string = "Range: " + this.expPickupRange;
    }
  },

  onKeyDown(event) {
    this.keyPressed[event.keyCode] = true;
  },

  onKeyUp(event) {
    this.keyPressed[event.keyCode] = false;
  },

  handleMovement(dt) {
    if (!this.anim) return;

    let dir = cc.v2(0, 0);
    if (this.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
    if (this.keyPressed[cc.macro.KEY.d]) dir.x += 1;
    if (this.keyPressed[cc.macro.KEY.w]) dir.y += 1;
    if (this.keyPressed[cc.macro.KEY.s]) dir.y -= 1;

    if (!dir.equals(this.lastDir)) {
      this.lastDir = dir.clone();
    }

    if (dir.mag() > 0) {
      dir = dir.normalize();

      if (dir.x !== 0) {
        this.node.scaleX = dir.x > 0 ? 1 : -1;
      }

      let pos = this.node.getPosition();
      pos.x += dir.x * this.speed * dt;
      pos.y += dir.y * this.speed * dt;

      pos = this.clampPositionToCanvas(pos);
      this.node.setPosition(pos);

      if (!this.isAttacking) {
        if (!this.anim.getAnimationState("Soldier").isPlaying) {
          this.anim.play("Soldier");
        }
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

  handleAutoAttack(dt) {
    if (!this.attackAnim) return;

    this.attackTimer += dt;
    if (this.attackTimer >= this.attackInterval && !this.isAttacking) {
      this.attackTimer = 0;
      this.isAttacking = true;

      if (this.anim && this.anim.node) {
        this.anim.node.active = false;
        this.anim.stop();
      }

      if (this.attackAnim.node) {
        this.attackAnim.node.active = true;
      }

      const attackState = this.attackAnim.getAnimationState("SoldierAttack");
      if (attackState) {
        this.attackAnim.play("SoldierAttack");

        attackState.once("finished", () => {
          this.attackNearbyEnemies();
          this.isAttacking = false;

          if (this.attackAnim.node) {
            this.attackAnim.node.active = false;
          }
          if (this.anim && this.anim.node) {
            this.anim.node.active = true;
          }

          let dir = cc.v2(0, 0);
          if (this.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
          if (this.keyPressed[cc.macro.KEY.d]) dir.x += 1;
          if (this.keyPressed[cc.macro.KEY.w]) dir.y += 1;
          if (this.keyPressed[cc.macro.KEY.s]) dir.y -= 1;

          if (dir.mag() > 0) {
            if (!this.anim.getAnimationState("Soldier").isPlaying) {
              this.anim.play("Soldier");
            }
          } else {
            this.anim.stop("Soldier");
          }
        });
      } else {
        this.isAttacking = false;
        if (this.attackAnim.node) this.attackAnim.node.active = false;
        if (this.anim && this.anim.node) this.anim.node.active = true;
      }
    }
  },

  attackNearbyEnemies() {
    const ATTACK_RANGE = 100;
    let damage = this.baseAttack;

    const isCrit = Math.random() < this.criticalRate;
    if (isCrit) {
      damage *= 2;
    }

    if (!this.canvasNode) return;

    const enemies = this.canvasNode.children.filter(
      (node) => node.name === "Enemy" || node.group === "enemy"
    );

    enemies.forEach((enemy) => {
      if (!enemy || !enemy.isValid) return;

      const dist = this.node.getPosition().sub(enemy.getPosition()).mag();
      if (dist <= ATTACK_RANGE) {
        const enemyScript = enemy.getComponent("Enemy");
        if (enemyScript && typeof enemyScript.takeDamage === "function") {
          enemyScript.takeDamage(damage);
        }
      }
    });
  },

  handleSkill(dt) {
    if (!this.skillNode) return;

    this.skillTimer += dt;

    if (this.skillTimer >= this.skillCooldown && this.canUseSkill) {
      this.skillTimer = 0;
      this.canUseSkill = false;

      this.skillNode.setPosition(cc.v2(0, 0)); // Reset về tâm Player (nếu cần)
      this.skillNode.active = true;

      const anim = this.skillNode.getComponent(cc.Animation);
      if (anim && anim.getAnimationState("SkillSplash")) {
        anim.play("SkillSplash");

        anim.once("finished", () => {
          this.skillNode.active = false;
          this.canUseSkill = true;
          this.skillDamageArea(); // Gây damage ở vị trí player
        });
      } else {
        this.skillNode.active = false;
        this.canUseSkill = true;
      }
    }
  },

  skillDamageArea() {
    const SKILL_RANGE = 200;
    const SKILL_DAMAGE = 20;

    if (!this.canvasNode) return;

    const enemies = this.canvasNode.children.filter(
      (node) => node.name === "Enemy" || node.group === "enemy"
    );

    enemies.forEach((enemy) => {
      if (!enemy || !enemy.isValid) return;

      const dist = this.node.getPosition().sub(enemy.getPosition()).mag();
      if (dist <= SKILL_RANGE) {
        const enemyScript = enemy.getComponent("Enemy");
        if (enemyScript && typeof enemyScript.takeDamage === "function") {
          enemyScript.takeDamage(SKILL_DAMAGE);
        }
      }
    });
  },
  gainExp(amount) {
    this.currentExp += amount;
    this.updateExpUI();

    while (this.currentExp >= this.expToNextLevel) {
      this.currentExp -= this.expToNextLevel;
      this.level += 1;
      this.applyLevelUp();
    }

    this.updateExpUI();
  },
  collectNearbyExp() {
    const EXP_GROUP = "exp";
    if (!this.canvasNode) return;

    const expNodes = this.canvasNode.children.filter(
      (node) => node.group === EXP_GROUP || node.name === "Exp"
    );

    expNodes.forEach((expNode) => {
      if (!expNode || !expNode.isValid) return;

      const playerPos = this.node.getPosition();
      const expPos = expNode.getPosition();
      const dist = playerPos.sub(expPos).mag();

      if (dist <= this.expPickupRange) {
        // Tốc độ hút exp, ví dụ 300 pixels / giây
        const speed = 300;
        // Tính hướng di chuyển (vector đơn vị)
        const direction = playerPos.sub(expPos).normalize();
        // Di chuyển exp về player
        const moveDist = speed * (1 / 60); // giả sử 60fps, hoặc dùng dt nếu trong update
        const newPos = expPos.add(direction.mul(moveDist));
        expNode.setPosition(newPos);

        // Nếu exp đã gần player đủ (dưới 10 px), thì hút exp và destroy
        if (newPos.sub(playerPos).mag() < 10) {
          const expScript = expNode.getComponent("Exp");
          if (expScript && typeof expScript.getAmount === "function") {
            this.gainExp(expScript.getAmount());
          }
          expNode.destroy();
        }
      }
    });
  },

  applyLevelUp() {
    this.maxHp += 20;
    this.currentHp = this.maxHp;

    this.baseAttack += 5;
    this.expPickupRange += 10;
    this.criticalRate += 0.05;

    // Cứ mỗi cấp tăng 25% EXP cần
    this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);

    this.updateHpLabel();
    this.updateStatsLabel(); // ← Thêm dòng này
    this.updateExpUI();
  },

  updateExpUI() {
    if (this.expBar) {
      this.expBar.progress = this.currentExp / this.expToNextLevel;
    }
    if (this.levelLabel) {
      this.levelLabel.string = "Lv: " + this.level;
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
