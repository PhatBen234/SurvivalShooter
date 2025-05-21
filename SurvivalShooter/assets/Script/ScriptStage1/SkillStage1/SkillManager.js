import { defaultSkills } from "./SkillData";

cc.Class({
  extends: cc.Component,

  properties: {
    player: cc.Node, // node player, hoặc bạn truyền object player vào
    skillPanel: cc.Node,
    skillOptionPrefab: cc.Prefab,
    ownedSkillsLabel: cc.Label,

    maxSkillsToShow: 3,
  },

  onLoad() {
    this.playerSkills = {}; // { skillId: level }
    this.skillPanel.active = false;
  },

  onLevelUp() {
    // Lấy random skill chưa max level
    const choices = this.getRandomSkills(this.maxSkillsToShow);
    this.showSkillPanel(choices);
  },

  getRandomSkills(count) {
    // Lọc ra skill còn có thể nâng cấp
    const available = defaultSkills.filter((skill) => {
      const level = this.playerSkills[skill.id] || 0;
      return level < skill.maxLevel;
    });

    // Trộn mảng và lấy count phần tử
    const shuffled = available.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  showSkillPanel(skills) {
    this.skillPanel.removeAllChildren();
    this.skillPanel.active = true;

    skills.forEach((skill) => {
      const node = cc.instantiate(this.skillOptionPrefab);
      const skillComp = node.getComponent("SkillOption");
      skillComp.init(skill, () => this.selectSkill(skill));
      this.skillPanel.addChild(node);
    });
  },

  selectSkill(skill) {
    const currentLevel = this.playerSkills[skill.id] || 0;
    this.playerSkills[skill.id] = currentLevel + 1;

    this.applyAllSkills(); // <-- Gọi thay vì apply từng skill riêng lẻ

    this.skillPanel.active = false;
    this.updateOwnedSkillsLabel();
  },

  updateOwnedSkillsLabel() {
    const text = Object.entries(this.playerSkills)
      .map(([id, level]) => {
        const skill = defaultSkills.find((s) => s.id === Number(id));
        return `${skill.name} Lv${level}`;
      })
      .join("\n");

    this.ownedSkillsLabel.string = "Skills Owned:\n" + text;
  },
  applyAllSkills() {
    if (!this.player) {
      cc.warn("[SkillManager] Không tìm thấy player để apply skill");
      return;
    }

    const playerComp = this.player.getComponent("Player");
    if (!playerComp) {
      cc.warn("[SkillManager] Player không có component Player");
      return;
    }

    // Reset chỉ số về mặc định (phải đảm bảo playerComp có các biến này)
    playerComp.baseAttack = playerComp.baseAttackDefault || 0;
    playerComp.attackRange = playerComp.attackRangeDefault || 0;
    playerComp.expPickupRange = playerComp.expPickupRangeDefault || 0;
    playerComp.attackInterval = playerComp.attackIntervalDefault || 1;
    playerComp.criticalRate = playerComp.criticalRateDefault || 0;
    playerComp.lifeRegenAmount = 0;
    playerComp.enableLifeRegen = false;

    // Apply skill 1 lần theo level
    Object.entries(this.playerSkills).forEach(([id, level]) => {
      const skill = defaultSkills.find((s) => s.id === Number(id));
      if (skill) {
        skill.apply(playerComp, level);
      }
    });

    cc.log(
      "[SkillManager] applyAllSkills - Đã cập nhật lại toàn bộ buff kỹ năng"
    );
  },
});
