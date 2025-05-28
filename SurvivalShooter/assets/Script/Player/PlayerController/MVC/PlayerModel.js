cc.Class({
  extends: cc.Component,

  properties: {
    // HP & Movement
    _maxHp: 10000,
    _currentHp: 100,
    _speed: 200,

    // Attack stats
    _baseAttack: 10000,
    _criticalRate: 0.1,
    _meleeAttackRange: 100,
    _rangedAttackRange: 300,
    _meleeToRangedThreshold: 120,

    // EXP & Level
    _level: 1,
    _currentExp: 0,
    _expToNextLevel: 50,
    _expPickupRange: 100,

    // Skill
    _skillCooldown: 4,
    _attackInterval: 2,
    _skillDamage: 10, // Thêm skill damage base

    // Ultimate Skill Properties
    _hasUltimateSkill: false,
    _ultimateCooldown: 1, // 15 giây cooldown cho ultimate (fix sau)
    _canUseUltimate: true,

    // State
    _isAttacking: false,
    _currentAttackType: null,
    _canUseSkill: true,
    _lastDirection: null,
  },

  onLoad() {
    this._currentHp = this._maxHp;
    this._lastDirection = cc.v2(0, 0);
  },

  // === HP METHODS ===
  getMaxHp() {
    return this._maxHp;
  },
  getCurrentHp() {
    return this._currentHp;
  },
  setCurrentHp(value) {
    this._currentHp = Math.max(0, Math.min(value, this._maxHp));
  },
  addMaxHp(amount) {
    this._maxHp += amount;
  },

  // === ATTACK METHODS ===
  getBaseAttack() {
    return this._baseAttack;
  },
  addBaseAttack(amount) {
    this._baseAttack += amount;
  },
  getCriticalRate() {
    return this._criticalRate;
  },
  addCriticalRate(amount) {
    this._criticalRate = Math.min(1, this._criticalRate + amount);
  },
  getMeleeAttackRange() {
    return this._meleeAttackRange;
  },
  addMeleeAttackRange(amount) {
    this._meleeAttackRange += amount;
  },
  getRangedAttackRange() {
    return this._rangedAttackRange;
  },
  addRangedAttackRange(amount) {
    this._rangedAttackRange += amount;
  },
  getMeleeToRangedThreshold() {
    return this._meleeToRangedThreshold;
  },
  addMeleeToRangedThreshold(amount) {
    this._meleeToRangedThreshold += amount;
  },

  // === SKILL DAMAGE METHODS ===
  getSkillDamage() {
    return this._skillDamage;
  },
  addSkillDamage(amount) {
    this._skillDamage += amount;
  },

  // === ULTIMATE SKILL METHODS ===
  hasUltimateSkill() {
    return this._hasUltimateSkill;
  },
  setHasUltimateSkill(value) {
    this._hasUltimateSkill = value;
  },
  getUltimateCooldown() {
    return this._ultimateCooldown;
  },
  canUseUltimate() {
    return this._canUseUltimate && this._hasUltimateSkill;
  },
  setCanUseUltimate(value) {
    this._canUseUltimate = value;
  },

  // === MOVEMENT METHODS ===
  getSpeed() {
    return this._speed;
  },
  getLastDirection() {
    return this._lastDirection;
  },
  setLastDirection(dir) {
    this._lastDirection = dir.clone();
  },

  // === LEVEL & EXP METHODS ===
  getLevel() {
    return this._level;
  },
  levelUp() {
    this._level++;
  },
  getCurrentExp() {
    return this._currentExp;
  },
  getExpToNextLevel() {
    return this._expToNextLevel;
  },
  addExp(amount) {
    this._currentExp += amount;
  },
  subtractExp(amount) {
    this._currentExp -= amount;
  },
  setExpToNextLevel(amount) {
    this._expToNextLevel = amount;
  },
  getExpPickupRange() {
    return this._expPickupRange;
  },
  addExpPickupRange(amount) {
    this._expPickupRange += amount;
  },

  // === ATTACK STATE METHODS ===
  getAttackInterval() {
    return this._attackInterval;
  },
  isAttacking() {
    return this._isAttacking;
  },
  setAttacking(value) {
    this._isAttacking = value;
  },
  getCurrentAttackType() {
    return this._currentAttackType;
  },
  setCurrentAttackType(type) {
    this._currentAttackType = type;
  },

  // === SKILL METHODS ===
  getSkillCooldown() {
    return this._skillCooldown;
  },
  canUseSkill() {
    return this._canUseSkill;
  },
  setCanUseSkill(value) {
    this._canUseSkill = value;
  },

  // === SKILL BUFF METHODS ===
  applySkillBuff(skillId, amount) {
    switch (skillId) {
      case 1: // Power Boost
        this.addBaseAttack(amount);
        break;
      case 2: // Range Boost - tăng cả melee và ranged
        this.addMeleeAttackRange(amount);
        this.addRangedAttackRange(amount);
        break;
      case 3: // Pickup Magnet
        this.addExpPickupRange(amount);
        break;
      case 4: // Crit Up
        this.addCriticalRate(amount);
        break;
      case 5: // Skill Damage
        this.addSkillDamage(amount);
        break;
      case 6: // Ultimate Skill
        this.setHasUltimateSkill(true);
        cc.log("[PlayerModel] Ultimate Skill unlocked!");
        break;
      default:
        cc.warn(`[PlayerModel] Unknown skill ID: ${skillId}`);
    }
  },

  // === LEVEL UP BENEFITS ===
  applyLevelUpBenefits() {
    this.addMaxHp(20);
    this.setCurrentHp(this.getMaxHp()); // Full heal
    this.addBaseAttack(5);
    this.addExpPickupRange(10);
    this.addCriticalRate(0.05);
    this.addMeleeAttackRange(10);
    this.addRangedAttackRange(15);
    this.addMeleeToRangedThreshold(10);
    this.addSkillDamage(2); // Thêm skill damage khi level up
    this.setExpToNextLevel(Math.floor(this._expToNextLevel * 1.25));
  },
});
