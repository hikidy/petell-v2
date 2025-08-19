const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket('wss://petell-io.railway.app');
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const messages = document.getElementById("messages");
const input = document.getElementById("input");
//import { memoizedColors, rgbToHex, componentToHex, blendColor, drawPolygon, convertAngleToRadians, getRandomInRange, drawMob } from './mobdraw.js';

ws.onopen = () => {
  console.log("✅ WebSocket connected");
};

ws.onmessage = (event) => {
  console.log("📩 Message from server:", event.data);
};

ws.onerror = (err) => {
  console.error("❌ WebSocket error:", err);
};

ws.onclose = (event) => {
  console.warn("⚠️ WebSocket closed:", event.code, event.reason);
};

let myId = null;
let players = {};
let selectedPetellIndex = null;

// Map WASD keys to arrow keys
const keyMap = {
  "w": "ArrowUp",
  "a": "ArrowLeft",
  "s": "ArrowDown",
  "d": "ArrowRight",
  "ArrowUp": "ArrowUp",
  "ArrowLeft": "ArrowLeft",
  "ArrowDown": "ArrowDown",
  "ArrowRight": "ArrowRight",
  "MouseLeft": "MouseLeft",
};

let hoveredPetell = null;
let mouse = { x: 0, y: 0 };

let inputs = {};

window.addEventListener("keydown", (e) => {
  let key = e.key;
  if (key.length === 1) key = key.toLowerCase();

  if (!(key in keyMap)) return;

  let mappedKey = keyMap[key];

  if (!inputs[mappedKey]) {
    inputs[mappedKey] = true;
    ws.send(JSON.stringify({ type: "input", key: mappedKey, state: true }));
  }
});

window.addEventListener("keyup", (e) => {
  let key = e.key;
  if (key.length === 1) key = key.toLowerCase();

  if (!(key in keyMap)) return;

  let mappedKey = keyMap[key];

  if (inputs[mappedKey]) {
    inputs[mappedKey] = false;
    ws.send(JSON.stringify({ type: "input", key: mappedKey, state: false }));
  }
});

let currentMap = null;
let currentTileSize = 0; // or whatever default you want
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init") {
    currentMap = data.map;
    currentTileSize = data.tileSize;
    myId = data.id;
    players = data.players;
  } else if (data.type === "new") {
    players[data.player.id] = data.player;
    addChatMessage(`Player ${data.player.id} joined.`);
  } else if (data.type === "state") {
    players = data.players;
    window.mobs = data.mobs || []; // save mobs
  } else if (data.type === "leave") {
    addChatMessage(`Player ${data.id} left.`);
    delete players[data.id];
  } else if (data.type === "chat") {
    addChatMessage(`Player ${data.id}: ${data.message}`);
  } else if (data.type === "update_player") {
  players[data.id] = data.player;
}

};

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && input.value.trim() !== "") {
    ws.send(JSON.stringify({ type: "chat", message: input.value.trim() }));
    input.value = "";
  }
});

function addChatMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
const petellColors = {
  "Stinger": "#ff0000", // red
  "Heavy": "#808080",   // gray
  "Basic": "#ffffff",   // white
  "Rose": "#ff69b4",    // pink
  "Leaf": "#00ff00",     // green
  "Cactus": "#12bb05"
};

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;

  const me = players[myId];
  if (!me || !me.petells) {
    hoveredPetell = null;
    return;
  }

  hoveredPetell = null;
