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

    skillNode: cc.Node,
    skillCooldown: 4,
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,
    attackLabel: cc.Label,
    critLabel: cc.Label,
    rangeLabel: cc.Label,

    level: 1,
    currentExp: 0,
    expToNextLevel: 50,

    baseAttack: 10,
    criticalRate: 0.1,
    expPickupRange: 100,

    isInvincible: false,   // Biến để kiểm tra miễn nhiễm
    invincibleTime: 1.0,   // Thời gian miễn nhiễm sau khi trúng đòn (giây)
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
  // --- ATTACK ALL NEARBY ENEMIES INCLUDING BOSS ---
  attackNearbyEnemies() {
    this.attackEnemyIfNearby();
    this.attackBossIfNearby();
  },

  // --- ATTACK ENEMY ---
  attackEnemyIfNearby() {
    const ATTACK_RANGE = 100;
    let damage = this.baseAttack;
    if (Math.random() < this.criticalRate) damage *= 2;

    if (!this.canvasNode) return;

    const enemies = this.canvasNode.children.filter(
      (node) => node.name === "Enemy" || node.group === "enemy"
    );

    enemies.forEach((enemy) => {
      if (!enemy || !enemy.isValid) return;

      const dist = this.node.position.sub(enemy.position).mag();
      if (dist <= ATTACK_RANGE) {
        const enemyScript = enemy.getComponent("Enemy");
        if (enemyScript?.takeDamage) enemyScript.takeDamage(damage);
      }
    });
  },
  // --- ATTACK BOSS ---
  attackBossIfNearby() {
    const ATTACK_RANGE = 100;
    let damage = this.baseAttack;

    // Nếu chí mạng thì nhân đôi damage
    if (Math.random() < this.criticalRate) {
      damage *= 2;
    }

    if (!this.canvasNode) return;

    const bosses = this.canvasNode.children.filter(
      (node) => node.name === "FinalBoss" || node.group === "boss"
    );

    bosses.forEach((boss) => {
      if (!boss || !boss.isValid) return;

      const dist = this.node.position.sub(boss.position).mag();
      if (dist <= ATTACK_RANGE) {
        const bossScript = boss.getComponent("Boss");
        if (bossScript?.takeDamage) {
          bossScript.takeDamage(damage);
        }
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
    this.skillDamageBoss(SKILL_RANGE, SKILL_DAMAGE); //Gọi hàm Skill gây dmg lên boss
  },

  skillDamageBoss(range, damage) {
    if (!this.canvasNode) return;

    const bosses = this.canvasNode.children.filter(
      (node) => node.name === "FinalBoss" || node.group === "boss"
    );

    bosses.forEach((boss) => {
      if (!boss || !boss.isValid) return;

      const dist = this.node.position.sub(boss.position).mag();
      if (dist <= range) {
        const bossScript = boss.getComponent("Boss");
        if (bossScript?.takeDamage) {
          bossScript.takeDamage(damage);
        }
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

    this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);

    this.updateAllUI();
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
    if (!this.isInvincible) {
      this.currentHp -= amount;
      this.isInvincible = true;
      this.scheduleOnce(() => {
        this.isInvincible = false;
      }, this.invincibleTime);
    }
    if (this.currentHp < 0) this.currentHp = 0;
    this.updateHpLabel();
    this.node.runAction(
      cc.sequence(
        cc.fadeTo(0.1, 100),
        cc.fadeTo(0.1, 255)
      )
    );
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
    if (this.rangeLabel)
      this.rangeLabel.string = `Range: ${this.expPickupRange}`;
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
