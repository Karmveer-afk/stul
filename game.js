// Weapon Configs
const WEAPONS = {
    pistol: { damage: 10, fireRate: 100, maxAmmo: 30, cost: 0, owned: true },
    rifle: { damage: 25, fireRate: 200, maxAmmo: 60, cost: 300, owned: false },
    shotgun: { damage: 50, fireRate: 400, maxAmmo: 20, cost: 500, owned: false },
    sniper: { damage: 100, fireRate: 800, maxAmmo: 10, cost: 1000, owned: false }
};

const ABILITIES = {
    grenade: { damage: 75, cost: 150, quantity: 0 },
    health: { amount: 50, cost: 200, quantity: 0 }
};

const LEVELS = {
    1: { botCount: 1, botHealth: 100, botDamage: 5, botSpeed: 2, isBoss: false, reward: 500 },
    2: { botCount: 2, botHealth: 120, botDamage: 7, botSpeed: 2.5, isBoss: false, reward: 1000 },
    3: { botCount: 2, botHealth: 140, botDamage: 9, botSpeed: 3, isBoss: false, reward: 1500 },
    4: { botCount: 3, botHealth: 160, botDamage: 11, botSpeed: 3.5, isBoss: false, reward: 2000 },
    5: { botCount: 1, botHealth: 300, botDamage: 20, botSpeed: 4.5, isBoss: true, reward: 5000 }
};

// Game State
let gameState = {
    money: 0,
    level: 1,
    kills: 0,
    selectedWeapon: 'pistol',
    ammo: 30,
    maxAmmo: 30,
    inventory: { pistol: { owned: true } },
    game: null
};

// Screen Management
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(name).classList.add('active');
}

// Main Menu
document.getElementById('playBtn').addEventListener('click', () => {
    gameState.money = 0;
    gameState.kills = 0;
    gameState.level = 1;
    gameState.selectedWeapon = 'pistol';
    gameState.ammo = 30;
    showScreen('levelSelectScreen');
});

document.getElementById('instructionsBtn').addEventListener('click', () => {
    showScreen('instructionsScreen');
});

document.getElementById('backBtn').addEventListener('click', () => {
    showScreen('mainMenu');
});

// Level Select
document.querySelectorAll('.levelCard').forEach(card => {
    card.addEventListener('click', function() {
        gameState.level = parseInt(this.dataset.level);
        showScreen('gameScreen');
        startGame();
    });
});

document.getElementById('levelBackBtn').addEventListener('click', () => {
    showScreen('mainMenu');
});

// Store Modal
const storeModal = document.getElementById('storeModal');
const gameOverModal = document.getElementById('gameOverModal');

// TAB key to toggle store
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        if (gameState.game && gameState.game.running) {
            storeModal.classList.toggle('active');
        }
    }
});

document.getElementById('closeStoreBtn').addEventListener('click', () => {
    storeModal.classList.remove('active');
});

// Store Item Purchase
document.querySelectorAll('.storeItem').forEach(item => {
    item.querySelector('.buyBtn').addEventListener('click', function() {
        const type = item.dataset.type;
        const id = item.dataset.id;
        
        if (type === 'weapon') {
            const cost = WEAPONS[id].cost;
            if (gameState.money >= cost) {
                gameState.money -= cost;
                WEAPONS[id].owned = true;
                this.textContent = 'OWNED';
                this.disabled = true;
                updateStoreDisplay();
            }
        } else if (type === 'ability') {
            const cost = ABILITIES[id].cost;
            if (gameState.money >= cost) {
                gameState.money -= cost;
                ABILITIES[id].quantity++;
                updateStoreDisplay();
            }
        }
    });
});

function updateStoreDisplay() {
    document.getElementById('storeMoney').textContent = gameState.money;
    
    document.querySelectorAll('.storeItem').forEach(item => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        const btn = item.querySelector('.buyBtn');
        
        if (type === 'weapon' && WEAPONS[id].owned) {
            btn.textContent = 'OWNED';
            btn.disabled = true;
        } else if (type === 'ability') {
            const qty = ABILITIES[id].quantity;
            btn.textContent = `Buy (${qty})`;
        }
    });
}

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    gameState.level++;
    if (gameState.level > 5) gameState.level = 5;
    showScreen('gameScreen');
    startGame();
});

document.getElementById('mainMenuBtn').addEventListener('click', () => {
    showScreen('mainMenu');
});

// Game Engine
class FPSGame {
    constructor(level) {
        this.level = level;
        this.config = LEVELS[level];
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: 0,
            vy: 0,
            health: 100,
            maxHealth: 100,
            speed: 6,
            jumpPower: 15,
            isGrounded: true,
            gravity: 0.6,
            yVel: 0,
            rotation: 0
        };
        
