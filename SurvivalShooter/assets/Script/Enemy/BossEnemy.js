cc.Class({
    extends: require("EnemyLevel2"),

    properties: {
        // boss-specific properties
        bossScore: 1000, // ADD THIS: Define boss score explicitly
    },

    onLoad() {
        this._super();

        // Override score for boss - make sure it's a valid number
        this.score = this.bossScore || 1000;
    },

    // Override onDie method to handle boss-specific death logic
    onDie() {

        // Validate score before using it
        const scoreToAdd = this.score || 1000;

        // Clean up collision tracking
        this.collidingPlayers.clear();
        this.isCollidingWithPlayer = false;

        // Update score in GameManager first
        if (cc.game.gameManager) {
            cc.game.gameManager.onEnemyDestroyed(scoreToAdd);
        }

        // Destroy boss node first to prevent multiple calls
        if (this.node && this.node.isValid) {
            this.node.destroy();
        }

        // Trigger stage completion with a longer delay to ensure everything is processed
        this.scheduleOnce(() => {
            if (cc.game.gameManager) {
                cc.game.gameManager.onStageComplete();
            }
        }, 0.5); // Increased delay to 0.5 seconds
    },
});