// cc.Class({
//   extends: cc.Component,

//   properties: {
//     speed: 200,
//     direction: 0,
//     damage: 20,
//   },

//   onLoad() {
//     this.hasHit = false; // cờ kiểm soát chỉ va chạm 1 lần
//   },

//   init(pos, angle) {
//     this.node.setPosition(pos);
//     this.direction = angle;
//   },

//   update(dt) {
//     if (this.hasHit) return; // nếu đã trúng thì không xử lý tiếp

//     let rad = cc.misc.degreesToRadians(this.direction);
//     let dx = Math.cos(rad) * this.speed * dt;
//     let dy = Math.sin(rad) * this.speed * dt;
//     this.node.x += dx;
//     this.node.y += dy;

//     let canvas = cc.find("Canvas");
//     let players = canvas.children.filter((n) => n.group === "player");

//     for (let player of players) {
//       let dist = this.node.position.sub(player.position).mag();
//       if (dist < 30) {
//         let playerScript = player.getComponent("PlayerStage3");

//         if (playerScript?.takeDamage) {
//           playerScript.takeDamage(this.damage);
//         }
//         this.hasHit = true; // đánh dấu đã trúng
//         this.node.destroy(); // huỷ viên đạn
//         break; // ngắt vòng lặp
//       }
//     }
//   },
// });
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
    if (this.hasHit) return; // nếu đã trúng thì không xử lý tiếp

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
    let playerScript = player.getComponent("Player");
    
    if (playerScript?.takeDamage) {
      playerScript.takeDamage(this.damage);
      cc.log(`[Bullet] Gây ${this.damage} damage cho player`);
    } else {
      cc.warn("[Bullet] Không tìm thấy hàm takeDamage trong player");
    }
    
    this.hasHit = true; // đánh dấu đã trúng
    this.destroyBullet(); // huỷ viên đạn
  },

  checkBounds() {
    // Hủy đạn nếu ra khỏi màn hình (800x600)
    let pos = this.node.position;
    if (Math.abs(pos.x) > 500 || Math.abs(pos.y) > 400) {
      this.destroyBullet();
    }
  },

  destroyBullet() {
    if (this.node && this.node.isValid) {
      this.node.destroy();
    }
  }
});