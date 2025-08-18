import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mobTypes, petellTypes } from './stats.js';

// recreate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".md": "text/markdown"
  };
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not Found");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const mobStats = {
  minBossRarity: 8,
  highestRarity: 10,
};
let mobs = [];
let mobIdCounter = 0;
const sizeScaling = [1,1.2,1.5,1.9,3,5,8,13,21,34,55];
//1, 3.75, 13.5, 54, 405, 2430, 36450, 1968300
                // c  u    r   e   l    m     u      s        q          g           i
const hpScaling = [1, 4.5, 18, 90, 810, 8192, 98304, 2359296, 28311552,  169869312,  1019215872];
function spawnMob(x, y, rarity, mobName, angle, team=0, owner=0) {   let type;
  if (mobName) {
    type = mobTypes.find(mob => mob.name === mobName);
    if (!type) {
      console.warn(`Mob with name "${mobName}" not found. Using random mob instead.`);
      type = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    }
  } else {
    type = mobTypes[Math.floor(Math.random() * mobTypes.length)];
  }

  let randomRarity = rarity;
  let sizeScale = 1.04;
  let scalingType = 0;

  // compute scaled size/mass based on scalingType
  let scaledRadius, scaledHitboxSize, scaledMass;
  if (scalingType === 0) {
    scaledRadius = type.radius/2 * sizeScaling[randomRarity];
    scaledHitboxSize = type.hitbox_size/2 * sizeScaling[randomRarity];
    scaledMass = type.mass/2 * sizeScaling[randomRarity];
  } else {
    scaledRadius = type.radius/2 * Math.pow(sizeScale, randomRarity);
    scaledHitboxSize = type.hitbox_size/2 * Math.pow(sizeScale, randomRarity);
    scaledMass = type.mass/2 * Math.pow(sizeScale, randomRarity);
  }

  const mob = {
    rarity: randomRarity,
    id: mobIdCounter++,
    type: type.name,
    x: x,
    y: y,
    dmg: type.dmg * Math.pow(4, randomRarity),
    ltn: type.ltn * Math.pow(4, randomRarity),
    poison: type.poison * Math.pow(4, randomRarity),
    radiation: type.radiation * Math.pow(4, randomRarity),
    hp: type.hp * hpScaling[randomRarity],
    curhp: type.hp * hpScaling[randomRarity],
    armor: type.armor * Math.pow(4, randomRarity),
    radius: scaledRadius,
    hitbox_size: scaledHitboxSize,
    behavior: type.behavior,
    aggroType: type.aggroType,
    idleType: type.idleType,
    mass: scaledMass,
    state: "idle",
    aggroTargetId: null,
    angle: angle,
    ran1: Math.random() + 1,
    ran2: Math.random() + 1,
    ran3: Math.random() + 1,
    ran4: Math.random() + 1,
    ran5: Math.random() + 1,
    intangible: type.intangible,
    team: team,
    owner: owner,
    renderhp: type.renderhp ?? true,
    tail: type.tail ?? false,
    hole: type.renderhp ?? false,
    holeSpawns: type.holeSpawns ?? [], // 👈 add this line
  };

  if (type.sizevary === true) {
    let sizevar = Math.random() * 0.4 + 0.8;
    mob.radius *= sizevar;
    mob.hitbox_size *= sizevar;
  }

  mobs.push(mob);
  console.log(`Spawned rarity ${mob.rarity} ${mob.type} at ${mob.x}, ${mob.y}`)
}

let players = {};
let keysHeld = {};
let playerId = 0;
// Player setup
// === Updated player spawn ===
wss.on("connection", (ws) => {
  const id = playerId++;
  const spawnPos = findSpawnTile();
  const spawn = {
    x: spawnPos.x,
    y: spawnPos.y,
    vx: 0,
    vy: 0,
    id,
    hp: 12000000,
    curhp: 12000000,
    petells: generatePetells(),
    petellOrbitRadius: 30,
    team: 1
  };

  players[id] = spawn;
  keysHeld[id] = {};
  spawn.curhp = spawn.hp;

  // Send initial data including the map
  ws.send(JSON.stringify({
    type: "init",
    id,
    players,
    map,           // <-- send map here
    tileSize: TILE_SIZE  // helpful to know tile size for rendering
  }));

  ws.on("message", (msg) => {
    let data = JSON.parse(msg);

    if (data.type === "input") {
      if (keysHeld[id]) {
        keysHeld[id][data.key] = data.state;
      }
    } else if (data.type === "chat") {
      broadcast({ type: "chat", id, message: data.message });
    } else if (data.type === "swap_petells") {
      const p = players[id];
      if (!p) return;

      const a = data.a;
      const b = data.b;
      console.log("Attempting swap_petells:");
      console.log("a:", a, "b:", b);
      console.log("petells:", p.petells);
      
      if (
        Array.isArray(p.petells) &&
        p.petells[a] && p.petells[b]
      ) {
        const temp = p.petells[a];
        p.petells[a] = p.petells[b];
        p.petells[b] = temp;

        broadcast({
          type: "update_player",
          id: id,
          player: p
        });
      }
    } else if (data.type === "spawnMobRequest") {
  const { x, y, rarity, mobType, angle } = data.data;

  const mob = mobTypes.find((m) => m.name === mobType);
  if (!mob) {
    ws.send(JSON.stringify({
      type: "spawnMobResponse",
      data: { status: "error", message: `Invalid mob type: ${mobType}` }
    }));
    return;
  }

  // Call spawnMob and get the new mob object (adjust spawnMob if needed)
  const newMob = spawnMob(x, y, rarity, mobType, angle);

  // Broadcast the new mob to all connected clients (or relevant ones)
  broadcast({
    type: "mobSpawned",
    mob: newMob,
  });

  ws.send(JSON.stringify({
    type: "spawnMobResponse",
    data: { status: "success", message: `Spawned ${mobType} at (${x}, ${y})` }
  }));
}
  });

  ws.on("close", () => {
    delete players[id];
    delete keysHeld[id];
    broadcast({ type: "leave", id });
  });
});

function generatePetells() {
  const petellCount = 10;
  const spacing = (Math.PI * 2) / petellCount;
  let petells = [];
  //let rarity = 0;
  for (let i = 0; i < petellCount; i++) {
    const type = petellTypes[Math.floor(Math.random() * petellTypes.length)];
    const rarity = Math.floor(Math.random() * 2) + 8; // 0, 1, or 2
    petells.push({
      type: type.name,
      angle: i * spacing,
      rarity: rarity,
      extra_hp: type.extra_hp * Math.pow(4, rarity),
      hp: type.hp * Math.pow(4, rarity),
      maxhp: type.hp * Math.pow(4, rarity),
      dmg: type.dmg * Math.pow(4, rarity),
      armor: type.armor * Math.pow(4, rarity),
      reload: type.reload,
      heal: type.heal * Math.pow(4, rarity) || 0,
      hps: type.hps * Math.pow(4, rarity) || 0,
      respawning: false,
      summon: type.summon
    });
    //rarity++;
  }
  return petells;
}

