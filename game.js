/**
 * 飞机大战 - 哈雷酱专属版
 * 原生 JavaScript + Canvas 实现
 * 包含：闯关模式、Boss战、武器升级、道具掉落、存档功能
 * 新增：Combo系统、通关评价系统、成就系统、稀有道具系统
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    // 画布尺寸
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 800,

    // 游戏难度（简单）
    DIFFICULTY: 'easy',
    ENEMY_SPAWN_RATE: 1500,
    ENEMY_SPEED_MULTIPLIER: 0.8,

    // ==================== Combo系统配置 ====================
    COMBO: {
        MAX_TIME: 3000,           // Combo最大持续时间（毫秒）
        MIN_COMBO_FOR_MULTIPLIER: 5, // 开始倍率的最小Combo数
        MULTIPLIER_INTERVAL: 5,   // 每5连击增加1倍率
        MAX_MULTIPLIER: 10,       // 最大倍率
        SCORE_BONUS_THRESHOLD: 10, // Combo达到10的额外奖励
        SCORE_BONUS_AMOUNT: 50    // 额外奖励分数值
    },

    // ==================== 通关评价系统配置 ====================
    RATING: {
        ONE_STAR: { MIN_HEALTH_PERCENT: 20, MAX_TIME_MULTIPLIER: 3.0, MIN_KILLS: 0 },
        TWO_STAR: { MIN_HEALTH_PERCENT: 40, MAX_TIME_MULTIPLIER: 2.5, MIN_KILLS: 10 },
        THREE_STAR: { MIN_HEALTH_PERCENT: 70, MAX_TIME_MULTIPLIER: 2.0, MIN_KILLS: 20, MIN_MAX_COMBO: 10 }
    },
    STANDARD_TIME: {
        1: 120000,  // 2分钟
        2: 180000,  // 3分钟
        3: 240000   // 4分钟
    },
    STAR_REWARDS: {
        1: { scoreBonus: 0, specialPowerup: false },
        2: { scoreBonus: 100, specialPowerup: false },
        3: { scoreBonus: 300, specialPowerup: true }
    },

    // ==================== 成就系统配置 ====================
    ACHIEVEMENTS: {
        'first_kill': { id: 'first_kill', name: '初出茅庐', description: '击杀第1个敌人', icon: '⚔️', condition: (stats) => stats.totalKills >= 1, reward: { score: 50 } },
        'kill_100': { id: 'kill_100', name: '百战百胜', description: '累计击杀100个敌人', icon: '💀', condition: (stats) => stats.totalKills >= 100, reward: { score: 500 } },
        'kill_1000': { id: 'kill_1000', name: '战神降临', description: '累计击杀1000个敌人', icon: '👑', condition: (stats) => stats.totalKills >= 1000, reward: { score: 5000 } },
        'combo_10': { id: 'combo_10', name: '连击达人', description: '单局达到10连击', icon: '🔥', condition: (stats) => stats.maxComboEver >= 10, reward: { score: 200 } },
        'combo_50': { id: 'combo_50', name: '连击大师', description: '单局达到50连击', icon: '⚡', condition: (stats) => stats.maxComboEver >= 50, reward: { score: 1000 } },
        'clear_level_1': { id: 'clear_level_1', name: '勇闯第一关', description: '通关第1关', icon: '🚀', condition: (stats) => stats.highestLevel >= 1, reward: { score: 100 } },
        'clear_level_3': { id: 'clear_level_3', name: '终极挑战', description: '通关第3关', icon: '🏆', condition: (stats) => stats.highestLevel >= 3, reward: { score: 1000 } },
        'three_star_level': { id: 'three_star_level', name: '完美通关', description: '获得3星评价', icon: '⭐', condition: (stats) => stats.totalThreeStars >= 1, reward: { score: 300 } },
        'three_star_all': { id: 'three_star_all', name: '全星荣耀', description: '所有关卡获得3星评价', icon: '🌟', condition: (stats) => stats.totalThreeStars >= 3, reward: { score: 3000 } },
        'score_1000': { id: 'score_1000', name: '千分高手', description: '单局获得1000分', icon: '🎯', condition: (stats) => stats.highestScore >= 1000, reward: { score: 200 } },
        'score_10000': { id: 'score_10000', name: '万分传奇', description: '单局获得10000分', icon: '💎', condition: (stats) => stats.highestScore >= 10000, reward: { score: 2000 } },
        'defeat_first_boss': { id: 'defeat_first_boss', name: 'Boss终结者', description: '击败第1个Boss', icon: '👊', condition: (stats) => stats.bossesDefeated >= 1, reward: { score: 500 } },
        'defeat_all_bosses': { id: 'defeat_all_bosses', name: 'Boss克星', description: '击败所有Boss', icon: '🔱', condition: (stats) => stats.bossesDefeated >= 3, reward: { score: 3000 } }
    },

    // ==================== 稀有道具配置 ====================
    RARE_POWERUPS: {
        INVINCIBLE: {
            type: 'rare_invincible',
            name: '无敌护盾',
            description: '无敌5秒，免疫所有伤害',
            duration: 5000,
            color: '#e74c3c',
            symbol: '🛡️',
            dropRate: 0.01,
            effect: (player) => { player.isInvincible = true; player.invincibleTimer = 5000; },
            endEffect: (player) => { player.isInvincible = false; }
        },
        BOMB: {
            type: 'rare_bomb',
            name: '全屏炸弹',
            description: '清除屏幕上所有敌人',
            duration: 0,
            color: '#9b59b6',
            symbol: '💣',
            dropRate: 0.008,
            effect: (game) => {
                game.enemies.forEach(enemy => {
                    game.createParticles(enemy.x, enemy.y, enemy.color, 20);
                });
                game.enemies = [];
                game.score += 200;
            }
        },
        DOUBLE_SCORE: {
            type: 'rare_double_score',
            name: '双重分数',
            description: '接下来10秒获得双倍分数',
            duration: 10000,
            color: '#f39c12',
            symbol: '💰',
            dropRate: 0.015,
            effect: (player) => { player.doubleScore = true; player.doubleScoreTimer = 10000; },
            endEffect: (player) => { player.doubleScore = false; }
        },
        RAPID_FIRE: {
            type: 'rare_rapid_fire',
            name: '急速射击',
            description: '射速提升50%，持续8秒',
            duration: 8000,
            color: '#3498db',
            symbol: '⚡',
            dropRate: 0.012,
            effect: (player) => { player.rapidFireMultiplier = 0.5; },
            endEffect: (player) => { player.rapidFireMultiplier = 1; }
        },
        HEAL_FULL: {
            type: 'rare_heal_full',
            name: '完全恢复',
            description: '恢复所有生命值',
            duration: 0,
            color: '#2ecc71',
            symbol: '❤️',
            dropRate: 0.01,
            effect: (player) => { player.heal(player.maxHealth); }
        }
    },
    DROP_RULES: {
        BASE_DROP_RATE: 0.2,
        RARE_DROP_RATE: 0.02,
        ELITE_BOOST: 2,
        BOSS_DROP_RATE: 0.3
    },

    // ==================== 原有配置保持不变 ====================
    // 关卡配置
    LEVELS: {
        1: {
            scoreToComplete: 500,
            enemySpawnRate: 1500,
            enemyHealthMultiplier: 1.0,
            boss: {
                name: '毁灭战机',
                health: 500,
                speed: 1.5,
                attackPattern: 'spread',
                shootRate: 800
            }
        },
        2: {
            scoreToComplete: 1000,
            enemySpawnRate: 1200,
            enemyHealthMultiplier: 1.2,
            boss: {
                name: '暗影魔龙',
                health: 800,
                speed: 2.0,
                attackPattern: 'aimed',
                shootRate: 600
            }
        },
        3: {
            scoreToComplete: 2000,
            enemySpawnRate: 1000,
            enemyHealthMultiplier: 1.5,
            boss: {
                name: '终焉帝皇',
                health: 1200,
                speed: 1.8,
                attackPattern: 'combined',
                shootRate: 400
            }
        }
    },

    // 武器升级配置
    WEAPON_UPGRADES: {
        1: { damage: 10, fireRate: 300, bulletCount: 1 },
        2: { damage: 15, fireRate: 250, bulletCount: 1 },
        3: { damage: 15, fireRate: 250, bulletCount: 2 },
        4: { damage: 20, fireRate: 200, bulletCount: 2 },
        5: { damage: 25, fireRate: 150, bulletCount: 3 }
    },

    // 道具类型
    POWERUPS: {
        HEAL: { type: 'heal', duration: 0, effect: 30, color: '#ff6b6b', symbol: '❤️' },
        SPEED: { type: 'speed', duration: 5000, effect: 1.5, color: '#ffd93d', symbol: '⚡' },
        DAMAGE: { type: 'damage', duration: 8000, effect: 1.5, color: '#ff9f43', symbol: '💪' },
        SHIELD: { type: 'shield', duration: 5000, effect: 0, color: '#74b9ff', symbol: '🛡️' }
    }
};

// ==================== 游戏类 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = CONFIG.CANVAS_WIDTH;
        this.height = CONFIG.CANVAS_HEIGHT;

        // 游戏状态
        this.running = false;
        this.paused = false;
        this.state = 'menu'; // menu, playing, levelComplete, gameOver, bossFight

        // 游戏数据
        this.score = 0;
        this.level = 1;
        this.highScore = this.loadHighScore();
        this.savedData = this.loadGameData();

        // ==================== Combo系统变量 ====================
        this.comboCount = 0;           // 当前连击数
        this.comboTimer = 0;           // Combo计时器
        this.comboMultiplier = 1;      // 当前倍率
        this.maxCombo = 0;             // 最大连击数（单局）
        this.comboActive = false;      // Combo是否激活

        // ==================== 评价系统变量 ====================
        this.levelStats = {
            startTime: 0,
            endTime: 0,
            kills: 0,
            damageTaken: 0,
            powerupsCollected: 0,
            maxCombo: 0
        };
        this.levelRatings = { 1: 0, 2: 0, 3: 0 }; // 存储各关卡的星级评价

        // ==================== 成就系统变量 ====================
        this.unlockedAchievements = this.loadAchievements();
        this.achievementQueue = [];
        this.achievementNotifications = [];
        this.globalStats = {
            totalGamesPlayed: 0,
            totalKills: 0,
            totalDamageTaken: 0,
            totalCombos: 0,
            totalThreeStars: 0,
            maxComboEver: 0,
            highestScore: 0,
            bossesDefeated: 0,
            highestLevel: 0
        };

        // 实体
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.boss = null;

        // 道具消息提示
        this.powerupMessages = [];

        // 游戏循环
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.lastShotTime = 0;

        // 背景星星
        this.stars = this.createStars();

        // 事件监听
        this.setupEventListeners();

        // 更新显示
        this.updateHighScoreDisplay();
        this.updateAchievementDisplay();
    }

    // ==================== 初始化与控制 ====================
    setupEventListeners() {
        // 鼠标控制
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.running || this.paused || this.state !== 'playing' && this.state !== 'bossFight') return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.player) {
                this.player.targetX = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, x));
                this.player.targetY = Math.max(this.player.height / 2, Math.min(this.height - this.player.height / 2, y));
            }
        });

        // 触摸控制（移动端）
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.running || this.paused || this.state !== 'playing' && this.state !== 'bossFight') return;

            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (this.player) {
                this.player.targetX = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, x));
                this.player.targetY = Math.max(this.player.height / 2, Math.min(this.height - this.player.height / 2, y));
            }
        }, { passive: false });
    }

    start() {
        this.score = 0;
        this.level = 1;
        this.player = new Player(this.width / 2, this.height - 100);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.boss = null;

        // 重置Combo系统
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        this.comboActive = false;

        // 初始化关卡统计
        this.startLevelStats();

        this.running = true;
        this.state = 'playing';
        this.lastTime = performance.now();

        // 隐藏所有菜单屏幕，但显示 HUD
        this.hideAllScreens();
        document.getElementById('hud').classList.remove('hidden');
        this.gameLoop(this.lastTime);
    }

    continueGame() {
        if (!this.savedData) {
            alert('没有存档记录！笨蛋！(￣へ￣)');
            return;
        }

        this.score = this.savedData.score || 0;
        this.level = this.savedData.level || 1;
        this.player = new Player(this.width / 2, this.height - 100);

        // 恢复武器等级
        this.player.weaponLevel = this.savedData.weaponLevel || 1;

        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.boss = null;

        // 重置Combo系统
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        this.comboActive = false;

        // 初始化关卡统计
        this.startLevelStats();

        this.running = true;
        this.state = 'playing';
        this.lastTime = performance.now();

        // 隐藏所有菜单屏幕，但显示 HUD
        this.hideAllScreens();
        document.getElementById('hud').classList.remove('hidden');
        this.gameLoop(this.lastTime);
    }

    restart() {
        this.start();
    }

    showMenu() {
        this.running = false;
        this.hideAllScreens();
        document.getElementById('menuScreen').classList.remove('hidden');
        this.highScore = this.loadHighScore();
        this.updateHighScoreDisplay();
    }

    nextLevel() {
        this.level++;

        // 升级武器
        this.player.weaponLevel = Math.min(5, this.player.weaponLevel + 1);

        // 恢复玩家生命值（每关都给玩家补满血）
        this.player.health = this.player.maxHealth;

        // 清空游戏实体
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.boss = null;

        // 重置Combo系统
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        this.comboActive = false;

        // 初始化新关卡统计
        this.startLevelStats();

        // 隐藏所有菜单屏幕，但保留 HUD 显示
        this.hideAllScreens();
        document.getElementById('hud').classList.remove('hidden');

        this.state = 'playing';
        this.lastTime = performance.now();
    }

    // ==================== 游戏循环 ====================
    gameLoop(timestamp) {
        if (!this.running) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // 更新背景星星
        this.updateStars(deltaTime);

        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime);

            // 更新玩家稀有道具效果计时器
            this.player.updateRarePowerups(deltaTime);

            if (this.player.health <= 0) {
                this.gameOver();
                return;
            }
        }

        // 根据状态更新
        if (this.state === 'playing') {
            this.updatePlaying(deltaTime);
        } else if (this.state === 'bossFight' && this.boss) {
            this.updateBossFight(deltaTime);
        }

        // 更新子弹
        this.updateBullets(deltaTime);
        this.updateEnemyBullets(deltaTime);

        // 更新道具
        this.updatePowerups(deltaTime);

        // 更新粒子效果
        this.updateParticles(deltaTime);

        // 更新道具消息提示
        this.updatePowerupMessages(deltaTime);

        // 更新Combo系统
        this.updateCombo(deltaTime);

        // 更新成就通知
        this.updateAchievementNotifications(deltaTime);

        // 更新 HUD
        this.updateHUD();
    }

    updatePlaying(deltaTime) {
        const levelConfig = CONFIG.LEVELS[this.level];

        // 生成敌人
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= levelConfig.enemySpawnRate * CONFIG.ENEMY_SPEED_MULTIPLIER) {
            this.spawnEnemy(levelConfig.enemyHealthMultiplier);
            this.enemySpawnTimer = 0;
        }

        // 更新敌人
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);

            // 敌人射击
            if (enemy.canShoot && enemy.shootTimer >= enemy.shootRate) {
                enemy.shoot();
                enemy.shootTimer = 0;
            } else if (enemy.canShoot) {
                enemy.shootTimer += deltaTime;
            }

            // 移除超出边界的敌人
            if (enemy.y > this.height + 50) {
                this.enemies.splice(index, 1);
                // 敌人逃跑会重置Combo
                this.resetCombo();
            }
        });

        // 自动射击
        this.autoShoot();

        // 检查 Boss 战触发条件
        if (this.score >= levelConfig.scoreToComplete && !this.boss) {
            this.startBossFight();
        }
    }

    updateBossFight(deltaTime) {
        if (!this.boss) return;

        this.boss.update(deltaTime);

        // Boss 攻击
        if (this.boss.shootTimer >= this.boss.shootRate) {
            this.boss.shoot();
            this.boss.shootTimer = 0;
        } else {
            this.boss.shootTimer += deltaTime;
        }

        // Boss 被击败
        if (this.boss.health <= 0) {
            this.bossDefeated();
        }

        // 自动射击
        this.autoShoot();
    }

    updateBullets(deltaTime) {
        this.bullets = this.bullets.filter((bullet, index) => {
            bullet.update(deltaTime);

            // 检查与敌人碰撞
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.checkCollision(bullet, this.enemies[i])) {
                    this.enemies[i].takeDamage(bullet.damage);
                    this.createParticles(bullet.x, bullet.y, '#ffd700', 5);

                    if (this.enemies[i].health <= 0) {
                        this.destroyEnemy(this.enemies[i], i);
                    }

                    return false;
                }
            }

            // 检查与 Boss 碰撞
            if (this.boss && this.checkCollision(bullet, this.boss)) {
                this.boss.takeDamage(bullet.damage);
                this.createParticles(bullet.x, bullet.y, '#ffd700', 5);

                if (this.boss.health <= 0) {
                    this.bossDefeated();
                }

                return false;
            }

            return bullet.y > -50;
        });
    }

    updateEnemyBullets(deltaTime) {
        this.enemyBullets = this.enemyBullets.filter((bullet, index) => {
            bullet.update(deltaTime);

            // 检查与玩家碰撞
            if (this.player && this.checkCollision(bullet, this.player)) {
                // 检查玩家是否处于无敌状态
                if (!this.player.isInvincible) {
                    this.player.takeDamage(10);
                    this.createParticles(bullet.x, bullet.y, '#ff6b6b', 8);
                    this.recordDamage(10);
                }
                return false;
            }

            return bullet.y < this.height + 50;
        });
    }

    updatePowerups(deltaTime) {
        this.powerups = this.powerups.filter((powerup, index) => {
            powerup.update(deltaTime);

            // 检查与玩家碰撞
            if (this.player && this.checkCollision(powerup, this.player)) {
                if (powerup.isRare) {
                    this.applyRarePowerup(powerup);
                } else {
                    this.applyPowerup(powerup);
                }
                return false;
            }

            return powerup.y < this.height + 50;
        });
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
    }

    // ==================== Combo系统 ====================
    addCombo(enemy) {
        this.comboCount++;
        this.comboTimer = CONFIG.COMBO.MAX_TIME;
        this.comboActive = true;

        // 更新最大连击
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }

        // 计算Combo倍率
        const multiplier = this.calculateComboMultiplier();

        // 计算基础分数（考虑双倍分数效果）
        let baseScore = enemy.scoreValue;
        if (this.player && this.player.doubleScore) {
            baseScore *= 2;
        }

        // 应用Combo倍率
        const comboScore = Math.floor(baseScore * multiplier);

        // Combo达到10的额外奖励
        if (this.comboCount === CONFIG.COMBO.SCORE_BONUS_THRESHOLD) {
            this.showComboMessage(`🔥 ${CONFIG.COMBO.SCORE_BONUS_AMOUNT}连击奖励!`, '#ffd700');
            return comboScore + CONFIG.COMBO.SCORE_BONUS_AMOUNT;
        }

        // 每5连击显示消息
        if (this.comboCount % CONFIG.COMBO.MULTIPLIER_INTERVAL === 0) {
            this.showComboMessage(`${this.comboCount}连击! ${multiplier}x倍率`, '#ff6b6b');
        }

        return comboScore;
    }

    calculateComboMultiplier() {
        if (this.comboCount < CONFIG.COMBO.MIN_COMBO_FOR_MULTIPLIER) {
            return 1;
        }

        const extraMultiplier = Math.floor(
            (this.comboCount - CONFIG.COMBO.MIN_COMBO_FOR_MULTIPLIER + 1) /
            CONFIG.COMBO.MULTIPLIER_INTERVAL
        );

        return Math.min(CONFIG.COMBO.MAX_MULTIPLIER, 1 + extraMultiplier);
    }

    updateCombo(deltaTime) {
        if (!this.comboActive) return;

        this.comboTimer -= deltaTime;

        if (this.comboTimer <= 0) {
            this.resetCombo();
        }
    }

    resetCombo() {
        if (this.comboCount > 0) {
            this.comboCount = 0;
            this.comboTimer = 0;
            this.comboMultiplier = 1;
            this.comboActive = false;
        }
    }

    showComboMessage(text, color) {
        const messageObj = {
            text: text,
            x: this.width / 2,
            y: this.height / 2 - 100,
            color: color,
            alpha: 1,
            scale: 0.5
        };
        this.powerupMessages.push(messageObj);

        // 1.5秒后自动消失
        setTimeout(() => {
            const index = this.powerupMessages.indexOf(messageObj);
            if (index > -1) {
                this.powerupMessages.splice(index, 1);
            }
        }, 1500);
    }

    renderComboCounter() {
        if (!this.comboActive || this.comboCount < 2) return;

        this.ctx.save();
        this.ctx.textAlign = 'center';

        // 连击数显示
        const comboColor = this.comboCount >= 20 ? '#ff4444' :
                         this.comboCount >= 10 ? '#ffaa00' :
                         this.comboCount >= 5 ? '#ffdd00' : '#44ff44';

        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillStyle = comboColor;
        this.ctx.shadowColor = comboColor;
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(`${this.comboCount}连击`, this.width / 2, 120);

        // 倍率显示
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`${this.comboMultiplier}x倍率`, this.width / 2, 145);

        this.ctx.restore();
    }

    renderComboTimer() {
        if (!this.comboActive) return;

        const timerWidth = 200;
        const timerHeight = 8;
        const x = (this.width - timerWidth) / 2;
        const y = 155;
        const progress = this.comboTimer / CONFIG.COMBO.MAX_TIME;

        this.ctx.save();

        // 计时器背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x, y, timerWidth, timerHeight);

        // 计时器进度
        const timerColor = progress > 0.6 ? '#44ff44' :
                          progress > 0.3 ? '#ffaa00' : '#ff4444';
        this.ctx.fillStyle = timerColor;
        this.ctx.fillRect(x, y, timerWidth * progress, timerHeight);

        this.ctx.restore();
    }

    // ==================== 通关评价系统 ====================
    startLevelStats() {
        this.levelStats = {
            startTime: performance.now(),
            endTime: 0,
            kills: 0,
            damageTaken: 0,
            powerupsCollected: 0,
            maxCombo: 0
        };
    }

    recordKill() {
        this.levelStats.kills++;
        this.globalStats.totalKills++;
    }

    recordDamage(damage) {
        this.levelStats.damageTaken += damage;
        this.globalStats.totalDamageTaken += damage;
    }

    recordPowerupCollected() {
        this.levelStats.powerupsCollected++;
    }

    calculateLevelRating() {
        // 更新关卡统计
        this.levelStats.endTime = performance.now();
        this.levelStats.maxCombo = this.maxCombo;

        const timeTaken = this.levelStats.endTime - this.levelStats.startTime;
        const standardTime = CONFIG.STANDARD_TIME[this.level] || CONFIG.STANDARD_TIME[1];
        const timeRatio = timeTaken / standardTime;

        // 计算生命值百分比
        const healthPercent = this.player ? (this.player.health / this.player.maxHealth) * 100 : 0;

        // 检查3星标准
        if (this.meetsThreeStarCriteria(healthPercent, timeRatio)) {
            return 3;
        }

        // 检查2星标准
        if (this.meetsTwoStarCriteria(healthPercent, timeRatio)) {
            return 2;
        }

        // 默认1星
        return 1;
    }

    meetsThreeStarCriteria(healthPercent, timeRatio) {
        const criteria = CONFIG.RATING.THREE_STAR;
        return (
            healthPercent >= criteria.MIN_HEALTH_PERCENT &&
            timeRatio <= criteria.MAX_TIME_MULTIPLIER &&
            this.levelStats.kills >= criteria.MIN_KILLS &&
            this.levelStats.maxCombo >= criteria.MIN_MAX_COMBO
        );
    }

    meetsTwoStarCriteria(healthPercent, timeRatio) {
        const criteria = CONFIG.RATING.TWO_STAR;
        return (
            healthPercent >= criteria.MIN_HEALTH_PERCENT &&
            timeRatio <= criteria.MAX_TIME_MULTIPLIER &&
            this.levelStats.kills >= criteria.MIN_KILLS
        );
    }

    getLevelRatingDetails() {
        const rating = this.calculateLevelRating();
        const timeTaken = this.levelStats.endTime - this.levelStats.startTime;
        const standardTime = CONFIG.STANDARD_TIME[this.level] || CONFIG.STANDARD_TIME[1];
        const healthPercent = this.player ? Math.round((this.player.health / this.player.maxHealth) * 100) : 0;

        return {
            rating: rating,
            stars: this.getStarDisplay(rating),
            comment: this.getRatingComment(rating),
            score: this.score,
            healthPercent: healthPercent,
            timeSeconds: Math.round(timeTaken / 1000),
            kills: this.levelStats.kills,
            maxCombo: this.levelStats.maxCombo
        };
    }

    getStarDisplay(rating) {
        const filled = '★';
        const empty = '☆';
        return filled.repeat(rating) + empty.repeat(3 - rating);
    }

    getRatingComment(rating) {
        const comments = {
            1: ['继续加油！', '下次会更好！', '还需努力！'],
            2: ['表现不错！', '干得漂亮！', '很棒的表现！'],
            3: ['完美通关！', '太厉害了！', '简直是天才！']
        };
        const ratingComments = comments[rating];
        return ratingComments[Math.floor(Math.random() * ratingComments.length)];
    }

    applyStarRewards(rating) {
        const rewards = CONFIG.STAR_REWARDS[rating];

        if (rewards.scoreBonus > 0) {
            this.score += rewards.scoreBonus;
            this.showPowerupMessage(`🎁 星级奖励: +${rewards.scoreBonus}分`, '#ffd700');
        }

        if (rewards.specialPowerup && rating === 3) {
            // 3星奖励：给予一个稀有道具
            setTimeout(() => {
                if (this.player) {
                    this.spawnRarePowerup(this.player.x, this.player.y - 100);
                }
            }, 1000);
        }

        // 更新全局统计
        if (rating === 3) {
            this.globalStats.totalThreeStars++;
        }

        // 保存关卡评价
        this.levelRatings[this.level] = Math.max(this.levelRatings[this.level] || 0, rating);

        // 检查成就
        this.checkAchievements('level_complete');
    }

    // ==================== 成就系统 ====================
    checkAchievements(eventId) {
        Object.values(CONFIG.ACHIEVEMENTS).forEach(achievement => {
            if (!this.unlockedAchievements.includes(achievement.id)) {
                try {
                    if (achievement.condition(this.globalStats)) {
                        this.unlockAchievement(achievement);
                    }
                } catch (error) {
                    console.error('成就检查失败:', achievement.id, error);
                }
            }
        });
    }

    unlockAchievement(achievement) {
        this.unlockedAchievements.push(achievement.id);

        // 应用奖励
        this.applyAchievementReward(achievement);

        // 显示通知
        this.showAchievementNotification(achievement);

        // 保存成就
        this.saveAchievements();

        // 更新成就显示
        this.updateAchievementDisplay();
    }

    applyAchievementReward(achievement) {
        if (achievement.reward) {
            if (achievement.reward.score) {
                this.score += achievement.reward.score;
                this.showPowerupMessage(`🏆 ${achievement.reward.score}分`, '#ffd700');
            }

            if (achievement.reward.special) {
                this.applySpecialReward(achievement.reward.special);
            }
        }
    }

    applySpecialReward(specialType) {
        // 特殊奖励效果（可以根据需要扩展）
        switch (specialType) {
            case 'double_damage':
                if (this.player) {
                    this.player.damageMultiplier *= 2;
                    this.showPowerupMessage(`永久伤害翻倍！`, '#ff6b6b');
                }
                break;
            // 可以添加更多特殊奖励类型
        }
    }

    showAchievementNotification(achievement) {
        const notification = {
            achievement: achievement,
            x: this.width / 2,
            y: -80,
            targetY: 80,
            alpha: 0,
            timer: 0,
            maxTime: 3000
        };

        this.achievementNotifications.push(notification);
    }

    updateAchievementNotifications(deltaTime) {
        this.achievementNotifications = this.achievementNotifications.filter(notif => {
            // 进入动画
            if (notif.y < notif.targetY) {
                notif.y += (notif.targetY - notif.y) * 0.1;
            }

            // 渐入
            if (notif.alpha < 1) {
                notif.alpha += deltaTime / 500;
                if (notif.alpha > 1) notif.alpha = 1;
            }

            // 计时
            notif.timer += deltaTime;

            // 超时后淡出
            if (notif.timer > notif.maxTime) {
                notif.alpha -= deltaTime / 500;
                if (notif.alpha <= 0) {
                    return false;
                }
            }

            return true;
        });
    }

    renderAchievementNotifications(ctx) {
        this.achievementNotifications.forEach(notif => {
            ctx.save();
            ctx.globalAlpha = notif.alpha;

            // 背景
            this.roundRect(ctx, notif.x - 200, notif.y, 400, 80, 10);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fill();

            // 金色边框
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 图标
            ctx.font = '40px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(notif.achievement.icon, notif.x - 180, notif.y + 50);

            // 文本
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('成就解锁!', notif.x - 120, notif.y + 30);

            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(notif.achievement.name, notif.x - 120, notif.y + 55);

            ctx.restore();
        });
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    saveAchievements() {
        const data = {
            unlockedAchievements: this.unlockedAchievements,
            globalStats: this.globalStats,
            levelRatings: this.levelRatings
        };
        localStorage.setItem('planeWarAchievements', JSON.stringify(data));
    }

    loadAchievements() {
        const data = localStorage.getItem('planeWarAchievements');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.globalStats = { ...this.globalStats, ...parsed.globalStats };
                if (parsed.levelRatings) {
                    this.levelRatings = parsed.levelRatings;
                }
                return parsed.unlockedAchievements || [];
            } catch (error) {
                console.error('加载成就数据失败:', error);
                return [];
            }
        }
        return [];
    }

    getUnlockedAchievements() {
        return this.unlockedAchievements.map(id => CONFIG.ACHIEVEMENTS[id]).filter(Boolean);
    }

    getLockedAchievements() {
        return Object.values(CONFIG.ACHIEVEMENTS).filter(achievement =>
            !this.unlockedAchievements.includes(achievement.id)
        );
    }

    updateAchievementDisplay() {
        const achievementCount = document.getElementById('achievementCount');
        if (achievementCount) {
            achievementCount.textContent = `${this.unlockedAchievements.length}/${Object.keys(CONFIG.ACHIEVEMENTS).length}`;
        }
    }

    // ==================== 稀有道具系统 ====================
    handlePowerupDrop(x, y, isElite) {
        const dropRate = isElite ?
            CONFIG.DROP_RULES.BASE_DROP_RATE * CONFIG.DROP_RULES.ELITE_BOOST :
            CONFIG.DROP_RULES.BASE_DROP_RATE;

        // 检查是否掉落稀有道具
        if (this.shouldDropRarePowerup(isElite)) {
            this.spawnRarePowerup(x, y);
            return;
        }

        // 普通道具掉落
        if (Math.random() < dropRate) {
            this.spawnPowerup(x, y);
        }
    }

    shouldDropRarePowerup(isElite) {
        let dropRate = CONFIG.DROP_RULES.RARE_DROP_RATE;

        if (isElite) {
            dropRate *= CONFIG.DROP_RULES.ELITE_BOOST;
        }

        return Math.random() < dropRate;
    }

    spawnRarePowerup(x, y) {
        const rareTypes = Object.values(CONFIG.RARE_POWERUPS);
        const weightedTypes = [];

        // 根据掉落率加权随机
        rareTypes.forEach(type => {
            const weight = Math.floor(type.dropRate * 1000);
            for (let i = 0; i < weight; i++) {
                weightedTypes.push(type);
            }
        });

        const selected = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];

        this.powerups.push(new RarePowerup(x, y, selected));

        // 创建生成特效
        this.createRareSpawnEffect(x, y);
    }

    createRareSpawnEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 3 + Math.random() * 2;
            this.particles.push(new Particle(x, y, '#ffd700', {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }));
        }
    }

    applyRarePowerup(powerup) {
        const config = powerup.config;

        // 显示获取消息
        this.showPowerupMessage(`✨ 稀有道具: ${config.name}!`, config.color);

        // 应用效果
        config.effect(this);

        // 如果有持续时间，设置结束效果
        if (config.duration > 0 && config.endEffect) {
            setTimeout(() => {
                if (this.player) {
                    config.endEffect(this.player);
                    this.showPowerupMessage(`${config.name}效果结束`, '#aaa');
                }
            }, config.duration);
        }

        // 创建获取特效
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#9b59b6', '#2ecc71'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(powerup.x, powerup.y, color, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }));
        }

        // 记录收集
        this.recordPowerupCollected();
    }

    // ==================== 实体操作 ====================
    spawnEnemy(healthMultiplier = 1) {
        const type = Math.random();
        let enemy;

        if (type < 0.6) {
            // 普通敌人
            enemy = new Enemy(
                Math.random() * (this.width - 60) + 30,
                -50,
                'normal',
                20 * healthMultiplier
            );
        } else if (type < 0.85) {
            // 快速敌人
            enemy = new Enemy(
                Math.random() * (this.width - 60) + 30,
                -50,
                'fast',
                10 * healthMultiplier
            );
            enemy.speed = 3;
            enemy.canShoot = false;
        } else {
            // 精英敌人
            enemy = new Enemy(
                Math.random() * (this.width - 80) + 40,
                -50,
                'elite',
                40 * healthMultiplier
            );
            enemy.canShoot = true;
            enemy.shootRate = 1500;
        }

        this.enemies.push(enemy);
    }

    destroyEnemy(enemy, index) {
        this.createParticles(enemy.x, enemy.y, enemy.color, 20);
        this.enemies.splice(index, 1);

        // 记录击杀
        this.recordKill();

        // 使用Combo系统计算分数
        const comboScore = this.addCombo(enemy);
        this.score += comboScore;

        // 道具掉落（包含稀有道具）
        this.handlePowerupDrop(enemy.x, enemy.y, enemy.isElite);

        // 武器升级检查
        if (this.player.weaponLevel < 5 && this.score % 300 === 0) {
            this.player.weaponLevel++;
        }

        // 检查成就
        this.checkAchievements('kill');
    }

    startBossFight() {
        this.state = 'bossWarning';
        this.enemies = [];

        // 显示 Boss 警告
        document.getElementById('bossWarning').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('bossWarning').classList.add('hidden');
            this.spawnBoss();
        }, 2000);
    }

    spawnBoss() {
        const levelConfig = CONFIG.LEVELS[this.level];
        this.state = 'bossFight';

        this.boss = new Boss(
            this.width / 2,
            -200,
            levelConfig.boss.name,
            levelConfig.boss.health,
            levelConfig.boss.speed,
            levelConfig.boss.attackPattern,
            levelConfig.boss.shootRate
        );

        document.getElementById('bossHealthBar').classList.remove('hidden');
    }

    bossDefeated() {
        this.createParticles(this.boss.x, this.boss.y, '#ff6b6b', 50);
        this.score += 500;
        this.boss = null;

        // 更新Boss击败统计
        this.globalStats.bossesDefeated++;

        // 记录关卡结束时间
        this.levelStats.endTime = performance.now();
        this.levelStats.maxCombo = this.maxCombo;

        // Boss必掉一个稀有道具
        this.spawnRarePowerup(this.width / 2, 200);

        // 计算评价
        const rating = this.calculateLevelRating();
        const details = this.getLevelRatingDetails();

        // 应用星级奖励
        this.applyStarRewards(rating);

        // 检查Boss相关成就
        this.checkAchievements('boss_defeated');

        document.getElementById('bossHealthBar').classList.add('hidden');
        this.state = 'levelComplete';

        // 保存进度（包含评价数据）
        this.saveGameData(rating);

        // 显示关卡完成界面（带评价）
        this.showLevelCompleteScreen(details);
    }

    showLevelCompleteScreen(details) {
        document.getElementById('completedLevel').textContent = this.level;
        document.getElementById('starRating').textContent = details.stars;
        document.getElementById('ratingComment').textContent = details.comment;
        document.getElementById('levelScore').textContent = details.score;
        document.getElementById('healthRating').textContent = `${details.healthPercent}%`;
        document.getElementById('timeRating').textContent = `${details.timeSeconds}秒`;
        document.getElementById('killRating').textContent = details.kills;
        document.getElementById('comboRating').textContent = details.maxCombo;

        document.getElementById('levelCompleteScreen').classList.remove('hidden');
    }

    applyPowerup(powerup) {
        // 直接使用道具的配置，不需要再次转换大小写
        const config = CONFIG.POWERUPS[powerup.type.toUpperCase()];

        switch (powerup.type) {
            case 'heal':
                const actualHeal = this.player.heal(config.effect);
                this.showPowerupMessage(`+${actualHeal} 生命值`, config.color);
                break;
            case 'speed':
                this.player.speed *= config.effect;
                this.showPowerupMessage(`速度提升 ${(config.effect - 1) * 100}%！`, config.color);
                setTimeout(() => {
                    this.player.speed /= config.effect;
                    this.showPowerupMessage(`速度恢复正常`, '#aaa');
                }, config.duration);
                break;
            case 'damage':
                this.player.damageMultiplier *= config.effect;
                this.showPowerupMessage(`伤害提升 ${(config.effect - 1) * 100}%！`, config.color);
                setTimeout(() => {
                    this.player.damageMultiplier /= config.effect;
                    this.showPowerupMessage(`伤害恢复正常`, '#aaa');
                }, config.duration);
                break;
            case 'shield':
                this.player.hasShield = true;
                this.player.shieldHealth = 50;
                this.showPowerupMessage(`护盾激活！`, config.color);
                setTimeout(() => {
                    this.player.hasShield = false;
                    this.showPowerupMessage(`护盾消失`, '#aaa');
                }, config.duration);
                break;
        }

        this.createParticles(powerup.x, powerup.y, config.color, 10);
        this.recordPowerupCollected();
    }

    showPowerupMessage(message, color) {
        const messageObj = {
            text: message,
            x: this.width / 2,
            y: this.height / 2 - 100,
            color: color,
            alpha: 1,
            scale: 1
        };
        this.powerupMessages.push(messageObj);

        // 2 秒后自动消失
        setTimeout(() => {
            const index = this.powerupMessages.indexOf(messageObj);
            if (index > -1) {
                this.powerupMessages.splice(index, 1);
            }
        }, 2000);
    }

    updatePowerupMessages(deltaTime) {
        this.powerupMessages.forEach(msg => {
            msg.y -= 0.5; // 向上漂浮
            msg.alpha -= deltaTime / 2000; // 渐隐
            msg.scale += deltaTime / 1000; // 放大
        });

        // 移除已消失的消息
        this.powerupMessages = this.powerupMessages.filter(msg => msg.alpha > 0);
    }

    renderPowerupMessages(ctx) {
        this.powerupMessages.forEach(msg => {
            ctx.save();
            ctx.globalAlpha = msg.alpha;
            ctx.translate(msg.x, msg.y);
            ctx.scale(msg.scale, msg.scale);

            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = msg.color;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillText(msg.text, 0, 0);

            ctx.restore();
        });
    }

    spawnPowerup(x, y) {
        const types = Object.keys(CONFIG.POWERUPS);
        const type = types[Math.floor(Math.random() * types.length)];
        const config = CONFIG.POWERUPS[type];

        // 将类型转换为小写，确保与switch语句匹配
        this.powerups.push(new Powerup(x, y, type.toLowerCase(), config));
    }

    autoShoot() {
        const now = performance.now();
        const weaponConfig = CONFIG.WEAPON_UPGRADES[this.player.weaponLevel];

        // 考虑急速射击倍率
        let fireRate = weaponConfig.fireRate;
        if (this.player.rapidFireMultiplier) {
            fireRate *= this.player.rapidFireMultiplier;
        }

        if (now - this.lastShotTime >= fireRate) {
            this.player.shoot(weaponConfig);
            this.lastShotTime = now;
        }
    }

    // ==================== 碰撞检测 ====================
    checkCollision(obj1, obj2) {
        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }

    // ==================== 渲染 ====================
    render() {
        // 清空画布（完全清除，不透明度设为 1）
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制背景星星
        this.renderStars();

        // 绘制道具
        this.powerups.forEach(powerup => powerup.render(this.ctx));

        // 绘制敌人
        this.enemies.forEach(enemy => enemy.render(this.ctx));

        // 绘制子弹
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.render(this.ctx));

        // 绘制粒子
        this.particles.forEach(particle => particle.render(this.ctx));

        // 绘制 Boss
        if (this.boss) {
            this.boss.render(this.ctx);
        }

        // 绘制玩家
        if (this.player) {
            this.player.render(this.ctx);
        }

        // 绘制Combo计数器和计时器
        this.renderComboCounter();
        this.renderComboTimer();

        // 绘制道具消息提示（在最上层）
        this.renderPowerupMessages(this.ctx);

        // 绘制成就通知
        this.renderAchievementNotifications(this.ctx);
    }

    // ==================== 背景星星 ====================
    createStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random()
            });
        }
        return stars;
    }

    updateStars(deltaTime) {
        this.stars.forEach(star => {
            star.y += star.speed * deltaTime / 16;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
    }

    renderStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // ==================== 粒子效果 ====================
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push(new Particle(x, y, color, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }));
        }
    }

    // ==================== 游戏状态 ====================
    gameOver() {
        this.running = false;
        this.hideAllScreens();

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }

        // 更新全局统计
        this.globalStats.totalGamesPlayed++;
        if (this.score > this.globalStats.highestScore) {
            this.globalStats.highestScore = this.score;
        }
        if (this.maxCombo > this.globalStats.maxComboEver) {
            this.globalStats.maxComboEver = this.maxCombo;
        }

        // 保存成就数据
        this.saveAchievements();

        // 检查成就
        this.checkAchievements('game_over');

        // 清除存档
        this.clearGameData();

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    // ==================== UI 更新 ====================
    updateHUD() {
        if (!this.player) return;

        // 更新血条
        document.getElementById('healthFill').style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;

        // 更新分数
        document.getElementById('scoreDisplay').textContent = this.score;

        // 更新武器等级
        document.getElementById('weaponLevel').textContent = `Lv.${this.player.weaponLevel}`;

        // 更新关卡
        document.getElementById('levelDisplay').textContent = this.level;

        // 更新 Boss 血条
        if (this.boss) {
            const bossMaxHealth = CONFIG.LEVELS[this.level].boss.health;
            document.getElementById('bossHealthFill').style.width = `${(this.boss.health / bossMaxHealth) * 100}%`;
        }
    }

    updateHighScoreDisplay() {
        document.getElementById('highScoreDisplay').textContent = this.highScore;
    }

    // ==================== 存档系统 ====================
    saveGameData(rating = 0) {
        const data = {
            score: this.score,
            level: this.level,
            weaponLevel: this.player ? this.player.weaponLevel : 1,
            timestamp: Date.now(),
            rating: rating
        };
        localStorage.setItem('planeWarSave', JSON.stringify(data));
    }

    loadGameData() {
        const data = localStorage.getItem('planeWarSave');
        return data ? JSON.parse(data) : null;
    }

    clearGameData() {
        localStorage.removeItem('planeWarSave');
    }

    saveHighScore() {
        localStorage.setItem('planeWarHighScore', this.highScore.toString());
    }

    loadHighScore() {
        return parseInt(localStorage.getItem('planeWarHighScore') || '0');
    }

    // ==================== 工具方法 ====================
    hideAllScreens() {
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        document.getElementById('bossWarning').classList.add('hidden');
        document.getElementById('bossHealthBar').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
    }

    showScreen(screenId) {
        document.getElementById(screenId).classList.remove('hidden');
    }
}

// ==================== 玩家类 ====================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;

        this.width = 50;
        this.height = 50;

        this.maxHealth = 100;
        this.health = this.maxHealth;

        this.speed = 5;
        this.weaponLevel = 1;
        this.damageMultiplier = 1;

        this.hasShield = false;
        this.shieldHealth = 0;

        // 稀有道具效果
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.doubleScore = false;
        this.doubleScoreTimer = 0;
        this.rapidFireMultiplier = 1;
    }

    update(deltaTime) {
        // 平滑移动到目标位置
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        this.x += dx * 0.1;
        this.y += dy * 0.1;
    }

    updateRarePowerups(deltaTime) {
        // 更新无敌计时器
        if (this.isInvincible && this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        // 更新双倍分数计时器
        if (this.doubleScore && this.doubleScoreTimer > 0) {
            this.doubleScoreTimer -= deltaTime;
            if (this.doubleScoreTimer <= 0) {
                this.doubleScore = false;
            }
        }
    }

    shoot(weaponConfig) {
        const game = window.game;
        const damage = weaponConfig.damage * this.damageMultiplier;

        if (weaponConfig.bulletCount === 1) {
            // 单发
            game.bullets.push(new Bullet(this.x - 3, this.y - 30, 0, -10, damage));
        } else if (weaponConfig.bulletCount === 2) {
            // 双发
            game.bullets.push(new Bullet(this.x - 10, this.y - 20, 0, -10, damage));
            game.bullets.push(new Bullet(this.x + 10, this.y - 20, 0, -10, damage));
        } else if (weaponConfig.bulletCount === 3) {
            // 三发
            game.bullets.push(new Bullet(this.x - 3, this.y - 30, 0, -10, damage));
            game.bullets.push(new Bullet(this.x - 15, this.y - 20, -1, -9, damage));
            game.bullets.push(new Bullet(this.x + 15, this.y - 20, 1, -9, damage));
        }
    }

    takeDamage(damage) {
        // 无敌状态免疫伤害
        if (this.isInvincible) return;

        if (this.hasShield && this.shieldHealth > 0) {
            this.shieldHealth -= damage;
            if (this.shieldHealth <= 0) {
                this.hasShield = false;
            }
            return;
        }

        this.health -= damage;
    }

    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - oldHealth; // 返回实际恢复的生命值
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 无敌状态闪烁效果
        if (this.isInvincible) {
            const flashAlpha = 0.5 + Math.sin(performance.now() / 50) * 0.5;
            ctx.globalAlpha = flashAlpha;
        }

        // 护盾效果
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(116, 185, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(116, 185, 255, 0.1)';
            ctx.fill();
        }

        // 绘制飞机主体
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-25, 25);
        ctx.lineTo(0, 15);
        ctx.lineTo(25, 25);
        ctx.closePath();
        ctx.fill();

        // 飞机装饰
        ctx.fillStyle = '#95e1d3';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-8, 15);
        ctx.lineTo(8, 15);
        ctx.closePath();
        ctx.fill();

        // 驾驶舱
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.ellipse(0, -5, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 引擎火焰
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(-8, 20);
        ctx.lineTo(0, 35 + Math.random() * 10);
        ctx.lineTo(8, 20);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// ==================== 敌人类 ====================
class Enemy {
    constructor(x, y, type = 'normal', health = 20) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = health;
        this.maxHealth = health;

        this.canShoot = true;
        this.shootRate = 2000;
        this.shootTimer = 0;

        this.speed = type === 'fast' ? 3 : 1.5;

        this.setupType();
    }

    setupType() {
        switch (this.type) {
            case 'normal':
                this.width = 40;
                this.height = 40;
                this.color = '#ff6b6b';
                this.scoreValue = 10;
                this.isElite = false;
                break;
            case 'fast':
                this.width = 30;
                this.height = 30;
                this.color = '#ffd93d';
                this.scoreValue = 20;
                this.isElite = false;
                break;
            case 'elite':
                this.width = 50;
                this.height = 50;
                this.color = '#9b59b6';
                this.scoreValue = 50;
                this.isElite = true;
                break;
        }
    }

    update(deltaTime) {
        this.y += this.speed;
    }

    shoot() {
        const game = window.game;
        game.enemyBullets.push(new Bullet(this.x, this.y + 20, 0, 5, 10));
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 绘制敌机
        ctx.fillStyle = this.color;

        if (this.type === 'normal') {
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.lineTo(-20, -15);
            ctx.lineTo(0, -5);
            ctx.lineTo(20, -15);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'fast') {
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(-15, -10);
            ctx.lineTo(15, -10);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'elite') {
            ctx.beginPath();
            ctx.moveTo(0, 25);
            ctx.lineTo(-25, -20);
            ctx.lineTo(0, -10);
            ctx.lineTo(25, -20);
            ctx.closePath();
            ctx.fill();

            // 精英标记
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, 5);
        }

        ctx.restore();
    }
}

// ==================== Boss 类 ====================
class Boss {
    constructor(x, y, name, health, speed, attackPattern, shootRate) {
        this.x = x;
        this.y = y;
        this.targetY = 150;
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.attackPattern = attackPattern;
        this.shootRate = shootRate;
        this.shootTimer = 0;

        this.width = 100;
        this.height = 100;

        this.movePhase = 0;
        this.moveTimer = 0;
    }

    update(deltaTime) {
        // 入场动画
        if (this.y < this.targetY) {
            this.y += 2;
            return;
        }

        // 移动模式
        this.moveTimer += deltaTime;

        if (this.moveTimer > 2000) {
            this.movePhase = (this.movePhase + 1) % 2;
            this.moveTimer = 0;
        }

        if (this.movePhase === 0) {
            this.x += Math.sin(performance.now() / 500) * 2;
        } else {
            this.x += Math.sin(performance.now() / 800) * 3;
        }

        // 边界限制
        this.x = Math.max(50, Math.min(550, this.x));
    }

    shoot() {
        const game = window.game;

        switch (this.attackPattern) {
            case 'spread':
                // 散射
                for (let i = -2; i <= 2; i++) {
                    game.enemyBullets.push(new Bullet(
                        this.x + (i * 20),
                        this.y + 40,
                        i * 0.5,
                        6,
                        15
                    ));
                }
                break;

            case 'aimed':
                // 瞄准射击
                if (game.player) {
                    const dx = game.player.x - this.x;
                    const dy = game.player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const vx = (dx / dist) * 7;
                    const vy = (dy / dist) * 7;

                    game.enemyBullets.push(new Bullet(this.x, this.y + 40, vx, vy, 20));
                }
                break;

            case 'combined':
                // 组合攻击
                // 散射
                for (let i = -1; i <= 1; i++) {
                    game.enemyBullets.push(new Bullet(
                        this.x + (i * 30),
                        this.y + 40,
                        i * 0.5,
                        5,
                        15
                    ));
                }
                // 瞄准
                if (game.player) {
                    const dx = game.player.x - this.x;
                    const dy = game.player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    game.enemyBullets.push(new Bullet(
                        this.x,
                        this.y + 40,
                        (dx / dist) * 6,
                        (dy / dist) * 6,
                        25
                    ));
                }
                break;
        }
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Boss 主体
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(1, '#c0392b');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(-50, -20);
        ctx.lineTo(-30, -30);
        ctx.lineTo(0, -40);
        ctx.lineTo(30, -30);
        ctx.lineTo(50, -20);
        ctx.closePath();
        ctx.fill();

        // Boss 核心发光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Boss 名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, 70);

        ctx.restore();
    }
}

// ==================== 子弹类 ====================
class Bullet {
    constructor(x, y, vx, vy, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;

        this.width = 8;
        this.height = 15;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime / 16;
        this.y += this.vy * deltaTime / 16;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 子弹主体
        const gradient = ctx.createLinearGradient(0, -7.5, 0, 7.5);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#4ecdc4');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==================== 道具类 ====================
class Powerup {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = config.color;
        this.symbol = config.symbol;

        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.isRare = false;

        this.pulsePhase = 0;
    }

    update(deltaTime) {
        this.y += this.speed;
        this.pulsePhase += deltaTime / 500;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const scale = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.scale(scale, scale);

        // 背景圆
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // 符号
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        ctx.restore();
    }
}

// ==================== 稀有道具类 ====================
class RarePowerup {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.color = config.color;
        this.symbol = config.symbol;

        this.width = 35;
        this.height = 35;
        this.speed = 2;
        this.isRare = true;

        this.pulsePhase = 0;
        this.rotationPhase = 0;
        this.starPhase = 0;
    }

    update(deltaTime) {
        this.y += this.speed;
        this.pulsePhase += deltaTime / 500;
        this.rotationPhase += deltaTime / 1000;
        this.starPhase += deltaTime / 800;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const scale = 1 + Math.sin(this.pulsePhase) * 0.15;
        ctx.scale(scale, scale);

        // 旋转的金色光环
        ctx.save();
        ctx.rotate(this.rotationPhase);

        // 外圈
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 脉冲边框
        const pulseAlpha = 0.3 + Math.sin(this.pulsePhase * 2) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // 5个星星绕圈旋转
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i + this.starPhase;
            const starX = Math.cos(angle) * 35;
            const starY = Math.sin(angle) * 35;
            const starSize = 0.5 + Math.sin(this.starPhase + i) * 0.3;

            ctx.font = `${14 * starSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', starX, starY);
        }

        // 背景圆
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 0.3));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // 金色边框
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 符号
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        ctx.restore();
    }

    darkenColor(color, factor) {
        // 简单的颜色变暗函数
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// ==================== 粒子类 ====================
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocity.x;
        this.vy = velocity.y;

        this.life = 1;
        this.decay = 0.02;
        this.size = 4;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime / 16;
        this.y += this.vy * deltaTime / 16;
        this.life -= this.decay * deltaTime / 16;
        this.size *= 0.98;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ==================== 初始化游戏 ====================
// 将 game 变量挂载到 window 对象，确保全局可访问
let game;
window.game = game; // 声明引用

window.addEventListener('load', () => {
    game = new Game();
    window.game = game; // 更新引用
    console.log('游戏初始化成功！✓');
});
