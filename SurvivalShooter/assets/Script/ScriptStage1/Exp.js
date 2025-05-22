cc.Class({
  extends: cc.Component,

  properties: {
    expAmount: 10,
    pickupRange: 50,
  },

  onLoad() {
    // Nếu chưa có targetPlayer thì tự động tìm trong Canvas
    if (!this.targetPlayer) {
      this.targetPlayer =
        cc.find("Canvas").getComponentInChildren("Player") ||
        cc.find("Canvas").getComponentInChildren("PlayerStage2") ||
        cc.find("Canvas").getComponentInChildren("PlayerStage3");

      if (this.targetPlayer) {
        this.targetPlayer = this.targetPlayer.node;
      } else {
        cc.warn("EXP: Không tìm thấy Player!");
      }
    }
  },

  update(dt) {
    if (!this.targetPlayer || !this.targetPlayer.isValid) return;

    const playerPos = this.targetPlayer.getPosition();
    const currentPos = this.node.getPosition();
    const dir = playerPos.sub(currentPos);

    if (dir.mag() < this.pickupRange) {
      const playerScript =
        this.targetPlayer.getComponent("Player") ||
        this.targetPlayer.getComponent("PlayerStage2") ||
        this.targetPlayer.getComponent("PlayerStage3");

      if (playerScript && typeof playerScript.gainExp === "function") {
        playerScript.gainExp(this.expAmount);
      }

      this.node.destroy();
    }
  },
});