// Helper function to calculate distance squared (for collision)
function distSq(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

// Helper collision check for circles
function circlesCollide(x1, y1, r1, x2, y2, r2) {
  const radiusSum = r1 + r2;
  return distSq(x1, y1, x2, y2) <= radiusSum * radiusSum;
}

// Damage cooldown (avoid rapid repeated damage)
const mobDamageCooldown = new Map(); // key: playerId or petellId, value: timestamp
const damageInterval = 1000; // 1 second cooldown
// Store poison timers and poison damage for each player from each mob
// Key format: player_${playerId}_poison
const poisonStatus = new Map();
const POISON_INTERVAL = 1000; // poison damage every 1 second
function despawnMob(mobToRemove) {
  if (!mobToRemove) return;

  // Reward logic
  const damageMap = mobDamageLog.get(mobToRemove.id) || {};
  const totalHp = mobToRemove.hp;

  // Step 1: Extract eligible damage dealers
  const sorted = Object.entries(damageMap)
    .map(([id, dmg]) => ({ id: Number(id), dmg })) // convert id to number here
    .filter(entry => entry.dmg >= totalHp * 0.05) // >=5% damage
    .sort((a, b) => b.dmg - a.dmg);

  // Step 2: Take top 2 eligible
  const eligible = sorted.slice(0, 2).map(entry => entry.id);

  // Step 3: Send announcement
  if (eligible.length > 0 && mobToRemove.rarity > mobStats.minBossRarity - 1) {
    console.log(`Congratulations, ${eligible.join(', ')} defeated a mob.`);
    broadcast({
      type: "chat", // send to all players
      message: `A ${rarityStuff[mobToRemove.rarity].name} ${mobToRemove.type} has been defeated by players ${eligible.join(', ')}!`
    });
  }

  // Step 4: Remove the mob from list
  mobs = mobs.filter(m => m !== mobToRemove && m.id !== mobToRemove.id);

  // Step 5: Clean up damage log
  mobDamageLog.delete(mobToRemove.id);
}

const radiationStatus = new Map();
const mobDamageLog    = new Map(); // key: mob.id, value: { playerId: damage, ... }
function logDamage(mob, playerId, dmg) {
  if (!mobDamageLog.has(mob.id)) {
    mobDamageLog.set(mob.id, {});
  }
  const log = mobDamageLog.get(mob.id);
  log[playerId] = (log[playerId] || 0) + dmg;
}
setInterval(() => {
  for (let id in players) {
    const p = players[id];
    const input = keysHeld[id] || {};const accel = 0.5;
const maxSpeed = 2.5 * 15;
const drag = 0.85;

let dx = 0, dy = 0;
if (input["ArrowUp"]) dy -= 1;
if (input["ArrowDown"]) dy += 1;
if (input["ArrowLeft"]) dx -= 1;
if (input["ArrowRight"]) dx += 1;

const length = Math.hypot(dx, dy);
if (length > 0) {
  dx /= length;
  dy /= length;
  p.vx += dx * accel;
  p.vy += dy * accel;
}

// Clamp combined velocity to maxSpeed
const speed = Math.hypot(p.vx, p.vy);
if (speed > maxSpeed) {
  p.vx = (p.vx / speed) * maxSpeed;
  p.vy = (p.vy / speed) * maxSpeed;
}

// Apply drag only when no input along that axis
if (dx === 0) p.vx *= drag;
if (dy === 0) p.vy *= drag;

// Calculate proposed next position
const nextX = p.x + p.vx;
const nextY = p.y + p.vy;

// Assume player radius is 10 (based on your collision radius in mobs code)
const playerRadius = 10;

// Check collisions on each axis separately
const collisionX = isWallAt(nextX + playerRadius, p.y) || isWallAt(nextX - playerRadius, p.y);
const collisionY = isWallAt(p.x, nextY + playerRadius) || isWallAt(p.x, nextY - playerRadius);

// Adjust movement if collision detected
if (!collisionX) {
  p.x = nextX;
} else {
  p.vx = 0; // stop horizontal movement if blocked
}

if (!collisionY) {
  p.y = nextY;
} else {
  p.vy = 0; // stop vertical movement if blocked
}

// Clamp to bounds
p.x = Math.max(10, Math.min(map.x, p.x));
p.y = Math.max(10, Math.min(map.y, p.y));

// Orbit radius logic (instant change)
const baseRadius = 30;       // default
const extendedRadius = 60;   // when held

// Orbit radius logic
if (p.petellOrbitRadius == null) {
  p.petellOrbitRadius = baseRadius; // initialize once
}

p.petellOrbitRadius = input["MouseLeft"] ? extendedRadius : baseRadius;

    // Update petell angles (robust to uninitialized angle/orbit radius)
    const orbitSpeed = 0.05;
    for (let petell of p.petells) {
      // ensure angle exists and is a finite number
      if (!Number.isFinite(petell.angle)) petell.angle = Math.random() * Math.PI * 2;

      // ensure radius is valid (fallback to baseRadius if needed)
      const radius = Number.isFinite(p.petellOrbitRadius) ? p.petellOrbitRadius : baseRadius;

      petell.angle += orbitSpeed;
      petell.x = p.x + Math.cos(petell.angle) * radius;
      petell.y = p.y + Math.sin(petell.angle) * radius;
    }

    // Passive healing (hps)
    for (let petell of p.petells) {
      if (petell.hps && petell.hp > 0 && !petell.respawning) {
        p.curhp = Math.min(p.hp, p.curhp + petell.hps / 60); // per frame (60 fps)
      }
    }

    // --------- COLLISIONS ---------
    for (let mob of mobs) {
      // precompute dx, dy & distance once
      const dx       = p.x - mob.x;
      const dy       = p.y - mob.y;
      const distance = Math.hypot(dx, dy);

      // 0) RADIATION AOE (fixed)
      if (mob.radiation > 0 && mob.radiation) {
        // define how far the radiation reaches
        const range = mob.radiationRange ?? mob.hitbox_size * 3;
        // *** key now includes mob.id AND player.id ***
        const key   = `radiation_m${mob.id}_p${p.id}`;

        if (distance < range) {
          const now   = Date.now();
          const entry = radiationStatus.get(key);

          if (!entry) {
            // first frame *for this mob/player*
            radiationStatus.set(key, { lastTick: now });
          } else {
            const elapsed = (now - entry.lastTick) / 1000; // seconds
            if (elapsed > 0) {
              const factor = 1 - (distance / range);
              const dps    = mob.radiation * factor;    // damage per second
              const damage = dps * elapsed;

              p.curhp -= damage;
              entry.lastTick = now;

              if (p.curhp <= 0) {
                const spawnPos = findSpawnTile();
                p.x     = spawnPos.x;
                p.y     = spawnPos.y;
                p.petells = generatePetells();
                p.curhp = p.hp;
                poisonStatus.delete(`player_${p.id}_poison`);
                // clear only *this* radiation entry
                radiationStatus.delete(key);
              }
            }
          }
        } else {
          // out of range for *this* mob/player → clear only this entry
          radiationStatus.delete(key);
        }
      }
// 1) Mob hits player
if (circlesCollide(p.x, p.y, 10, mob.x, mob.y, mob.hitbox_size)) {
  const now = Date.now();

  // Push player out of mob hitbox
  const dx = p.x - mob.x;
  const dy = p.y - mob.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.001; // avoid division by zero
  const minDist = 10 + mob.hitbox_size; // player's radius + mob's hitbox
  const pushDist = minDist - dist;
  if (pushDist > 0) {
    p.x += (dx / dist) * pushDist;
    p.y += (dy / dist) * pushDist;
  }

  if (!mobDamageCooldown.has(`player_${p.id}`) || now - mobDamageCooldown.get(`player_${p.id}`) > damageInterval) {
    // Immediate damage
    p.curhp -= mob.dmg || 10;
    mobDamageCooldown.set(`player_${p.id}`, now);

    // Reset position and health if dead
    if (p.curhp <= 0) {
      let spawnPos = findSpawnTile();
      p.x = spawnPos.x;
      p.y = spawnPos.y;
      p.petells = generatePetells();
      p.curhp = p.hp;
      // Also clear poison if any
      poisonStatus.delete(`player_${p.id}_poison`);
    }

    // Apply poison effect if mob has poison damage
    if (mob.poison && mob.poison > 0) {
      // Store or refresh poison timer and damage for this player
      poisonStatus.set(`player_${p.id}_poison`, {
        lastTick: now,
        damage: mob.poison,
      });
    }
  }
}

      for (let i = 0; i < p.petells.length; i++) {
  const petell = p.petells[i];
  if (petell.hp > 0 && !petell.respawning) {
    const radius = p.petellOrbitRadius;
    const petellX = p.x + Math.cos(petell.angle) * radius;
    const petellY = p.y + Math.sin(petell.angle) * radius;

    if (circlesCollide(petellX, petellY, 2.5, mob.x, mob.y, mob.hitbox_size) && mob.team !== p.team) {
      const now = Date.now();
      if (!mobDamageCooldown.has(`petell_${id}_${i}`) || now - mobDamageCooldown.get(`petell_${id}_${i}`) > damageInterval) {
        petell.hp -= Math.max(0, mob.dmg - petell.armor);
        mobDamageCooldown.set(`petell_${id}_${i}`, now);

        if (petell.hp <= 0) {
          petell.respawning = true;

          // Spawn summoned mob here, at the petell's last position
          if (petell.summon) {
            spawnMob(petellX, petellY, Math.max(petell.rarity - 1, 0), petell.summon, 0, 1, p.id);
          }

          setTimeout(() => {
            petell.hp = petell.maxhp;
            petell.respawning = false;
            if (petell.heal) {
              p.curhp = Math.min(p.hp, p.curhp + petell.heal);
            }
          }, petell.reload * 1000);
        }
      }

      // Petell damages mob
      if (circlesCollide(petellX, petellY, 2.5, mob.x, mob.y, mob.radius) && mob.team !== p.team) {
        mob.curhp -= Math.max(0, petell.dmg - mob.armor);
        logDamage(mob, p.id, Math.max(0, petell.dmg - mob.armor));

  // Spawn hole mobs if mob has holeSpawns
  if (mob.holeSpawns && mob.holeSpawns.length > 0) {
    // Spawn 1 to 3 mobs
    const numToSpawn = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numToSpawn; i++) {
      // Pick random mob from holeSpawns
      const spawnName = mob.holeSpawns[Math.floor(Math.random() * mob.holeSpawns.length)];
      // Pick rarity 1-2 below, min 0
      const spawnRarity = Math.max(0, mob.rarity - (Math.floor(Math.random() * 2) + 1));
      // Spawn slightly offset from the burrow
      const offsetX = (Math.random() - 0.5) * mob.radius * 2;
      const offsetY = (Math.random() - 0.5) * mob.radius * 2;

      spawnMob(mob.x + offsetX, mob.y + offsetY, spawnRarity, spawnName, mob.angle);
    }
  }
        if (mob.curhp <= 0) {
          despawnMob(mob);
        }
      }
    }
  }
      }


      // 3) Player hits mob
      if (circlesCollide(p.x, p.y, 10, mob.x, mob.y, mob.hitbox_size) & mob.team !== p.team) {
        mob.curhp -= 20;
        logDamage(mob, p.id, 20);
        if (mob.curhp <= 0) {
          despawnMob(mob);
        }
      }
    }
  }
  const UPDATE_RANGE = 1000; // max distance to update mobs
for (let mob of mobs) {

  // Default values
  mob.vx = 0;
  mob.vy = 0;

  const closestPlayer = Object.values(players).reduce((closest, p) => {
    const d2 = distSq(mob.x, mob.y, p.x, p.y);
    if (!closest || d2 < closest.d2) return { player: p, d2 };
    return closest;
  }, null);

  const distanceToClosest = closestPlayer ? Math.sqrt(closestPlayer.d2) : Infinity;
  const player = closestPlayer?.player;
  const range = Math.max(500, 100 * (mob.radius / 15));

  // Skip mobs too far away from all players
  if (distanceToClosest > UPDATE_RANGE) {
    continue; // skip rest of this mob's update
  }

  // STATE TRANSITIONS
  if (mob.behavior === "passive") {
    mob.state = "idle";
  } else if (mob.behavior === "neutral") {
    if (mob.state === "idle") {
      for (let pId in players) {
        const p = players[pId];
        if (circlesCollide(p.x, p.y, 10, mob.x, mob.y, mob.hitbox_size) && mob.team !== p.team) {
          mob.state = "aggro";
          mob.aggroTargetId = p.id;
        }
        for (let pet of p.petells) {
          const radius = p.petellOrbitRadius;
          const px = p.x + Math.cos(pet.angle) * radius;
          const py = p.y + Math.sin(pet.angle) * radius;
          if (circlesCollide(px, py, 2.5, mob.x, mob.y, mob.hitbox_size)) {
            mob.state = "aggro";
            mob.aggroTargetId = p.id;
          }
        }
      }
    } else if (distanceToClosest > range) {
      mob.state = "idle";
      mob.aggroTargetId = null;
    }
  } else if (mob.behavior === "hostile") {
    if (distanceToClosest <= range) {
      mob.state = "aggro";
      mob.aggroTargetId = player.id;
    } else {
      mob.state = "idle";
      mob.aggroTargetId = null;
    }
  }

  // STATE ACTIONS
  const speed = 2.5; // Match player speed

if (mob.state === "aggro" && mob.aggroTargetId != null) {
  const target = players[mob.aggroTargetId];
  switch (mob.aggroType) {
  case "chase": {
      if (target) {
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        mob.vx = (dx / len) * speed;
        mob.vy = (dy / len) * speed;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;
      }
    break;
  }
  case "fast_chase": {
      if (target) {
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        mob.vx = (dx / len) * 3;
        mob.vy = (dy / len) * 3;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;
      }
    break;
  }
  case "slow_turn": {
      if (target) {
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.05;
        mob.vx += Math.cos(mob.angle) * 3.2;
        mob.vy += Math.sin(mob.angle) * 3.2;
      }
    break;
  }
  case "hornet": {
      if (target) {
        let dx = target.x - mob.x;
        let dy = target.y - mob.y;

        // Predictive aiming if rarity > 3
        if (mob.rarity > 3) {
          const predictionScale = 10; // tweak this value to adjust prediction strength
          dx += target.vx * predictionScale;
          dy += target.vy * predictionScale;
        }

        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;

        const stopDistance = mob.hitbox_size * 5;
        if (len > stopDistance) {
          mob.vx = (dx / len) * speed;
          mob.vy = (dy / len) * speed;
        } else {
          mob.vx = 0;
          mob.vy = 0;
        }

        // Missile spawn logic
        if (!mob.missileTimer) mob.missileTimer = 0;
        mob.missileTimer++;
        if (mob.missileTimer >= 60) { // fire every 60 frames (~1s)
          mob.missileTimer = 0;

          const missileOffset = mob.hitbox_size + 10;
          const spawnX = mob.x + Math.cos(mob.angle) * missileOffset;
          const spawnY = mob.y + Math.sin(mob.angle) * missileOffset;

          spawnMob(spawnX, spawnY, Math.max(mob.rarity, 0), "Missile", mob.angle);
        }
      }
    break;
  }
  case "wasp": {
      if (target) {
        let dx = target.x - mob.x;
        let dy = target.y - mob.y;

        // Predictive aiming if rarity > 3
        if (mob.rarity > 3) {
          const predictionScale = 10; // tweak this value to adjust prediction strength
          dx += target.vx * predictionScale;
          dy += target.vy * predictionScale;
        }

        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;

        const stopDistance = mob.hitbox_size * 5;
        if (len > stopDistance) {
          mob.vx = (dx / len) * speed;
          mob.vy = (dy / len) * speed;
        } else {
          mob.vx = 0;
          mob.vy = 0;
        }

        // Missile spawn logic
        if (!mob.missileTimer) mob.missileTimer = 0;
        mob.missileTimer++;
        if (mob.missileTimer >= 30) { // fire every 30 frames (~.5s)
          mob.missileTimer = 0;

          const missileOffset = mob.hitbox_size + 10;
          const spawnX = mob.x + Math.cos(mob.angle) * missileOffset;
          const spawnY = mob.y + Math.sin(mob.angle) * missileOffset;

          spawnMob(spawnX, spawnY, Math.max(mob.rarity, 0), "Wasp Missile", mob.angle);
        }
      }
    break;
  }
  case "hel_wasp": {
      if (target) {
        let dx = target.x - mob.x;
        let dy = target.y - mob.y;

        // Predictive aiming if rarity > 3
        if (mob.rarity > 3) {
          const predictionScale = 10; // tweak this value to adjust prediction strength
          dx += target.vx * predictionScale;
          dy += target.vy * predictionScale;
        }

        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;

        const stopDistance = mob.hitbox_size * 5;

        // --- RECOIL HANDLING (push + smooth return) ---
        // If we're in a recoil phase, override movement by directly tweening position/angle
        if (mob.recoilState) {
          mob.recoilTimer = (mob.recoilTimer || 0) + 1;

          if (mob.recoilState === "pushed") {
            // push lasts a few frames so the shove is visible
            const pushDuration = 6; // frames (tweak for a faster/slower visible shove)
            const t = Math.min(1, mob.recoilTimer / pushDuration);
            // ease-out: 1 - (1 - t)^2
            const ease = 1 - Math.pow(1 - t, 2);

            mob.x = mob.recoilPre.x + mob.recoilOffset.x * ease;
            mob.y = mob.recoilPre.y + mob.recoilOffset.y * ease;
            mob.angle = mob.recoilPre.angle + (mob.recoilAngleOffset || 0) * ease;

            // zero velocities so physics won't fight our direct position set
            mob.vx = 0;
            mob.vy = 0;

            if (mob.recoilTimer >= pushDuration) {
              mob.recoilState = "return";
              mob.recoilTimer = 0;
            }
          } else if (mob.recoilState === "return") {
            // smooth return to pre-fire spot
            const returnDuration = Math.max(8, Math.floor(12 / (1 + mob.rarity * 0.08))); // rarer wasps return faster
            const tr = Math.min(1, mob.recoilTimer / returnDuration);
            // ease-in: tr^2
            const easeIn = tr * tr;

            mob.x = mob.recoilPre.x + mob.recoilOffset.x * (1 - easeIn);
            mob.y = mob.recoilPre.y + mob.recoilOffset.y * (1 - easeIn);
            mob.angle = mob.recoilPre.angle + (mob.recoilAngleOffset || 0) * (1 - easeIn);

            // keep velocities zero while returning to avoid oscillation
            mob.vx = 0;
            mob.vy = 0;

            if (mob.recoilTimer >= returnDuration) {
              // finished return, clear recoil state and resume normal AI
              delete mob.recoilState;
              delete mob.recoilTimer;
              delete mob.recoilPre;
              delete mob.recoilOffset;
              delete mob.recoilAngleOffset;
              mob.vx = 0;
              mob.vy = 0;
            }
          }
        } else {
          // normal movement towards the target
          if (len > stopDistance) {
            mob.vx = (dx / len) * speed;
            mob.vy = (dy / len) * speed;
          } else {
            mob.vx = 0;
            mob.vy = 0;
          }
        }

        // Missile spawn logic
        if (!mob.missileTimer) mob.missileTimer = 0;
        mob.missileTimer++;
        if (mob.missileTimer >= 30) { // fire every 30 frames (~0.5s)
          mob.missileTimer = 0;

          // Generate 6 random position and angle offsets
          const offsets = [];
          for (let i = 0; i < 6; i++) {
            offsets.push({
              posX: ((Math.random() - 0.5) * 3) * (mob.hitbox_size * 0.56), // slight random X offset (-5 to +5)
              posY: ((Math.random() - 0.5) * 1.5) * (mob.hitbox_size * 0.56), // slight random Y offset (-5 to +5)
              angleOffset: (Math.random() - 0.5) * 0.2 // slight angle offset (-0.1 to +0.1 rad)
            });
          }

          const missileOffset = mob.hitbox_size - 3;
          for (const off of offsets) {
            const spawnX = mob.x + Math.cos(mob.angle + off.angleOffset) * missileOffset + off.posX;
            const spawnY = mob.y + Math.sin(mob.angle + off.angleOffset) * missileOffset + off.posY;

            spawnMob(spawnX, spawnY, Math.max(mob.rarity, 0), "Hel Wasp Missile", mob.angle + off.angleOffset);
          }

          // --- Replace previous immediate displacement with a deterministic push+return ---
          // Store pre-fire pose
          mob.recoilPre = { x: mob.x, y: mob.y, angle: mob.angle };

          // recoil magnitude base (visual push) scaled by rarity
          const recoilBase = 1.6;
          const recoilScale = 1 + (mob.rarity * 0.12);
          const immediateRecoil = recoilBase * recoilScale;

          // Offset we will tween to (negative = pushed backwards)
          mob.recoilOffset = {
            x: -Math.cos(mob.angle) * immediateRecoil * 6, // multiply so it's visually noticeable
            y: -Math.sin(mob.angle) * immediateRecoil * 6
          };

          // small angle offset to make the kick look lively
          mob.recoilAngleOffset = (Math.random() - 0.5) * 0.06;

          // initialize recoil state to start push phase
          mob.recoilState = "pushed";
          mob.recoilTimer = 0;
        }
      }
    break;
  }
  case "mantis": {
      if (target) {
        let dx = target.x - mob.x;
        let dy = target.y - mob.y;

        // Predictive aiming if rarity > 3
        if (mob.rarity > 3) {
          const predictionScale = 50; // tweak this value to adjust prediction strength
          dx += target.vx * predictionScale;
          dy += target.vy * predictionScale;
        }

        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;

        const stopDistance = mob.hitbox_size * 5;
        if (len > stopDistance) {
          mob.vx = (dx / len) * speed;
          mob.vy = (dy / len) * speed;
        } else {
          mob.vx = 0;
          mob.vy = 0;
        }

        // Missile spawn logic
        if (!mob.missileTimer) mob.missileTimer = 0;
        if (!mob.peaShootCount) mob.peaShootCount = 0;
        if (!mob.peaShootTimer) mob.peaShootTimer = 0;

        mob.missileTimer++;

        if (mob.missileTimer >= 60) { // start shooting sequence every 60 frames (~1s)
            if (mob.peaShootCount === 0) {
               mob.peaShootCount = 3;  // total peas to shoot
               mob.peaShootTimer = 0;  // reset shoot timer
            }
            mob.missileTimer = 0;
        }

        if (mob.peaShootCount > 0) {
           mob.peaShootTimer++;
           if (mob.peaShootTimer >= 15) {  // 15 frames = 0.25 seconds
                mob.peaShootTimer = 0;

               const missileOffset = mob.hitbox_size + 10;
                const spawnX = mob.x + Math.cos(mob.angle) * missileOffset;
               const spawnY = mob.y + Math.sin(mob.angle) * missileOffset;

                spawnMob(spawnX, spawnY, Math.max(mob.rarity, 0), "Mantis Pea", mob.angle);

               mob.peaShootCount--;
            }
        }
      }
    break;
  }
  case "scorp": {
      if (target) {
        let dx = target.x - mob.x;
        let dy = target.y - mob.y;

        // Predictive aiming if rarity > 3
        if (mob.rarity > 3) {
          const predictionScale = 20; // tweak this value to adjust prediction strength
          dx += target.vx * predictionScale;
          dy += target.vy * predictionScale;
        }

        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;

        const stopDistance = mob.hitbox_size * 5;
        if (len > stopDistance) {
          // Normalize direction
          const nx = dx / len;
          const ny = dy / len;

          // Add perpendicular (circle around) component
          const orbitStrength = 0.6; // tweak: higher = more circling
          const px = -ny; // perpendicular x
          const py = nx;  // perpendicular y

          mob.vx = (nx + px * orbitStrength) * speed * 1.5;
          mob.vy = (ny + py * orbitStrength) * speed * 1.5;
        } else {
          mob.vx = 0;
          mob.vy = 0;
        }

        // Missile spawn logic
        if (!mob.missileTimer) mob.missileTimer = 0;
        mob.missileTimer++;
        if (mob.missileTimer >= 60) { // fire every 30 frames (~.5s)
          mob.missileTimer = 0;

          const missileOffset = mob.hitbox_size + 10;
          const spawnX = mob.x + Math.cos(mob.angle) * missileOffset;
          const spawnY = mob.y + Math.sin(mob.angle) * missileOffset;

          spawnMob(spawnX, spawnY, Math.max(mob.rarity, 0), "Scorpion Missile", mob.angle);
        }
      }
    break;
  }
  case "sine": {
      if (target) {
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const dirX = dx / len;
        const dirY = dy / len;

        const perpX = -dirY;
        const perpY = dirX;

        mob.circleTime += 0.15; // controls wave speed
        const waveOffset = Math.sin(mob.circleTime) * 2; // tweak amplitude

        mob.vx = (dirX * 3.5) + (perpX * waveOffset);
        mob.vy = (dirY * 3.5) + (perpY * waveOffset);

        mob.angle = Math.atan2(mob.vy, mob.vx);
      }
    break;
  }  
  case "fear": {
      if (target) {
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        const dirX = -dx / len;
        const dirY = -dy / len;

        const perpX = -dirY;
        const perpY = dirX;

        mob.circleTime += 0.15; // controls wave speed
        const waveOffset = Math.sin(mob.circleTime) * 2; // tweak amplitude

        mob.vx = (dirX * 3.5) + (perpX * waveOffset);
        mob.vy = (dirY * 3.5) + (perpY * waveOffset);

        mob.angle = Math.atan2(mob.vy, mob.vx);
      }
    break;
  }  
  case "hop": {
    if (target) {
      mob.nextHopTime ??= 0;
      const now         = Date.now();
      const interval    = 500;                     // ms between hops
      const maxHopDist  = speed * (interval / 1000); // distance = speed (pixels/sec) × seconds

      // smooth angle turning
      const dx     = target.x - mob.x;
      const dy     = target.y - mob.y;
      const len    = Math.sqrt(dx * dx + dy * dy) || 1;
      const dirX   = dx / len;
      const dirY   = dy / len;
      const targetAngle = Math.atan2(dy, dx);
      let angleDiff     = targetAngle - mob.angle;
      if (angleDiff > Math.PI)  angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      mob.angle += angleDiff * 0.15;

      // perform the leap
      if (now >= mob.nextHopTime) {
        // hop distance is at most maxHopDist, or exactly to the player if closer
        const hopDist = Math.min(len, maxHopDist);
        mob.vx += dirX * hopDist * 30;
        mob.vy += dirY * hopDist * 30;
        mob.nextHopTime = now + interval;
      }
    }
    break;
  }
  case "queen_ant": {
    if (target) {
      const dx = target.x - mob.x;
      const dy = target.y - mob.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      mob.vx = (dx / len) * speed;
      mob.vy = (dy / len) * speed;

      const targetAngle = Math.atan2(dy, dx);
      let angleDiff = targetAngle - mob.angle;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      mob.angle += angleDiff * 0.15;

      // Initialize timer and count if not present
      if (mob.timerQueen === undefined) mob.timerQueen = 0;
      if (mob.soldierAntCount === undefined) mob.soldierAntCount = 0;

      const spawnDistance = mob.hitbox_size + ((20 / 1.5) * sizeScaling[Math.max(mob.rarity - 1, 0)]);

      mob.timerQueen++;

      if (mob.timerQueen >= 60 && mob.soldierAntCount < 20) {
        // Assuming 60 FPS => 60 frames ~ 1 second
        mob.timerQueen = 0;

        const spawnAngle = mob.angle + Math.PI;
        const spawnX = mob.x + Math.cos(spawnAngle) * spawnDistance;
        const spawnY = mob.y + Math.sin(spawnAngle) * spawnDistance;

        spawnMob(spawnX, spawnY, Math.max(mob.rarity - 1, 0), "Soldier Ant", 0);
        mob.soldierAntCount++;
      }
    }
    break;
  }
  case "jellyfish": {
    if (target) {
      let dx = target.x - mob.x;
      let dy = target.y - mob.y;

      // Predictive aiming if rarity > 3
      if (mob.rarity > 3) {
        const predictionScale = 10; // tweak this value to adjust prediction strength
        dx += target.vx * predictionScale;
        dy += target.vy * predictionScale;
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - mob.angle;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    mob.angle += angleDiff * 0.15;

    const stopDistance = mob.hitbox_size * 5;
    if (len > stopDistance) {
      mob.vx = (dx / len) * speed;
      mob.vy = (dy / len) * speed;
    } else {
      mob.vx = 0;
      mob.vy = 0;
    }
    }
    break;
  }
  case "roach": {
      if (target) {
        const hpRatio = mob.curhp/mob.hp;
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        mob.vx = (dx / len) * 12.5 * hpRatio;
        mob.vy = (dy / len) * 12.5 * hpRatio;

        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - mob.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        mob.angle += angleDiff * 0.15;
      }
    break;
  }
  // Add other aggroTypes if needed...
}
} else if (mob.state === "idle") {
switch(mob.idleType) {
  case "wander": {
    // initialize timers & targets
    if (mob.wanderTimer    === undefined) mob.wanderTimer    = 0;
    if (mob.wanderInterval === undefined) mob.wanderInterval = 3;    // seconds between direction changes
    if (mob.targetAngle    === undefined) mob.targetAngle    = Math.random() * Math.PI * 2;

    // increment timer (assuming each tick ≈1/60 second)
    mob.wanderTimer += 1 / 60;

    // time to pick a new direction?
    if (mob.wanderTimer >= mob.wanderInterval) {
      mob.targetAngle = Math.random() * Math.PI * 2;
      mob.wanderTimer = 0;
    }

    // compute smallest difference to target angle
    let angleDiff = mob.targetAngle - mob.angle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    // smooth turn: change just a bit each frame
    const turnSpeed = 0.05; 
    mob.angle += angleDiff * turnSpeed;

    // move forward in the (newly adjusted) angle
    const speed = 1; 
    mob.vx += Math.cos(mob.angle) * speed;
    mob.vy += Math.sin(mob.angle) * speed;

    break;
  }
  case "flesh_pillar": {
      // only act when dead
      if (mob.curhp > 0) break;

      // avoid double-spawn if this code runs multiple frames after death
      if (mob._fleshPillarHandled) break;
      mob._fleshPillarHandled = true;

      // sanity checks / debug
      if (typeof spawnMob !== "function") {
        console.error("spawnMob is not defined — cannot spawn flesh pillar minions.");
        break;
      }

      const choices = ["Hel Beetle", "Hel Wasp", "Hel Jellyfish", "Hel Spider"];

      // how many to spawn: base 3..5, plus extras depending on rarity
      const baseCount = 3 + Math.floor(Math.random() * 3); // 3..5
      const rarityExtra = Math.floor(mob.rarity / 2); // +1 per 2 rarity (tweakable)
      const totalCount = Math.max(1, Math.min(12, baseCount + rarityExtra)); // clamp to reasonable limits

      // spawn radius around pillar (bigger for larger hitboxes/rarity)
      const spawnRadius = (mob.hitbox_size || 20) + 20 + (mob.rarity || 0) * 6;

      const fullCircle = Math.PI * 2;
      let spawned = 0;
      for (let i = 0; i < totalCount; i++) {
        // evenly space with jitter
        const baseAngle = (i / totalCount) * fullCircle;
        const angle = baseAngle + (Math.random() - 0.5) * 0.28;

        // circular position + small radial jitter
        const rJitter = (Math.random() - 0.5) * Math.min(12, spawnRadius * 0.15);
        const spawnX = mob.x + Math.cos(angle) * (spawnRadius + rJitter);
        const spawnY = mob.y + Math.sin(angle) * (spawnRadius + rJitter);

        // pick type and verify it exists (common bug: name mismatch)
        const chosenType = choices[Math.floor(Math.random() * choices.length)];
        // Optional: verify name exists in mobTypes if that array is available
        if (typeof mobTypes !== "undefined" && Array.isArray(mobTypes)) {
          const found = mobTypes.find(t => t.name === chosenType);
          if (!found) {
            console.warn(`flesh_pillar: chosen type "${chosenType}" not found in mobTypes — skipping this spawn.`);
            continue;
          }
        }

        // spawn rarity: average ~1 below pillar, with +/-1 random noise, clamped 0..7
        let spawnRarity = Math.round((mob.rarity || 0) - 1 + (Math.random() - 0.5) * 2);
        spawnRarity = Math.max(0, Math.min(7, spawnRarity));

        // spawn facing outward from pillar
        const spawnAngle = angle + Math.PI + (Math.random() - 0.5) * 0.4;

        // call spawnMob using the signature you provided
        try {
          spawnMob(mob.x, mob.y, spawnRarity, chosenType, spawnAngle);
          spawned++;
        } catch (err) {
          console.error("spawnMob threw an error:", err);
        }
      }

      console.log(`Flesh Pillar died at (${mob.x.toFixed(1)},${mob.y.toFixed(1)}) — attempted to spawn ${totalCount}, actually spawned ${spawned}.`);
      break;
  }
  case "missile": {
    const missileSpeed = 5 * 1.5; // 25 units/frame

    // Convert your angle to radians *once*
    const rad = mob.angle;// * (Math.PI / 180);

    // 
    mob.vx += Math.cos(rad) * missileSpeed;
    mob.vy += Math.sin(rad) * missileSpeed;

    // Handle lifetime
    if (mob.lifetime === undefined) mob.lifetime = 0;
    if (++mob.lifetime >= 60 * 1) {
      despawnMob(mob);
    }
    break;
  }
  case "circle": {
    if (mob.circleTime === undefined) mob.circleTime = 0;
    mob.circleTime += 0.05; // controls oscillation speed

    // Add a small sin-based wobble to angle
    const angleOffset = Math.sin(mob.circleTime) * 0.5; // tweak 0.5 for wider curves
    mob.angle += angleOffset * 0.02; // smooth curve over time
    mob.angle += .002;

    // Move forward slowly
    const speed = 0.8; // lower than wander
    mob.vx += Math.cos(mob.angle) * speed;
    mob.vy += Math.sin(mob.angle) * speed;

    break;
  }
  case "crazy": {
  // Gog-mode activated: smooth wandering (gradual direction changes + smoothed velocity)
    if (mob.wanderAngle === undefined) mob.wanderAngle = Math.random() * Math.PI * 2;
    if (mob.wanderSpeed === undefined) mob.wanderSpeed = 0.6;  // desired movement speed
    if (mob.wanderTurn === undefined) mob.wanderTurn = 0.12;   // how fast the angle jitters
    if (mob.wanderSmooth === undefined) mob.wanderSmooth = 0.06; // smoothing factor (0..1)

    // jitter the target angle a little each frame
    mob.wanderAngle += (Math.random() * 2 - 1) * mob.wanderTurn;

    // target velocity from the angle
    const desiredVx = Math.cos(mob.wanderAngle) * mob.wanderSpeed;
    const desiredVy = Math.sin(mob.wanderAngle) * mob.wanderSpeed;

    // smoothly move current velocity toward the desired velocity
    mob.vx += (desiredVx - mob.vx) * mob.wanderSmooth;
    mob.vy += (desiredVy - mob.vy) * mob.wanderSmooth;
    break;
  }
  case "sine": { 
    if (mob.wanderTimer === undefined) mob.wanderTimer = 0;
    if (mob.wanderInterval === undefined) mob.wanderInterval = 3;
    if (mob.targetAngle === undefined) mob.targetAngle = Math.random() * Math.PI * 2;

    if (mob.circleTime === undefined) mob.circleTime = 0;

    mob.wanderTimer += 1 / 60;
    mob.circleTime += 1 / 10;

    if (mob.wanderTimer >= mob.wanderInterval) {
      mob.targetAngle = Math.random() * Math.PI * 2;
      mob.wanderTimer = 0;
    }

    let angleDiff = mob.targetAngle - mob.angle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    const turnSpeed = 0.05; 
    const angleOffset = Math.sin(mob.circleTime * 1.0) * 1.2;

    mob.angle += angleDiff * turnSpeed + convertAngleToRadians(angleOffset);

    const speed = 3; 
    mob.vx += Math.cos(mob.angle) * speed;
    mob.vy += Math.sin(mob.angle) * speed;
    break;
  }
  case "bumble": { 
    if (mob.wanderTimer === undefined) mob.wanderTimer = 0;
    if (mob.wanderInterval === undefined) mob.wanderInterval = 3;
    if (mob.targetAngle === undefined) mob.targetAngle = Math.random() * Math.PI * 2;

    if (mob.circleTime === undefined) mob.circleTime = 0;

    mob.wanderTimer += 1 / 60;
    mob.circleTime += 1 / 10;

    if (mob.wanderTimer >= mob.wanderInterval) {
      mob.targetAngle = Math.random() * Math.PI * 2;
      mob.wanderTimer = 0;
    }

    let angleDiff = mob.targetAngle - mob.angle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    const turnSpeed = 0.05; 
    const angleOffset = Math.sin(mob.circleTime * 1.0) * 1.2;

    mob.angle += angleDiff * turnSpeed + convertAngleToRadians(angleOffset);

    const speed = 3; 
    mob.vx += Math.cos(mob.angle) * speed;
    mob.vy += Math.sin(mob.angle) * speed;

    if (mob.pollenCD === undefined) mob.pollenCD = 0;
    mob.pollenCD++;

    if (mob.pollenCD >= 30) {
     spawnMob(mob.x, mob.y, mob.rarity, "Pollen");
      mob.pollenCD = 0;
    }   
    break;
  }
  case "despawn": {
    // Handle lifetime
    if (mob.lifetime === undefined) mob.lifetime = 0;
    if (++mob.lifetime >= 60 * 2) {
      despawnMob(mob);
    }
    break;
  }
}
}

// --- MOB VS MOB COLLISIONS ---
for (let i = 0; i < mobs.length; i++) {
  const mobA = mobs[i];
  if (mobA.intangible) continue;

  for (let j = i + 1; j < mobs.length; j++) {
    const mobB = mobs[j];
    if (mobB.intangible) continue;

    const dx = mobB.x - mobA.x;
    const dy = mobB.y - mobA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = mobA.hitbox_size + mobB.hitbox_size;

    if (dist < minDist && dist > 0.01) {
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      const massA = mobA.mass || 1;
      const massB = mobB.mass || 1;
      const totalMass = massA + massB;

      // Push each mob away from the other, with heavier mobs moving less
      const pushA = (massB / totalMass) * overlap;
      const pushB = (massA / totalMass) * overlap;

      mobA.x -= nx * pushA;
      mobA.y -= ny * pushA;
      mobB.x += nx * pushB;
      mobB.y += ny * pushB;

      // Optional: apply a simple "bounce" to velocity based on mass
      const bounce = 0.25; // lower = less bounce
      mobA.vx -= nx * bounce * (massB / totalMass);
      mobA.vy -= ny * bounce * (massB / totalMass);
      mobB.vx += nx * bounce * (massA / totalMass);
      mobB.vy += ny * bounce * (massA / totalMass);

      // === TEAM DAMAGE SECTION ===
      const teamA = mobA.team || 0;
      const teamB = mobB.team || 0;

      if (teamA !== teamB) {
        mobA.curhp -= mobB.dmg || 10;
        mobB.curhp -= mobA.dmg || 10;

        if (mobA.curhp <= 0) despawnMob(mobA);
        if (mobB.curhp <= 0) despawnMob(mobB);
      }
    }
  }
}

const hs = mob.hitbox_size;
const WALL_BUFFER = 2; // pixels or units, tweak as needed
const effectiveRadius = mob.hitbox_size + WALL_BUFFER;

const nextX = mob.x + mob.vx;
const nextY = mob.y + mob.vy;

const collisionX = isWallAt(nextX + effectiveRadius, mob.y) || isWallAt(nextX - effectiveRadius, mob.y);
const collisionY = isWallAt(mob.x, nextY + effectiveRadius) || isWallAt(mob.x, nextY - effectiveRadius);

if (!collisionX) {
  mob.x = nextX;
} else {
  mob.vx = 0;
  // Optional: pull mob slightly away from wall to prevent "catching"
  mob.x = Math.round(mob.x);
}

if (!collisionY) {
  mob.y = nextY;
} else {
  mob.vy = 0;
  mob.y = Math.round(mob.y);
}

mob.vx *= 0.9; // or 0.85 for faster decay
mob.vy *= 0.9;

// 3) Clamp within bounds once
mob.x = Math.max(hs, Math.min(map.x - hs, mob.x));
mob.y = Math.max(hs, Math.min(map.y - hs, mob.y));
  // TAIL HANDLING
  if (mob.tail) {
    // desired fixed distance between follower and leader
    const desiredDist = mob.hitbox_size * 1.5;

    // init tail points if missing (9 points)
    if (!Array.isArray(mob.tailPoints) || mob.tailPoints.length !== 9) {
      mob.tailPoints = new Array(9).fill(0).map((_, i) => {
        // place initial points directly behind the mob along mob.angle
        const behindAngle = mob.angle + Math.PI;
        return {
          x: mob.x + Math.cos(behindAngle) * desiredDist * (i + 1),
          y: mob.y + Math.sin(behindAngle) * desiredDist * (i + 1)
        };
      });
    }

    // update each tail point to be exactly desiredDist from the leader
    for (let t = 0; t < mob.tailPoints.length; t++) {
      const leaderX = (t === 0) ? mob.x : mob.tailPoints[t - 1].x;
      const leaderY = (t === 0) ? mob.y : mob.tailPoints[t - 1].y;
      const p = mob.tailPoints[t];

      // vector from leader -> current follower
      let dx = p.x - leaderX;
      let dy = p.y - leaderY;
      let dist = Math.sqrt(dx * dx + dy * dy);

      // if distance is extremely small, pick a sensible default direction
      if (dist < 0.0001) {
        // prefer trailing directly behind the leader using mob.angle (for t===0)
        // or reuse previous point direction if available
        let ux = -Math.cos(mob.angle);
        let uy = -Math.sin(mob.angle);
        if (t > 0) {
          const prev = mob.tailPoints[t - 1];
          ux = (p.x - prev.x) || ux;
          uy = (p.y - prev.y) || uy;
          const l = Math.sqrt(ux * ux + uy * uy) || 1;
          ux /= l; uy /= l;
        }
        p.x = leaderX + ux * desiredDist;
        p.y = leaderY + uy * desiredDist;
        continue;
      }

      // normalized direction from leader to follower (preserve current orientation)
      const ux = dx / dist;
      const uy = dy / dist;

      // set follower so it's exactly desiredDist away along that direction
      p.x = leaderX + ux * desiredDist;
      p.y = leaderY + uy * desiredDist;
    }
  }
}

const now = Date.now();

for (let key of poisonStatus.keys()) {
  const status = poisonStatus.get(key);
  if (now - status.lastTick >= POISON_INTERVAL) {
    // Extract player id from key (e.g. "player_123_poison")
    const playerId = key.split('_')[1];
    const player = players[playerId];
    if (player) {
      player.curhp -= status.damage;

      // Update last tick time
      status.lastTick = now;

      // If player dies from poison, respawn them and clear poison
      if (player.curhp <= 0) {
        player.x = Math.random() * 580 + 10;
        player.y = Math.random() * 380 + 10;
        player.petells = generatePetells();
        player.curhp = player.hp;
        poisonStatus.delete(key);
      }
    } else {
      // Player might be gone; clear poison effect
      poisonStatus.delete(key);
    }
  }
}

  broadcast({
    type: "state",
    players,
    mobs
  });
}, 1000 / 60);

// Helper function to convert degrees to radians
function convertAngleToRadians(angle) {
  return angle * (Math.PI / 180);
}

function broadcast(data) {
  const str = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  });
}

