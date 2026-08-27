// ===== WEAPON CONFIGURATION =====
const WEAPONS = {
    pistol: { 
        name: 'Pistol', 
        damage: 10, 
        fireRate: 100, 
        maxAmmo: 30, 
        cost: 0, 
        owned: true,
        color: '#FFD700'
    },
    rifle: { 
        name: 'Rifle', 
        damage: 25, 
        fireRate: 150, 
        maxAmmo: 60, 
        cost: 300, 
        owned: false,
        color: '#FF6347'
    },
    shotgun: { 
        name: 'Shotgun', 
        damage: 50, 
        fireRate: 400, 
        maxAmmo: 20, 
        cost: 500, 
        owned: false,
        color: '#FF4500'
    },
    sniper: { 
        name: 'Sniper', 
        damage: 100, 
        fireRate: 800, 
        maxAmmo: 10, 
        cost: 1000, 
        owned: false,
        color: '#DC143C'
    }
};

const ABILITIES = {
    grenade: { damage: 75, cost: 150, quantity: 0 },
    health: { amount: 50, cost: 200, quantity: 0 }
};

const LEVELS = {
    1: { botCount: 1, botHealth: 100, botDamage: 5, botSpeed: 2.5, isBoss: false, reward: 500 },
    2: { botCount: 2, botHealth: 120, botDamage: 7, botSpeed: 3, isBoss: false, reward: 1000 },
    3: { botCount: 2, botHealth: 140, botDamage: 9, botSpeed: 3.5, isBoss: false, reward: 1500 },
    4: { botCount: 3, botHealth: 160, botDamage: 11, botSpeed: 4, isBoss: false, reward: 2000 },
    5: { botCount: 1, botHealth: 300, botDamage: 20, botSpeed: 4.5, isBoss: true, reward: 5000 }
};

// ===== GAME STATE =====
let gameState = {
    money: 0,
    level: 1,
    kills: 0,
    selectedWeapon: 'pistol',
    ammo: 30,
    maxAmmo: 30,
    health: 100,
    game: null
};

// ===== UI MANAGEMENT =====
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
    gameState.health = 100;
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
        setTimeout(() => startGame(), 100);
    });
});

document.getElementById('levelBackBtn').addEventListener('click', () => {
    showScreen('mainMenu');
});

// Store
const storeModal = document.getElementById('storeModal');
const gameOverModal = document.getElementById('gameOverModal');

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && gameState.game && gameState.game.running) {
        e.preventDefault();
        storeModal.classList.toggle('active');
    }
});

document.getElementById('closeStoreBtn').addEventListener('click', () => {
    storeModal.classList.remove('active');
});

document.querySelectorAll('.buyBtn').forEach(btn => {
    btn.addEventListener('click', function() {
        const item = this.closest('.storeItem');
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
        } else if (type === 'grenade') {
            const cost = ABILITIES.grenade.cost;
            if (gameState.money >= cost) {
                gameState.money -= cost;
                ABILITIES.grenade.quantity++;
                updateStoreDisplay();
            }
        } else if (type === 'ability') {
            const cost = ABILITIES.health.cost;
            if (gameState.money >= cost) {
                gameState.money -= cost;
                ABILITIES.health.quantity++;
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
        } else if (type === 'grenade') {
            btn.textContent = `BUY (${ABILITIES.grenade.quantity})`;
        } else if (type === 'ability') {
            btn.textContent = `BUY (${ABILITIES.health.quantity})`;
        }
    });
}

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    gameState.level++;
    if (gameState.level > 5) gameState.level = 5;
    showScreen('gameScreen');
    setTimeout(() => startGame(), 100);
});

document.getElementById('mainMenuBtn').addEventListener('click', () => {
    showScreen('mainMenu');
});

