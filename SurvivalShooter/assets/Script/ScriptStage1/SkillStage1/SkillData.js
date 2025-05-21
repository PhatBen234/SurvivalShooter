export const defaultSkills = [
  {
    id: 1,
    name: "Power Boost",
    maxLevel: 3,
    description: "Tăng tấn công cơ bản",
    apply(player) {
      player.baseAttack += 5;
    },
  },
  {
    id: 2,
    name: "Range Boost",
    maxLevel: 2,
    description: "Tăng tầm tấn công",
    apply(player) {
      player.attackRange += 20;
    },
  },
  {
    id: 3,
    name: "Pickup Magnet",
    maxLevel: 3,
    description: "Tăng tầm hút EXP",
    apply(player) {
      player.expPickupRange += 15;
    },
  },
  {
    id: 4,
    name: "Attack Speed",
    maxLevel: 3,
    description: "Giảm thời gian giữa các đòn đánh",
    apply(player) {
      player.attackInterval = Math.max(0.1, player.attackInterval - 0.1);
    },
  },
  {
    id: 5,
    name: "Crit Up",
    maxLevel: 3,
    description: "Tăng tỉ lệ chí mạng",
    apply(player) {
      player.criticalRate += 0.05;
    },
  },
  {
    id: 6,
    name: "Life Regen",
    maxLevel: 3,
    description: "Hồi máu mỗi vài giây",
    apply(player) {
      // Có thể add timer hoặc flag để player tự hồi hp trong update()
      player.enableLifeRegen = true;
      player.lifeRegenAmount = (player.lifeRegenAmount || 0) + 2;
    },
  },
];
