// PlayerModel.js - Data từ code gốc
cc.Class({
  extends: cc.Component,

  properties: {
    // HP & di chuyển
    maxHp: 100,
    currentHp: 100,
    speed: 200,

    // Attack stats
    baseAttack: 10, // Tấn công cơ bản
    criticalRate: 0.1, // Tỉ lệ chí mạng (10%)
    meleeAttackRange: 100, // Tầm tấn công cận chiến
    attackRange: 300, // Tầm tấn công tầm xa

    // Khoảng cách tối thiểu để ưu tiên ranged attack
    meleeToRangedThreshold: 120, // Nếu > 120 thì ưu tiên bắn cung

    // EXP & Level
    level: 1,
    currentExp: 0,
    expToNextLevel: 50,
    expPickupRange: 100, // Tầm hút exp

    // Auto attack
    attackInterval: 2,

    // Skill
    skillCooldown: 4,
  },

  onLoad() {
    this.currentHp = this.maxHp;
    this.keyPressed = {};
    this.lastDir = cc.v2(0, 0);
    this.attackTimer = 0;
    this.isAttacking = false;
    this.currentAttackType = null; // 'melee' hoặc 'ranged'
    this.skillTimer = 0;
    this.canUseSkill = true;
  },

  // --- EXP SYSTEM ---
  gainExp(amount) {
    this.currentExp += amount;
    this.tryLevelUp();
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
  },

  // --- HP ---
  takeDamage(amount) {
    this.currentHp -= amount;
    if (this.currentHp < 0) this.currentHp = 0;
  },
});
