// cc.Class({
//     extends: cc.Component,

//     properties: {
//         spawnInterval: 3, // Thời gian cooldown để spawn wave
//         enemiesPerWave: 10, // số lượng enemy trong mỗi wave
//         enemyLv1Prefabs: [cc.Prefab],
//         enemyLv2Prefabs: [cc.Prefab], 
//         bossEnemyPrefab: cc.Prefab, // Sửa lỗi typo: boosEnemyPrefab -> bossEnemyPrefab
//         player: cc.Node,
//         canvas: cc.Node,
//     },

//     onLoad() {
//         this.timer = 0;
//         this.currentRound = 1;
//         this.isActive = false; // Chỉ spawn khi game đang chạy
        
//         // Đăng ký với game manager
//         cc.game.enemyManager = this;
//     },

//     update(dt) {
//         // Chỉ spawn khi game đang chạy
//         if (!this.isActive || !cc.game.gameManager || !cc.game.gameManager.isPlaying()) {
//             return;
//         }
        
//         this.timer += dt;
//         if (this.timer >= this.spawnInterval) {
//             this.spawnWave();
//             this.timer = 0;
//         }
//     },

//     setCurrentRound(roundNumber) {
//         this.currentRound = roundNumber;
//         this.isActive = true;
        
//         // Điều chỉnh spawn interval và số lượng enemy theo round
//         switch(roundNumber) {
//             case 1:
//                 this.spawnInterval = 3;
//                 this.enemiesPerWave = 5;
//                 break;
//             case 2:
//                 this.spawnInterval = 2.5;
//                 this.enemiesPerWave = 7;
//                 break;
//             case 3:
//                 this.spawnInterval = 2;
//                 this.enemiesPerWave = 10;
//                 break;
//         }
//     },

//     spawnWave() {
//         // Kiểm tra canvas có tồn tại không
//         if (!this.canvas) {
//             console.error("Canvas not found!");
//             return;
//         }
        
//         // Spawn enemy theo round
//         for (let i = 0; i < this.enemiesPerWave; i++) {
//             this.spawnSingleEnemy();
//         }
        
//         // Spawn boss ở round 3
//         if (this.currentRound === 3 && Math.random() < 0.1) { // 10% chance spawn boss
//             this.spawnBoss();
//         }
//     },

//     spawnSingleEnemy() {
//         let prefab = null;
        
//         // Chọn prefab theo round
//         switch(this.currentRound) {
//             case 1:
//                 // Chỉ spawn enemy level 1
//                 if (this.enemyLv1Prefabs && this.enemyLv1Prefabs.length > 0) {
//                     prefab = this.enemyLv1Prefabs[Math.floor(Math.random() * this.enemyLv1Prefabs.length)];
//                 }
//                 break;
                
//             case 2:
//                 // Spawn cả level 1 và level 2
//                 let allPrefabs = [];
//                 if (this.enemyLv1Prefabs) allPrefabs = allPrefabs.concat(this.enemyLv1Prefabs);
//                 if (this.enemyLv2Prefabs) allPrefabs = allPrefabs.concat(this.enemyLv2Prefabs);
                
//                 if (allPrefabs.length > 0) {
//                     prefab = allPrefabs[Math.floor(Math.random() * allPrefabs.length)];
//                 }
//                 break;
                
//             case 3:
//                 // Spawn tất cả loại enemy
//                 let allPrefabsRound3 = [];
//                 if (this.enemyLv1Prefabs) allPrefabsRound3 = allPrefabsRound3.concat(this.enemyLv1Prefabs);
//                 if (this.enemyLv2Prefabs) allPrefabsRound3 = allPrefabsRound3.concat(this.enemyLv2Prefabs);
                
//                 if (allPrefabsRound3.length > 0) {
//                     prefab = allPrefabsRound3[Math.floor(Math.random() * allPrefabsRound3.length)];
//                 }
//                 break;
//         }
        
//         // Kiểm tra prefab hợp lệ
//         if (!prefab) {
//             console.error("No valid prefab found for round", this.currentRound);
//             return;
//         }
        
//         // Tạo enemy
//         let enemy = cc.instantiate(prefab);
//         if (!enemy) {
//             console.error("Failed to instantiate enemy");
//             return;
//         }

//         // Tính toán vị trí spawn
//         let pos = this.getRandomSpawnPosition();
//         enemy.setPosition(pos);
//         this.node.addChild(enemy);
        
