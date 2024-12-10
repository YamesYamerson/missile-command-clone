// TODO update the drawMissiles function to draw the missiles

export function drawMissiles(ctx, missiles, playerMissiles) {
    missiles.forEach((missile) => drawMissileShape(ctx, missile, "enemy"));
    playerMissiles.forEach((missile) => drawMissileShape(ctx, missile, "player"));
  }
  
  export function drawMissileShape(ctx, missile, type) {
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
  