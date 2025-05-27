// BaseEnemy.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        maxHp: 100,
        damage: 10,
        speed: 100,
        scoreValue: 10
    },
    
    onLoad() {
        this.currentHp = this.maxHp;
        this.player = null;
        this.isDead = false;
    },
    
    init(playerNode) {
        this.player = playerNode;
        this.currentHp = this.maxHp;
        this.isDead = false;
        this.node.active = true;
    },
    
    update(dt) {
        if (this.isDead || !this.player) return;
        
        this.moveToPlayer(dt);
    },
    
    moveToPlayer(dt) {
        let playerPos = this.player.getPosition();
        let currentPos = this.node.getPosition();
        
        let direction = playerPos.sub(currentPos).normalize();
        let moveDistance = this.speed * dt;
        
        this.node.setPosition(currentPos.add(direction.mul(moveDistance)));
    },
    
    takeDamage(damage) {
        if (this.isDead) return;
        
        this.currentHp -= damage;
        
        // Hiển thị damage label
        this.showDamageLabel(damage);
        
        if (this.currentHp <= 0) {
            this.die();
        }
    },
    
    showDamageLabel(damage) {
        let damageLabel = cc.game.poolManager.getFromPool(
            cc.find("Constants").getComponent("Constants").POOL_TAG.DAMAGE_LABEL,
            cc.game.poolManager.damageLabelPrefab
        );
        
        damageLabel.parent = this.node.parent;
        damageLabel.setPosition(this.node.getPosition().add(cc.v2(0, 50)));
        damageLabel.getComponent("DamageLabel").showDamage(damage);
    },
    
    die() {
        this.isDead = true;
        
        // Cộng điểm
        cc.game.gameManager.addScore(this.scoreValue);
        
        // Trả về pool
        this.returnToPool();
    },
    
    returnToPool() {
        // Override trong class con
    },
    
    onCollisionEnter(other, self) {
        if (other.node.group === "player") {
            // Gây damage cho player
            other.getComponent("PlayerController").takeDamage(this.damage);
        }
    }
});