// === map setup ===
// Legend:
// "w" = wall, "s" = spawn, number = rarity spawn zone
export const gardenMap = [
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        1.66,
        1.56,
        1.45,
        1.35,
        1.25,
        1.14,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.26,
        4.36,
        "w",
        4.57,
        "w",
        4.78,
        "w",
        "w"
    ],
    [
        "w",
        1.56,
        1.45,
        1.35,
        1.25,
        1.14,
        1.04,
        1.14,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        "w"
    ],
    [
        "w",
        1.45,
        1.35,
        1.25,
        1.14,
        1.04,
        0.94,
        1.04,
        1.14,
        1.25,
        1.14,
        1.04,
        0.94,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        "w",
        "w",
        "w",
        3.53,
        3.64,
        3.74,
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        "w"
    ],
    [
        "w",
        1.35,
        1.25,
        1.14,
        1.04,
        0.94,
        0.83,
        0.94,
        "0",
        "0",
        "0",
        "0",
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        3.22,
        3.32,
        3.43,
        3.53,
        3.64,
        3.74,
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        "w",
        "w"
    ],
    [
        "w",
        1.25,
        1.14,
        1.04,
        0.94,
        0.83,
        0.73,
        "0",
        "0",
        "0",
        "0",
        "0",
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        3.22,
        3.32,
        3.43,
        3.53,
        "w",
        "w",
        "w",
        "w",
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        "w"
    ],
    [
        "w",
        "w",
        1.04,
        0.94,
        0.83,
        0.73,
        0.62,
        "0",
        "0",
        "s",
        "0",
        "0",
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        3.22,
        3.32,
        3.43,
        "w",
        "w",
        "w",
        "w",
        "w",
        4.47,
        4.57,
        4.68,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        0.83,
        0.73,
        0.62,
        0.52,
        "0",
        "0",
        "0",
        "0",
        "0",
        0.52,
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        3.22,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.68,
        4.78,
        4.88,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        0.73,
        0.62,
        0.52,
        0.42,
        "0",
        "0",
        "0",
        "0",
        "0",
        0.42,
        0.52,
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.57,
        4.68,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        0.62,
        0.52,
        0.42,
        0.31,
        0.21,
        0.1,
        0,
        0.1,
        0.21,
        0.31,
        0.42,
        0.52,
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.36,
        4.47,
        4.57,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        0.62,
        0.52,
        0.42,
        0.31,
        0.21,
        0.1,
        0.21,
        0.31,
        0.42,
        0.52,
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        1.97,
        2.08,
        2.18,
        2.29,
        2.39,
        2.49,
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        "w",
        "w",
        "w",
        "w",
        4.05,
        4.16,
        4.26,
        4.36,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.42,
        0.31,
        0.21,
        0.31,
        0.42,
        0.52,
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        1.35,
        1.45,
        1.56,
        1.66,
        1.77,
        1.87,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        2.6,
        2.7,
        2.81,
        2.91,
        3.01,
        3.12,
        3.22,
        3.32,
        3.43,
        "w",
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.42,
        0.31,
        0.42,
        0.52,
        0.62,
        0.73,
        0.83,
        0.94,
        1.04,
        1.14,
        1.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.01,
        3.12,
        3.22,
        3.32,
        3.43,
        3.53,
        3.64,
        3.74,
        3.84,
        3.95,
        4.05,
        4.16,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.62,
        0.52,
        0.42,
        0.52,
        0.62,
        0.73,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.32,
        3.43,
        3.53,
        3.64,
        3.74,
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.62,
        0.52,
        0.62,
        0.73,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.53,
        3.64,
        3.74,
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.83,
        0.73,
        0.62,
        "w",
        0.83,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.64,
        3.74,
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        4.36,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        1.04,
        0.94,
        0.83,
        "w",
        "w",
        0.94,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.84,
        3.95,
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        1.14,
        1.04,
        "w",
        "w",
        "w",
        1.04,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.95,
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        4.57,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        1.45,
        1.35,
        1.25,
        1.14,
        "w",
        "w",
        1.25,
        1.14,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        1.66,
        1.56,
        1.45,
        1.35,
        1.25,
        "w",
        "w",
        1.35,
        1.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        1.87,
        1.77,
        1.66,
        1.56,
        1.45,
        1.35,
        1.45,
        1.56,
        1.45,
        1.35,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        "w",
        "w"
    ],
    [
        "w",
        2.08,
        1.97,
        1.87,
        1.77,
        "w",
        1.56,
        1.45,
        1.56,
        1.66,
        1.56,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.57,
        4.68,
        "w",
        "w",
        4.99,
        5.09,
        5.19,
        "w",
        "w"
    ],
    [
        "w",
        2.18,
        2.08,
        1.97,
        "w",
        "w",
        1.66,
        1.56,
        1.66,
        1.77,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        5.4,
        "w"
    ],
    [
        "w",
        2.29,
        2.18,
        2.08,
        "w",
        "w",
        1.77,
        1.66,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.78,
        4.88,
        4.99,
        "w",
        5.19,
        5.3,
        5.4,
        5.51,
        "w"
    ],
    [
        "w",
        2.39,
        2.29,
        "w",
        "w",
        "w",
        1.87,
        1.77,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.88,
        4.99,
        5.09,
        "w",
        "w",
        5.4,
        5.51,
        5.61,
        "w"
    ],
    [
        "w",
        2.49,
        2.39,
        "w",
        "w",
        2.08,
        1.97,
        1.87,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.09,
        5.19,
        5.3,
        5.4,
        5.51,
        5.61,
        "w",
        "w"
    ],
    [
        "w",
        2.6,
        2.49,
        2.39,
        2.29,
        2.18,
        "w",
        1.97,
        2.08,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.19,
        "w",
        5.4,
        5.51,
        5.61,
        5.71,
        5.82,
        "w"
    ],
    [
        "w",
        2.7,
        2.6,
        "w",
        "w",
        2.29,
        "w",
        "w",
        2.18,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.3,
        "w",
        5.51,
        "w",
        5.71,
        5.82,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        2.7,
        2.81,
        "w",
        2.39,
        "w",
        "w",
        2.29,
        2.39,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.4,
        5.51,
        5.61,
        "w",
        5.82,
        5.92,
        6.03,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        2.91,
        "w",
        2.49,
        2.6,
        "w",
        2.39,
        2.49,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.61,
        5.51,
        5.61,
        "w",
        6.03,
        5.92,
        6.03,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        3.01,
        "w",
        "w",
        2.7,
        2.6,
        2.49,
        2.6,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.71,
        5.61,
        5.71,
        "w",
        6.13,
        6.03,
        6.13,
        6.23,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        3.12,
        3.01,
        2.91,
        2.81,
        2.7,
        2.6,
        2.7,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        5.92,
        5.82,
        5.71,
        5.82,
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        3.12,
        3.01,
        "w",
        2.81,
        2.7,
        2.81,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.03,
        5.92,
        "w",
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        3.22,
        3.12,
        "w",
        2.91,
        2.81,
        2.91,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.13,
        6.03,
        "w",
        "w",
        6.13,
        6.23,
        6.34,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        3.32,
        "w",
        "w",
        3.01,
        2.91,
        3.01,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.23,
        6.13,
        6.23,
        6.34,
        6.23,
        6.34,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        3.53,
        3.43,
        "w",
        "w",
        3.12,
        3.01,
        3.12,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.34,
        6.23,
        "w",
        6.44,
        6.34,
        6.44,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        3.74,
        3.64,
        3.53,
        3.43,
        3.32,
        3.22,
        3.12,
        3.22,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.44,
        6.34,
        6.44,
        "w",
        6.44,
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        3.95,
        3.84,
        3.74,
        3.64,
        3.53,
        3.43,
        3.32,
        3.22,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.55,
        6.44,
        6.55,
        "w",
        6.55,
        6.65,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        4.05,
        3.95,
        3.84,
        3.74,
        3.64,
        3.53,
        3.43,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.65,
        6.55,
        6.65,
        6.75,
        6.65,
        6.75,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        4.16,
        4.05,
        3.95,
        3.84,
        3.74,
        3.64,
        3.53,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.75,
        6.65,
        6.75,
        6.86,
        6.75,
        6.86,
        6.96,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        4.26,
        4.16,
        4.05,
        3.95,
        3.84,
        3.74,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.86,
        6.75,
        6.86,
        6.96,
        6.86,
        6.96,
        7.06,
        7.17,
        "w",
        "w"
    ],
    [
        "w",
        4.36,
        4.26,
        4.16,
        4.05,
        3.95,
        3.84,
        3.95,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        7.38,
        7.27,
        7.17,
        7.06,
        6.96,
        6.86,
        6.96,
        7.06,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        "w"
    ],
    [
        "w",
        4.47,
        4.36,
        4.26,
        4.16,
        4.05,
        3.95,
        4.05,
        "w",
        "w",
        "w",
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        5.4,
        5.51,
        5.61,
        5.71,
        5.82,
        5.92,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.75,
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        7.27,
        7.17,
        7.06,
        6.96,
        7.06,
        7.17,
        7.06,
        7.17,
        7.27,
        7.38,
        7.48,
        "w"
    ],
    [
        "w",
        4.57,
        4.47,
        4.36,
        4.26,
        4.16,
        4.05,
        4.16,
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        5.4,
        5.51,
        5.61,
        5.71,
        5.82,
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        6.44,
        6.55,
        6.65,
        6.75,
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        7.27,
        7.17,
        7.06,
        7.17,
        7.27,
        7.17,
        7.27,
        7.38,
        7.48,
        "w",
        "w"
    ],
    [
        "w",
        4.68,
        4.57,
        4.47,
        4.36,
        4.26,
        4.16,
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        5.4,
        5.51,
        5.61,
        5.71,
        5.82,
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        6.44,
        6.55,
        6.65,
        6.75,
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        7.48,
        7.38,
        7.27,
        7.17,
        7.27,
        7.38,
        7.27,
        7.38,
        7.48,
        7.58,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        4.68,
        4.57,
        4.47,
        4.36,
        4.26,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        5.4,
        5.51,
        5.61,
        5.71,
        5.82,
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        6.44,
        6.55,
        6.65,
        6.75,
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        7.48,
        7.58,
        7.48,
        7.38,
        7.27,
        7.38,
        7.48,
        7.38,
        7.48,
        7.58,
        7.69,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        4.68,
        4.57,
        4.47,
        4.36,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        5.4,
        5.51,
        5.61,
        5.71,
        5.82,
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        6.44,
        6.55,
        6.65,
        6.75,
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        7.48,
        7.58,
        7.69,
        7.58,
        7.48,
        7.38,
        7.48,
        7.58,
        7.48,
        7.58,
        7.69,
        7.79,
        7.9,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        4.78,
        4.68,
        4.57,
        4.47,
        4.57,
        4.68,
        4.78,
        4.88,
        4.99,
        5.09,
        5.19,
        5.3,
        "w",
        "w",
        "w",
        "w",
        "w",
        5.92,
        6.03,
        6.13,
        6.23,
        6.34,
        6.44,
        6.55,
        6.65,
        6.75,
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        7.38,
        7.48,
        "w",
        "w",
        "w",
        "w",
        "w",
        7.48,
        7.58,
        7.69,
        7.58,
        7.69,
        7.79,
        7.9,
        8,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        4.78,
        4.68,
        4.57,
        4.68,
        4.78,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        6.44,
        "w",
        6.65,
        "w",
        6.86,
        6.96,
        7.06,
        7.17,
        7.27,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        7.79,
        7.69,
        7.79,
        7.9,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ]
];
export const map = [
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        "w",
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        "w",
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        "w",
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        2.02,
        "w",
        "w",
        "w",
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        "w",
        "w",
        "w",
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        "w",
        "w",
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        "w",
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        0.4,
        0.54,
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        "w",
        "w",
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        "w",
        "w",
        "w",
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        "w"
    ],
    [
        "w",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        "w",
        "0",
        "0",
        "s",
        "0",
        "0",
        "0",
        "w",
        0.27,
        0.4,
        0.54,
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        "w",
        "w",
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        "w",
        "w",
        "w",
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        0,
        0.13,
        0.27,
        0.4,
        0.54,
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        "w",
        2.56,
        2.69,
        2.83,
        2.96,
        "w",
        "w",
        "w",
        "w",
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        0.13,
        0.27,
        0.4,
        0.54,
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        "w",
        2.42,
        2.56,
        2.69,
        2.83,
        "w",
        "w",
        "w",
        "w",
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "w",
        "w",
        "w",
        0.27,
        0.4,
        0.54,
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        2.02,
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        "w",
        "w",
        "w",
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "0",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.4,
        0.54,
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        "w",
        "w",
        "w",
        "w",
        2.02,
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        6.87,
        6.73,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        0.67,
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        "w",
        "w",
        "w",
        "w",
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        6.87,
        6.73,
        6.6,
        6.46,
        6.6,
        "w",
        6.6,
        "w",
        6.87,
        "w",
        "w",
        "w",
        "w",
        0.81,
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        "w",
        "w",
        "w",
        "w",
        "w",
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        6.87,
        6.73,
        6.6,
        6.46,
        6.33,
        6.46,
        6.33,
        6.46,
        6.6,
        6.73,
        6.87,
        "w",
        "w",
        "w",
        0.94,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        "w",
        "w",
        "w",
        "w",
        "w",
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.33,
        6.19,
        6.33,
        6.46,
        6.6,
        6.73,
        "w",
        "w",
        1.21,
        1.08,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        2.02,
        2.15,
        2.29,
        2.42,
        "w",
        "w",
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        6.19,
        6.06,
        6.19,
        6.33,
        6.46,
        6.6,
        "w",
        "w",
        1.35,
        1.21,
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        2.02,
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        "w",
        5.92,
        6.06,
        6.19,
        6.33,
        6.46,
        "w",
        "w",
        "w",
        1.35,
        1.48,
        1.62,
        1.75,
        1.88,
        2.02,
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.79,
        5.92,
        6.06,
        6.19,
        6.33,
        6.46,
        "w",
        "w",
        "w",
        1.62,
        1.75,
        1.88,
        2.02,
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.65,
        5.79,
        5.92,
        6.06,
        6.19,
        6.33,
        "w",
        "w",
        "w",
        1.75,
        1.88,
        2.02,
        2.15,
        2.29,
        2.42,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        6.06,
        6.19,
        "w",
        "w",
        "w",
        1.88,
        2.02,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.38,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        2.15,
        2.02,
        2.15,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        2.42,
        2.29,
        2.15,
        2.29,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        5.38,
        5.25,
        5.12,
        4.98,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        2.69,
        2.56,
        2.42,
        2.29,
        2.42,
        2.56,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.85,
        "w",
        "w",
        "w",
        "w",
        "w",
        2.96,
        2.83,
        2.69,
        2.56,
        2.42,
        2.56,
        2.69,
        2.83,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        4.98,
        4.85,
        "w",
        4.58,
        4.71,
        "w",
        "w",
        "w",
        3.37,
        3.23,
        3.1,
        2.96,
        2.83,
        2.69,
        2.56,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        4.71,
        4.58,
        4.44,
        "w",
        "w",
        3.77,
        3.63,
        3.5,
        3.37,
        3.23,
        3.1,
        2.96,
        2.83,
        2.69,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        3.77,
        3.63,
        3.5,
        3.37,
        3.23,
        3.1,
        2.96,
        2.83,
        2.96,
        3.1,
        3.23,
        3.37,
        3.5,
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        3.77,
        3.63,
        3.5,
        3.37,
        3.23,
        3.1,
        2.96,
        3.1,
        3.23,
        "w",
        "w",
        3.63,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        3.77,
        3.63,
        3.5,
        3.37,
        3.23,
        3.1,
        "w",
        "w",
        "w",
        "w",
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        3.77,
        3.63,
        3.5,
        3.37,
        "w",
        "w",
        "w",
        "w",
        4.04,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        5.12,
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        3.77,
        3.63,
        "w",
        "w",
        "w",
        "w",
        4.31,
        4.17,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        5.52,
        5.38,
        5.25,
        5.12,
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        3.77,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.31,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        3.9,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.44,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.04,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.58,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.17,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.71,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        4.98,
        4.85,
        4.71,
        4.58,
        4.44,
        4.31,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        4.85,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        "w",
        "w",
        "w",
        4.71,
        4.58,
        4.44,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        4.98,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        "w",
        "w",
        "w",
        "w",
        4.85,
        4.71,
        4.58,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.12,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        6.06,
        "w",
        "w",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        "w",
        "w",
        "w",
        5.12,
        4.98,
        4.85,
        4.71,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.25,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        6.06,
        6.19,
        6.33,
        "w",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        "w",
        "w",
        "w",
        5.25,
        5.12,
        4.98,
        4.85,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.38,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        6.06,
        6.19,
        6.33,
        6.46,
        "w",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        6.87,
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        4.98,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.52,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        6.06,
        6.19,
        6.33,
        6.46,
        6.6,
        "w",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.12,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.65,
        5.52,
        5.65,
        "w",
        "w",
        "w",
        "w",
        6.33,
        6.46,
        6.6,
        6.73,
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "7",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        7,
        6.87,
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.25,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        5.79,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "7",
        "w",
        "7",
        "7",
        "7",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        7,
        6.87,
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        5.38,
        5.52,
        5.65,
        5.79,
        5.92,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        7,
        6.87,
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        6.06,
        5.92,
        5.79,
        5.65,
        5.52,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "7",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        7,
        6.87,
        6.73,
        6.6,
        6.46,
        6.33,
        6.19,
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "7",
        "7",
        "w",
        "w",
        "7",
        "7",
        "w",
        "7",
        "w",
        "w",
        "w"
    ],
    [
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w",
        "w"
    ]
];

