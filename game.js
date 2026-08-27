// Game Constants
const MAPS = {
    arena: { width: 800, height: 600, obstacles: 8 },
    warehouse: { width: 1200, height: 800, obstacles: 15 },
    street: { width: 1000, height: 700, obstacles: 12 },
    desert: { width: 1500, height: 900, obstacles: 5 }
};

const WEAPONS = {
    pistol: { damage: 10, fireRate: 150, ammo: 30, cost: 100 },
    rifle: { damage: 20, fireRate: 250, ammo: 60, cost: 250 },
    shotgun: { damage: 40, fireRate: 400, ammo: 20, cost: 500 }
};

const ABILITIES = {
    grenade: { damage: 50, cost: 150 },
    smokeGrenade: { duration: 3000, cost: 100 },
    heal: { amount: 50, cost: 200 }
};

const DIFFICULTY = {
    1: { botHealth: 100, botDamage: 5, botSpeed: 3, count: 1 },
    2: { botHealth: 120, botDamage: 7, botSpeed: 3.5, count: 2 },
    3: { botHealth: 140, botDamage: 9, botSpeed: 4, count: 2 },
    4: { botHealth: 160, botDamage: 11, botSpeed: 4.5, count: 3 },
    5: { botHealth: 200, botDamage: 15, botSpeed: 5, count: 1, isBoss: true }
};

// Game State
let gameState = {
    screen: 'start',
    currentLevel: 1,
    currentMap: 'arena',
    money: 1000,
    inventory: {
        weapons: ['pistol'],
        abilities: [],
        selectedWeapon: 'pistol',
        selectedAbility: null
    },
    game: null
};

// Screen Management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + 'Screen').classList.add('active');
    gameState.screen = screenName;
}

// Event Listeners - Start Screen
document.getElementById('startBtn').addEventListener('click', () => {
    gameState.money = 1000;
    gameState.currentLevel = 1;
    gameState.inventory = { weapons: ['pistol'], abilities: [], selectedWeapon: 'pistol', selectedAbility: null };
    showScreen('levelSelect');
});

document.getElementById('instructionsBtn').addEventListener('click', () => {
    showScreen('instructions');
});

document.getElementById('backBtn').addEventListener('click', () => {
    showScreen('start');
});

// Level Select Screen
document.querySelectorAll('.mapCard').forEach(card => {
    card.addEventListener('click', function() {
        gameState.currentMap = this.dataset.map;
        showScreen('shop');
        updateMoneyDisplay();
    });
});

document.getElementById('levelSelectBackBtn').addEventListener('click', () => {
    showScreen('start');
});

// Shop Screen
document.querySelectorAll('.buyBtn').forEach(btn => {
    btn.addEventListener('click', function() {
        const item = this.parentElement;
        const type = item.dataset.type;
        const id = item.dataset.id;
        buyItem(type, id, btn);
    });
});

function buyItem(type, id, btn) {
    let cost = 0;
    
    if (type === 'weapon') {
        cost = WEAPONS[id].cost;
    } else if (type === 'ability') {
        cost = ABILITIES[id].cost;
    }
    
    if (gameState.money >= cost) {
        gameState.money -= cost;
        
        if (type === 'weapon' && !gameState.inventory.weapons.includes(id)) {
            gameState.inventory.weapons.push(id);
            btn.textContent = 'OWNED';
            btn.disabled = true;
        } else if (type === 'ability' && !gameState.inventory.abilities.includes(id)) {
            gameState.inventory.abilities.push(id);
            btn.textContent = 'OWNED';
            btn.disabled = true;
        }
        
        updateMoneyDisplay();
    }
}

function updateMoneyDisplay() {
    document.getElementById('moneyDisplay').textContent = gameState.money;
}

// Initialize shop display
function initializeShop() {
    gameState.inventory.weapons.forEach(weapon => {
        const btn = document.querySelector(`[data-type="weapon"][data-id="${weapon}"] .buyBtn`);
        if (btn) {
            btn.textContent = 'OWNED';
            btn.disabled = true;
        }
    });
    
    gameState.inventory.abilities.forEach(ability => {
        const btn = document.querySelector(`[data-type="ability"][data-id="${ability}"] .buyBtn`);
        if (btn) {
            btn.textContent = 'OWNED';
            btn.disabled = true;
        }
    });
}

document.getElementById('shopStartBtn').addEventListener('click', () => {
    startGameLevel();
});

