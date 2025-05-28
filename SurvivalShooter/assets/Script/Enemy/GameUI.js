// GameUI.js
cc.Class({
    extends: cc.Component,
    
    properties: {
        scoreLabel: cc.Label,
        roundLabel: cc.Label,
        timerLabel: cc.Label
    },
    
    updateScore(score) {
        this.scoreLabel.string = "Score: " + score;
    },
    
    updateRound(round) {
        this.roundLabel.string = "Round: " + round;
    },
    
    updateTimer(time) {
        if (time < 0) {
            this.timerLabel.string = "Boss Fight!";
        } else {
            let minutes = Math.floor(time / 60);
            let seconds = Math.floor(time % 60);
            this.timerLabel.string = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        }
    }
});