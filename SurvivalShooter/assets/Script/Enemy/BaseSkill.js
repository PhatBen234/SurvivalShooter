// BaseSkill.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        damage: 20,
        speed: 200,
        lifeTime: 3.0
    },
    
    onLoad() {
        this.target = null;
        this.timer = 0;
    },
    
    init(targetNode) {
        this.target = targetNode;
        this.timer = 0;
        this.node.active = true;
    },
    
    update(dt) {
        if (!this.target) return;
        
        this.timer += dt;
        if (this.timer >= this.lifeTime) {
            this.returnToPool();
            return;
        }
        
        this.moveToTarget(dt);
    },
    
    moveToTarget(dt) {
        let targetPos = this.target.getPosition();
        let currentPos = this.node.getPosition();
        
        let direction = targetPos.sub(currentPos).normalize();
        let moveDistance = this.speed * dt;
        
        this.node.setPosition(currentPos.add(direction.mul(moveDistance)));
    },
    
    onCollisionEnter(other, self) {
        if (other.node.group === "player") {
            other.getComponent("PlayerController").takeDamage(this.damage);
            this.returnToPool();
        }
    },
    
    returnToPool() {
        // Override trong class con
    }
});