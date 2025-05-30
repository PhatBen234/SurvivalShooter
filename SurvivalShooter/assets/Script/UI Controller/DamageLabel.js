// DamageLabel.js
cc.Class({
  extends: cc.Component,

  properties: {
    label: cc.Label,
  },

  showDamage(damage, isCritical = false) {
    this.label.string = "-" + damage;

    // Thay đổi màu sắc dựa trên loại damage
    if (isCritical) {
      this.label.node.color = cc.Color.RED;
      // Có thể thêm size lớn hơn cho critical
      this.label.fontSize = this.label.fontSize * 1.2;
    } else {
      this.label.node.color = cc.Color.WHITE;
    }

    // Animation bay lên và biến mất
    let fadeOut = cc.fadeOut(1.0);
    let moveUp = cc.moveBy(1.0, cc.v2(0, 50));
    let spawn = cc.spawn(fadeOut, moveUp);
    let callback = cc.callFunc(() => {});

    let sequence = cc.sequence(spawn, callback);
    this.node.runAction(sequence);
  },
});