// ===== GAME ENGINE =====
class RivalsGame {
    constructor(level) {
        this.level = level;
        this.config = LEVELS[level];
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Player - First Person
        this.player = {
            x: 400,
            y: 300,
            vx: 0,
            vy: 0,
            health: 100,
            maxHealth: 100,
            speed: 5,
            acceleration: 0.8,
            friction: 0.85,
            viewDistance: 800
        };
        
        this.camera = {
            rotation: 0,
            pitch: 0,
            fov: 60
        };
        
        this.keys = {};
        this.mouse = { x: 0, y: 0, aiming: false };
        this.bots = [];
        this.bullets = [];
        this.grenades = [];
        this.particles = [];
        
        this.running = true;
        this.kills = 0;
        this.lastShotTime = 0;
        
        this.mapWidth = 1200;
        this.mapHeight = 900;
        
        this.spawnBots();
        this.setupControls();
        this.gameLoop();
    }
    
    spawnBots() {
        for (let i = 0; i < this.config.botCount; i++) {
            let x, y, validSpawn = false;
            
            while (!validSpawn) {
                x = Math.random() * this.mapWidth;
                y = Math.random() * this.mapHeight;
                const dist = Math.hypot(x - this.player.x, y - this.player.y);
                if (dist > 300) validSpawn = true;
            }
            
            const bot = {
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                health: this.config.botHealth,
                maxHealth: this.config.botHealth,
                damage: this.config.botDamage,
                speed: this.config.botSpeed,
                radius: 25,
                isBoss: this.config.isBoss,
                shootCooldown: this.config.isBoss ? 800 : 1500,
                lastShoot: 0,
                moveTimer: 0,
                moveDirection: Math.random() * Math.PI * 2,
                stoppingDistance: this.config.isBoss ? 150 : 200
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
            
            // Smooth camera rotation
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            
            this.camera.rotation = Math.atan2(dx, 300);
            this.camera.pitch = Math.atan2(dy, 300) * 0.3;
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
            document.getElementById('hudWeapon').textContent = WEAPONS[weapon].name;
            document.getElementById('hudMaxAmmo').textContent = WEAPONS[weapon].maxAmmo;
            updateHUD();
        }
    }
    
    shoot() {
        if (gameState.ammo <= 0) return;
        
        const now = Date.now();
        const weapon = gameState.selectedWeapon;
        const fireRate = WEAPONS[weapon].fireRate;
        
        if (now - this.lastShotTime < fireRate) return;
        this.lastShotTime = now;
        
        const damage = WEAPONS[weapon].damage;
        
        // Raycast from camera
        const rotation = this.camera.rotation;
        
        for (let i = 0; i < this.bots.length; i++) {
            const bot = this.bots[i];
            const dx = bot.x - this.player.x;
            const dy = bot.y - this.player.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > this.player.viewDistance) continue;
            
            const angle = Math.atan2(dy, dx);
            const angleDiff = Math.abs(angle - rotation);
            
            // Hitbox based on distance (closer = larger hitbox)
            const hitRadius = Math.max(15, 100 / (dist / 100));
            
            if (angleDiff < Math.atan2(hitRadius, dist)) {
                bot.health -= damage;
                
                // Create hit particle
                this.particles.push({
                    x: bot.x,
                    y: bot.y,
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    life: 200,
                    color: '#ff4444'
                });
                
                if (bot.health <= 0) {
                    this.kills++;
                    gameState.kills = this.kills;
                    gameState.money += 100;
                    this.bots.splice(i, 1);
                    
                    // Explosion effect
                    for (let j = 0; j < 10; j++) {
                        const angle = (Math.PI * 2 * j) / 10;
                        this.particles.push({
                            x: bot.x,
                            y: bot.y,
                            vx: Math.cos(angle) * 4,
                            vy: Math.sin(angle) * 4,
                            life: 300,
                            color: '#ffaa00'
                        });
                    }
                }
                break;
            }
        }
        
        gameState.ammo--;
        updateHUD();
    }
    
    reload() {
        gameState.ammo = gameState.maxAmmo;
        updateHUD();
    }
    
