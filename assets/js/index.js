// Constants
const WIDTH = 40;
const HEIGHT = 24;
const ROOM_MIN_SIZE = 3;
const ROOM_MAX_SIZE = 8;
const MIN_ROOMS = 5;
const MAX_ROOMS = 10;
const MIN_CORRIDORS = 3;
const MAX_CORRIDORS = 5;
const SWORDS_COUNT = 2;
const POTIONS_COUNT = 10;
const ENEMIES_COUNT = 10;

// GameData
const gameState = {
    map: [],
    hero: { x: 0, y: 0, health: 100, power: 1 },
    enemies: [],
    swords: [],
    potions: [],
    gameOver: false
};

function initGame() {
    generateMap();
    placeObjects();
    render();
    addEventListeners();
}

function generateMap() {
    for (let y = 0; y < HEIGHT; y++) {
        gameState.map[y] = [];
        for (let x = 0; x < WIDTH; x++) {
            gameState.map[y][x] = { type: 'wall', x, y };
        }
    }

    const roomsCount = randomInt(MIN_ROOMS, MAX_ROOMS);
    const rooms = [];

    for (let i = 0; i < roomsCount; i++) {
        const room = generateRoom();
        if (isRoomValid(room, rooms)) {
            rooms.push(room);
            carveRoom(room);
        }
    }

    const hCorridors = randomInt(MIN_CORRIDORS, MAX_CORRIDORS);
    const vCorridors = randomInt(MIN_CORRIDORS, MAX_CORRIDORS);

    for (let i = 0; i < hCorridors; i++) {
        const y = randomInt(1, HEIGHT - 2);
        for (let x = 1; x < WIDTH - 1; x++) {
            gameState.map[y][x].type = 'floor';
        }
    }

    for (let i = 0; i < vCorridors; i++) {
        const x = randomInt(1, WIDTH - 2);
        for (let y = 1; y < HEIGHT - 1; y++) {
            gameState.map[y][x].type = 'floor';
        }
    }

    ensureAccessibility();
}

function generateRoom() {
    const width = randomInt(ROOM_MIN_SIZE, ROOM_MAX_SIZE);
    const height = randomInt(ROOM_MIN_SIZE, ROOM_MAX_SIZE);
    const x = randomInt(1, WIDTH - width - 1);
    const y = randomInt(1, HEIGHT - height - 1);

    return { x, y, width, height };
}

function isRoomValid(room, existingRooms) {
    if (room.x < 1 || room.y < 1 ||
        room.x + room.width >= WIDTH - 1 ||
        room.y + room.height >= HEIGHT - 1) {
        return false;
    }

    for (const existing of existingRooms) {
        if (!(room.x > existing.x + existing.width + 1 ||
            room.x + room.width < existing.x - 1 ||
            room.y > existing.y + existing.height + 1 ||
            room.y + room.height < existing.y - 1)) {
            return false;
        }
    }

    return true;
}

function carveRoom(room) {
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            gameState.map[y][x].type = 'floor';
        }
    }
}

function ensureAccessibility() {
    let hasFloor = false;
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (gameState.map[y][x].type === 'floor') {
                hasFloor = true;
                break;
            }
        }
        if (hasFloor) break;
    }

    if (!hasFloor) {
        const x = randomInt(1, WIDTH - 2);
        const y = randomInt(1, HEIGHT - 2);
        gameState.map[y][x].type = 'floor';
    }
}

function placeObjects() {
    const freeCells = [];
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (gameState.map[y][x].type === 'floor') {
                freeCells.push({ x, y });
            }
        }
    }

    shuffleArray(freeCells);

    if (freeCells.length > 0) {
        const heroPos = freeCells.pop();
        gameState.hero.x = heroPos.x;
        gameState.hero.y = heroPos.y;
    }

    for (let i = 0; i < SWORDS_COUNT && freeCells.length > 0; i++) {
        const swordPos = freeCells.pop();
        gameState.swords.push({ x: swordPos.x, y: swordPos.y });
    }

    for (let i = 0; i < POTIONS_COUNT && freeCells.length > 0; i++) {
        const potionPos = freeCells.pop();
        gameState.potions.push({ x: potionPos.x, y: potionPos.y });
    }

    for (let i = 0; i < ENEMIES_COUNT && freeCells.length > 0; i++) {
        const enemyPos = freeCells.pop();
        gameState.enemies.push({
            x: enemyPos.x,
            y: enemyPos.y,
            health: 100,
            power: 1
        });
    }
}

function render() {
    const field = document.getElementById('field');
    field.innerHTML = '';

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile';

            if (gameState.map[y][x].type === 'wall') {
                tile.classList.add('wall');
            } else {
                tile.classList.add('floor');
            }

            if (x === gameState.hero.x && y === gameState.hero.y) {
                tile.classList.add('hero');

                const healthBar = document.createElement('div');
                healthBar.className = 'health';
                healthBar.style.width = `${gameState.hero.health}%`;
                tile.appendChild(healthBar);
            } else {
                const enemy = gameState.enemies.find(e => e.x === x && e.y === y);
                if (enemy) {
                    tile.classList.add('enemy');

                    const healthBar = document.createElement('div');
                    healthBar.className = 'health';
                    healthBar.style.width = `${enemy.health}%`;
                    tile.appendChild(healthBar);
                } else if (gameState.swords.some(s => s.x === x && s.y === y)) {
                    tile.classList.add('sword');
                } else if (gameState.potions.some(p => p.x === x && p.y === y)) {
                    tile.classList.add('potion');
                }
            }

            field.appendChild(tile);
        }
    }

    document.getElementById('health').textContent = gameState.hero.health;
    document.getElementById('power').textContent = gameState.hero.power;
}