// on mouse move or click:
hoveredPetell = me.petells.find(pet => 
  mouse.x >= pet.uiX &&
  mouse.x <= pet.uiX + pet.uiW &&
  mouse.y >= pet.uiY &&
  mouse.y <= pet.uiY + pet.uiH
);
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const me = players[myId];
  if (!me) return;

  // Check if click was inside any petell icon slot
  let clickedOnPetell = false;

  me.petells.forEach((pet, index) => {
    if (
      mx >= pet.uiX &&
      mx <= pet.uiX + 60 &&
      my >= pet.uiY &&
      my <= pet.uiY + 60
    ) {
      clickedOnPetell = true;
      if (selectedPetellIndex === null) {
        selectedPetellIndex = index; // first click
      } else if (selectedPetellIndex !== index) {
        // swap
        const temp = me.petells[selectedPetellIndex];
        me.petells[selectedPetellIndex] = me.petells[index];
        me.petells[index] = temp;

        ws.send(JSON.stringify({
          type: "swap_petells",
  a: selectedPetellIndex,
  b: index,
  petA: me.petells[selectedPetellIndex],
  petB: me.petells[index]
        }));
        console.log(`Sent swap_petells: ${selectedPetellIndex} <-> ${index}`);
        selectedPetellIndex = null;    
      } else {
        // same slot clicked again, deselect
        selectedPetellIndex = null;
      }
    }
  });

  // If click was NOT on any petell icon, deselect
  if (!clickedOnPetell) {
    selectedPetellIndex = null;
  }
});
let dragIndex = null; // define at top level
canvas.addEventListener("mouseup", (e) => {
  if (dragIndex === null) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const me = players[myId];
  if (!me) return;

  me.petells.forEach((pet, index) => {
    if (
      mx >= pet.uiX &&
      mx <= pet.uiX + 30 &&
      my >= pet.uiY &&
      my <= pet.uiY + 30
    ) {
      // Swap petells
      const temp = me.petells[dragIndex];
      me.petells[dragIndex] = me.petells[index];
      me.petells[index] = temp;

      // Notify server
      ws.send(JSON.stringify({
        type: "swap_petells",
        a: dragIndex,
        b: index
      }));
    }
  });

  dragIndex = null;
});

let zoom = 0.1;
// ---- put once at top of your script ----
const tileImages = {
  garden: new Image(),
  desert: new Image(),
  hel: new Image(),
  void: new Image(),
  dirt: new Image()
};
tileImages.garden.src = "tiles/garden.png";
tileImages.desert.src = "tiles/desert.png";
tileImages.hel.src = "tiles/hel.png";
tileImages.void.src = "tiles/void.png";
tileImages.dirt.src   = "tiles/dirt.png"
// ---- replace your drawMap with this ----
function drawMap(ctx, map, tileSize) {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      // === WALL ===
      if (tile === 'w') {
        if (tileImages.dirt.complete && tileImages.dirt.naturalWidth) {
          ctx.drawImage(tileImages.dirt, x, y, tileSize, tileSize);
        } else {
          // fallback while image is loading
          ctx.fillStyle = "#7a5a3a";
          ctx.fillRect(x, y, tileSize, tileSize);
        }

      // === SPAWN ('s') or numeric rarity tiles ===
      } else if (tile === 's' || !Number.isNaN(parseFloat(tile))) {
        if (tileImages.garden.complete && tileImages.garden.naturalWidth) {
          ctx.drawImage(tileImages.desert, x, y, tileSize, tileSize);
        } else {
          // fallback while image is loading
          ctx.fillStyle = "#6fbf6f";
          ctx.fillRect(x, y, tileSize, tileSize);
        }

        // Optional: draw the rarity number on top (if it's numeric)
        /*const rarityNum = parseFloat(tile);
        if (!Number.isNaN(rarityNum)) {
          ctx.font = `${Math.max(10, Math.floor(tileSize * 0.28))}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // outline + fill for contrast
          ctx.strokeStyle = "rgba(0,0,0,0.8)";
          ctx.lineWidth = 3;
          ctx.strokeText(rarityNum.toFixed(2), x + tileSize / 2, y + tileSize / 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(rarityNum.toFixed(2), x + tileSize / 2, y + tileSize / 2);
        }*/

      // === OTHER / EMPTY ===
      } else {
        // clear background (or draw your default ground)
        ctx.clearRect(x, y, tileSize, tileSize);
      }
    }
  }
}

