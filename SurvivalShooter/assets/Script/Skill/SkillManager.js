import { defaultSkills, weaponSkills } from "./SkillData";

cc.Class({
    extends: cc.Component,

    properties: {
        currentWeapon: "sword",  // Vũ khí hiện tại

        ownedSkillsLabel: cc.Label,     // Label hiển thị kỹ năng đã có
        selectedSkillsLabel: cc.Label,  // Label hiển thị kỹ năng vũ khí đã chọn
        skillPanel: cc.Node,            // Panel chọn kỹ năng
        skillOptionPrefab: cc.Prefab,   // Prefab kỹ năng

        levelUpButton: cc.Button        // Nút thăng cấp để test
    },

    onLoad() {
        console.log("[SkillManager] onLoad - Khởi tạo game");

        this.playerSkills = {};           // Kỹ năng đang có {id: level}
        this.weaponSkillPicked = [];      // Kỹ năng vũ khí đã chọn
        this.skillPanel.active = false;   // Ẩn panel kỹ năng ban đầu
    },

    // Gọi khi nhấn nút thăng cấp
    onLevelUp() {
        console.log("[SkillManager] onLevelUp - Nhấn nút thăng cấp");

        const choices = this.getRandomSkills(3);
        console.log("[SkillManager] onLevelUp - Các kỹ năng hiển thị:", choices);

        this.showSkillPanel(choices);
    },

    // Lấy ngẫu nhiên skill phù hợp
    getRandomSkills(count) {
        console.log("[SkillManager] getRandomSkills - Chuẩn bị danh sách kỹ năng");

        const options = [];

        // Kỹ năng mặc định
        defaultSkills.forEach(skill => {
            options.push({ ...skill, type: "default" });
        });

        // Kỹ năng vũ khí
        const weapon = this.currentWeapon;
        const weaponList = weaponSkills[weapon];

        if (this.weaponSkillPicked.length < 3) {
            console.log("[SkillManager] getRandomSkills - Chưa đủ 3 kỹ năng vũ khí, thêm kỹ năng mới");
            weaponList.forEach(skill => {
                const currentLevel = this.playerSkills[skill.id] || 0;
                if (currentLevel < skill.maxLevel) {
                    options.push({ ...skill, type: "weapon" });
                }
            });
        } else {
            console.log("[SkillManager] getRandomSkills - Đã có 3 kỹ năng vũ khí, chỉ nâng cấp kỹ năng đã chọn");
            this.weaponSkillPicked.forEach(skillId => {
                const skillInfo = weaponList.find(s => s.id === skillId);
                const currentLevel = this.playerSkills[skillId] || 0;
                if (currentLevel < skillInfo.maxLevel) {
                    options.push({ ...skillInfo, type: "weapon" });
                }
            });
        }

        const shuffled = options.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        console.log("[SkillManager] getRandomSkills - Đã chọn ngẫu nhiên:", selected);
        return selected;
    },

    // Hiển thị panel chọn kỹ năng
    showSkillPanel(choices) {
        console.log("[SkillManager] showSkillPanel - Hiển thị panel kỹ năng");

        this.skillPanel.removeAllChildren();
        this.skillPanel.active = true;

        // choices.forEach(skillData => {
        //     const skillNode = cc.instantiate(this.skillOptionPrefab);
        //     const skillScript = skillNode.getComponent("SkillOption");

        //     if (!skillScript) {
        //         console.warn("[SkillManager] showSkillPanel - Không tìm thấy SkillOption trên prefab");
        //         return;
        //     }

        //     skillScript.init(skillData, this.selectSkill.bind(this));
        //     this.skillPanel.addChild(skillNode);
        // Trong showSkillPanel
        choices.forEach(skillData => {
            const skillNode = cc.instantiate(this.skillOptionPrefab);
            const skillScript = skillNode.getComponent("SkillOption");

            if (!skillScript) {
                cc.error("[SkillManager] Không tìm thấy SkillOption script trong prefab!");
            } 
            else {
                cc.log("[SkillManager] Gọi init() với:", skillData.name);
                skillScript.init(skillData, this.selectSkill.bind(this));
            }

            this.skillPanel.addChild(skillNode);
        });
    },

    // Gọi khi người chơi chọn kỹ năng
    selectSkill(skill) {
        console.log("[SkillManager] selectSkill - Người chơi chọn:", skill);

        const prevLevel = this.playerSkills[skill.id] || 0;
        this.playerSkills[skill.id] = prevLevel + 1;

        if (skill.type === "weapon" && !this.weaponSkillPicked.includes(skill.id)) {
            this.weaponSkillPicked.push(skill.id);
        }

        this.skillPanel.active = false;
        this.updateLabels();
    },

    // Cập nhật các label
    updateLabels() {
        console.log("[SkillManager] updateLabels - Cập nhật giao diện");

        const skillText = Object.keys(this.playerSkills).map(id => {
            return `${id}: Lv${this.playerSkills[id]}`;
        }).join("\n");

        this.ownedSkillsLabel.string = "Kỹ năng đang có:\n" + skillText;
        this.selectedSkillsLabel.string = "Kỹ năng vũ khí đã chọn:\n" + this.weaponSkillPicked.join(", ");
    }
});
