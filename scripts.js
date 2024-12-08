const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game configuration constants
const NUM_CITIES = 6;
const CITY_WIDTH = 30;
const GUN_EDGE_OFFSET = 50;
const GROUND_HEIGHT = 50;
const HILL_BASE_HEIGHT = 50;
const HILL_PEAK_HEIGHT = HILL_BASE_HEIGHT * 6; // Adjust based on the gun height

// Game variables
let cities = [];
let missiles = [];
let playerMissiles = [];
let explosions = [];
let gameOver = false;
let playerHealth = 100; // Player health starts at 100
let playerMissilesRemaining = 30; // Player starts with 30 missiles
let playerScore = 0; // Current game score
let highScore = 0; // High score (update this based on gameplay)
const siloMissiles = {
  left: 10, // Missiles for the left silo
  center: 10, // Missiles for the center silo
  right: 10, // Missiles for the right silo
};

if (playerScore > highScore) {
  highScore = playerScore;
}

function displayStats() {
  ctx.save();

  const canvasCenterX = canvas.width / 2; // Center of the canvas for high score
  const statsY = 20; // Y position for stats
  const fontSize = 24; // Font size for the text

  // Set font style and alignment
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "white";

  // Draw the current score on the left
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${playerScore}`, 20, statsY);

  // Draw the high score in the center
  ctx.textAlign = "center";
  ctx.fillText(`High Score: ${highScore}`, canvasCenterX, statsY);

  ctx.restore();
}

// Update player health if a city or turret is hit
function decreasePlayerHealth() {
  playerHealth -= 10; // Decrease health by 10 on a hit
  if (playerHealth <= 0) {
    gameOver = true;
  }
}

// Fix the init function
function init() {
    // Set up playerLauncher guns
    playerLauncher.guns = [
      { x: GUN_EDGE_OFFSET, y: canvas.height - HILL_PEAK_HEIGHT, silo: "left" },
      { x: canvas.width / 2, y: canvas.height - HILL_PEAK_HEIGHT, silo: "center" },
      {
        x: canvas.width - GUN_EDGE_OFFSET,
        y: canvas.height - HILL_PEAK_HEIGHT,
        silo: "right",
      },
    ];
  
    // Set up cities
    const spaceBetweenGuns = playerLauncher.guns[1].x - playerLauncher.guns[0].x;
    const gap =
      (spaceBetweenGuns - CITY_WIDTH * (NUM_CITIES / 2)) / (NUM_CITIES / 2 + 1);
  
    cities = [];
    for (let i = 0; i < NUM_CITIES / 2; i++) {
      cities.push({
        x: playerLauncher.guns[0].x + gap * (i + 1) + CITY_WIDTH * i,
        y: canvas.height - GROUND_HEIGHT,
      });
    }
    for (let i = 0; i < NUM_CITIES / 2; i++) {
      cities.push({
        x: playerLauncher.guns[1].x + gap * (i + 1) + CITY_WIDTH * i,
        y: canvas.height - GROUND_HEIGHT,
      });
    }
  
    // Update total missiles remaining
    playerMissilesRemaining =
      siloMissiles.left + siloMissiles.center + siloMissiles.right;
  
    // Set up enemy missile generation
    setInterval(generateEnemyMissile, 2000);
  }

// Player launcher logic
const playerLauncher = {
  guns: [],
  fire: (targetX, targetY) => {
    // Find the closest gun
    const closestGun = playerLauncher.guns.reduce((prev, curr) => {
      return Math.abs(curr.x - targetX) < Math.abs(prev.x - targetX)
        ? curr
        : prev;
    });

    // Determine which silo corresponds to the closest gun
    let silo = "";
    if (closestGun === playerLauncher.guns[0]) {
      silo = "left";
    } else if (closestGun === playerLauncher.guns[1]) {
      silo = "center";
    } else if (closestGun === playerLauncher.guns[2]) {
      silo = "right";
    }

    // Check if the silo has missiles
    if (siloMissiles[silo] > 0) {
      siloMissiles[silo]--; // Decrement the missile count for the selected silo

      // Update the total missiles remaining
      playerMissilesRemaining =
        siloMissiles.left + siloMissiles.center + siloMissiles.right;

      const missileOriginY = closestGun.y + 110;

      const angle = Math.atan2(
        targetY - missileOriginY,
        targetX - closestGun.x
      );
      const speed = 5;
      const missile = {
        x: closestGun.x,
        y: missileOriginY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
      playerMissiles.push({ ...missile, targetX, targetY, exploded: false });

      console.log(
        `Missile fired from ${silo} silo. Remaining missiles in silo: ${siloMissiles[silo]}`
      );
      console.log(`Total missiles remaining: ${playerMissilesRemaining}`);
    } else {
      console.log(`No missiles left in the ${silo} silo!`);
    }
  },
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
    if (
      gunIndex < playerLauncher.guns.length &&
      playerLauncher.guns[gunIndex]
    ) {
      const gun = playerLauncher.guns[gunIndex];
      targetX = gun.x;
      targetY = gun.y + 140; // Aim at the top of the turret
    } else {
      // If the turret is destroyed, or if we're targeting a non-existent turret, aim at the ground level
      targetX =
        gunIndex === 0
          ? GUN_EDGE_OFFSET
          : gunIndex === 1
          ? canvas.width / 2
          : canvas.width - GUN_EDGE_OFFSET;
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
    speed: 2,
  };
  missiles.push(missile);
}

function gameLoop() {
  if (gameOver) {
    return alert("Game Over!");
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
  drawGround(); // Updated ground with hills and upright missile pattern
  drawCities();
  drawMissiles();
  displayStats(); // Draw stats before explosions
  renderExplosions(); // Ensure explosions are the last element drawn
}

function renderExplosions() {
  explosions.forEach((explosion, index) => {
    // Ensure explosions render fully within canvas boundaries
    const x = Math.max(
      explosion.radius,
      Math.min(explosion.x, canvas.width - explosion.radius)
    );
    const y = Math.max(
      explosion.radius,
      Math.min(explosion.y, canvas.height - explosion.radius)
    );

    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(x, y, explosion.radius, 0, 2 * Math.PI); // Draw full circle
    ctx.fill();

    // Increase explosion radius
    explosion.radius += 2;

    // Remove explosion if it exceeds max radius
    if (explosion.radius >= explosion.maxRadius) {
      explosions.splice(index, 1);
    }
  });
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  playerLauncher.fire(x, y);
  // Update the firing logic to check remaining missiles
  // Fix the fire method
playerLauncher.fire = (targetX, targetY) => {
    // Find the closest gun
    const closestGun = playerLauncher.guns.reduce((prev, curr) => {
      return Math.abs(curr.x - targetX) < Math.abs(prev.x - targetX) ? curr : prev;
    });
  
    // Determine which silo corresponds to the closest gun
    let silo = closestGun.silo;
  
    // Check if the silo has missiles
    if (siloMissiles[silo] > 0) {
      siloMissiles[silo]--; // Decrement the missile count for the selected silo
  
      // Update the total missiles remaining
      playerMissilesRemaining =
        siloMissiles.left + siloMissiles.center + siloMissiles.right;
  
      const missileOriginY = closestGun.y;
  
      const angle = Math.atan2(
        targetY - missileOriginY,
        targetX - closestGun.x
      );
      const speed = 5;
      const missile = {
        x: closestGun.x,
        y: missileOriginY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
      playerMissiles.push({ ...missile, targetX, targetY, exploded: false });
  
      console.log(
        `Missile fired from ${silo} silo. Remaining missiles in silo: ${siloMissiles[silo]}`
      );
      console.log(`Total missiles remaining: ${playerMissilesRemaining}`);
    } else {
      console.log(`No missiles left in the ${silo} silo!`);
    }
  };
});

function moveMissiles() {
  const groundLevelY = canvas.height - GROUND_HEIGHT; // Calculate the ground level's y-coordinate

  // Update enemy missiles
  for (let i = missiles.length - 1; i >= 0; i--) {
    const missile = missiles[i];
    missile.x += missile.vx;
    missile.y += missile.vy;

    // Check for collision with the ground
    if (missile.y >= groundLevelY) {
      explosions.push({
        x: missile.x,
        y: groundLevelY,
        radius: 0,
        maxRadius: 100,
      });
      missiles.splice(i, 1);
      decreasePlayerHealth(); // Reduce health when a missile hits the ground
      continue;
    }

    // Check for collision with cities
    for (let j = cities.length - 1; j >= 0; j--) {
      const city = cities[j];
      if (Math.hypot(city.x - missile.x, city.y - missile.y) < 20) {
        explosions.push({
          x: city.x,
          y: city.y,
          radius: 0,
          maxRadius: 100,
        });
        missiles.splice(i, 1);
        cities.splice(j, 1);
        decreasePlayerHealth(); // Reduce health when a city is destroyed
        break;
      }
    }

    // Check for collision with turrets
    for (let j = playerLauncher.guns.length - 1; j >= 0; j--) {
      const gun = playerLauncher.guns[j];
      const turretTopY = gun.y + 140;
      if (Math.hypot(gun.x - missile.x, turretTopY - missile.y) < 20) {
        explosions.push({
          x: gun.x,
          y: turretTopY,
          radius: 0,
          maxRadius: 100,
        });
        missiles.splice(i, 1);
        playerLauncher.guns.splice(j, 1); // Remove the turret on hit
        decreasePlayerHealth(); // Reduce health when a turret is destroyed
        break;
      }
    }
  }

  // Update player missiles
  playerMissiles.forEach((missile, index) => {
    missile.x += missile.vx;
    missile.y += missile.vy;

    // Check if missile reaches its target
    if (
      Math.hypot(missile.x - missile.targetX, missile.y - missile.targetY) < 5
    ) {
      missile.exploded = true;
      explosions.push({
        x: missile.targetX,
        y: missile.targetY,
        radius: 0,
        maxRadius: 100,
      });
    }
  });

  // Remove exploded player missiles
  playerMissiles = playerMissiles.filter((m) => !m.exploded);
}

// Explosion rendering logic
function renderExplosions() {
  explosions.forEach((explosion, index) => {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();

    // Increase explosion radius
    explosion.radius += 2;

    // Remove explosion if it exceeds max radius
    if (explosion.radius >= explosion.maxRadius) {
      explosions.splice(index, 1);
    }
  });
}

// Ensure the missile shapes remain visually correct
function drawMissileShape(missile, type) {
  const angle = Math.atan2(missile.vy, missile.vx);

  ctx.save();
  ctx.translate(missile.x, missile.y);
  ctx.rotate(angle);

  const missileLength = 20;
  const missileWidth = 8;

  ctx.fillStyle = type === "player" ? "#007bff" : "#dc3545";
  ctx.beginPath();
  ctx.ellipse(0, 0, missileWidth / 2, missileLength / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Drawing missiles with correct orientation
function drawMissiles() {
  missiles.forEach((missile) => drawMissileShape(missile, "enemy"));
  playerMissiles.forEach((missile) => drawMissileShape(missile, "player"));
}

function checkCollisions() {
  explosions.forEach((explosion) => {
    missiles.forEach((missile, i) => {
      if (
        Math.hypot(explosion.x - missile.x, explosion.y - missile.y) <=
        explosion.radius
      ) {
        missiles.splice(i, 1);
      }
    });

    playerMissiles.forEach((missile, i) => {
      if (
        Math.hypot(explosion.x - missile.x, explosion.y - missile.y) <=
        explosion.radius
      ) {
        playerMissiles.splice(i, 1);
      }
    });
  });
}

function drawMissileShape(missile, type) {
  let baseAngle =
    type === "enemy"
      ? Math.atan2(missile.targetY - missile.y, missile.targetX - missile.x)
      : Math.atan2(missile.vy, missile.vx);

  let angle = baseAngle + Math.PI / 2;

  ctx.save();
  ctx.translate(missile.x, missile.y);
  ctx.rotate(angle);

  const missileLength = 20;
  const missileWidth = 8;
  const finThickness = missileWidth;

  ctx.fillStyle = type === "player" ? "#007bff" : "#dc3545";

  ctx.beginPath();
  ctx.ellipse(
    0,
    -missileLength / 2,
    missileWidth / 2,
    missileLength / 2,
    0,
    0,
    2 * Math.PI
  );
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
  missiles.forEach((missile) => drawMissileShape(missile, "enemy"));
  playerMissiles.forEach((missile) => drawMissileShape(missile, "player"));
}

function drawCities() {
  const cityHeight = 20;

  ctx.fillStyle = "blue";
  cities.forEach((city) => {
    ctx.fillRect(
      city.x - CITY_WIDTH / 2,
      city.y - cityHeight,
      CITY_WIDTH,
      cityHeight
    );

    ctx.fillStyle = "darkblue";
    const windowWidth = 5;
    const windowHeight = 5;
    for (
      let x = city.x - CITY_WIDTH / 2 + 5;
      x < city.x + CITY_WIDTH / 2 - 5;
      x += 10
    ) {
      for (let y = city.y - cityHeight + 5; y < city.y - 5; y += 10) {
        ctx.fillRect(x, y, windowWidth, windowHeight);
      }
    }

    ctx.fillStyle = "blue";
  });
}

// Update ground rendering to reflect separate silo missile counts
function drawGround() {
  const hillWidth = 120;
  const hillHeight = 60;
  const groundLevel = canvas.height - GROUND_HEIGHT;
  const hillColor = "green";

  // Draw the base ground
  ctx.fillStyle = "green";
  ctx.fillRect(0, groundLevel, canvas.width, GROUND_HEIGHT);

  // Draw hills with missiles
  playerLauncher.guns.forEach((gun, index) => {
    // Determine which silo this gun corresponds to
    let remainingMissiles;
    if (index === 0) {
      remainingMissiles = siloMissiles.left;
    } else if (index === 1) {
      remainingMissiles = siloMissiles.center;
    } else if (index === 2) {
      remainingMissiles = siloMissiles.right;
    }

    // Draw the hill
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(gun.x - hillWidth / 2, groundLevel); // Bottom-left of the hill
    ctx.lineTo(gun.x - hillWidth / 4, groundLevel - hillHeight); // Left slope
    ctx.lineTo(gun.x + hillWidth / 4, groundLevel - hillHeight); // Flat top
    ctx.lineTo(gun.x + hillWidth / 2, groundLevel); // Right slope
    ctx.closePath();
    ctx.fill();

    // Draw remaining missiles
    const missileSpacing = 15;
    const missileSizeScale = 0.6;
    const rows = 4;
    const maxMissilesPerRow = [1, 2, 3, 4];
    let missilesToDraw = remainingMissiles;

    for (let row = 0; row < rows; row++) {
      if (missilesToDraw <= 0) break;

      const missilesInRow = Math.min(maxMissilesPerRow[row], missilesToDraw);
      const startX = gun.x - ((missilesInRow - 1) * missileSpacing) / 2;
      const yOffset = groundLevel - hillHeight + 18 + row * missileSpacing;

      for (let i = 0; i < missilesInRow; i++) {
        const missileX = startX + i * missileSpacing;

        // Draw each missile rotated 180 degrees
        ctx.save();
        ctx.translate(missileX, yOffset);
        ctx.rotate(Math.PI); // Rotate the missile 180 degrees
        ctx.scale(missileSizeScale, missileSizeScale); // Scale missile size
        const missile = { x: 0, y: 0, vx: 0, vy: 1 }; // Dummy missile for static display
        drawMissileShape(missile, "player");
        ctx.restore();
      }

      missilesToDraw -= missilesInRow;
    }
  });
}

window.onload = function () {
  init();
  gameLoop();
};