let startTime = performance.now();
function getRainbowColor() {
  const elapsed = performance.now() - startTime; // ms since start
  const speed = 0.5; // degrees per ms, tweak this to speed up/down
  const hue = (elapsed * speed) % 360;
  return `hsl(${hue}, 100%, 50%)`;
}

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
/*const rarityStuff = {
  0: { name: "Common", color: "#7EEF6D" },
  1: { name: "Unusual", color: "#FFE65D" },
  2: { name: "Rare", color: "#455FCF" },
  3: { name: "Epic", color: "#7633CB" },
  4: { name: "Legendary", color: "#C13328" },
  5: { name: "Mythical", color: "#1ED2CB" },
  6: { name: "Ultimate", color: "#ff2b75" },
  7: { name: "Supreme", color: "#2affa3" },
  8: { name: "Unique", color: "#C643FF" },
  9: { name: "Mega", color: "#FF9B11" },
  10: { name: "Sublime", color: "#121212" },
  11: { name: "Magical", color: "#16abc2" },
  12: { name: "Ethereal", color: "#0000ff" },
  13: { name: "Arcane", color: "#22Fe00" },
  14: { name: "Otherworldly", color: "#ff05c0" },
  15: { name: "Grand", color: "#a631ff" },
  16: { name: "Exotic", color: "#00ff95" },
  17: { name: "Mysterious", color: "#272d48" },
  18: { name: "Prime", color: "#cfc24f" },
  19: { name: "Celestial",     color: "#8FB6FF" },
  20: { name: "Stellar",       color: "#FFD580" },
  21: { name: "Radiant",       color: "#FFB3A7" },
  22: { name: "Cosmic",        color: "#6A0DAD" },
  23: { name: "Nebular",       color: "#7B5FFF" },
  24: { name: "Galactic",      color: "#00B3B3" },
  25: { name: "Fabled",        color: "#FF7F50" },
  26: { name: "Ancient",       color: "#8B5A2B" },
  27: { name: "Primal",        color: "#D35400" },
  28: { name: "Oracle",        color: "#00CED1" },
  29: { name: "Eternal",       color: "#FFD700" },
  30: { name: "Ascendant",     color: "#FF8C00" },
  31: { name: "Sovereign",     color: "#4B0082" },
  32: { name: "Imperial",      color: "#B22222" },
  33: { name: "Phantasmal",    color: "#9FE2BF" },
  34: { name: "Luminous",      color: "#FFFACD" },
  35: { name: "Venerated",     color: "#C0C0C0" },
  36: { name: "Sanctified",    color: "#E6E6FA" },
  37: { name: "Arcadian",      color: "#3CB371" },
  38: { name: "Chrono",        color: "#708090" },
  39: { name: "Rift",          color: "#5D3FD3" },
  40: { name: "Singularity",   color: "#0A0A2A" },
  41: { name: "Empyreal",      color: "#E0FFFF" },
  42: { name: "Myriad",        color: "#FF6EC7" },
  43: { name: "Zenith",        color: "#0033CC" },
  44: { name: "Paragon",       color: "#32CD32" },
  45: { name: "Universal", color: "#800000" },
  46: { name: "Metaversal", color: "#9e4242" },
  47: { name: "Omniscient", color: "#ad7777" },
  48: { name: "TRANSCENDENT", color: "#ffffff" },
  49: { name: "GODLY", color: "#000000" }
};*/

