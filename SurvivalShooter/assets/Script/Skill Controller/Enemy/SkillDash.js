cc.Class({
  extends: require("BaseSkill"),

  properties: {
    duration: 0.3, // thời gian lướt
    delayBeforeDash: 0.5, // thời gian tính toán trước khi lướt
  },

  execute() {
    // Override từ BaseSkill để thực hiện skill dash
    this.dash();
  },

  dash() {
    // Tìm player gần nhất
    let canvas = cc.find("Canvas");
    let players = canvas.children.filter((n) => n.group === "player");
    if (players.length === 0) {
      this.destroySkill();
      return;
    }

    // Sử dụng owner (enemy) từ BaseSkill
    let boss = this.owner || this.node.parent;
    if (!boss || !boss.isValid) {
      this.destroySkill();
      return;
    }

    // Chọn player đầu tiên và lấy vị trí hiện tại của họ
    let player = players[0];
    let playerPos = player.position.clone();

    // Tính hướng và vị trí mục tiêu từ vị trí hiện tại của boss đến playerPos
    let dir = playerPos.sub(boss.position).normalize();
    let distance = this.speed * this.duration; //Sử dụng speed từ BaseSkill
    let target = boss.position.add(dir.mul(distance));

    // Giới hạn vị trí target trong canvas (800x600)
    let halfWidth = 400,
      halfHeight = 300;
    target.x = Math.max(-halfWidth, Math.min(halfWidth, target.x));
    target.y = Math.max(-halfHeight, Math.min(halfHeight, target.y));

    // Đứng yên trước khi dash
    this.scheduleOnce(() => {
      // Kiểm tra lại boss còn sống không
      if (!boss || !boss.isValid) {
        this.destroySkill();
        return;
      }

      cc.tween(boss)
        .to(this.duration, { position: target })
        .call(() => {
          // Tìm lại players (có thể đã thay đổi)
          let currentPlayers = canvas.children.filter(
            (n) => n.group === "player"
          );

          currentPlayers.forEach((p) => {
            if (!p || !p.isValid) return;

            let dist = boss.position.sub(p.position).mag();
            if (dist < 200) {
              this.hitPlayer(p);
            }
          });

          // Hủy skill sau khi hoàn thành
          this.destroySkill();
        })
        .start();
    }, this.delayBeforeDash);
  },

  hitPlayer(player) {
    let playerScript = player.getComponent("PlayerController");
    if (playerScript?.takeDamage) {
      playerScript.takeDamage(this.damage);
    }
  },
});
