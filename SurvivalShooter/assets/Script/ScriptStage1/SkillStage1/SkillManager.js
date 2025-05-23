import { defaultSkills } from "./SkillData";

cc.Class({
  extends: cc.Component,

  properties: {
    player: cc.Node,
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
    this.skillPanel.removeAllChildren();
    this.skillPanel.active = true;

    skills.forEach((skill) => {
      const node = cc.instantiate(this.skillOptionPrefab);
      const skillComp = node.getComponent("SkillOption");
      skillComp.init(skill, () => this.selectSkill(skill));
      this.skillPanel.addChild(node);
    });
    //Pause Game
    cc.director.pause();
  },

  selectSkill(skill) {
    const currentLevel = this.playerSkills[skill.id] || 0;
    if (currentLevel >= skill.maxLevel) {
      cc.warn(`[SkillManager] Skill ${skill.name} đã đạt max level`);
      return;
    }

    this.playerSkills[skill.id] = currentLevel + 1;

    // Cộng trực tiếp buff vào player
    let playerComp =
      this.player.getComponent("Player") ||
      this.player.getComponent("PlayerStage2") ||
      this.player.getComponent("PlayerController") ||
      this.player.getComponent("PlayerStage3");

    if (!playerComp) {
      cc.warn(
        "[SkillManager] Player không có component Player, PlayerStage2 hoặc PlayerStage3"
      );
      return;
    }

    switch (skill.id) {
      case 1: // Power Boost
        playerComp.baseAttack += 5;
        break;
      case 2: // Range Boost
        if (playerComp.attackRange === undefined) {
          playerComp.attackRange = 100;
        }
        playerComp.attackRange += 20;
        break;
      case 3: // Pickup Magnet
        playerComp.expPickupRange += 15;
        break;
      case 4: // Crit Up
        playerComp.criticalRate += 0.05;
        break;
    }

    // Update lại UI cho player
    if (playerComp.updateStatsLabel) {
      playerComp.updateStatsLabel();
    }

    this.skillPanel.active = false;
    this.updateOwnedSkillsLabel();

    // Resume Game
    cc.director.resume();
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
});
