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
        attackInterval: 2,

        skillNode: cc.Node,     // Node kỹ năng chứa anim SkillSplash
        skillCooldown: 4,       // Thời gian hồi kỹ năng
    },

    onLoad () {
        this.currentHp = this.maxHp;
        this.updateHpLabel();

        this.keyPressed = {};
        this.lastDir = cc.v2(0, 0);
        this.attackTimer = 0;
        this.isAttacking = false;

        this.skillTimer = 0;
        this.canUseSkill = true;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.anim && this.anim.node) this.anim.node.active = true;
        if (this.attackAnim && this.attackAnim.node) this.attackAnim.node.active = false;

        if (this.skillNode) this.skillNode.active = false;
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    update(dt) {
        this.handleMovement(dt);
        this.handleAutoAttack(dt);
        this.handleSkill(dt);
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
                    this.attackNearbyEnemies();
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
                this.isAttacking = false;
                if (this.attackAnim.node) this.attackAnim.node.active = false;
                if (this.anim && this.anim.node) this.anim.node.active = true;
            }
        }
    },

    attackNearbyEnemies() {
        const ATTACK_RANGE = 100;
        const DAMAGE = 10;

        if (!this.canvasNode) return;

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
                }
            }
        });
    },

    handleSkill(dt) {
        if (!this.skillNode) return;

        this.skillTimer += dt;

        if (this.skillTimer >= this.skillCooldown && this.canUseSkill) {
            this.skillTimer = 0;
            this.canUseSkill = false;

            this.skillNode.setPosition(this.node.getPosition());
            this.skillNode.active = true;

            const anim = this.skillNode.getComponent(cc.Animation);
            if (anim && anim.getAnimationState("SkillSplash")) {
                anim.play("SkillSplash");

                anim.once("finished", () => {
                    this.skillNode.active = false;
                    this.canUseSkill = true;
                    this.skillDamageArea();
                });
            } else {
                this.skillNode.active = false;
                this.canUseSkill = true;
            }
        }
    },

    skillDamageArea() {
        const SKILL_RANGE = 150;
        const SKILL_DAMAGE = 20;

        if (!this.canvasNode) return;

        const enemies = this.canvasNode.children.filter(node =>
            node.name === "Enemy" || node.group === "enemy"
        );

        enemies.forEach(enemy => {
            if (!enemy || !enemy.isValid) return;

            const dist = this.node.getPosition().sub(enemy.getPosition()).mag();
            if (dist <= SKILL_RANGE) {
                const enemyScript = enemy.getComponent("Enemy");
                if (enemyScript && typeof enemyScript.takeDamage === "function") {
                    enemyScript.takeDamage(SKILL_DAMAGE);
                }
            }
        });
    },

    clampPositionToCanvas(pos) {
        if (!this.canvasNode) return pos;

        const canvasSize = this.canvasNode.getContentSize();
        const nodeSize = this.node.getContentSize();

        const limitX = (canvasSize.width / 2 - nodeSize.width) - 12;
        const limitY = (canvasSize.height / 2 - nodeSize.height) - 12;

        const clampedX = Math.min(Math.max(pos.x, -limitX), limitX);
        const clampedY = Math.min(Math.max(pos.y, -limitY), limitY);

        return cc.v2(clampedX, clampedY);
    }
});
