cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        currentHp: 100,
        hpLabel: cc.Label,
        anim: cc.Animation,
        attackAnim: cc.Animation,
        speed: 200,
        canvasNode: cc.Node,
        attackInterval: 2
    },

    onLoad () {
        this.currentHp = this.maxHp;
        this.updateHpLabel();

        this.keyPressed = {};
        this.lastDir = cc.v2(0, 0);
        this.attackTimer = 0;
        this.isAttacking = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.anim && this.anim.node) this.anim.node.active = true;
        if (this.attackAnim && this.attackAnim.node) this.attackAnim.node.active = false;

        if (this.anim) {
            cc.log("Walk clips:", this.anim.getClips().map(c => c.name));
        }
        if (this.attackAnim) {
            cc.log("Attack clips:", this.attackAnim.getClips().map(c => c.name));
        }
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    update(dt) {
        this.handleMovement(dt);
        this.handleAutoAttack(dt);
    },

    takeDamage(amount) {
        this.currentHp -= amount;
        if (this.currentHp < 0) this.currentHp = 0;
        this.updateHpLabel();
    },

    updateHpLabel() {
        if (this.hpLabel) {
            this.hpLabel.string = "HP: " + this.currentHp;
        }
    },

    onKeyDown(event) {
        this.keyPressed[event.keyCode] = true;
    },

    onKeyUp(event) {
        this.keyPressed[event.keyCode] = false;
    },

    handleMovement(dt) {
        if (!this.anim) return;

        let dir = cc.v2(0, 0);
        if (this.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
        if (this.keyPressed[cc.macro.KEY.d]) dir.x += 1;
        if (this.keyPressed[cc.macro.KEY.w]) dir.y += 1;
        if (this.keyPressed[cc.macro.KEY.s]) dir.y -= 1;

        if (!dir.equals(this.lastDir)) {
            this.lastDir = dir.clone();
        }

        if (dir.mag() > 0) {
            dir = dir.normalize();

            if (dir.x !== 0) {
                this.node.scaleX = dir.x > 0 ? 1 : -1;
            }

            let pos = this.node.getPosition();
            pos.x += dir.x * this.speed * dt;
            pos.y += dir.y * this.speed * dt;

            pos = this.clampPositionToCanvas(pos);
            this.node.setPosition(pos);

            if (!this.isAttacking) {
                if (!this.anim.getAnimationState("Soldier").isPlaying) {
                    this.anim.play("Soldier");
                }
            }
        } else {
            if (!this.isAttacking && this.anim.getAnimationState("Soldier").isPlaying) {
                this.anim.stop("Soldier");
            }
        }
    },

    handleAutoAttack(dt) {
        if (!this.attackAnim) return;

        this.attackTimer += dt;
        if (this.attackTimer >= this.attackInterval && !this.isAttacking) {
            this.attackTimer = 0;
            this.isAttacking = true;

            cc.log("[AutoAttack] Start attack animation");

            if (this.anim && this.anim.node) {
                this.anim.node.active = false;
                this.anim.stop();
            }

            if (this.attackAnim.node) {
                this.attackAnim.node.active = true;
            }

            const attackState = this.attackAnim.getAnimationState("SoldierAttack");
            if (attackState) {
                this.attackAnim.play("SoldierAttack");

                attackState.once("finished", () => {
                    cc.log("[AutoAttack] Attack animation finished");

                    // Gây damage tại đây khi animation tấn công kết thúc
                    this.attackNearbyEnemies();

                    this.isAttacking = false;

                    if (this.attackAnim.node) {
                        this.attackAnim.node.active = false;
                    }

                    if (this.anim && this.anim.node) {
                        this.anim.node.active = true;
                    }

                    // Tự động chơi lại anim đi bộ nếu có phím di chuyển
                    let dir = cc.v2(0, 0);
                    if (this.keyPressed[cc.macro.KEY.a]) dir.x -= 1;
                    if (this.keyPressed[cc.macro.KEY.d]) dir.x += 1;
                    if (this.keyPressed[cc.macro.KEY.w]) dir.y += 1;
                    if (this.keyPressed[cc.macro.KEY.s]) dir.y -= 1;

                    if (dir.mag() > 0) {
                        if (!this.anim.getAnimationState("Soldier").isPlaying) {
                            this.anim.play("Soldier");
                        }
                    } else {
                        this.anim.stop("Soldier");
                    }
                });
            } else {
                cc.warn("[AutoAttack] Attack clip 'SoldierAttack' not found!");
                this.isAttacking = false;

                if (this.attackAnim.node) {
                    this.attackAnim.node.active = false;
                }
                if (this.anim && this.anim.node) {
                    this.anim.node.active = true;
                }
            }
        }
    },

    attackNearbyEnemies() {
        const ATTACK_RANGE = 100;
        const DAMAGE = 10;

        if (!this.canvasNode) {
            cc.warn("[attackNearbyEnemies] canvasNode chưa được gán");
            return;
        }

        const enemies = this.canvasNode.children.filter(node => 
            node.name === "Enemy" || node.group === "enemy"
        );

        enemies.forEach(enemy => {
            if (!enemy || !enemy.isValid) return;

            const dist = this.node.getPosition().sub(enemy.getPosition()).mag();
            if (dist <= ATTACK_RANGE) {
                const enemyScript = enemy.getComponent("Enemy");
                if (enemyScript && typeof enemyScript.takeDamage === "function") {
                    enemyScript.takeDamage(DAMAGE);
                    cc.log(`[attackNearbyEnemies] Damaged enemy at distance ${dist.toFixed(2)}`);
                }
            }
        });
    },

    clampPositionToCanvas(pos) {
        if (!this.canvasNode) {
            cc.warn("[clampPositionToCanvas] canvasNode is not assigned!");
            return pos;
        }

        const canvasSize = this.canvasNode.getContentSize();
        const nodeSize = this.node.getContentSize();

        const limitX = (canvasSize.width / 2 - nodeSize.width) - 12;
        const limitY = (canvasSize.height / 2 - nodeSize.height) - 12;

        const clampedX = Math.min(Math.max(pos.x, -limitX), limitX);
        const clampedY = Math.min(Math.max(pos.y, -limitY), limitY);

        return cc.v2(clampedX, clampedY);
    }
});
