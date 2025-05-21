cc.Class({
    extends: cc.Component,

    properties: {
        speed: 200,
        direction: 0,
        damage: 20
    },

    init(pos, angle) {
        this.node.setPosition(pos);
        this.direction = angle;
    },

    update(dt) {
    let rad = cc.misc.degreesToRadians(this.direction);
    let dx = Math.cos(rad) * this.speed * dt;
    let dy = Math.sin(rad) * this.speed * dt;
    this.node.x += dx;
    this.node.y += dy;

    let canvas = cc.find("Canvas");
    let players = canvas.children.filter(n => n.group === "player");

    players.forEach(player => {
        let dist = this.node.position.sub(player.position).mag();
        if (dist < 30) {
            let playerScript = player.getComponent("Player");
            if (playerScript?.takeDamage) {
                playerScript.takeDamage(20);
                //cc.log("Boss skill gây damage cho Player!");
            } else {
                //cc.log("Không lấy được component Player");
            }
            this.node.destroy();
        }
    });
}

});
