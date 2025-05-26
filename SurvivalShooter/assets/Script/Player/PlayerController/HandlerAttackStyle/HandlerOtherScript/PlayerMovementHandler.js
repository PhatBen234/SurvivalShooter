// PlayerMovementHandler.js - Handles player movement logic
cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
  },

  init(playerModel, playerView, inputHandler) {
    this.playerModel = playerModel;
    this.playerView = playerView;
    this.inputHandler = inputHandler;
  },

  handleMovement(dt) {
    if (!this.playerModel || !this.playerView) return;

    const dir = this.inputHandler.getInputDirection();
    this.updateDirection(dir);

    if (dir.mag() > 0) {
      this.movePlayer(dir.normalize(), dt);
      this.playMovementAnimation();
    } else {
      this.stopMovementAnimation();
    }
  },

  updateDirection(dir) {
    if (!dir.equals(this.playerModel.getLastDirection())) {
      this.playerModel.setLastDirection(dir);
    }
  },

  movePlayer(normalizedDir, dt) {
    this.playerView.updatePlayerScale(normalizedDir);

    let pos = this.node.getPosition();
    pos = pos.add(normalizedDir.mul(this.playerModel.getSpeed() * dt));
    this.node.setPosition(this.clampPositionToCanvas(pos));
  },

  playMovementAnimation() {
    if (!this.playerModel.isAttacking()) {
      this.playerView.playWalkAnimation();
    }
  },

  stopMovementAnimation() {
    if (!this.playerModel.isAttacking()) {
      this.playerView.stopWalkAnimation();
    }
  },

  clampPositionToCanvas(pos) {
    if (!this.canvasNode) return pos;

    const canvasSize = this.canvasNode.getContentSize();
    const nodeSize = this.node.getContentSize();
    const limitX = canvasSize.width / 2 - nodeSize.width - 12;
    const limitY = canvasSize.height / 2 - nodeSize.height - 12;

    return cc.v2(
      Math.min(Math.max(pos.x, -limitX), limitX),
      Math.min(Math.max(pos.y, -limitY), limitY)
    );
  },
});