//         // Set target cho enemy
//         let enemyComponent = enemy.getComponent('EnemyBase');
//         if (enemyComponent && this.player) {
//             enemyComponent.target = this.player;
//         }
//     },

//     spawnBoss() {
//         if (!this.bossEnemyPrefab) {
//             console.warn("Boss prefab not assigned!");
//             return;
//         }
        
//         let boss = cc.instantiate(this.bossEnemyPrefab);
//         if (!boss) {
//             console.error("Failed to instantiate boss");
//             return;
//         }
        
//         let pos = this.getRandomSpawnPosition();
//         boss.setPosition(pos);
//         this.node.addChild(boss);
        
//         let bossComponent = boss.getComponent('EnemyBase');
//         if (bossComponent && this.player) {
//             bossComponent.target = this.player;
//         }
//     },

//     getRandomSpawnPosition() {
//         // Lấy kích thước canvas
//         let canvasSize = this.canvas.getContentSize();
//         let pos;
        
//         // Thử tìm vị trí hợp lệ (không quá gần player)
//         let attempts = 0;
//         do {
//             let x = Math.random() * canvasSize.width - canvasSize.width / 2;
//             let y = Math.random() * canvasSize.height - canvasSize.height / 2;
//             pos = cc.v2(x, y);
//             attempts++;
//         } while (this.player && pos.sub(this.player.position).mag() < 100 && attempts < 10);
        
//         return pos;
//     },

//     stopSpawning() {
//         this.isActive = false;
//     },

//     startSpawning() {
//         this.isActive = true;
//     }
// });

