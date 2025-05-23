// PlayerView.js - UI và Animation từ code gốc
cc.Class({
  extends: cc.Component,

  properties: {
    // Animation
    anim: cc.Animation,
    meleeAttackAnim: cc.Animation, // animation cận chiến
    rangedAttackAnim: cc.Animation, // animation tầm xa
    arrowPrefab: cc.Prefab,

    // UI Label
    hpLabel: cc.Label,
    attackLabel: cc.Label,
    critLabel: cc.Label,
    expRangeLabel: cc.Label,
    attackRangeLabel: cc.Label,
    expBar: cc.ProgressBar,
    levelLabel: cc.Label,

    // Kỹ năng
    skillNode: cc.Node,
  },

  onLoad() {
    this.updateAllUI();
    this.setAnimationActive(this.anim, true);
    this.setAnimationActive(this.meleeAttackAnim, false);
    this.setAnimationActive(this.rangedAttackAnim, false);

    if (this.skillNode) this.skillNode.active = false;
  },

  setAnimationActive(animationComponent, isActive) {
    if (!animationComponent || !animationComponent.node) return;
    animationComponent.node.active = isActive;
    if (!isActive) animationComponent.stop();
  },

  spawnArrowToTarget(target, canvasNode, playerModel) {
    if (!this.arrowPrefab || !target) return;

    const arrow = cc.instantiate(this.arrowPrefab);
    canvasNode.addChild(arrow);
    arrow.setPosition(this.node.position);

    const arrowScript = arrow.getComponent("Arrow");
    if (arrowScript && arrowScript.init) {
      let damage = playerModel.baseAttack;
      if (Math.random() < playerModel.criticalRate) damage *= 2;
      arrowScript.init(target, damage);
    }
  },

  // --- UI UPDATE HELPERS ---
  updateHpLabel(playerModel) {
    if (this.hpLabel) {
      this.hpLabel.string = `HP: ${playerModel.currentHp}`;
    }
  },

  updateStatsLabel(playerModel) {
    if (this.attackLabel)
      this.attackLabel.string = `Atk: ${playerModel.baseAttack}`;
    if (this.critLabel)
      this.critLabel.string = `Crit: ${Math.floor(
        playerModel.criticalRate * 100
      )}%`;
    if (this.expRangeLabel)
      this.expRangeLabel.string = `EXP Range: ${playerModel.expPickupRange}`;
    if (this.attackRangeLabel)
      this.attackRangeLabel.string = `Melee: ${playerModel.meleeAttackRange} | Archer: ${playerModel.attackRange}`;
  },

  updateExpUI(playerModel) {
    if (this.expBar)
      this.expBar.progress =
        playerModel.currentExp / playerModel.expToNextLevel;
    if (this.levelLabel) this.levelLabel.string = `Lv: ${playerModel.level}`;
  },

  updateAllUI(playerModel) {
    this.updateHpLabel(playerModel);
    this.updateStatsLabel(playerModel);
    this.updateExpUI(playerModel);
  },

  clampPositionToCanvas(pos, canvasNode) {
    if (!canvasNode) return pos;

    const canvasSize = canvasNode.getContentSize();
    const nodeSize = this.node.getContentSize();

    const limitX = canvasSize.width / 2 - nodeSize.width - 12;
    const limitY = canvasSize.height / 2 - nodeSize.height - 12;

    const clampedX = Math.min(Math.max(pos.x, -limitX), limitX);
    const clampedY = Math.min(Math.max(pos.y, -limitY), limitY);

    return cc.v2(clampedX, clampedY);
  },
});
