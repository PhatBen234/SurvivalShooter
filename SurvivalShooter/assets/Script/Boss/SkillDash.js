// cc.Class({
//   extends: cc.Component,

//   properties: {
//     speed: 400, // tốc độ lướt
//     duration: 0.3, // thời gian lướt
//     damage: 30,
//     delayBeforeDash: 0.8, // thời gian đứng yên trước khi lướt
//   },

//   init(owner) {
//     this.owner = owner; // lưu reference đến enemy
//     // Tự động bắt đầu dash khi được khởi tạo
//     this.dash();
//   },

//   dash() {
//     // Tìm player gần nhất
//     let canvas = cc.find("Canvas");
//     let players = canvas.children.filter((n) => n.group === "player");
//     if (players.length === 0) {
//       cc.warn("[Dash] Không tìm thấy player");
//       this.destroySkill();
//       return;
//     }

//     // Sử dụng owner (enemy) thay vì node.parent
//     let boss = this.owner || this.node.parent;
//     if (!boss || !boss.isValid) {
//       cc.error("[Dash] Không tìm thấy boss/owner hợp lệ");
//       this.destroySkill();
//       return;
//     }

//     // Chọn player đầu tiên và lấy vị trí hiện tại của họ (vị trí A)
//     let player = players[0];
//     let playerPos = player.position.clone();

//     // Tính hướng và vị trí mục tiêu từ vị trí hiện tại của boss đến playerPos
//     let dir = playerPos.sub(boss.position).normalize();
//     let distance = this.speed * this.duration;
//     let target = boss.position.add(dir.mul(distance));

//     // Giới hạn vị trí target trong canvas (800x600)
//     let halfWidth = 400,
//       halfHeight = 300;
//     target.x = Math.max(-halfWidth, Math.min(halfWidth, target.x));
//     target.y = Math.max(-halfHeight, Math.min(halfHeight, target.y));

//     cc.log(
//       `[Dash] Khóa vị trí mục tiêu tại: (${playerPos.x.toFixed(
//         2
//       )}, ${playerPos.y.toFixed(2)})`
//     );

//     // Đứng yên trước khi dash
//     this.scheduleOnce(() => {
//       // Kiểm tra lại boss còn tồn tại không
//       if (!boss || !boss.isValid) {
//         cc.warn("[Dash] Boss đã bị hủy, hủy skill");
//         this.destroySkill();
//         return;
//       }

//       cc.log(`[Dash] Bắt đầu dash đến vị trí đã khóa`);

//       cc.tween(boss)
//         .to(this.duration, { position: target })
//         .call(() => {
//           cc.log(`[Dash] Đã đến vị trí. Kiểm tra va chạm`);

//           // Tìm lại players (có thể đã thay đổi)
//           let currentPlayers = canvas.children.filter((n) => n.group === "player");

//           currentPlayers.forEach((p) => {
//             if (!p || !p.isValid) return;

//             let dist = boss.position.sub(p.position).mag();
//             if (dist < 100) {
//               let playerScript = p.getComponent("PlayerStage3");
//               if (playerScript?.takeDamage) {
//                 playerScript.takeDamage(this.damage);
//                 cc.log(
//                   `[Dash] Gây damage ${
//                     this.damage
//                   } cho player tại khoảng cách ${dist.toFixed(2)}`
//                 );
//               } else {
//                 cc.warn("[Dash] Không tìm thấy hàm takeDamage trong player");
//               }
//             } else {
//               cc.log(
//                 `[Dash] Player cách xa ${dist.toFixed(2)}, không gây damage`
//               );
//             }
//           });

//           // Hủy skill sau khi hoàn thành
//           this.destroySkill();
//         })
//         .start();
//     }, this.delayBeforeDash);
//   },

//   destroySkill() {
//     // Hủy skill node an toàn
//     this.scheduleOnce(() => {
//       if (this.node && this.node.isValid) {
//         this.node.destroy();
//       }
//     }, 0.1);
//   },

//   onDestroy() {
//     // Cleanup khi skill bị hủy
//     this.unscheduleAllCallbacks();
//   }
// });

cc.Class({
  extends: require('BaseSkill'),

  properties: {
    duration: 0.3, // thời gian lướt
    delayBeforeDash: 0.8, // thời gian đứng yên trước khi lướt
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
    let distance = this.speed * this.duration; // Sử dụng speed từ BaseSkill
    let target = boss.position.add(dir.mul(distance));

    // Giới hạn vị trí target trong canvas (800x600)
    let halfWidth = 400,
      halfHeight = 300;
    target.x = Math.max(-halfWidth, Math.min(halfWidth, target.x));
    target.y = Math.max(-halfHeight, Math.min(halfHeight, target.y));

    // Đứng yên trước khi dash
    this.scheduleOnce(() => {
      // Kiểm tra lại boss còn tồn tại không
      if (!boss || !boss.isValid) {
        this.destroySkill();
        return;
      }

      cc.tween(boss)
        .to(this.duration, { position: target })
        .call(() => {

          // Tìm lại players (có thể đã thay đổi)
          let currentPlayers = canvas.children.filter((n) => n.group === "player");

          currentPlayers.forEach((p) => {
            if (!p || !p.isValid) return;

            let dist = boss.position.sub(p.position).mag();
            if (dist < 100) {
              this.hitPlayer(p, dist);
            }
          });

          // Hủy skill sau khi hoàn thành
          this.destroySkill();
        })
        .start();
    }, this.delayBeforeDash);
  },

  hitPlayer(player, distance) {
    let playerScript = player.getComponent("PlayerStage3");
    if (playerScript?.takeDamage) {
      playerScript.takeDamage(this.damage); // Sử dụng damage từ BaseSkill
    }
  }
});