document.getElementById('shopBackBtn').addEventListener('click', () => {
    showScreen('levelSelect');
});

// Game Over Screen
document.getElementById('gameOverContinueBtn').addEventListener('click', () => {
    if (gameState.currentLevel % 5 === 0) {
        gameState.currentLevel++;
        showScreen('levelSelect');
    } else {
        gameState.currentLevel++;
        if (gameState.currentLevel > 5) gameState.currentLevel = 5;
        showScreen('shop');
    }
});

document.getElementById('gameOverMenuBtn').addEventListener('click', () => {
    gameState.currentLevel = 1;
    gameState.money = 1000;
    gameState.inventory = { weapons: ['pistol'], abilities: [], selectedWeapon: 'pistol', selectedAbility: null };
    showScreen('start');
});

// Game Engine
class Game {
    constructor(canvas, level, map) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.level = level;
        this.mapConfig = MAPS[map];
        this.diffConfig = DIFFICULTY[level];
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.bots = [];
        this.projectiles = [];
        this.particles = [];
        this.obstacles = [];
        
        this.createMap();
        this.createBots();
        
        this.running = true;
        this.kills = 0;
        
        this.setupControls();
        this.gameLoop();
    }
    
    createMap() {
        // Create random obstacles based on map difficulty
        const obstacleCount = this.mapConfig.obstacles;
        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = {
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                width: 50 + Math.random() * 50,
                height: 50 + Math.random() * 50
            };
            this.obstacles.push(obstacle);
        }
    }
    
    createBots() {
        const botCount = this.diffConfig.count;
        for (let i = 0; i < botCount; i++) {
            let x, y, validPosition;
            
            do {
                validPosition = true;
                x = Math.random() * (this.canvas.width - 200) + 100;
                y = Math.random() * (this.canvas.height - 200) + 100;
                
                // Ensure bot is far from player
                const dist = Math.hypot(x - this.player.x, y - this.player.y);
                if (dist < 300) validPosition = false;
                
                // Ensure bot is not in obstacle
                this.obstacles.forEach(obs => {
                    if (x > obs.x && x < obs.x + obs.width && y > obs.y && y < obs.y + obs.height) {
                        validPosition = false;
                    }
                });
            } while (!validPosition);
            
            const bot = new Bot(
                x, y,
                this.diffConfig.botHealth,
                this.diffConfig.botDamage,
                this.diffConfig.botSpeed,
                this.diffConfig.isBoss || false
            );
            this.bots.push(bot);
        }
    }
    
    setupControls() {
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'g') this.throwGrenade();
            if (e.key === ' ') this.throwSmokeGrenade();
            if (e.key === 'e') this.useAbility();
            if (e.key === '1') gameState.inventory.selectedWeapon = 'pistol';
            if (e.key === '2') gameState.inventory.selectedWeapon = 'rifle';
            if (e.key === '3') gameState.inventory.selectedWeapon = 'shotgun';
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            this.player.mouseX = e.clientX;
            this.player.mouseY = e.clientY;
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.shoot();
            if (e.button === 2) this.player.aiming = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) this.player.aiming = false;
        });
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        this.keys = keys;
    }
    
    shoot() {
        if (!this.player.canShoot()) return;
        
        const weapon = gameState.inventory.selectedWeapon;
        const damage = WEAPONS[weapon].damage;
        
        const angle = Math.atan2(
            this.player.mouseY - this.player.y,
            this.player.mouseX - this.player.x
        );
        
        // Create projectile
        const projectile = {
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            damage: damage,
            owner: 'player'
        };
        
        this.projectiles.push(projectile);
        this.player.shoot(weapon);
    }
    
    throwGrenade() {
        if (!gameState.inventory.abilities.includes('grenade')) return;
        
        const angle = Math.atan2(
            this.player.mouseY - this.player.y,
            this.player.mouseX - this.player.x
        );
        
        // Grenade with arc
        const projectile = {
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            damage: ABILITIES.grenade.damage,
            owner: 'player',
            isGrenade: true,
            life: 2000,
            maxLife: 2000
        };
        
        this.projectiles.push(projectile);
    }
    
    throwSmokeGrenade() {
        if (!gameState.inventory.abilities.includes('smokeGrenade')) return;
        
        // Create smoke effect around player
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const particle = {
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: ABILITIES.smokeGrenade.duration,
                maxLife: ABILITIES.smokeGrenade.duration,
                radius: 10,
                type: 'smoke'
            };
            this.particles.push(particle);
        }
    }
    
    useAbility() {
        if (gameState.inventory.abilities.includes('heal')) {
            this.player.heal(ABILITIES.heal.amount);
            gameState.inventory.abilities.splice(gameState.inventory.abilities.indexOf('heal'), 1);
        }
    }
    
    update() {
        if (!this.running) return;
        
        // Update player
        this.player.update(this.keys, this.canvas, this.obstacles);
        
        // Update bots
        this.bots = this.bots.filter(bot => bot.health > 0);
        this.bots.forEach(bot => {
            bot.update(this.player, this.obstacles, this.canvas);
            bot.shoot(this.projectiles, this.player);
        });
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            if (proj.isGrenade) {
                proj.life -= 16;
                if (proj.life <= 0) {
                    // Explosion effect
                    this.createExplosion(proj.x, proj.y);
                    return false;
                }
            }
            
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            // Check collision with player
            if (proj.owner === 'bot') {
                const dist = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);
                if (dist < 15) {
                    this.player.takeDamage(proj.damage);
                    return false;
                }
            }
            
            // Check collision with bots
            if (proj.owner === 'player') {
                for (let bot of this.bots) {
                    const dist = Math.hypot(proj.x - bot.x, proj.y - bot.y);
                    if (dist < 20) {
                        bot.takeDamage(proj.damage);
                        if (bot.health <= 0) {
                            this.kills++;
                        }
                        return false;
                    }
                }
            }
            
            // Check collision with obstacles
            for (let obs of this.obstacles) {
                if (proj.x > obs.x && proj.x < obs.x + obs.width &&
                    proj.y > obs.y && proj.y < obs.y + obs.height) {
                    return false;
                }
            }
            
            // Check out of bounds
            if (proj.x < 0 || proj.x > this.canvas.width || proj.y < 0 || proj.y > this.canvas.height) {
                return false;
            }
            
            return true;
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.life -= 16;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            return p.life > 0;
        });
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameOver(false);
        }
        
        if (this.bots.length === 0) {
            const reward = 500 * this.level;
            gameState.money += reward;
            this.gameOver(true, reward);
        }
    }
    
    createExplosion(x, y) {
        // Damage all entities in explosion radius
        const radius = 100;
        
        this.bots.forEach(bot => {
            const dist = Math.hypot(x - bot.x, y - bot.y);
            if (dist < radius) {
                bot.takeDamage(ABILITIES.grenade.damage);
            }
        });
        
        const playerDist = Math.hypot(x - this.player.x, y - this.player.y);
        if (playerDist < radius) {
            this.player.takeDamage(ABILITIES.grenade.damage / 2);
        }
        
        // Create particles
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 500,
                maxLife: 500,
                radius: 5,
                type: 'explosion'
            };
            this.particles.push(particle);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw obstacles
        this.ctx.fillStyle = '#444';
        this.obstacles.forEach(obs => {
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
        
        // Draw bots
        this.bots.forEach(bot => bot.draw(this.ctx));
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw projectiles
        this.projectiles.forEach(proj => {
            if (proj.isGrenade) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw particles
        this.particles.forEach(p => {
            if (p.type === 'smoke') {
                this.ctx.fillStyle = `rgba(100, 100, 100, ${p.life / p.maxLife * 0.5})`;
            } else if (p.type === 'explosion') {
                this.ctx.fillStyle = `rgba(255, 165, 0, ${p.life / p.maxLife})`;
            }
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    gameLoop() {
        if (!this.running) return;
        
        this.update();
        this.draw();
        
        // Update HUD
        document.getElementById('playerHpDisplay').textContent = Math.max(0, this.player.health);
        document.getElementById('healthBarFill').style.width = (Math.max(0, this.player.health) / 100) * 100 + '%';
        document.getElementById('botsDisplay').textContent = this.bots.length;
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver(won, reward = 0) {
        this.running = false;
        
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        
        if (won) {
            title.textContent = 'LEVEL COMPLETE';
            message.textContent = `You defeated all bots on level ${this.level}!`;
            document.getElementById('rewardDisplay').textContent = reward;
        } else {
            title.textContent = 'GAME OVER';
            message.textContent = `You were defeated on level ${this.level}.`;
            document.getElementById('rewardDisplay').textContent = '0';
        }
        
        document.getElementById('killsDisplay').textContent = this.kills;
        
        setTimeout(() => showScreen('gameOver'), 500);
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 4;
        this.radius = 15;
        this.mouseX = x;
        this.mouseY = y;
        this.aiming = false;
        this.lastShootTime = 0;
    }
    
    update(keys, canvas, obstacles) {
        const moveSpeed = this.speed;
        let newX = this.x;
        let newY = this.y;
        
        if (keys['w']) newY -= moveSpeed;
        if (keys['a']) newX -= moveSpeed;
        if (keys['s']) newY += moveSpeed;
        if (keys['d']) newX += moveSpeed;
        
        // Collision detection with obstacles
        let canMove = true;
        for (let obs of obstacles) {
            if (newX - this.radius > obs.x && newX + this.radius < obs.x + obs.width &&
                newY - this.radius > obs.y && newY + this.radius < obs.y + obs.height) {
                canMove = false;
                break;
            }
        }
        
        // Boundary check
        if (newX - this.radius < 0 || newX + this.radius > canvas.width) canMove = false;
        if (newY - this.radius < 0 || newY + this.radius > canvas.height) canMove = false;
        
        if (canMove) {
            this.x = newX;
            this.y = newY;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw aiming indicator
        if (this.aiming) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    canShoot() {
        const weapon = gameState.inventory.selectedWeapon;
        const fireRate = WEAPONS[weapon].fireRate;
        const now = Date.now();
        
        if (now - this.lastShootTime >= fireRate) {
            this.lastShootTime = now;
            return true;
        }
        return false;
    }
    
    shoot(weapon) {
        // Visual feedback can be added here
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
}

class Bot {
    constructor(x, y, health, damage, speed, isBoss = false) {
        this.x = x;
        this.y = y;
        this.health = health;
        this.maxHealth = health;
        this.damage = damage;
        this.speed = speed;
        this.radius = 15;
        this.isBoss = isBoss;
        this.lastShootTime = 0;
        this.shootCooldown = 1000;
        this.direction = Math.random() * Math.PI * 2;
        this.moveChangeTimer = 0;
    }
    
    update(player, obstacles, canvas) {
        this.moveChangeTimer--;
        
        // Change direction periodically
        if (this.moveChangeTimer <= 0) {
            if (Math.random() < 0.5) {
                // Chase player
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist < 400) {
                    this.direction = Math.atan2(player.y - this.y, player.x - this.x);
                }
            } else {
                // Random movement
                this.direction = Math.random() * Math.PI * 2;
            }
            this.moveChangeTimer = 30 + Math.random() * 60;
        }
        
        // Move bot
        let newX = this.x + Math.cos(this.direction) * this.speed;
        let newY = this.y + Math.sin(this.direction) * this.speed;
        
        // Collision detection
        let canMove = true;
        for (let obs of obstacles) {
            if (newX - this.radius > obs.x && newX + this.radius < obs.x + obs.width &&
                newY - this.radius > obs.y && newY + this.radius < obs.y + obs.height) {
                canMove = false;
                break;
            }
        }
        
        if (newX - this.radius < 0 || newX + this.radius > canvas.width) canMove = false;
        if (newY - this.radius < 0 || newY + this.radius > canvas.height) canMove = false;
        
        if (canMove) {
            this.x = newX;
            this.y = newY;
        } else {
            this.moveChangeTimer = 0;
        }
    }
    
    shoot(projectiles, player) {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;
        
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 500) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const spread = (Math.random() - 0.5) * 0.3;
            
            const projectile = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle + spread) * 6,
                vy: Math.sin(angle + spread) * 6,
                damage: this.damage,
                owner: 'bot'
            };
            
            projectiles.push(projectile);
            this.lastShootTime = now;
        }
    }
    
    draw(ctx) {
        if (this.isBoss) {
            ctx.fillStyle = '#ff0000';
        } else {
            ctx.fillStyle = '#ff6600';
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar above bot
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 15, this.y - 30, 30 * healthPercent, 5);
        ctx.strokeStyle = '#00ff00';
        ctx.strokeRect(this.x - 15, this.y - 30, 30, 5);
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
}

function startGameLevel() {
    initializeShop();
    showScreen('game');
    
    const canvas = document.getElementById('gameCanvas');
    gameState.game = new Game(canvas, gameState.currentLevel, gameState.currentMap);
}

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas && gameState.game) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// Initialize game
showScreen('start');