cc.Class({
  extends: cc.Component,

  properties: {
    speed: 400, // tốc độ lướt
    duration: 0.3, // thời gian lướt
    damage: 30,
    delayBeforeDash: 0.8, // thời gian đứng yên trước khi lướt
  },

  dash() {
    // Tìm player gần nhất
    let canvas = cc.find("Canvas");
    let players = canvas.children.filter((n) => n.group === "player");
    if (players.length === 0) {
      cc.warn("[Dash] Không tìm thấy player");
      return;
    }

    let boss = this.node.parent;

    // Chọn player đầu tiên và lấy vị trí hiện tại của họ (vị trí A)
    let player = players[0];
    let playerPos = player.position.clone();

    // Tính hướng và vị trí mục tiêu từ vị trí hiện tại của boss đến playerPos
    let dir = playerPos.sub(boss.position).normalize();
    let distance = this.speed * this.duration;
    let target = boss.position.add(dir.mul(distance));

    // Giới hạn vị trí target trong canvas (800x600)
    let halfWidth = 400,
      halfHeight = 300;
    target.x = Math.max(-halfWidth, Math.min(halfWidth, target.x));
    target.y = Math.max(-halfHeight, Math.min(halfHeight, target.y));

    cc.log(
      `[Dash] Khóa vị trí mục tiêu tại: (${playerPos.x.toFixed(
        2
      )}, ${playerPos.y.toFixed(2)})`
    );

    // Đứng yên 2 giây trước khi dash
    this.scheduleOnce(() => {
      cc.log(`[Dash] Bắt đầu dash đến vị trí đã khóa`);

      cc.tween(boss)
        .to(this.duration, { position: target })
        .call(() => {
          cc.log(`[Dash] Đã đến vị trí. Kiểm tra va chạm`);
          players.forEach((p) => {
            let dist = boss.position.sub(p.position).mag();
            if (dist < 100) {
              let playerScript = p.getComponent("PlayerController");
              if (playerScript?.takeDamage) {
                playerScript.takeDamage(this.damage);
                cc.log(
                  `[Dash] Gây damage ${
                    this.damage
                  } cho player tại khoảng cách ${dist.toFixed(2)}`
                );
              } else {
                cc.warn("[Dash] Không tìm thấy hàm takeDamage trong player");
              }
            } else {
              cc.log(
                `[Dash] Player cách xa ${dist.toFixed(2)}, không gây damage`
              );
            }
          });
        })
        .start();
    }, this.delayBeforeDash);
  },
});
