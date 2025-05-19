cc.Class({
    extends: cc.Component,

    properties: {
        maxHp: 100,
        currentHp: 100,
        hpLabel: cc.Label,          // Label để hiển thị máu
        anim: cc.Animation,         // animation walk, idle
        attackAnim: cc.Animation,   // animation attack riêng
        speed: 200,
        canvasNode: cc.Node,
        attackInterval: 2
    },

    onLoad () {
        // Khởi tạo HP
        this.currentHp = this.maxHp;
        this.updateHpLabel();

        // Di chuyển và tấn công
        this.keyPressed = {};
        this.lastDir = cc.v2(0, 0);
        this.attackTimer = 0;
        this.isAttacking = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        // Ban đầu chỉ hiện anim node, ẩn attackAnim node
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

    // --- HP ---
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

    // --- Movement ---
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

    // --- Auto Attack ---
    handleAutoAttack(dt) {
        if (!this.attackAnim) return;

        this.attackTimer += dt;
        if (this.attackTimer >= this.attackInterval && !this.isAttacking) {
            this.attackTimer = 0;
            this.isAttacking = true;

            cc.log("Start attack animation");

            if (this.anim && this.anim.node) {
                this.anim.node.active = false;
                this.anim.stop();
            }

            if (this.attackAnim.node) {
                this.attackAnim.node.active = true;
            }

            if (this.attackAnim.getAnimationState("SoldierAttack")) {
                this.attackAnim.play("SoldierAttack");

                this.attackAnim.once("finished", () => {
                    cc.log("Attack animation finished");
                    this.isAttacking = false;

                    if (this.attackAnim.node) {
                        this.attackAnim.node.active = false;
                    }

                    if (this.anim && this.anim.node) {
                        this.anim.node.active = true;
                    }

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
                cc.warn("Attack clip 'SoldierAttack' not found!");
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

    // --- Clamp position ---
    clampPositionToCanvas(pos) {
        if (!this.canvasNode) {
            cc.warn("Canvas node is not assigned!");
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
