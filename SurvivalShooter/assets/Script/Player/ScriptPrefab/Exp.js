cc.Class({
  extends: cc.Component,

  properties: {
    expAmount: 10,
    pickupRange: 50,
  },

  onLoad() {
    // Nếu chưa có targetPlayer thì tự động tìm trong Canvas
    if (!this.targetPlayer) {
      const playerComponent = cc
        .find("Canvas")
        .getComponentInChildren("PlayerController");
      if (playerComponent) {
        this.targetPlayer = playerComponent.node;
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
      const playerScript = this.targetPlayer.getComponent("PlayerController");
      if (playerScript && typeof playerScript.gainExp === "function") {
        playerScript.gainExp(this.expAmount);
      }

      this.node.destroy();
    }
  },
});
