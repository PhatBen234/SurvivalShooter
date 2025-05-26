cc.Class({
  extends: cc.Component,

  properties: {
    speed: 200,
    direction: 0,
    damage: 20,
  },

  onLoad() {
    this.hasHit = false; // cờ kiểm soát chỉ va chạm 1 lần
  },

  init(pos, angle) {
    this.node.setPosition(pos);
    this.direction = angle;
    cc.log("[SkillShoot] Khởi tạo skill tại vị trí:", pos, "góc:", angle);
  },

  update(dt) {
    if (this.hasHit) return; // nếu đã trúng thì không xử lý tiếp

    let rad = cc.misc.degreesToRadians(this.direction);
    let dx = Math.cos(rad) * this.speed * dt;
    let dy = Math.sin(rad) * this.speed * dt;
    this.node.x += dx;
    this.node.y += dy;

    let canvas = cc.find("Canvas");
    let players = canvas.children.filter((n) => n.group === "player");

    for (let player of players) {
      let dist = this.node.position.sub(player.position).mag();
      if (dist < 30) {
        cc.log(
          `[SkillShoot] Va chạm với player ${
            player.name
          }, khoảng cách: ${dist.toFixed(2)}`
        );
        let playerScript = player.getComponent("PlayerController");

        if (playerScript?.takeDamage) {
          cc.log(
            `[SkillShoot] Gọi takeDamage cho player, damage = ${this.damage}`
          );
          playerScript.takeDamage(this.damage);
        } else {
          cc.log(
            "[SkillShoot] Không lấy được component PlayerStage3 hoặc hàm takeDamage"
          );
        }

        this.hasHit = true; // đánh dấu đã trúng
        this.node.destroy(); // huỷ viên đạn
        break; // ngắt vòng lặp
      }
    }
  },
});
