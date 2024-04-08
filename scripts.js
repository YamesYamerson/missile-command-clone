const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game configuration constants
const NUM_CITIES = 6;
const CITY_WIDTH = 30;
const GUN_EDGE_OFFSET = 50;
const GROUND_HEIGHT = 50;
const HILL_BASE_HEIGHT = 50;
const GUN_HEIGHT = 30;
const HILL_PEAK_HEIGHT = HILL_BASE_HEIGHT + GUN_HEIGHT * 6; // Adjust based on the gun height

// Game variables
let cities = [];
let missiles = [];
let playerMissiles = [];
let explosions = [];
let gameOver = false;

// Initialize game objects
function init() {
    playerLauncher.guns = [
        { x: GUN_EDGE_OFFSET, y: canvas.height - HILL_PEAK_HEIGHT },
        { x: canvas.width / 2, y: canvas.height - HILL_PEAK_HEIGHT },
        { x: canvas.width - GUN_EDGE_OFFSET, y: canvas.height - HILL_PEAK_HEIGHT }
    ];

    const spaceBetweenGuns = playerLauncher.guns[1].x - playerLauncher.guns[0].x;
    const gap = (spaceBetweenGuns - CITY_WIDTH * (NUM_CITIES / 2)) / ((NUM_CITIES / 2) + 1);

    cities = [];
    for (let i = 0; i < NUM_CITIES / 2; i++) {
        cities.push({
            x: playerLauncher.guns[0].x + gap * (i + 1) + CITY_WIDTH * i,
            y: canvas.height - GROUND_HEIGHT
        });
    }
    for (let i = 0; i < NUM_CITIES / 2; i++) {
        cities.push({
            x: playerLauncher.guns[1].x + gap * (i + 1) + CITY_WIDTH * i,
            y: canvas.height - GROUND_HEIGHT
        });
    }

    setInterval(generateEnemyMissile, 2000);
}

const playerLauncher = {
    guns: [],
    fire: (targetX, targetY) => {
        const closestGun = playerLauncher.guns.reduce((prev, curr) => {
            return (Math.abs(curr.x - targetX) < Math.abs(prev.x - targetX) ? curr : prev);
        });

        const missileOriginY = closestGun.y + 110;

        const angle = Math.atan2(targetY - missileOriginY, targetX - closestGun.x);
        const speed = 5;
        const missile = {
            x: closestGun.x,
            y: missileOriginY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
        playerMissiles.push({...missile, targetX, targetY, exploded: false });
    }
};

function generateEnemyMissile() {
    const groundLevelY = canvas.height - GROUND_HEIGHT; // Y-coordinate of the ground level
    const totalTargets = cities.length + 3; // Assuming 3 turrets to start with
    const targetIndex = Math.floor(Math.random() * totalTargets);

    let targetX, targetY;
    if (targetIndex < cities.length) {
        // Targeting a city
        const target = cities[targetIndex];
        targetX = target.x;
        targetY = target.y;
    } else {
        // Targeting a turret or its former position if destroyed
        const gunIndex = targetIndex - cities.length;
        if (gunIndex < playerLauncher.guns.length && playerLauncher.guns[gunIndex]) {
            const gun = playerLauncher.guns[gunIndex];
            targetX = gun.x;
            targetY = gun.y + 140; // Aim at the top of the turret
        } else {
            // If the turret is destroyed, or if we're targeting a non-existent turret, aim at the ground level
            targetX = (gunIndex === 0) ? GUN_EDGE_OFFSET :
                      (gunIndex === 1) ? canvas.width / 2 :
                      canvas.width - GUN_EDGE_OFFSET;
            targetY = groundLevelY;
        }
    }

    const missileStartX = Math.random() * canvas.width;
    const missileStartY = 0; // Starting at the top of the canvas
    const angle = Math.atan2(targetY - missileStartY, targetX - missileStartX);

    const missile = {
        x: missileStartX,
        y: missileStartY,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        targetX: targetX,
        targetY: targetY,
        speed: 2
    };
    missiles.push(missile);
}

function gameLoop() {
    if (gameOver) {
        return alert('Game Over!');
    }

    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    moveMissiles();
    checkCollisions();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawMissiles();
    drawCities();
    drawPlayerGuns();
    renderExplosions();
}

function renderExplosions() {
    ctx.fillStyle = 'orange';
    explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();

        explosion.radius += 2;
        if (explosion.radius > explosion.maxRadius) {
            explosions.splice(explosions.indexOf(explosion), 1);
        }
    });
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    playerLauncher.fire(x, y);
});