function addEventListeners() {
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (gameState.gameOver) return;

    let moved = false;

    switch (e.key.toLowerCase()) {
        case 'w':
            moved = tryMoveHero(0, -1);
            break;
        case 'a':
            moved = tryMoveHero(-1, 0);
            break;
        case 's':
            moved = tryMoveHero(0, 1);
            break;
        case 'd':
            moved = tryMoveHero(1, 0);
            break;
        case ' ':
            attack();
            break;
        default:
            return;
    }

    if (moved) {
        moveEnemies();
        checkHeroPosition();
        render();
        checkGameOver();
    }
}

function tryMoveHero(dx, dy) {
    const newX = gameState.hero.x + dx;
    const newY = gameState.hero.y + dy;

    if (newX < 0 || newX >= WIDTH || newY < 0 || newY >= HEIGHT) {
        return false;
    }

    if (gameState.map[newY][newX].type === 'wall') {
        return false;
    }

    const enemyAtPos = gameState.enemies.find(e => e.x === newX && e.y === newY);
    if (enemyAtPos) {
        return false;
    }

    gameState.hero.x = newX;
    gameState.hero.y = newY;

    return true;
}

function attack() {
    const directions = [
        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];

    let attacked = false;

    for (const dir of directions) {
        const x = gameState.hero.x + dir.dx;
        const y = gameState.hero.y + dir.dy;

        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
            const enemyIndex = gameState.enemies.findIndex(e => e.x === x && e.y === y);
            if (enemyIndex !== -1) {
                gameState.enemies[enemyIndex].health -= 10 * gameState.hero.power;
                attacked = true;

                if (gameState.enemies[enemyIndex].health <= 0) {
                    gameState.enemies.splice(enemyIndex, 1);
                    showMessage('Враг повержен!');
                } else {
                    showMessage('Вы атаковали врага!');
                }
            }
        }
    }

    if (attacked) {
        moveEnemies();
        render();
        checkGameOver();
    } else {
        showMessage('Нет врагов рядом для атаки');
    }
}

function moveEnemies() {
    for (const enemy of gameState.enemies) {
        const dx = Math.sign(gameState.hero.x - enemy.x);
        const dy = Math.sign(gameState.hero.y - enemy.y);

        if (Math.random() > 0.5) {
            if (Math.random() > 0.5 && dx !== 0) {
                tryMoveEnemy(enemy, dx, 0);
            } else if (dy !== 0) {
                tryMoveEnemy(enemy, 0, dy);
            }
        } else {
            const randomDir = randomInt(0, 3);
            switch (randomDir) {
                case 0: tryMoveEnemy(enemy, -1, 0); break;
                case 1: tryMoveEnemy(enemy, 1, 0); break;
                case 2: tryMoveEnemy(enemy, 0, -1); break;
                case 3: tryMoveEnemy(enemy, 0, 1); break;
            }
        }

        if (Math.abs(enemy.x - gameState.hero.x) <= 1 &&
            Math.abs(enemy.y - gameState.hero.y) <= 1) {
            gameState.hero.health -= 5;
            showMessage('Враг атаковал вас!');
        }
    }
}

function tryMoveEnemy(enemy, dx, dy) {
    const newX = enemy.x + dx;
    const newY = enemy.y + dy;

    if (newX < 0 || newX >= WIDTH || newY < 0 || newY >= HEIGHT ||
        gameState.map[newY][newX].type === 'wall') {
        return false;
    }

    const hasEnemy = gameState.enemies.some(e => e !== enemy && e.x === newX && e.y === newY);
    const hasHero = newX === gameState.hero.x && newY === gameState.hero.y;

    if (!hasEnemy && !hasHero) {
        enemy.x = newX;
        enemy.y = newY;
        return true;
    }

    return false;
}

function checkHeroPosition() {
    const potionIndex = gameState.potions.findIndex(p =>
        p.x === gameState.hero.x && p.y === gameState.hero.y);

    if (potionIndex !== -1) {
        gameState.hero.health = Math.min(100, gameState.hero.health + 20);
        gameState.potions.splice(potionIndex, 1);
        showMessage('Вы нашли зелье здоровья! +20% здоровья');
    }

    const swordIndex = gameState.swords.findIndex(s =>
        s.x === gameState.hero.x && s.y === gameState.hero.y);

    if (swordIndex !== -1) {
        gameState.hero.power += 1;
        gameState.swords.splice(swordIndex, 1);
        showMessage('Вы нашли меч! Сила атаки увеличена');
    }
}

function checkGameOver() {
    if (gameState.hero.health <= 0) {
        gameState.gameOver = true;
        showMessage('Игра окончена! Вы погибли.', true);
    } else if (gameState.enemies.length === 0) {
        gameState.gameOver = true;
        showMessage('Победа! Все враги повержены.', true);
    }
}

function showMessage(text, isPersistent = false) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;

    if (!isPersistent) {
        setTimeout(() => {
            if (messageEl.textContent === text) {
                messageEl.textContent = '';
            }
        }, 2000);
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

window.onload = initGame;