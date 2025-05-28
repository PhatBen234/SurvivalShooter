cc.Class({
    extends: cc.Component,

    properties: {
        hp: 100,
        damage: 10,
        speed: 100,
        score: 10,
        target: cc.Node, // Player
        damageLabelPrefab: cc.Prefab,
        
        // Sprite flipping properties
        flipOnMove: {
            default: true,
            tooltip: "Có lật sprite theo hướng di chuyển không"
        },
        originalFacingLeft: {
            default: false,
            tooltip: "Sprite gốc có đang nhìn sang trái không"
        },
        
        // Collision damage properties
        damageInterval: {
            default: 1.0,
            tooltip: "Thời gian giữa các lần gây damage (giây)"
        }
    },

    onLoad() {
        this.maxHp = this.hp; // Store original HP for percentage calculations
        
        // Get sprite component for flipping
        this.spriteComponent = this.node.getComponent(cc.Sprite);
        
        // Store original scale for flipping
        this.originalScaleX = this.node.scaleX;
        
        // Initialize collision damage timer
        this.damageTimer = 0;
        this.isCollidingWithPlayer = false;
        this.collidingPlayers = new Set(); // Track multiple players if needed
        
        if (this.target) {
            this.player = this.target.getComponent('PlayerController');
        }

        // Enable collision detection
        this.enableCollisionDetection();
    },

    enableCollisionDetection() {
        // Get collider component
        this.collider = this.node.getComponent(cc.Collider);
        
        if (this.collider) {
            // Enable collision detection
            cc.director.getCollisionManager().enabled = true;
            // Optional: Enable debug draw to see collision boxes
            // cc.director.getCollisionManager().enabledDebugDraw = true;
            
            console.log("Enemy collision detection enabled");
        } else {
            console.warn("No collider found on enemy node!");
        }
    },

    // Collision event handlers
    onCollisionEnter(other, self) {
        // Check if collided with player
        if (other.node.group === 'player' || other.node.name === 'Player') {
            this.isCollidingWithPlayer = true;
            this.collidingPlayers.add(other.node);
            
            // Deal immediate damage on first contact
            this.damageTimer = 0;
            this.dealDamageToPlayer(other.node);
        }
    },

    onCollisionStay(other, self) {
        // Continue collision with player
        if (other.node.group === 'player' || other.node.name === 'Player') {
            // Keep track that we're still colliding
            this.collidingPlayers.add(other.node);
        }
    },

    onCollisionExit(other, self) {
        // Player left collision area
        if (other.node.group === 'player' || other.node.name === 'Player') {
            this.collidingPlayers.delete(other.node);
            
            // If no more players colliding, reset state
            if (this.collidingPlayers.size === 0) {
                this.isCollidingWithPlayer = false;
                this.damageTimer = 0;
            }
        }
    },

    update(dt) {
        if (!this.player || !this.target) return;
        
        // Calculate direction to player
        let dir = this.target.position.sub(this.node.position).normalize();
        
        // Update sprite facing direction
        if (this.flipOnMove) {
            this.updateSpriteDirection(dir);
        }
        
        // Move towards player
        this.node.position = this.node.position.add(dir.mul(this.speed * dt));
        
        // Handle continuous damage during collision
        this.handleContinuousDamage(dt);
    },

    handleContinuousDamage(dt) {
        if (this.isCollidingWithPlayer && this.collidingPlayers.size > 0) {
            this.damageTimer += dt;
            
            if (this.damageTimer >= this.damageInterval) {
                this.damageTimer = 0;
                
                // Deal damage to all colliding players
                this.collidingPlayers.forEach(playerNode => {
                    this.dealDamageToPlayer(playerNode);
                });
            }
        }
    },

    dealDamageToPlayer(playerNode) {
        if (!playerNode || !playerNode.isValid) return;
        
        let playerScript = playerNode.getComponent('PlayerController');
        if (playerScript && playerScript.takeDamage) {
            playerScript.takeDamage(this.damage);
        }
    },

    updateSpriteDirection(direction) {
        // Skip if direction change is too small
        if (Math.abs(direction.x) < 0.1) return;
        
        // Determine if moving right (direction.x > 0) or left (direction.x < 0)
        let isMovingRight = direction.x > 0;
        
        // Simple flip logic - since original sprite faces right
        if (isMovingRight) {
            // Moving right - keep original orientation
            this.node.scaleX = Math.abs(this.originalScaleX);
        } else {
            // Moving left - flip sprite
            this.node.scaleX = -Math.abs(this.originalScaleX);
        }
    },

    takeDamage(amount) {
        this.hp -= amount;
        this.showDamage(amount);
        
        if (this.hp <= 0) {
            this.onDie();
        }
    },

    showDamage(amount) {
        if (!this.damageLabelPrefab) return;
        
        let label = cc.instantiate(this.damageLabelPrefab);
        if (!label) return;
        
        let labelComponent = label.getComponent(cc.Label);
        if (labelComponent) {
            labelComponent.string = `-${amount}`;
        }
        
        label.setPosition(this.node.position);
        this.node.parent.addChild(label);

        // Animate damage label
        cc.tween(label)
            .by(0.5, { 
                position: cc.v2(0, 50), 
                opacity: -255 
            })
            .call(() => {
                if (label && label.isValid) {
                    label.destroy();
                }
            })
            .start();
    },

    onDie() {
        // Clean up collision tracking
        this.collidingPlayers.clear();
        this.isCollidingWithPlayer = false;
        
        // Fire event to GameManager instead of directly calling it
        this.fireEnemyDestroyedEvent();
        
        // Destroy this enemy
        if (this.node && this.node.isValid) {
            this.node.destroy();
        }
    },

    fireEnemyDestroyedEvent() {
        // Notify GameManager about enemy destruction
        if (cc.game.gameManager) {
            cc.game.gameManager.onEnemyDestroyed(this.score);
        }
    },

    // Utility methods
    getHpPercentage() {
        return this.hp / this.maxHp;
    },

    isAlive() {
        return this.hp > 0;
    },

    // Method to set target dynamically
    setTarget(targetNode) {
        this.target = targetNode;
        if (targetNode) {
            this.player = targetNode.getComponent('PlayerController');
        }
    },

    // Method to increase difficulty (can be called by enemy manager)
    scaleDifficulty(multiplier) {
        if (multiplier && multiplier > 0) {
            this.hp = Math.floor(this.hp * multiplier);
            this.maxHp = this.hp;
            this.damage = Math.floor(this.damage * multiplier);
            this.score = Math.floor(this.score * multiplier);
        }
    },

    // Manual sprite direction control
    setSpriteDirection(facingLeft) {
        if (!this.spriteComponent) return;
        
        if (this.originalFacingLeft) {
            // Original faces left
            this.node.scaleX = facingLeft ? Math.abs(this.originalScaleX) : -Math.abs(this.originalScaleX);
        } else {
            // Original faces right  
            this.node.scaleX = facingLeft ? -Math.abs(this.originalScaleX) : Math.abs(this.originalScaleX);
        }
    },

    // Get current facing direction
    isFacingLeft() {
        if (this.originalFacingLeft) {
            return this.node.scaleX > 0;
        } else {
            return this.node.scaleX < 0;
        }
    },

    // Method to adjust damage interval
    setDamageInterval(interval) {
        if (interval !== undefined && interval > 0) {
            this.damageInterval = interval;
        }
    },

    // Get collision status (useful for debugging or other systems)
    isCollidingWithTarget() {
        return this.isCollidingWithPlayer;
    },

    // Clean up on destroy
    onDestroy() {
        if (this.collidingPlayers) {
            this.collidingPlayers.clear();
        }
    }
});