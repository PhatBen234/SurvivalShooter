cc.Class({
  extends: cc.Component,

  properties: {
    expAmount: 10, // Số EXP nhận được
    pickupRange: 50, // Khoảng cách để nhặt EXP
  },

  onLoad() {
    this.targetPlayer = cc.find("Canvas/Player"); // Hoặc gán từ bên ngoài tùy bạn setup
  },

  update(dt) {
    if (!this.targetPlayer || !this.targetPlayer.isValid) return;

    const playerPos = this.targetPlayer.getPosition();
    const currentPos = this.node.getPosition();
    const dir = playerPos.sub(currentPos);

    if (dir.mag() < this.pickupRange) {
      const playerScript = this.targetPlayer.getComponent("Player");
      if (playerScript) {
        playerScript.gainExp(this.expAmount);
      }
      this.node.destroy();
    }
  },
});