// Tile size in pixels
const TILE_SIZE = 1024; // adjust as needed

function isWallAt(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);

  // Catch NaNs
  if (isNaN(row) || isNaN(col)) {
    //console.error("isWallAt received NaN input!", { x, y, row, col });
    return true;
  }

  // Out-of-bounds or malformed map check
  if (
    row < 0 || 
    row >= map.length || 
    !Array.isArray(map[row]) ||
    col < 0 || 
    col >= map[row].length
  ) {
    console.warn(`Out of bounds in isWallAt: row=${row}, col=${col}, x=${x}, y=${y}`);
    return true;
  }

  return map[row][col] === 'w';
}

// Map dimensions
map.x = map[0].length * TILE_SIZE;
map.y = map.length * TILE_SIZE;

// === Player spawn update ===
function findSpawnTile() {
  const spawnTiles = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      if (map[row][col] === "s") {
        spawnTiles.push({ x: col, y: row });
      }
    }
  }
  const chosen = spawnTiles[Math.floor(Math.random() * spawnTiles.length)];
  return {
    x: chosen.x * TILE_SIZE + TILE_SIZE / 2,
    y: chosen.y * TILE_SIZE + TILE_SIZE / 2
  };
}

// Count all numeric tiles in the map
const numberTilesCount = map
  .flat()
  .filter(tile => /^\d$/.test(tile))
  .length;

