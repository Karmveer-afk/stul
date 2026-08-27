# STUL - First Person Fighting Game

A beginner-friendly first-person fighting game built with HTML5 Canvas and JavaScript.

## Features

### Game Modes
- **5 Progressive Levels**: Each level increases in difficulty
- **Boss Fights**: Every 5th level features a boss with increased health and damage
- **Multiple Maps**: Choose from Arena, Warehouse, Street, or Desert

### Weapons
- **Pistol**: Fast fire rate, medium damage (10 dmg, $100)
- **Rifle**: Balanced weapon (20 dmg, $250)
- **Shotgun**: High damage, slow fire rate (40 dmg, $500)

### Abilities
- **Grenade**: Explosive damage in radius (50 dmg, $150)
- **Smoke Grenade**: Escape tool for tactical advantage ($100)
- **Medkit**: Restore 50 HP ($200)

### Controls
- **W/A/S/D**: Move
- **LEFT CLICK**: Shoot
- **RIGHT CLICK**: Aim/Zoom
- **1/2/3**: Switch weapons
- **G**: Throw grenade
- **SPACE**: Throw smoke grenade
- **E**: Use ability (heal)

## Gameplay

### Level Progression
| Level | Difficulty | Bot Health | Bot Damage | Bot Count | Type |
|-------|-----------|-----------|-----------|-----------|------|
| 1 | Easy | 100 | 5 | 1 | Normal |
| 2 | Easy | 120 | 7 | 2 | Normal |
| 3 | Medium | 140 | 9 | 2 | Normal |
| 4 | Medium | 160 | 11 | 3 | Normal |
| 5 | Hard | 200 | 15 | 1 | **BOSS** |

### Gameplay Loop
1. Start with $1000 and a pistol
2. Visit the shop to buy weapons and abilities
3. Select a map and start the level
4. Defeat all bots to progress
5. Earn money for each level completed
6. Use money to upgrade your arsenal

## Getting Started

1. Open `index.html` in your web browser
2. Click "START GAME"
3. Select a map from the available options
4. Visit the shop to buy weapons and abilities
5. Click "START GAME" to begin

## Game Mechanics

### Combat
- Aim and shoot at bots
- Bots have AI that makes them move and shoot
- Use grenades for area damage
- Smoke grenades provide cover for escaping

### Health System
- Player starts with 100 HP
- Bots have variable health based on level
- Take damage from bot projectiles
- Use medkits to heal

### Economy
- Earn money by completing levels
- Purchase weapons and abilities in the shop
- Better weapons deal more damage
- Each tool has different costs and benefits

## Tips for Players

1. **Start with the pistol** - It's reliable and cheap
2. **Use cover** - Obstacles block projectiles
3. **Buy grenades early** - They're great for dealing with multiple bots
4. **Manage your health** - Buy medkits before difficult levels
5. **Practice aiming** - Hold right-click to zoom in
6. **Learn bot patterns** - They move and shoot in predictable ways

## File Structure

- `index.html` - Game UI and HTML structure
- `style.css` - Styling for all screens
- `game.js` - Core game logic and gameplay
- `README.md` - This file

## Browser Compatibility

- Chrome/Chromium
- Firefox
- Safari
- Edge

Requires HTML5 Canvas support.

## Future Improvements

- [ ] Additional weapons and abilities
- [ ] More maps and enemies
- [ ] Sound effects and music
- [ ] Leaderboard system
- [ ] Multiplayer support
- [ ] Advanced AI for boss fights
- [ ] Power-ups and special effects
- [ ] More game modes

## License

This project is open source and available for everyone to use and modify.

Enjoy the game! 🎮