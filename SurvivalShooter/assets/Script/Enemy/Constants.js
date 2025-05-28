// Constants.js
cc.Class({
    extends: cc.Component,
    
    statics: {
        // Enemy Types
        ENEMY_TYPE: {
            LEVEL_1: 1,
            LEVEL_2: 2,
            BOSS: 3
        },
        
        // Game States
        GAME_STATE: {
            MENU: 0,
            PLAYING: 1,
            PAUSED: 2,
            GAME_OVER: 3,
            VICTORY: 4
        },
        
        // Round Settings
        ROUND_SETTINGS: {
            ROUND_1_TIME: 90,  // 1 phút 30 giây
            ROUND_2_TIME: 90,  // 1 phút 30 giây
            ROUND_3_TIME: -1   // Không giới hạn thời gian
        },
        
        // Pool Tags
        POOL_TAG: {
            ENEMY_LV1: "enemy_lv1",
            ENEMY_LV2: "enemy_lv2",
            BOSS: "boss",
            DAMAGE_LABEL: "damage_label",
            SKILL_FIREBALL: "skill_fireball",
            SKILL_ICE: "skill_ice",
            SKILL_LIGHTNING: "skill_lightning"
        }
    }
});