function moveMissiles() {
    const groundLevelY = canvas.height - GROUND_HEIGHT; // Calculate the ground level's y-coordinate

    for (let i = missiles.length - 1; i >= 0; i--) {
        const missile = missiles[i];
        missile.x += missile.vx;
        missile.y += missile.vy;

        // Check for collision with the ground
        if (missile.y >= groundLevelY) {
            explosions.push({
                x: missile.x,
                y: groundLevelY,
                radius: 30,
                maxRadius: 100,
            });
            missiles.splice(i, 1); // Remove the missile
            continue; // Skip further collision checks for this missile
        }

        // Check for collision with cities
        for (let j = cities.length - 1; j >= 0; j--) {
            const city = cities[j];
            if (Math.hypot(city.x - missile.x, city.y - missile.y) < 20) {
                missiles.splice(i, 1);
                cities.splice(j, 1);
                explosions.push({
                    x: city.x,
                    y: city.y,
                    radius: 30,
                    maxRadius: 100,
                });
                break; // Exit the loop after finding a collision
            }
        }

        // Check for collision with turrets
        if (missiles[i]) { // Ensure the missile still exists after city collision check
            for (let j = playerLauncher.guns.length - 1; j >= 0; j--) {
                const gun = playerLauncher.guns[j];
                const turretTopY = gun.y + 140; // Adjusted to the turret's actual top
                if (Math.hypot(gun.x - missile.x, turretTopY - missile.y) < 20) {
                    missiles.splice(i, 1);
                    playerLauncher.guns.splice(j, 1); // Remove the turret on hit
                    explosions.push({
                        x: gun.x,
                        y: turretTopY,
                        radius: 30,
                        maxRadius: 100,
                    });
                    break; // Exit the loop after finding a collision
                }
            }
        }
    }

    // Update and check player missiles
    playerMissiles.forEach((missile, index) => {
        missile.x += missile.vx;
        missile.y += missile.vy;

        if (missile.y >= groundLevelY) {
            missile.exploded = true;
            explosions.push({
                x: missile.x,
                y: groundLevelY,
                radius: 30,
                maxRadius: 100,
            });
        } else if (!missile.exploded && Math.hypot(missile.x - missile.targetX, missile.y - missile.targetY) < 5) {
            missile.exploded = true;
            explosions.push({
                x: missile.targetX,
                y: missile.targetY,
                radius: 30,
                maxRadius: 100,
            });
        }
    });

    playerMissiles = playerMissiles.filter(m => !m.exploded);
}

function checkCollisions() {
    explosions.forEach((explosion) => {
        missiles.forEach((missile, i) => {
            if (Math.hypot(explosion.x - missile.x, explosion.y - missile.y) <= explosion.radius) {
                missiles.splice(i, 1);
            }
        });

        playerMissiles.forEach((missile, i) => {
            if (Math.hypot(explosion.x - missile.x, explosion.y - missile.y) <= explosion.radius) {
                playerMissiles.splice(i, 1);
            }
        });
    });
}

function drawMissileShape(missile, type) {
    let baseAngle = type === 'enemy' ?
        Math.atan2(missile.targetY - missile.y, missile.targetX - missile.x) :
        Math.atan2(missile.vy, missile.vx);

    let angle = baseAngle + Math.PI / 2;

    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.rotate(angle);

    const missileLength = 20;
    const missileWidth = 8;
    const finThickness = missileWidth;

    ctx.fillStyle = type === 'player' ? '#007bff' : '#dc3545';

    ctx.beginPath();
    ctx.ellipse(0, -missileLength / 2, missileWidth / 2, missileLength / 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-finThickness / 2, -missileLength / 3);
    ctx.lineTo(-finThickness, 0);
    ctx.lineTo(0, -missileLength / 6);
    ctx.lineTo(finThickness, 0);
    ctx.lineTo(finThickness / 2, -missileLength / 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawMissiles() {
    missiles.forEach(missile => drawMissileShape(missile, 'enemy'));
    playerMissiles.forEach(missile => drawMissileShape(missile, 'player'));
}

function drawCities() {
    const cityHeight = 20;

    ctx.fillStyle = 'blue';
    cities.forEach(city => {
        ctx.fillRect(city.x - CITY_WIDTH / 2, city.y - cityHeight, CITY_WIDTH, cityHeight);

        ctx.fillStyle = 'darkblue';
        const windowWidth = 5;
        const windowHeight = 5;
        for (let x = city.x - CITY_WIDTH / 2 + 5; x < city.x + CITY_WIDTH / 2 - 5; x += 10) {
            for (let y = city.y - cityHeight + 5; y < city.y - 5; y += 10) {
                ctx.fillRect(x, y, windowWidth, windowHeight);
            }
        }

        ctx.fillStyle = 'blue';
    });
}

function drawGround() {
    ctx.fillStyle = '#0B3D91';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
}

function drawPlayerGuns() {
    const hillWidth = 80;
    const hillHeight = 60;
    const hillColor = 'green';
    const groundLevel = canvas.height - GROUND_HEIGHT;

    const turretBaseRadius = 15;
    const turretBarrelWidth = 10;
    const turretBarrelHeight = 10;
    const turretColor = '#FFD700';

    playerLauncher.guns.forEach(gun => {
        ctx.fillStyle = hillColor;
        ctx.beginPath();
        ctx.moveTo(gun.x - hillWidth / 2, groundLevel);
        ctx.quadraticCurveTo(gun.x, groundLevel - hillHeight, gun.x + hillWidth / 2, groundLevel);
        ctx.fill();

        ctx.fillStyle = turretColor;
        ctx.beginPath();
        ctx.arc(gun.x, groundLevel - hillHeight + 25, turretBaseRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(gun.x - turretBarrelWidth / 2, groundLevel - hillHeight - turretBarrelHeight, turretBarrelWidth, turretBarrelHeight + 25);
    });
}

window.onload = function() {
    init();
    gameLoop();
};
