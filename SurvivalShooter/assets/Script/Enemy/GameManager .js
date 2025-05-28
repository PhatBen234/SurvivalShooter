cc.Class({
    extends: cc.Component,
    
    properties: {
        // UI Controllers
        uiStageController: cc.Node,
        enemyManager: cc.Node,
    },
    
    onLoad() {
        // Game state variables
        this.currentRound = 1;
        this.roundTimer = 90; // 1p30s = 90 seconds
        this.totalScore = 0;
        this.isGameActive = false;
        
        // Round settings
        this.ROUND_1_TIME = 5; // 1 minute 30 seconds
        this.ROUND_2_TIME = 90; // 1 minute 30 seconds
        this.ROUND_3_TIME = -1; // Unlimited time
        
        // Register global reference
        cc.game.gameManager = this;
        
        console.log("GameManager loaded");
    },

    start() {
        // Get references in start() to ensure other components are loaded
        if (this.uiStageController) {
            this.uiController = this.uiStageController.getComponent('UIStageController');
            console.log("UI Controller found:", !!this.uiController);
        }
        
        if (this.enemyManager) {
            this.enemyManagerComponent = this.enemyManager.getComponent('EnemyManager');
            console.log("Enemy Manager found:", !!this.enemyManagerComponent);
        }
        
        // Start game after getting references
        this.startGame();
    },
    
    startGame() {
        this.currentRound = 1;
        this.roundTimer = this.ROUND_1_TIME;
        this.totalScore = 0;
        this.isGameActive = true;
        
        // Start first round
        this.startRound(1);
        
        // Update UI
        this.updateUI();
    },
    
    update(dt) {
        if (!this.isGameActive) return;
        
        // Update timer for round 1 and 2 only
        if (this.currentRound <= 2 && this.roundTimer > 0) {
            this.roundTimer -= dt;
            
            if (this.roundTimer <= 0) {
                this.nextRound();
            }
            
            // Update timer UI
            this.updateTimerUI();
        }
    },
    
    startRound(roundNumber) {
        this.currentRound = roundNumber;
        
        // Set timer for round
        switch(roundNumber) {
            case 1:
                this.roundTimer = this.ROUND_1_TIME;
                break;
            case 2:
                this.roundTimer = this.ROUND_2_TIME;
                break;
            case 3:
                this.roundTimer = this.ROUND_3_TIME;
                break;
        }
        
        // Notify enemy manager about current round
        if (this.enemyManagerComponent) {
            this.enemyManagerComponent.setCurrentRound(roundNumber);
        }
        
        // Update round UI
        this.updateRoundUI();
    },
    
    nextRound() {
        if (this.currentRound < 3) {
            this.startRound(this.currentRound + 1);
        }
    },
    
    // Called when enemy is destroyed
    onEnemyDestroyed(scorePoints) {
        this.totalScore += scorePoints;
        
        // Fire event to UI controller to update score
        if (this.uiController) {
            this.uiController.updateScore(this.totalScore);
        }
    },
    
    // Called when player dies
    onPlayerDeath() {
        this.isGameActive = false;
        
        // Fire event to UI controller to show game over
        if (this.uiController) {
            this.uiController.showResultPanel(false); // false = game over
        }
    },
    
    // Called when stage is completed (can be triggered by boss death or other conditions)
    onStageComplete() {
        this.isGameActive = false;
        
        // Fire event to UI controller to show victory
        if (this.uiController) {
            this.uiController.showResultPanel(true); // true = victory
        }
    },
    
    // UI Update methods
    updateUI() {
        this.updateRoundUI();
        this.updateTimerUI();
        if (this.uiController) {
            this.uiController.updateScore(this.totalScore);
        }
    },
    
    updateRoundUI() {
        if (this.uiController) {
            this.uiController.updateRound(this.currentRound);
        }
    },
    
    updateTimerUI() {
        if (this.uiController) {
            this.uiController.updateTimer(this.roundTimer);
        }
    },
    
    // Getter methods
    getCurrentRound() {
        return this.currentRound;
    },
    
    getRoundTimer() {
        return this.roundTimer;
    },
    
    getTotalScore() {
        return this.totalScore;
    },
    
    isPlaying() {
        return this.isGameActive;
    }
});