cc.Class({
  extends: cc.Component,

  properties: {
    speed: 200,
    direction: 0,
    damage: 20,
  },

  onLoad() {
    this.hasHit = false; 
  },

  init(pos, angle, damage = null, speed = null) {
    this.node.setPosition(pos);
    this.direction = angle;

    // Cho phép override damage và speed từ skill
    if (damage !== null) {
      this.damage = damage;
    }
    if (speed !== null) {
      this.speed = speed;
    }
  },

  update(dt) {
    if (this.hasHit) return;

    // Di chuyển đạn theo hướng và tốc độ
    this.moveForward(dt);

    // Kiểm tra va chạm với player
    this.checkPlayerCollision();

    // Kiểm tra nếu đạn ra khỏi màn hình
    this.checkBounds();
  },

  moveForward(dt) {
    let rad = cc.misc.degreesToRadians(this.direction);
    let dx = Math.cos(rad) * this.speed * dt;
    let dy = Math.sin(rad) * this.speed * dt;
    this.node.x += dx;
    this.node.y += dy;
  },

  checkPlayerCollision() {
    let canvas = cc.find("Canvas");
    let players = canvas.children.filter((n) => n.group === "player");

    for (let player of players) {
      if (!player || !player.isValid) continue;

      let dist = this.node.position.sub(player.position).mag();
      if (dist < 30) {
        this.hitPlayer(player);
        break; // ngắt vòng lặp
      }
    }
  },

  hitPlayer(player) {
    let playerScript = player.getComponent("PlayerController");

    if (playerScript?.takeDamage) {
      playerScript.takeDamage(this.damage);
    }

    this.hasHit = true; // đánh dấu đã trúng
    this.destroyBullet(); // huỷ viên đạn
  },
  //Hủy đạn nếu đạn chạy ra khỏi canvas
  checkBounds() {
    let pos = this.node.position;
    if (Math.abs(pos.x) > 500 || Math.abs(pos.y) > 400) {
      this.destroyBullet();
    }
  },

  destroyBullet() {
    if (this.node && this.node.isValid) {
      this.node.destroy();
    }
  },
});