// 10 mobs per numeric tile
const maxMobs = numberTilesCount * 3;
const mobList = {
  garden: ["Baby Ant", "Worker Ant", "Soldier Ant", "Spider", "Ladybug", "Bee", "Rock", "Hornet", "Yellowjacket", "Bumble Bee"],
  desert: ["Beetle", "Scorpion", "Cactus", "Sandstorm", "Dragonfly", "Soldier Fire Ant"/*, "Fire Ant Burrow"*/, "Shiny Ladybug"],
  ocean: ["Bubble", "Shell", "Jellyfish", "Leech", "Starfish", "Sponge", "Crab"],
  sewers: ["Fly", "Spider", "Moth", "Roach"],
  jungle: ["Wasp", "Mantis", "Yellowjacket", "Dark Ladybug", "Leafbug", "Cicada", "Dragonfly", "Bush"],
  cavern: ["Stonefly", "Stalagmite", "Cave Spider", "Pill Bug"],
  ant_hell: ["Baby Ant", "Worker Ant", "Soldier Ant", "Queen Ant", "Cave Spider", "Worm"], 
  hel: ["Flesh Pillar", "Hel Beetle", "Hel Spider", "Hel Jellyfish", "Hel Wasp"],
  factory: ["Barrel", "Mecha Wasp", "Mecha Spider", "Mecha Worm"],
  void: ["Void Wasp", "House M.D.", "Gog", "Cube", "Karen"],
};

