// PlayerExpHandler.js - Handles experience and leveling system
cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: cc.Node,
    skillManager: cc.Node,
  },

  init(playerModel, playerView) {
    this.playerModel = playerModel;
    this.playerView = playerView;
  },

  gainExp(amount) {
    if (!this.playerModel || !this.playerView) return;

    this.playerModel.addExp(amount);
    this.tryLevelUp();
    this.playerView.updateExpUI();
  },

  tryLevelUp() {
    while (
      this.playerModel.getCurrentExp() >= this.playerModel.getExpToNextLevel()
    ) {
      this.playerModel.subtractExp(this.playerModel.getExpToNextLevel());
      this.playerModel.levelUp();
      this.applyLevelUp();
    }
  },

  applyLevelUp() {
    const oldSkillDamage = this.playerModel.getSkillDamage();

    this.playerModel.applyLevelUpBenefits();

    const newSkillDamage = this.playerModel.getSkillDamage();
    cc.log(
      `[PlayerExpHandler] Level up! Skill damage: ${oldSkillDamage} -> ${newSkillDamage}`
    );

    this.playerView.updateAllUI();

    const skillMgrScript = this.skillManager?.getComponent("SkillManager");
    skillMgrScript?.onLevelUp();
  },

  collectNearbyExp(dt) {
    if (!this.canvasNode || !this.playerModel) return;

    const expNodes = this.getExpNodes();
    const playerPos = this.node.position;
    const speed = 300;
    const pickupRange = this.playerModel.getExpPickupRange();

    expNodes.forEach((expNode) => {
      if (!expNode?.isValid) return;

      const distance = playerPos.sub(expNode.position).mag();
      if (distance <= pickupRange) {
        this.moveExpToPlayer(expNode, playerPos, speed * dt);
      }
    });
  },

  getExpNodes() {
    return this.canvasNode.children.filter(
      (node) => node.group === "exp" || node.name === "Exp"
    );
  },

  moveExpToPlayer(expNode, playerPos, moveDistance) {
    const direction = playerPos.sub(expNode.position).normalize();
    const newPos = expNode.position.add(direction.mul(moveDistance));
    expNode.setPosition(newPos);

    if (newPos.sub(playerPos).mag() < 10) {
      const expScript = expNode.getComponent("Exp");
      if (expScript?.getAmount) {
        this.gainExp(expScript.getAmount());
      }
      expNode.destroy();
    }
  },
});