        this.keys = {};
        this.mouse = { x: 0, y: 0, aiming: false };
        this.bots = [];
        this.bullets = [];
        this.particles = [];
        this.grenades = [];
        
        this.running = true;
        this.kills = 0;
        this.spawnBots();
        this.setupControls();
        this.gameLoop();
    }
    
    spawnBots() {
        for (let i = 0; i < this.config.botCount; i++) {
            const bot = {
                x: Math.random() * (this.canvas.width - 200) + 100,
                y: this.canvas.height / 2,
                vx: 0,
                vy: 0,
                health: this.config.botHealth,
                maxHealth: this.config.botHealth,
                damage: this.config.botDamage,
                speed: this.config.botSpeed,
                size: 20,
                isBoss: this.config.isBoss,
                shootCooldown: 1500,
                lastShoot: 0,
                angle: Math.random() * Math.PI * 2
            };
            this.bots.push(bot);
        }
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            if (key === 'r') this.reload();
            if (key === 'g') this.throwGrenade();
            if (key === '1') this.switchWeapon('pistol');
            if (key === '2') this.switchWeapon('rifle');
            if (key === '3') this.switchWeapon('shotgun');
            if (key === '4') this.switchWeapon('sniper');
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Calculate rotation towards mouse
            const dx = this.mouse.x - this.canvas.width / 2;
            const dy = this.mouse.y - this.canvas.height / 2;
            this.player.rotation = Math.atan2(dy, dx);
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.shoot();
            if (e.button === 2) this.mouse.aiming = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) this.mouse.aiming = false;
        });
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    switchWeapon(weapon) {
        if (WEAPONS[weapon].owned) {
            gameState.selectedWeapon = weapon;
            gameState.ammo = gameState.maxAmmo = WEAPONS[weapon].maxAmmo;
            document.getElementById('weaponName').textContent = weapon.charAt(0).toUpperCase() + weapon.slice(1);
            document.getElementById('maxAmmoDisplay').textContent = WEAPONS[weapon].maxAmmo;
        }
    }
    
    shoot() {
        if (gameState.ammo <= 0) return;
        
        const weapon = gameState.selectedWeapon;
        const damage = WEAPONS[weapon].damage;
        
        // Create bullet
        const bullet = {
            x: this.canvas.width / 2 + Math.cos(this.player.rotation) * 50,
            y: this.canvas.height / 2 + Math.sin(this.player.rotation) * 50,
            vx: Math.cos(this.player.rotation) * 12,
            vy: Math.sin(this.player.rotation) * 12,
            damage: damage,
            life: 300
        };
        
        this.bullets.push(bullet);
        gameState.ammo--;
        document.getElementById('ammoDisplay').textContent = gameState.ammo;
    }
    
    reload() {
        gameState.ammo = gameState.maxAmmo;
        document.getElementById('ammoDisplay').textContent = gameState.ammo;
    }
    
    throwGrenade() {
        if (ABILITIES.grenade.quantity <= 0) return;
        
        const grenade = {
            x: this.canvas.width / 2 + Math.cos(this.player.rotation) * 50,
            y: this.canvas.height / 2 + Math.sin(this.player.rotation) * 50,
            vx: Math.cos(this.player.rotation) * 8,
            vy: Math.sin(this.player.rotation) * 8 - 5,
            life: 3000,
            damage: ABILITIES.grenade.damage
        };
        
        this.grenades.push(grenade);
        ABILITIES.grenade.quantity--;
    }
    
    update() {
        if (!this.running) return;
        
        // Player movement
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys['w']) moveY -= this.player.speed;
        if (this.keys['s']) moveY += this.player.speed;
        if (this.keys['a']) moveX -= this.player.speed;
        if (this.keys['d']) moveX += this.player.speed;
        
        this.player.x += moveX;
        this.player.y += moveY;
        
        // Boundary checking
        this.player.x = Math.max(50, Math.min(this.canvas.width - 50, this.player.x));
        this.player.y = Math.max(50, Math.min(this.canvas.height - 50, this.player.y));
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Check collision with bots
            for (let i = 0; i < this.bots.length; i++) {
                const bot = this.bots[i];
                const dist = Math.hypot(bullet.x - bot.x, bullet.y - bot.y);
                if (dist < bot.size) {
                    bot.health -= bullet.damage;
                    if (bot.health <= 0) {
                        this.kills++;
                        gameState.kills = this.kills;
                        gameState.money += 100;
                        this.bots.splice(i, 1);
                    }
                    return false;
                }
            }
            
            return bullet.life > 0 && bullet.x > 0 && bullet.x < this.canvas.width && 
                   bullet.y > 0 && bullet.y < this.canvas.height;
        });
        
        // Update grenades
        this.grenades = this.grenades.filter(grenade => {
            grenade.x += grenade.vx;
            grenade.y += grenade.vy;
            grenade.vy += 0.3; // Gravity
            grenade.life--;
            
            if (grenade.life <= 0) {
                // Explosion
                for (let i = this.bots.length - 1; i >= 0; i--) {
                    const bot = this.bots[i];
                    const dist = Math.hypot(grenade.x - bot.x, grenade.y - bot.y);
                    if (dist < 150) {
                        bot.health -= grenade.damage;
                        if (bot.health <= 0) {
                            this.kills++;
                            gameState.kills = this.kills;
                            gameState.money += 100;
                            this.bots.splice(i, 1);
                        }
                    }
                }
                
                // Player damage
                const playerDist = Math.hypot(grenade.x - this.player.x, grenade.y - this.player.y);
                if (playerDist < 150) {
                    this.player.health -= grenade.damage / 2;
                }
                
                return false;
            }
            
            return true;
        });
        
        // Update bots
        this.bots.forEach(bot => {
            // Simple AI - move towards player
            const dist = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
            const angle = Math.atan2(this.player.y - bot.y, this.player.x - bot.x);
            
            if (dist > 100) {
                bot.x += Math.cos(angle) * bot.speed;
                bot.y += Math.sin(angle) * bot.speed;
            }
            
            // Shoot at player
            if (Date.now() - bot.lastShoot > bot.shootCooldown && dist < 600) {
                const bullet = {
                    x: bot.x,
                    y: bot.y,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    damage: bot.damage,
                    life: 300
                };
                this.bullets.push(bullet);
                bot.lastShoot = Date.now();
            }
        });
        
        // Check player damage from bot bullets
        this.bullets = this.bullets.filter(bullet => {
            const dist = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
            if (dist < 20) {
                this.player.health -= bullet.damage;
                return false;
            }
            return true;
        });
        
        // Check if level complete
        if (this.bots.length === 0) {
            this.levelComplete();
        }
        
        // Check if player dead
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        // Update HUD
        document.getElementById('healthDisplay').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('moneyDisplay').textContent = gameState.money;
        document.querySelector('.healthBarFill').style.width = (Math.max(0, this.player.health) / this.player.maxHealth) * 100 + '%';
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid background
        this.ctx.strokeStyle = '#111';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Draw bots
        this.bots.forEach(bot => {
            const dist = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
            
            // Scale based on distance (perspective)
            const scale = Math.max(0.3, Math.min(2, 500 / dist));
            
            if (bot.isBoss) {
                this.ctx.fillStyle = '#ff0000';
            } else {
                this.ctx.fillStyle = '#ff6600';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(bot.x, bot.y, bot.size * scale, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Health bar
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(bot.x - 20 * scale, bot.y - 35 * scale, 40 * scale * (bot.health / bot.maxHealth), 5 * scale);
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(bot.x - 20 * scale, bot.y - 35 * scale, 40 * scale, 5 * scale);
        });
        
        // Draw bullets
        this.ctx.fillStyle = '#00ff00';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw grenades
        this.ctx.fillStyle = '#ffff00';
        this.grenades.forEach(grenade => {
            this.ctx.beginPath();
            this.ctx.arc(grenade.x, grenade.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw weapon sight
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 30, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    gameLoop() {
        if (!this.running) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    levelComplete() {
        this.running = false;
        const reward = LEVELS[this.level].reward;
        gameState.money += reward;
        
        document.getElementById('killsCount').textContent = this.kills;
        document.getElementById('moneyEarned').textContent = reward;
        document.getElementById('totalMoney').textContent = gameState.money;
        document.getElementById('gameOverTitle').textContent = 'LEVEL COMPLETE!';
        
        gameOverModal.classList.add('active');
    }
    
    gameOver() {
        this.running = false;
        
        document.getElementById('killsCount').textContent = this.kills;
        document.getElementById('moneyEarned').textContent = '0';
        document.getElementById('totalMoney').textContent = gameState.money;
        document.getElementById('gameOverTitle').textContent = 'GAME OVER!';
        document.getElementById('nextLevelBtn').style.display = 'none';
        
        gameOverModal.classList.add('active');
    }
}

function startGame() {
    document.getElementById('storeModal').classList.remove('active');
    document.getElementById('gameOverModal').classList.remove('active');
    updateStoreDisplay();
    gameState.game = new FPSGame(gameState.level);
}

// Initialize
showScreen('mainMenu');