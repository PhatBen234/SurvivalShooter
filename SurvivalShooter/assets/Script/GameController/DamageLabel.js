// DamageLabel.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        label: cc.Label
    },
    
    showDamage(damage) {
        this.label.string = "-" + damage;
        
        // Animation bay lên và biến mất
        let fadeOut = cc.fadeOut(1.0);
        let moveUp = cc.moveBy(1.0, cc.v2(0, 50));
        let spawn = cc.spawn(fadeOut, moveUp);
        let callback = cc.callFunc(() => {
            this.returnToPool();
        });
        
        let sequence = cc.sequence(spawn, callback);
        this.node.runAction(sequence);
    },
    
    returnToPool() {
        cc.game.poolManager.putToPool(
            cc.find("Constants").getComponent("Constants").POOL_TAG.DAMAGE_LABEL,
            this.node
        );
    }
});