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
    attackAnim: cc.Animation,

    // Attack stats
    baseAttack: 10, // Tấn công cơ bản
    criticalRate: 0.1, // Tỉ lệ chí mạng (10%)
    attackRange: 100, // Tầm tấn công

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

    this.skillTimer = 0;
    this.canUseSkill = true;

    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

    this.setAnimationActive(this.anim, true);
    this.setAnimationActive(this.attackAnim, false);

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
    if (!this.attackAnim) return;

    this.attackTimer += dt;
    if (this.attackTimer < this.attackInterval || this.isAttacking) return;

    this.attackTimer = 0;
    this.isAttacking = true;

    this.setAnimationActive(this.anim, false);
    this.setAnimationActive(this.attackAnim, true);

    const attackState = this.attackAnim.getAnimationState("SoldierAttack");
    if (attackState) {
      this.attackAnim.play("SoldierAttack");
      attackState.once("finished", () => {
        this.attackNearbyEnemies();
        this.isAttacking = false;

        this.setAnimationActive(this.attackAnim, false);
        this.setAnimationActive(this.anim, true);

        let dir = this.getInputDirection();
        if (
          dir.mag() > 0 &&
          !this.anim.getAnimationState("Soldier").isPlaying
        ) {
          this.anim.play("Soldier");
        } else if (dir.mag() === 0) {
          this.anim.stop("Soldier");
        }
      });
    } else {
      this.isAttacking = false;
      this.setAnimationActive(this.attackAnim, false);
      this.setAnimationActive(this.anim, true);
    }
  },

  attackNearbyEnemies() {
    let damage = this.baseAttack;
    if (Math.random() < this.criticalRate) damage *= 2;

    if (!this.canvasNode) return;

    const enemies = this.canvasNode.children.filter(
      (node) => node.name === "Enemy" || node.group === "enemy"
    );

    enemies.forEach((enemy) => {
      if (!enemy || !enemy.isValid) return;

      const dist = this.node.position.sub(enemy.position).mag();
      if (dist <= this.attackRange) {
        const enemyScript = enemy.getComponent("Enemy");
        if (enemyScript?.takeDamage) enemyScript.takeDamage(damage);
      }
    });
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
      (node) => node.name === "Enemy" || node.group === "enemy"
    );

    enemies.forEach((enemy) => {
      if (!enemy || !enemy.isValid) return;

      const dist = this.node.position.sub(enemy.position).mag();
      if (dist <= SKILL_RANGE) {
        const enemyScript = enemy.getComponent("Enemy");
        if (enemyScript?.takeDamage) enemyScript.takeDamage(SKILL_DAMAGE);
      }
    });
  },

  // --- EXP & LEVEL UP ---
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
    this.attackRange += 10;
    this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);

    this.updateAllUI();

    // Gọi SkillManager hiển thị bảng chọn kỹ năng
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
      this.attackRangeLabel.string = `Attack Range: ${this.attackRange}`;
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
  applyBuffsFromSkill(buffData) {
    // buffData có thể có dạng { maxHp, speed, baseAttack, critRate, expPickupRange, attackInterval }
    if (buffData.maxHp !== undefined) {
      this.maxHp = buffData.maxHp;
      this.currentHp = this.maxHp; // reset HP full khi buff maxHp
    }
    if (buffData.speed !== undefined) this.speed = buffData.speed;
    if (buffData.baseAttack !== undefined)
      this.baseAttack = buffData.baseAttack;
    if (buffData.critRate !== undefined) this.criticalRate = buffData.critRate;
    if (buffData.expPickupRange !== undefined)
      this.expPickupRange = buffData.expPickupRange;
    if (buffData.attackInterval !== undefined)
      this.attackInterval = buffData.attackInterval;

    this.updateAllUI();
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