// Build allmobs dynamically
mobList.allmobs = []
  .concat(...Object.values(mobList));

const weightList = {
  garden: [0.5, 0.5, 0.6, 1.5, 1.2, 1.5, 0.5, 1, 0.3, 0.2],
  desert: [1, 1, 1.1, 1.1, 1, 0.2, 0.062],
  ocean: [5.5, 1, 1, 1, 1.2, 1, 1.2],
  sewers: [2, 1, 1, 1],
  jungle: [1, 1, 0.1, 0.5, 0.5, 0.7, 0.88, 0.8],
  cavern: [1, 2, 0.8, 1],
  ant_hell: [2, 2, 1, 0.5, 0.5, 0.2],
  hel: [1, 2, 2, 2, 2],
  factory: [1.2, 2, 2, 2],
  void: [1, 1, 0.5, 1, 0.8],
};

// Build allmobs weights dynamically
weightList.allmobs = []
  .concat(...Object.values(weightList));

let pickedBiomes = "desert";
const biomeMobs = mobList[pickedBiomes]; // <- still forced to "hel"
const biomeWeights = weightList[pickedBiomes]; // <- get corresponding weights
const rarityStuff = {
  0: { name: "Common", color: "#7EEF6D" },
  1: { name: "Uncommon", color: "#FFE65D" },
  2: { name: "Rare", color: "#4C56DB" },
  3: { name: "Epic", color: "#861FDE" },
  4: { name: "Legendary", color: "#DE1F1F" },
  5: { name: "Mythical", color: "#1FDBDE" },
  6: { name: "Ultra", color: "#FF2B75" },
  7: { name: "Super", color: "#2BFFA3" },
  8: { name: "Unique", color: "#C643FF" },
  9: { name: "Mega", color: "#FF9B11" },
  10: {
    name: "Sublime",
    get color() {
      return getRainbowColor();
    },
  },
};
const specialBossSpawnMessages = {
  // garden mobs
  "Ladybug": "Something cute appears in the garden...",
  "Spider": "You sense the shuffling of various legs...",
  "Rock": "Something mountain-like appears in the distance...",
  "Bee": "A dainty insect pollinates the garden around it...",
  "Hornet": "A big yellow spot shows up in the distance...",
  "Yellowjacket": "A small yellow spot shows up in the distance...",

  // desert mobs
  "Beetle": "You hear the rhythmic clacking of mandibles ready to devour you...",
  "Scorpion": "Something stabs the air with it's ferocious tail...",
  "Cactus": "A tower of thorns rises from the sands...",
  "Sandstorm": "A swirling vortex of sand appears before you...",

  // ocean mobs
  "Jellyfish": "You hear lightning strikes coming from a far distance...",
  // sewers mobs
  "Fly": "A buzzing noise echoes through the sewer tunnels...",
  "Moth": "The timid sound of fluttering can be heard from afar...",

  // jungle mobs
  "Wasp": "A big orange spot shows up in the distance...",
  "Mantis": "You hear the sound of peas being spat...",

  // hel mobs
  "Hel Beetle": "You sense ominous vibrations coming from another realm...",
  "Hel Spider": "You sense ominous vibrations coming from another realm...",
  "Hel Wasp": "You sense ominous vibrations coming from another realm...",
  "Hel Jellyfish": "You sense ominous vibrations coming from another realm...",
  "Flesh Pillar": "You sense something creating demons from another realm..."
};
setInterval(() => {
  if (mobs.length >= maxMobs) return;
  if (!Array.isArray(biomeMobs) || biomeMobs.length === 0) return;

  const rarityTiles = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      let val = map[row][col];
      // Convert both numbers and strings to float
      let rarityNum = (typeof val === "number" || typeof val === "string") ? parseFloat(val) : NaN;
      if (!isNaN(rarityNum)) {
        rarityTiles.push({ row, col, rarity: rarityNum });
      }
    }
  }

  if (rarityTiles.length === 0) return;

  const tile = rarityTiles[Math.floor(Math.random() * rarityTiles.length)];

  // === Weighted mob pick ===
  function weightedRandom(mobs, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < mobs.length; i++) {
      r -= weights[i];
      if (r <= 0) return mobs[i];
    }
    return mobs[mobs.length - 1]; // fallback
  }

  const pickedMob = weightedRandom(biomeMobs, biomeWeights);

  // === Rarity logic ===
  const baseInt = Math.floor(tile.rarity);
  let baseRarity = (Math.random() < (tile.rarity - baseInt))
                 ? Math.min(baseInt + 1, 7)
                 : baseInt;

  if (tile.rarity < mobStats.minBossRarity - 1 && baseRarity >= 1) {
    const changeChance = 0.10;
    const r = Math.random();
    if (r < changeChance / 2) baseRarity = Math.max(1, baseRarity - 1);
    else if (r > 1 - changeChance / 2) baseRarity = baseRarity + 1;
  }

  // === Boss spawn logic with special messages ===
  if (baseRarity === mobStats.minBossRarity - 1 && Math.random() < 0.01) {
    baseRarity += 1;

    // Use special spawn message if it exists, otherwise default
    const spawnMessage = specialBossSpawnMessages[pickedMob]
      || `A ${rarityStuff[baseRarity].name} ${pickedMob} has spawned!`;

    broadcast({ type: "chat", message: spawnMessage });
    if (Math.random() < 0.1) {
      baseRarity += 1;
      broadcast({ type: "chat", message: spawnMessage });
    }
  }

  const SPAWN_PADDING = 4;
  const mobX = tile.col * TILE_SIZE + SPAWN_PADDING + Math.random() * (TILE_SIZE - 2 * SPAWN_PADDING);
  const mobY = tile.row * TILE_SIZE + SPAWN_PADDING + Math.random() * (TILE_SIZE - 2 * SPAWN_PADDING);
  spawnMob(mobX, mobY, Math.min(Math.max(baseRarity, 0), 10), pickedMob, Math.random() * Math.PI * 2);
}, 1);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