function draw() {
  //console.log("myId:", myId, "players:", players);
  const me = players[myId];
  if (!me) {
    requestAnimationFrame(draw);
    return; // Skip draw until player data is available
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // if we have a valid player, translate; otherwise draw in world coords
  if (me) {
    const camX = canvas.width / 2 / zoom - me.x;
const camY = canvas.height / 2 / zoom - me.y;

ctx.save();
ctx.scale(zoom, zoom);
ctx.translate(camX, camY);
  } else {
    // optional: console.log so you see if it ever becomes defined
    console.log("Waiting for init… myId:", myId, "players:", players);
  }
  if (currentMap) {
    drawMap(ctx, currentMap, currentTileSize);
  }


  // DRAWING CODE (same as before) ----------------

  // 1) mobs
  const dist = 1000 / zoom;
  const maxDistSq = dist * dist;
  const mobList = (window.mobs || [])
    .map(m => ({ mob: m, d2: me ? (m.x - me.x) ** 2 + (m.y - me.y) ** 2 : 0 }))
    .filter(o => !me || o.d2 <= maxDistSq)
    .sort((a, b) => a.d2 - b.d2)
    .map(o => o.mob);
for (let mob of mobList) {
  drawMob(ctx, mob); // draw mob itself

  if (mob.hp != null && mob.curhp != null && mob.renderhp) {
    const barWidth = Math.min(Math.max(mob.radius * 2, 20), 200);
    const barHeight = 3;
    const hpHeight = 2;
    const ratio = mob.curhp / mob.hp;

    const xStart = mob.x - barWidth / 2; // center the bar horizontally
    const yPos = mob.y + mob.radius + 7.5; // position below the mob

    // Draw dark background line
    ctx.strokeStyle = '#444';
    ctx.lineWidth = barHeight;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(xStart, yPos);
    ctx.lineTo(xStart + barWidth, yPos);
    ctx.stroke();

    // Draw HP line with color
    const green = Math.floor(255 * ratio);
    const red = 255 - green;
    ctx.strokeStyle = `rgb(${red},${green},0)`;
    ctx.lineWidth = hpHeight;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(xStart, yPos);
    ctx.lineTo(xStart + barWidth * ratio, yPos);
    ctx.stroke();

    // Common text settings
    ctx.textAlign = "center";
    ctx.font = "5px Ubuntu, monospace";
    ctx.lineWidth = 0.5; // outline thickness

    // Draw mob name at the left of the bar
    ctx.textAlign = "left"; // align text to start from x
    ctx.font = "5px Ubuntu, monospace";
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.strokeText(mob.type, xStart, yPos - 3); // slightly above the bar
    ctx.fillText(mob.type, xStart, yPos - 3);

    // Draw rarity at the right of the bar
    ctx.textAlign = "right"; // align text to end at x
    ctx.strokeStyle = "black";
    ctx.fillStyle = rarityStuff[mob.rarity].color;
    ctx.strokeText(rarityStuff[mob.rarity].name, xStart + barWidth, yPos + 6);
    ctx.fillText(rarityStuff[mob.rarity].name, xStart + barWidth, yPos + 6);
  }
}

  // 2) players & petells
  for (let id in players) {
    const p = players[id];
    // player circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ffff00";
    ctx.fill();
    // player HP bar...
    if (p.hp != null && p.curhp != null) {
      const maxHp = p.hp, curHp = p.curhp;
      const barW = 20, barH = 5, ratio = curHp / maxHp;
      ctx.fillStyle = "#444";
      ctx.fillRect(p.x - barW/2, p.y - 25, barW, barH);
      const green = Math.floor(255 * ratio), red = 255 - green;
      ctx.fillStyle = `rgb(${red},${green},0)`;
      ctx.fillRect(p.x - barW/2, p.y - 25, barW * ratio, barH);
    }
    if (p.petells) {
    for (let pet of p.petells) {
    if (pet.respawning) continue; // ⬅️ Skip drawing if petell is inactive
    ctx.beginPath();
    ctx.arc(pet.x, pet.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = petellColors[pet.type] || "#00ffff"; // fallback color
    ctx.fill();
    // Draw petell hitbox for debugging
    ctx.beginPath();
    ctx.arc(pet.x, pet.y, 2.5, 0, Math.PI * 2); // Adjust radius if needed
    ctx.strokeStyle = (rarityStuff[pet.rarity]?.color) || "#00ffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  }
    // label
    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Player " + id, p.x, p.y - 35);
  }

  // restore only if we translated
  if (me) ctx.restore();
  // PETELL ICON BAR (bottom UI)
  if (me && me.petells) {
  const iconSize   = 30;
  const spacing    = 10;
  const totalWidth = me.petells.length * (iconSize + spacing) - spacing;
  const startX     = (canvas.width - totalWidth) / 2;
  const y          = canvas.height - iconSize - 10;

  me.petells.forEach((pet, index) => {
    const x = startX + index * (iconSize + spacing);

    // store full hit‑box for interaction
    pet.uiX = x;
    pet.uiY = y;
    pet.uiW = iconSize;
    pet.uiH = iconSize;

    // draw background & border
    ctx.beginPath();
    ctx.rect(x, y, iconSize, iconSize);
    ctx.strokeStyle = blendColor(rarityStuff[pet.rarity].color, "#000000", 0.2);
    ctx.fillStyle   = rarityStuff[pet.rarity].color;
    ctx.fill();
    ctx.stroke();

    // selected outline
    if (index === selectedPetellIndex) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth   = 4;
      ctx.strokeRect(x, y, iconSize, iconSize);
    } else {
      ctx.lineWidth   = 2;
      ctx.strokeRect(x, y, iconSize, iconSize);
    }

    // draw pet.type with dynamic font size
    const maxWidth = iconSize - 4;
    let fontSize = 10;
    ctx.font = `${fontSize}px Ubuntu`;
    while (ctx.measureText(pet.type).width > maxWidth && fontSize > 6) {
      fontSize--;
      ctx.font = `${fontSize}px Ubuntu`;
    }
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(pet.type, x + iconSize / 2, y + iconSize - 10);
  });

  // tooltip on hover
  if (hoveredPetell) {
    const rarity     = hoveredPetell.rarity ?? 0;
    const rarityInfo = rarityStuff[rarity] || { name: "Unknown", color: "#ffffff" };
    const lines = [
      hoveredPetell.type,
      rarityInfo.name,
      `Damage: ${hoveredPetell.dmg}`,
      `Health: ${hoveredPetell.maxhp}`,
    ];
    if (hoveredPetell.extra_hp) lines.push(`Health Buff: ${hoveredPetell.extra_hp}`);
    if (hoveredPetell.heal)     lines.push(`Heal: ${hoveredPetell.heal}`);
    if (hoveredPetell.armor) lines.push(`Armor: ${hoveredPetell.armor}`);
    if (hoveredPetell.hps)      lines.push(`Heal: ${hoveredPetell.hps}/s`);

    const padding    = 6;
    const lineHeight = 14;
    const width      = 120;
    const height     = lines.length * lineHeight + padding * 2;
    let tx = mouse.x + 15;
    let ty = mouse.y - height - 10;
    if (tx + width > canvas.width) tx = canvas.width - width - 5;
    if (ty < 0)                   ty = mouse.y + 20;

    // draw tooltip box
    ctx.fillStyle   = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(tx, ty, width, height);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 1;
    ctx.strokeRect(tx, ty, width, height);

    // draw tooltip text
    ctx.font      = "12px monospace";
    ctx.textAlign = "left";
    lines.forEach((line, i) => {
      ctx.fillStyle = (i === 1) ? rarityInfo.color : "#ffffff";
      ctx.fillText(line, tx + padding, ty + padding + i * lineHeight + 10);
    });
  }
  }

// --- PLAYER STATS HUD (bottom right) ---
if (me) {
  const padding = 10;
  const lineHeight = 18;
  const boxWidth = 140;
  const lines = [
    `HP: ${Math.floor(me.curhp)}/${me.hp}`
    // Add more stats here if desired
  ];

  const totalHeight = lines.length * lineHeight + padding * 2;
  const x = canvas.width - boxWidth - 10;
  const y = canvas.height - totalHeight - 10;

  // Background box
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(x, y, boxWidth, totalHeight);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, boxWidth, totalHeight);

  // Text lines
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + (i + 1) * lineHeight - 4);
  });
}

  requestAnimationFrame(draw);
}

draw();

// Developer bs
function spawnMob(x=0, y=0, rarity=0, mobType=0, angle=0) {
  // Prepare the message as a JSON string with a type field
  const message = JSON.stringify({
    type: "spawnMobRequest",
    data: {
      x: x,
      y: y,
      rarity: rarity,
      mobType: mobType,
      angle: angle,
    }
  });

  // Send the message through the WebSocket
  ws.send(message);

  // Set up a message handler for the response
  // IMPORTANT: If you call spawnMob multiple times, this will add multiple handlers.
  // You might want to move this outside the function or use a one-time handler pattern.
  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    if (response.type === "spawnMobResponse") {
      console.log(response.data.message);
    }
  };
}



