cc.Class({
    extends: cc.Component,

    properties: {
        // Label hiển thị tên kỹ năng trong prefab
        label: cc.Label,
    },

    // Hàm khởi tạo dữ liệu kỹ năng và callback khi chọn
    init(skillData, callback) {
        this.skillData = skillData;     // Lưu thông tin kỹ năng
        this.label.string = skillData.name;  // Hiển thị tên kỹ năng lên Label
        this.callback = callback;       // Lưu callback để gọi khi người chơi chọn kỹ năng

        cc.log("[SkillOption] init - Gán dữ liệu:", skillData.name);
    },

    // Gọi khi người chơi click vào prefab này
    onClick() {
        cc.log("[SkillOption] onClick - Người chơi đã nhấn chọn:", this.skillData.name);

        if (this.callback) {
            this.callback(this.skillData);  // Gọi callback về SkillManager
            cc.log("[SkillOption] onClick - Đã gọi callback về SkillManager");
        } else {
            cc.warn("[SkillOption] onClick - Không tìm thấy callback");
        }
    }
});
