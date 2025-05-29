// SkillManager.js - Cập nhật để tương thích với MVC và Ultimate Skill
import { defaultSkills } from "./SkillData";

cc.Class({
  extends: cc.Component,

  properties: {
    player: cc.Node,
    skillSelect: cc.Node,
    skillPanel: cc.Node,
    skillOptionPrefab: cc.Prefab,

    maxSkillsToShow: 3,
  },

  onLoad() {
    this.playerSkills = {}; // { skillId: level }
    this.skillPanel.active = false;

    // Cache player controller reference
    this.playerController = null;
    this.initPlayerController();
  },

  initPlayerController() {
    if (!this.player) {
      cc.warn("[SkillManager] Player node không được assign");
      return;
    }

    // Tìm PlayerController component
    this.playerController = this.player.getComponent("PlayerController");

    if (!this.playerController) {
      cc.warn("[SkillManager] Không tìm thấy PlayerController component");
    }
  },

  onLevelUp() {
    const choices = this.getRandomSkills(this.maxSkillsToShow);
    this.showSkillPanel(choices);
  },

  getRandomSkills(count) {
    const available = defaultSkills.filter((skill) => {
      const level = this.playerSkills[skill.id] || 0;
      return level < skill.maxLevel;
    });
    const shuffled = available.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  showSkillPanel(skills) {
    this.skillSelect.removeAllChildren();
    this.skillPanel.active = true;//Hiện Panel

    skills.forEach((skill) => {
      const node = cc.instantiate(this.skillOptionPrefab);
      const skillComp = node.getComponent("SkillOption");
      skillComp.init(skill, () => this.selectSkill(skill));
      this.skillSelect.addChild(node);
    });

    // Pause Game
    cc.director.pause();
  },

  selectSkill(skill) {
    const currentLevel = this.playerSkills[skill.id] || 0;
    if (currentLevel >= skill.maxLevel) {
      cc.warn(`[SkillManager] Skill ${skill.name} đã đạt max level`);
      return;
    }

    // Cập nhật skill level
    this.playerSkills[skill.id] = currentLevel + 1;

    // Kiểm tra PlayerController
    if (!this.playerController) {
      this.initPlayerController(); // Thử init lại
      if (!this.playerController) {
        cc.warn("[SkillManager] PlayerController không khả dụng");
        return;
      }
    }

    // Apply skill buff thông qua PlayerController
    this.applySkillEffect(skill.id);

    // Đóng skill panel và cập nhật UI
    this.skillPanel.active = false;

    // Resume Game
    cc.director.resume();
  },

  applySkillEffect(skillId) {
    if (!this.playerController) return;

    // Định nghĩa effect của từng skill
    const skillEffects = {
      1: { name: "Power Boost", amount: 5 }, // +5 attack
      2: { name: "Range Boost", amount: 20 }, // +20 range
      3: { name: "Pickup Magnet", amount: 15 }, // +15 exp pickup range
      4: { name: "Crit Up", amount: 0.05 }, // +5% crit rate
      5: { name: "Skill Damage", amount: 10 }, // +10 skill damage
      6: { name: "Ultimate Skill", amount: 1 }, // Ultimate skill unlock
    };

    const effect = skillEffects[skillId];
    if (!effect) {
      cc.warn(`[SkillManager] Unknown skill ID: ${skillId}`);
      return;
    }

    // Apply buff thông qua PlayerController
    this.playerController.applySkillBuff(skillId, effect.amount);

    cc.log(`[SkillManager] Applied ${effect.name}: +${effect.amount}`);
  },

  // === ULTIMATE SKILL METHODS ===
  hasUltimateSkill() {
    return (this.playerSkills[6] || 0) > 0;
  },

  // === DEBUG METHODS ===
  getCurrentSkills() {
    return this.playerSkills;
  },

  debugPlayerStats() {
    if (!this.playerController) return;

    cc.log("[SkillManager] Current Player Stats:");
    cc.log(`- Attack: ${this.playerController.getBaseAttack()}`);
    cc.log(`- Range: ${this.playerController.getRangedAttackRange()}`);
    cc.log(`- EXP Range: ${this.playerController.getExpPickupRange()}`);
    cc.log(
      `- Crit Rate: ${Math.floor(
        this.playerController.getCriticalRate() * 100
      )}%`
    );
    cc.log(`- Skill Damage: ${this.playerController.getSkillDamage()}`);
    cc.log(`- Has Ultimate: ${this.hasUltimateSkill()}`);
  },
});
