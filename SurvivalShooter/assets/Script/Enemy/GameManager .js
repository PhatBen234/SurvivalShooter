// GameManager.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        gameUI: cc.Node,
        mainMenu: cc.Node,
        resultPanel: cc.Node
    },
    
    onLoad() {
        this.gameState = cc.find("Constants").getComponent("Constants").GAME_STATE.MENU;
        this.currentStage = 1;
        this.currentRound = 1;
        this.roundTimer = 0;
        this.totalScore = 0;
        
        // Load game data
        cc.game.gameManager = this;
        cc.find("GameData").getComponent("GameData").loadData();
        
        this.showMainMenu();
    },
    
    startGame(stageNumber) {
        this.currentStage = stageNumber;
        this.currentRound = 1;
        this.roundTimer = cc.find("Constants").getComponent("Constants").ROUND_SETTINGS.ROUND_1_TIME;
        this.totalScore = 0;
        
        this.gameState = cc.find("Constants").getComponent("Constants").GAME_STATE.PLAYING;
        
        this.mainMenu.active = false;
        this.gameUI.active = true;
        this.resultPanel.active = false;
        
        // Bắt đầu round 1
        this.startRound(1);
        
        // Cập nhật UI
        this.updateUI();
    },
    
    update(dt) {
        if (this.gameState !== cc.find("Constants").getComponent("Constants").GAME_STATE.PLAYING) return;
        
        // Cập nhật timer cho round 1 và 2
        if (this.currentRound <= 2) {
            this.roundTimer -= dt;
            
            if (this.roundTimer <= 0) {
                this.nextRound();
            }
            
            this.updateUI();
        }
    },
    
    startRound(roundNumber) {
        this.currentRound = roundNumber;
        
        // Set timer cho round
        switch(roundNumber) {
            case 1:
                this.roundTimer = cc.find("Constants").getComponent("Constants").ROUND_SETTINGS.ROUND_1_TIME;
                break;
            case 2:
                this.roundTimer = cc.find("Constants").getComponent("Constants").ROUND_SETTINGS.ROUND_2_TIME;
                break;
            case 3:
                this.roundTimer = -1; // Không giới hạn thời gian
                break;
        }
        
        // Thông báo enemy manager về round hiện tại
        cc.game.enemyManager.setCurrentRound(roundNumber);
    },
    
    nextRound() {
        if (this.currentRound < 3) {
            this.startRound(this.currentRound + 1);
        }
    },
    
    addScore(points) {
        this.totalScore += points;
        this.updateUI();
    },
    
    gameOver() {
        this.gameState = cc.find("Constants").getComponent("Constants").GAME_STATE.GAME_OVER;
        this.showGameOver();
    },
    
    victory() {
        this.gameState = cc.find("Constants").getComponent("Constants").GAME_STATE.VICTORY;
        
        // Mở khóa stage tiếp theo
        if (this.currentStage < 3) {
            cc.find("GameData").getComponent("GameData").unlockStage(this.currentStage + 1);
        }
        
        this.showVictory();
    },
    
    showMainMenu() {
        this.gameState = cc.find("Constants").getComponent("Constants").GAME_STATE.MENU;
        this.mainMenu.active = true;
        this.gameUI.active = false;
        this.resultPanel.active = false;
    },
    
    showGameOver() {
        this.resultPanel.active = true;
        this.resultPanel.getComponent("ResultPanel").showResult(false, this.totalScore);
    },
    
    showVictory() {
        this.resultPanel.active = true;
        this.resultPanel.getComponent("ResultPanel").showResult(true, this.totalScore);
    },
    
    updateUI() {
        this.gameUI.getComponent("GameUI").updateScore(this.totalScore);
        this.gameUI.getComponent("GameUI").updateRound(this.currentRound);
        this.gameUI.getComponent("GameUI").updateTimer(this.roundTimer);
    },
    
    isPlaying() {
        return this.gameState === cc.find("Constants").getComponent("Constants").GAME_STATE.PLAYING;
    }
});