// EnemyManager.js - Refactored
// EnemyManager.js - Refactored
cc.Class({
    extends: cc.Component,

    properties: {
        // Spawn settings
        spawnInterval: 3,
        enemiesPerWave: 5,
        
        // Enemy prefabs
        enemyLv1Prefabs: [cc.Prefab],
        enemyLv2Prefabs: [cc.Prefab], 
        bossEnemyPrefab: cc.Prefab,
        
        // References
        player: cc.Node,
        canvas: cc.Node,
    },

    onLoad() {
        this.timer = 0;
        this.currentRound = 1;
        this.isActive = false;
        this.bossSpawned = false; // Prevent multiple boss spawns
        
        // Initialize round settings
        this.initRoundSettings();
        
        // Register with game manager
        cc.game.enemyManager = this;
    },

    initRoundSettings() {
        this.roundSettings = {};
        this.roundSettings[1] = {
            spawnInterval: 3,
            enemiesPerWave: 5,
            allowLv1: true,
            allowLv2: false,
            allowBoss: false
        };
        this.roundSettings[2] = {
            spawnInterval: 2.5,
            enemiesPerWave: 7,
            allowLv1: true,
            allowLv2: true,
            allowBoss: false
        };
        this.roundSettings[3] = {
            spawnInterval: 2,
            enemiesPerWave: 10,
            allowLv1: true,
            allowLv2: true,
            allowBoss: true
        };
    },

    update(dt) {
        // Only spawn when game is active
        if (!this.isActive || !cc.game.gameManager || !cc.game.gameManager.isPlaying()) {
            return;
        }
        
        this.timer += dt;
        if (this.timer >= this.spawnInterval) {
            this.spawnWave();
            this.timer = 0;
        }
    },

    setCurrentRound(roundNumber) {    
        this.currentRound = roundNumber;
        this.isActive = true;
        this.bossSpawned = false; // Reset boss spawn flag for new round
        
        // Apply round settings
        if (this.roundSettings && this.roundSettings[roundNumber]) {
            let settings = this.roundSettings[roundNumber];
            this.spawnInterval = settings.spawnInterval;
            this.enemiesPerWave = settings.enemiesPerWave;
        } else {
            // Fallback settings
            this.spawnInterval = 3;
            this.enemiesPerWave = 5;
        }
    },

    spawnWave() {
        if (!this.canvas) {
            return;
        }
        
        let settings = this.roundSettings[this.currentRound];
        if (!settings) return;
        
        // Spawn regular enemies
        for (let i = 0; i < this.enemiesPerWave; i++) {
            this.spawnSingleEnemy();
        }
        
        // Spawn boss in round 3 (only once)
        if (settings.allowBoss && !this.bossSpawned && Math.random() < 0.15) {
            this.spawnBoss();
            this.bossSpawned = true;
        }
    },

    spawnSingleEnemy() {
        if (!this.roundSettings || !this.roundSettings[this.currentRound]) {
            return;
        }
        
        let settings = this.roundSettings[this.currentRound];
        let availablePrefabs = [];
        
        // Add level 1 enemies if allowed
        if (settings.allowLv1 && this.enemyLv1Prefabs && this.enemyLv1Prefabs.length > 0) {
            availablePrefabs = availablePrefabs.concat(this.enemyLv1Prefabs);
        }
        
        // Add level 2 enemies if allowed
        if (settings.allowLv2 && this.enemyLv2Prefabs && this.enemyLv2Prefabs.length > 0) {
            availablePrefabs = availablePrefabs.concat(this.enemyLv2Prefabs);
        }
        
        if (availablePrefabs.length === 0) {
            return;
        }
        
        // Select random prefab
        let prefab = availablePrefabs[Math.floor(Math.random() * availablePrefabs.length)];
        if (!prefab) {
            return;
        }
        
        // Create enemy
        let enemy = cc.instantiate(prefab);
        if (!enemy) {
            return;
        }

        // Set spawn position
        let pos = this.getRandomSpawnPosition();
        enemy.setPosition(pos);
        this.canvas.addChild(enemy);
        
        // Set target for enemy - try multiple component names
        let enemyComponent = enemy.getComponent('BaseEnemy') || 
                           enemy.getComponent('EnemyBase') ||
                           enemy.getComponent('Enemy');
        
        if (enemyComponent && this.player) {
            if (enemyComponent.setTarget) {
                enemyComponent.setTarget(this.player);
            } else {
                // Fallback to direct assignment
                enemyComponent.target = this.player;
            }
            
            // Scale difficulty for higher rounds
            if (this.currentRound > 1 && enemyComponent.scaleDifficulty) {
                let difficultyMultiplier = 1 + (this.currentRound - 1) * 0.3;
                enemyComponent.scaleDifficulty(difficultyMultiplier);
            }
        }
    },

        spawnBoss() {
        if (!this.bossEnemyPrefab) {
            return;
        }
        
        let boss = cc.instantiate(this.bossEnemyPrefab);
        if (!boss) {
            return;
        }
        
        // Spawn boss at center or random position
        let pos = cc.v2(0, 0); // Center spawn for boss
        boss.setPosition(pos);
        this.canvas.addChild(boss);
        
        // Set target for boss
        let bossComponent = boss.getComponent('BaseEnemy') || boss.getComponent('EnemyBase') || boss.getComponent('BossEnemy');
        if (bossComponent && this.player) {
            bossComponent.setTarget(this.player);
        }
    },

    getRandomSpawnPosition() {
        if (!this.canvas) {
            return cc.v2(0, 0);
        }
        
        let canvasSize = this.canvas.getContentSize();
        let pos;
        let attempts = 0;
        let minDistanceFromPlayer = 150;
        
        do {
            // Generate random position on canvas edges
            let side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
            
            switch(side) {
                case 0: // Top
                    pos = cc.v2(
                        Math.random() * canvasSize.width - canvasSize.width / 2,
                        canvasSize.height / 2
                    );
                    break;
                case 1: // Right
                    pos = cc.v2(
                        canvasSize.width / 2,
                        Math.random() * canvasSize.height - canvasSize.height / 2
                    );
                    break;
                case 2: // Bottom
                    pos = cc.v2(
                        Math.random() * canvasSize.width - canvasSize.width / 2,
                        -canvasSize.height / 2
                    );
                    break;
                case 3: // Left
                    pos = cc.v2(
                        -canvasSize.width / 2,
                        Math.random() * canvasSize.height - canvasSize.height / 2
                    );
                    break;
            }
            
            attempts++;
        } while (this.player && 
                 pos.sub(this.player.position).mag() < minDistanceFromPlayer && 
                 attempts < 10);
        
        return pos;
    },

    stopSpawning() {
        this.isActive = false;
    },

    startSpawning() {
        this.isActive = true;
    },

    // Get current enemy count (useful for victory conditions)
    getCurrentEnemyCount() {
        return this.node.children.length;
    },

    // Clear all enemies (useful for round transitions)
    clearAllEnemies() {
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            let child = this.node.children[i];
            if (child && child.isValid) {
                child.destroy();
            }
        }
    }
}); 