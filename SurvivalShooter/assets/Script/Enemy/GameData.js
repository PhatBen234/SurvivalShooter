// GameData.js
cc.Class({
    extends: cc.Component,
    
    statics: {
        currentStage: 1,
        unlockedStages: [1], // Stage 1 mở sẵn
        playerScore: 0,
        
        saveData() {
            let data = {
                unlockedStages: this.unlockedStages,
                currentStage: this.currentStage
            };
            cc.sys.localStorage.setItem("gameData", JSON.stringify(data));
        },
        
        loadData() {
            let dataStr = cc.sys.localStorage.getItem("gameData");
            if (dataStr) {
                let data = JSON.parse(dataStr);
                this.unlockedStages = data.unlockedStages || [1];
                this.currentStage = data.currentStage || 1;
            }
        },
        
        unlockStage(stage) {
            if (this.unlockedStages.indexOf(stage) === -1) {
                this.unlockedStages.push(stage);
                this.saveData();
            }
        },
        
        isStageUnlocked(stage) {
            return this.unlockedStages.indexOf(stage) !== -1;
        }
    }
});