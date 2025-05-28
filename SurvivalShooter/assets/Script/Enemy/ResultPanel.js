// ResultPanel.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        titleLabel: cc.Label,
        scoreLabel: cc.Label,
        menuButton: cc.Button,
        nextButton: cc.Button
    },
    
    showResult(isVictory, score) {
        this.titleLabel.string = isVictory ? "Victory!" : "Game Over!";
        this.scoreLabel.string = "Final Score: " + score;
        
        // Hiển thị nút next chỉ khi thắng và không phải stage cuối
        this.nextButton.node.active = isVictory && cc.game.gameManager.currentStage < 3;
    },
    
    onMenuClick() {
        cc.game.gameManager.showMainMenu();
    },
    
    onNextClick() {
        let nextStage = cc.game.gameManager.currentStage + 1;
        cc.game.gameManager.startGame(nextStage);
    }
});