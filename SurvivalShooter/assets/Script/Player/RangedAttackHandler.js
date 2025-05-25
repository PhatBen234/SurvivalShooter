// RangedAttackHandler.js - Xử lý tấn công tầm xa
cc.Class({
  extends: cc.Component,

  properties: {
    // Sẽ được init từ PlayerController
    playerModel: null,
    playerView: null,
    canvasNode: null,
    arrowPrefab: null,
  },

  // Khởi tạo từ PlayerController
  init(playerModel, playerView, canvasNode, arrowPrefab) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.canvasNode = canvasNode;
    this.arrowPrefab = arrowPrefab;
  },

  // Thực hiện tấn công tầm xa
  performAttack(target, onFinishCallback) {
    if (!this.playerModel || !this.playerView) return;

    // Play ranged attack animation
    this.playerView.playRangedAttackAnimation(() => {
      this.executeRangedDamage(target);
      if (onFinishCallback) {
        onFinishCallback();
      }
    });
  },

  // Thực hiện damage tầm xa bằng cách spawn arrow
  executeRangedDamage(target) {
    if (!target || !target.isValid) return;
    this.spawnArrowToTarget(target);
  },

  // Spawn arrow bay về phía target
  spawnArrowToTarget(target) {
    if (!this.arrowPrefab || !target || !this.canvasNode) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    this.canvasNode.addChild(arrow);
    arrow.setPosition(this.node.position);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript && arrowScript.init) {
      const damage = this.playerModel.calculateDamage();
      arrowScript.init(target, damage);
    }
  },
});
