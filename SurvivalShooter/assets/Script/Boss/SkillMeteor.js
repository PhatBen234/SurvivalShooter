cc.Class({
    extends: cc.Component,

    properties: {
        meteorPrefab: cc.Prefab,
        warningPrefab: cc.Prefab,
        spawnCount: 5
    },

    cast() {
        for (let i = 0; i < this.spawnCount; i++) {
            let pos = cc.v2(
                (Math.random() - 0.5) * 800,  // canvas width
                (Math.random() - 0.5) * 600   // canvas height
            );
            let warning = cc.instantiate(this.warningPrefab);
            this.node.parent.addChild(warning);
            warning.setPosition(pos);

            this.scheduleOnce(() => {
                let meteor = cc.instantiate(this.meteorPrefab);
                this.node.parent.addChild(meteor);
                meteor.setPosition(pos.add(cc.v2(0, 300)));
                meteor.getComponent('Meteor').fallTo(pos);
                warning.destroy();
            }, 1); // sau 1 giây rơi
        }
    }
});