    throwGrenade() {
        if (ABILITIES.grenade.quantity <= 0) return;
        
        const rotation = this.camera.rotation;
        const speed = 8;
        
        const grenade = {
            x: this.player.x + Math.cos(rotation) * 30,
            y: this.player.y + Math.sin(rotation) * 30,
            vx: Math.cos(rotation) * speed,
            vy: Math.sin(rotation) * speed,
            life: 3000,
            damage: ABILITIES.grenade.damage,
            radius: 12
        };
        
        this.grenades.push(grenade);
        ABILITIES.grenade.quantity--;
    }
    
    update() {
        if (!this.running) return;
        
        // Player movement with momentum
        let accelX = 0, accelY = 0;
        
        if (this.keys['w']) accelY -= this.player.acceleration;
        if (this.keys['s']) accelY += this.player.acceleration;
        if (this.keys['a']) accelX -= this.player.acceleration;
        if (this.keys['d']) accelX += this.player.acceleration;
        
        this.player.vx += accelX;
        this.player.vy += accelY;
        
        // Apply friction
        this.player.vx *= this.player.friction;
        this.player.vy *= this.player.friction;
        
        // Limit speed
        const speed = Math.hypot(this.player.vx, this.player.vy);
        if (speed > this.player.speed) {
            this.player.vx = (this.player.vx / speed) * this.player.speed;
            this.player.vy = (this.player.vy / speed) * this.player.speed;
        }
        
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Map boundaries
        this.player.x = Math.max(40, Math.min(this.mapWidth - 40, this.player.x));
        this.player.y = Math.max(40, Math.min(this.mapHeight - 40, this.player.y));
        
        // Update grenades
        this.grenades = this.grenades.filter(grenade => {
            grenade.x += grenade.vx;
            grenade.y += grenade.vy;
            grenade.vy += 0.2;
            grenade.life--;
            
            if (grenade.life <= 0) {
                // Explosion
                const explosionRadius = 150;
                
                for (let i = this.bots.length - 1; i >= 0; i--) {
                    const bot = this.bots[i];
                    const dist = Math.hypot(grenade.x - bot.x, grenade.y - bot.y);
                    if (dist < explosionRadius) {
                        bot.health -= grenade.damage * (1 - dist / explosionRadius);
                        if (bot.health <= 0) {
                            this.kills++;
                            gameState.kills = this.kills;
                            gameState.money += 100;
                            this.bots.splice(i, 1);
                        }
                    }
                }
                
                const playerDist = Math.hypot(grenade.x - this.player.x, grenade.y - this.player.y);
                if (playerDist < explosionRadius) {
                    this.player.health -= 30 * (1 - playerDist / explosionRadius);
                }
                
                // Particles
                for (let j = 0; j < 15; j++) {
                    const angle = (Math.PI * 2 * j) / 15;
                    this.particles.push({
                        x: grenade.x,
                        y: grenade.y,
                        vx: Math.cos(angle) * 5,
                        vy: Math.sin(angle) * 5,
                        life: 400,
                        color: '#ff6600'
                    });
                }
                
                return false;
            }
            
            return true;
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
        
        // Bot AI
        this.bots.forEach(bot => {
            bot.moveTimer--;
            
            if (bot.moveTimer <= 0) {
                bot.moveDirection = Math.random() * Math.PI * 2;
                bot.moveTimer = 60 + Math.random() * 120;
            }
            
            const dist = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
            
            if (dist < 400) {
                bot.moveDirection = Math.atan2(this.player.y - bot.y, this.player.x - bot.x);
            }
            
            if (dist > bot.stoppingDistance) {
                bot.vx += Math.cos(bot.moveDirection) * 0.3;
                bot.vy += Math.sin(bot.moveDirection) * 0.3;
            }
            
            const botSpeed = Math.hypot(bot.vx, bot.vy);
            if (botSpeed > bot.speed) {
                bot.vx = (bot.vx / botSpeed) * bot.speed;
                bot.vy = (bot.vy / botSpeed) * bot.speed;
            }
            
            bot.vx *= 0.9;
            bot.vy *= 0.9;
            
            bot.x += bot.vx;
            bot.y += bot.vy;
            
            // Boundaries
            bot.x = Math.max(bot.radius, Math.min(this.mapWidth - bot.radius, bot.x));
            bot.y = Math.max(bot.radius, Math.min(this.mapHeight - bot.radius, bot.y));
            
            // Shoot at player
            if (Date.now() - bot.lastShoot > bot.shootCooldown && dist < 500) {
                const angle = Math.atan2(this.player.y - bot.y, this.player.x - bot.x);
                const spread = (Math.random() - 0.5) * 0.3;
                
                this.bullets.push({
                    x: bot.x,
                    y: bot.y,
                    vx: Math.cos(angle + spread) * 6,
                    vy: Math.sin(angle + spread) * 6,
                    damage: bot.damage,
                    radius: 4
                });
                
                bot.lastShoot = Date.now();
            }
        });
        
        // Check player hit by bullets
        this.bullets = this.bullets.filter(bullet => {
            const dist = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
            if (dist < 25) {
                this.player.health -= bullet.damage;
                return false;
            }
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            return bullet.x > 0 && bullet.x < this.mapWidth && 
                   bullet.y > 0 && bullet.y < this.mapHeight;
        });
        
        // Update HUD
        gameState.health = Math.max(0, this.player.health);
        updateHUD();
        
        // Check level complete
        if (this.bots.length === 0) {
            this.levelComplete();
        }
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    draw() {
        // Draw 3D-like map view
        const mapScale = Math.min(this.canvas.width, this.canvas.height) / 300;
        
        // Background
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid
        this.ctx.strokeStyle = '#1a1a2a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.mapWidth; i += 100) {
            const screenX = ((i - this.player.x) * mapScale * Math.cos(this.camera.rotation) - 
                           (0 - this.player.y) * mapScale * Math.sin(this.camera.rotation)) + this.canvas.width / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i < this.mapHeight; i += 100) {
            const screenY = ((0 - this.player.x) * mapScale * Math.sin(this.camera.rotation) + 
                           (i - this.player.y) * mapScale * Math.cos(this.camera.rotation)) + this.canvas.height / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
        
        // Draw bots (with perspective)
        this.bots.forEach(bot => {
            const relX = bot.x - this.player.x;
            const relY = bot.y - this.player.y;
            
            const rotX = relX * Math.cos(-this.camera.rotation) - relY * Math.sin(-this.camera.rotation);
            const rotY = relX * Math.sin(-this.camera.rotation) + relY * Math.cos(-this.camera.rotation);
            
            const dist = Math.hypot(rotX, rotY);
            if (dist > this.player.viewDistance) return;
            
            const screenX = this.canvas.width / 2 + (rotX * mapScale);
            const screenY = this.canvas.height / 2 + (rotY * mapScale);
            
            const scale = Math.max(0.5, Math.min(2, 500 / dist));
            const size = bot.radius * scale;
            
            // Draw bot
            if (bot.isBoss) {
                this.ctx.fillStyle = '#ff0000';
            } else {
                this.ctx.fillStyle = '#ff6600';
            }
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Health bar
            this.ctx.fillStyle = '#00ff00';
            const barWidth = size * 2;
            const barHeight = 4 * scale;
            const healthPercent = bot.health / bot.maxHealth;
            this.ctx.fillRect(screenX - barWidth / 2, screenY - size - 15 * scale, barWidth * healthPercent, barHeight);
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenX - barWidth / 2, screenY - size - 15 * scale, barWidth, barHeight);
        });
        
        // Draw bullets
        this.ctx.fillStyle = '#00ff00';
        this.bullets.forEach(bullet => {
            const relX = bullet.x - this.player.x;
            const relY = bullet.y - this.player.y;
            
            const rotX = relX * Math.cos(-this.camera.rotation) - relY * Math.sin(-this.camera.rotation);
            const rotY = relX * Math.sin(-this.camera.rotation) + relY * Math.cos(-this.camera.rotation);
            
            const screenX = this.canvas.width / 2 + (rotX * mapScale);
            const screenY = this.canvas.height / 2 + (rotY * mapScale);
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw grenades
        this.ctx.fillStyle = '#ffff00';
        this.grenades.forEach(grenade => {
            const relX = grenade.x - this.player.x;
            const relY = grenade.y - this.player.y;
            
            const rotX = relX * Math.cos(-this.camera.rotation) - relY * Math.sin(-this.camera.rotation);
            const rotY = relX * Math.sin(-this.camera.rotation) + relY * Math.cos(-this.camera.rotation);
            
            const screenX = this.canvas.width / 2 + (rotX * mapScale);
            const screenY = this.canvas.height / 2 + (rotY * mapScale);
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw particles
        this.particles.forEach(p => {
            const relX = p.x - this.player.x;
            const relY = p.y - this.player.y;
            
            const rotX = relX * Math.cos(-this.camera.rotation) - relY * Math.sin(-this.camera.rotation);
            const rotY = relX * Math.sin(-this.camera.rotation) + relY * Math.cos(-this.camera.rotation);
            
            const screenX = this.canvas.width / 2 + (rotX * mapScale);
            const screenY = this.canvas.height / 2 + (rotY * mapScale);
            
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 300;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        // Draw weapon model on separate canvas
        this.drawWeaponModel();
    }
    
    drawWeaponModel() {
        const weaponCanvas = document.getElementById('weaponCanvas');
        if (!weaponCanvas) return;
        
        const wCtx = weaponCanvas.getContext('2d');
        wCtx.fillStyle = '#000';
        wCtx.fillRect(0, 0, weaponCanvas.width, weaponCanvas.height);
        
        const weapon = gameState.selectedWeapon;
        const color = WEAPONS[weapon].color;
        
        // Simple weapon model
        wCtx.fillStyle = color;
        wCtx.globalAlpha = 0.9;
        
        // Weapon body
        wCtx.fillRect(150, 100, 100, 30);
        
        // Trigger guard
        wCtx.fillRect(200, 130, 20, 30);
        
        // Scope/sight
        wCtx.strokeStyle = color;
        wCtx.lineWidth = 3;
        wCtx.beginPath();
        wCtx.arc(260, 80, 15, 0, Math.PI * 2);
        wCtx.stroke();
        
        // Barrel
        wCtx.fillStyle = color;
        wCtx.fillRect(240, 108, 40, 14);
        
        wCtx.globalAlpha = 1;
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
        
        document.getElementById('statKills').textContent = this.kills;
        document.getElementById('statEarned').textContent = reward;
        document.getElementById('statTotal').textContent = gameState.money;
        document.getElementById('gameOverTitle').textContent = 'LEVEL COMPLETE!';
        document.getElementById('nextLevelBtn').style.display = 'block';
        
        gameOverModal.classList.add('active');
    }
    
    gameOver() {
        this.running = false;
        
        document.getElementById('statKills').textContent = this.kills;
        document.getElementById('statEarned').textContent = '0';
        document.getElementById('statTotal').textContent = gameState.money;
        document.getElementById('gameOverTitle').textContent = 'YOU DIED!';
        document.getElementById('nextLevelBtn').style.display = 'none';
        
        gameOverModal.classList.add('active');
    }
}

function updateHUD() {
    document.getElementById('hudHealth').textContent = Math.max(0, Math.floor(gameState.health));
    document.getElementById('hudMoney').textContent = gameState.money;
    document.getElementById('hudCurrentAmmo').textContent = gameState.ammo;
    
    const healthPercent = Math.max(0, gameState.health) / 100;
    document.getElementById('hudHealthBar').style.width = (healthPercent * 100) + '%';
}

function startGame() {
    document.getElementById('storeModal').classList.remove('active');
    document.getElementById('gameOverModal').classList.remove('active');
    updateStoreDisplay();
    updateHUD();
    gameState.game = new RivalsGame(gameState.level);
}

// Initialize
showScreen('mainMenu');