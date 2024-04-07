const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let cities = [];
let missiles = [];
let playerMissiles = [];
let gameOver = false;

// Initialize game objects
function init() {
    const numCities = 6; // Total number of cities
    const cityWidth = 30; // City width for calculating spacing
    const gunEdgeOffset = 50; // Distance of the guns from the edge of the canvas
    const groundHeight = 50; // Height of the ground from the bottom of the canvas

    // Calculate the hill peak height and adjust the gun position
    const hillBaseHeight = 50;
    const gunHeight = 30;
    const hillPeakHeight = hillBaseHeight + gunHeight * 6;

    // Initialize player guns (launchers)
    playerLauncher.guns = [
        { x: gunEdgeOffset, y: canvas.height - hillPeakHeight }, // Left gun
        { x: canvas.width / 2, y: canvas.height - hillPeakHeight }, // Middle gun
        { x: canvas.width - gunEdgeOffset, y: canvas.height - hillPeakHeight } // Right gun
    ];

    // Space between cities should take into account the width of the cities and the central gun
    const spaceBetweenGuns = playerLauncher.guns[1].x - playerLauncher.guns[0].x;
    const gap = (spaceBetweenGuns - cityWidth * (numCities / 2)) / ((numCities / 2) + 1);

    // Create cities evenly distributed on the left side of the central gun
    cities = [];
    for (let i = 0; i < numCities / 2; i++) {
        cities.push({
            x: playerLauncher.guns[0].x + gap * (i + 1) + cityWidth * i + 15, // Shift to the right by 20px
            y: canvas.height - groundHeight // Drop down by 50px
        });
    }

    // Create cities evenly distributed on the right side of the central gun
    for (let i = 0; i < numCities / 2; i++) {
        cities.push({
            x: playerLauncher.guns[1].x + gap * (i + 1) + cityWidth * i + 15, // Shift to the right by 20px
            y: canvas.height - groundHeight // Drop down by 50px
        });
    }

    setInterval(generateEnemyMissile, 2000); // Adjust interval as needed
}

// Player launcher object with three guns
const playerLauncher = {
    guns: [], // This will be populated in the init function
    fire: (targetX, targetY) => {
        // Find the closest gun to the click position
        const closestGun = playerLauncher.guns.reduce((prev, curr) => {
            return (Math.abs(curr.x - targetX) < Math.abs(prev.x - targetX) ? curr : prev);
        });

        // Calculate trajectory and fire missile
        const angle = Math.atan2(targetY - closestGun.y, targetX - closestGun.x);
        const speed = 5;
        const missile = {
            x: closestGun.x,
            y: closestGun.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
        playerMissiles.push(missile);
    }
};

// Generate enemy missile targeting a random city
function generateEnemyMissile() {
    const targetCity = cities[Math.floor(Math.random() * cities.length)];
    const missile = {
        x: Math.random() * canvas.width,
        y: 0,
        targetX: targetCity.x,
        targetY: targetCity.y,
        speed: 2 // Adjust speed as needed
    };
    missiles.push(missile);
}

// Game loop functions
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
    drawGround(); // Draw the ground first
    drawMissiles();
    drawCities();
    drawPlayerGuns(); // Draw player guns
}

// Event listeners for player input
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    playerLauncher.fire(x, y);
});

// Movement and collision functions
function moveMissiles() {
    // Player missiles
    playerMissiles.forEach((missile, index) => {
        missile.x += missile.vx;
        missile.y += missile.vy;

        if (missile.x < 0 || missile.x > canvas.width || missile.y < 0 || missile.y > canvas.height) {
            playerMissiles.splice(index, 1);
        }
    });

    // Enemy missiles
    missiles.forEach(missile => {
        const angle = Math.atan2(missile.targetY - missile.y, missile.targetX - missile.x);
        missile.x += Math.cos(angle) * missile.speed;
        missile.y += Math.sin(angle) * missile.speed;

        // Collision with target city
        if (Math.hypot(missile.x - missile.targetX, missile.y - missile.targetY) < 10) {
            missiles.splice(missiles.indexOf(missile), 1);
            // Handle city damage or destruction
        }
    });
}

function checkCollisions() {
    playerMissiles.forEach((pMissile, pIndex) => {
        missiles.forEach((eMissile, eIndex) => {
            if (Math.hypot(pMissile.x - eMissile.x, pMissile.y - eMissile.y) < 10) {
                playerMissiles.splice(pIndex, 1);
                missiles.splice(eIndex, 1);
            }
        });
    });
}

// Render functions
function drawMissiles() {
    ctx.fillStyle = 'red';
    playerMissiles.forEach(missile => {
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });

    ctx.fillStyle = 'green';
    missiles.forEach(missile => {
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawCities() {
    const cityWidth = 30;
    const cityHeight = 20;

    ctx.fillStyle = 'blue';
    cities.forEach(city => {
        // Draw the main body of the city
        ctx.fillRect(city.x - cityWidth / 2, city.y - cityHeight, cityWidth, cityHeight);

        // Add some details to the city to make it look more like a building
        ctx.fillStyle = 'darkblue';
        const windowWidth = 5;
        const windowHeight = 5;
        for (let x = city.x - cityWidth / 2 + 5; x < city.x + cityWidth / 2 - 5; x += 10) {
            for (let y = city.y - cityHeight + 5; y < city.y - 5; y += 10) {
                ctx.fillRect(x, y, windowWidth, windowHeight);
            }
        }

        // Reset fill color for next city
        ctx.fillStyle = 'blue';
    });
}

function drawGround() {
    ctx.fillStyle = '#0B3D91'; // Set to the color of the ground in the template
    const groundHeight = 50;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight); // Draw ground
}

function drawPlayerGuns() {
    const gunWidth = 15;
    const gunHeight = 30;
    const hillBaseHeight = 50; // Base height of the hill from the ground
    const hillPeakHeight = gunHeight * 6; // Making the hill six times as tall as the guns

    playerLauncher.guns.forEach(gun => {
        // Draw hill
        ctx.fillStyle = 'green'; // Color for the hill
        ctx.beginPath();
        ctx.moveTo(gun.x - gunWidth * 3, canvas.height - hillBaseHeight); // Start at left base of hill
        ctx.quadraticCurveTo(gun.x, canvas.height - hillPeakHeight, gun.x + gunWidth * 3, canvas.height - hillBaseHeight); // Peak at gun position and down to right base
        ctx.closePath();
        ctx.fill();

        // Draw gun on top of hill
        ctx.fillStyle = '#FFD700'; // Color for the gun
        ctx.fillRect(gun.x - gunWidth / 2, canvas.height - hillPeakHeight/2 - gunHeight -22, gunWidth, gunHeight);
    });
}


// Initialize and start the game loop
window.onload = function() {
    init();
    gameLoop();
};
