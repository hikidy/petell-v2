
//credit to flowr devs lmao
const memoizedColors = {};

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function blendColor(color1, color2, t) {
  const memoizedIndex = color1 + "_" + color2 + "_" + t;
  if (memoizedColors[memoizedIndex] !== undefined) {
    return memoizedColors[memoizedIndex];
  }

  function hexToRGBA(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) : 255;
    return { r, g, b, a };
  }

  function rgbaToHex(r, g, b, a = 255) {
    return (
      "#" +
      [r, g, b, a]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  const rgba1 = hexToRGBA(color1);
  const rgba2 = hexToRGBA(color2);

  const result = rgbaToHex(
    Math.floor(rgba1.r * (1 - t) + rgba2.r * t),
    Math.floor(rgba1.g * (1 - t) + rgba2.g * t),
    Math.floor(rgba1.b * (1 - t) + rgba2.b * t),
    Math.floor(rgba1.a * (1 - t) + rgba2.a * t)
  );

  memoizedColors[memoizedIndex] = result;
  return result;
}

function drawPolygon(
  ctx,
  x,
  y,
  sides,
  radius,
  angle,
  widthStretch,
  heightStretch
) {
  const step = (2 * Math.PI) / sides; // Step between each vertex in the polygon
  ctx.beginPath();

  // Loop through each vertex and plot it
  for (let i = 0; i < sides; i++) {
    const currentAngle = angle + i * step; // Rotate the angle for each vertex
    const vex = x + Math.cos(currentAngle) * radius * widthStretch; // Adjust x based on width stretch
    const vey = y + Math.sin(currentAngle) * radius * heightStretch; // Adjust y based on height stretch
    if (i === 0) {
      ctx.moveTo(vex, vey); // Move to the first vertex
    } else {
      ctx.lineTo(vex, vey); // Draw lines to the next vertex
    }
  }
  ctx.closePath();
  ctx.fill(); // Apply fill (optional, can be removed if only the outline is desired)
  ctx.stroke(); // Apply stroke (outlines the polygon)
}
// Helper function to convert degrees to radians
function convertAngleToRadians(angle) {
  return angle * (Math.PI / 180);
}
// Helper function to generate random values within a range
function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}
const house = new Image();
house.src = "tiles/House.jpg"; // or a URL
function drawMob(ctx, mob) {
  ctx.save();

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Translate to mob position
  ctx.translate(mob.x, mob.y);
  ctx.scale(mob.radius/50, mob.radius/50);  

  let velocity = Math.sqrt(mob.vx ** 2 + mob.vy ** 2);
  const velocityEffect = 7; // increase sensitivity
  const baseSpeed = 1;      // base flow so idle mobs still animate a bit

  let t =
    (performance.now() *
      (Math.log2(velocity * velocityEffect + 2) + baseSpeed)) / 500;

  let time = 11 + (19 - 11) * (Math.sin(t) * 0.5 + 0.5);
  let ngpo = -5 + (5 + 5) * (Math.sin(t) * 0.5 + 0.5);
  let fasterngpo = -5 + (5 + 5) * (Math.sin(2 * t) * 0.5 + 0.5);

  // Rotate to face the mob.angle
  ctx.rotate(mob.angle);

  switch(mob.type) {
    case "Baby Ant": {
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round";
      // Mandibles behind body
      ctx.strokeStyle = "#292929";
      ctx.beginPath();
      ctx.moveTo(15, 25);
      ctx.lineTo(60, time);
      ctx.moveTo(15, -25);
      ctx.lineTo(60, -time);
      ctx.stroke();
      // Body
      ctx.strokeStyle = "#454545";
      ctx.fillStyle = "#555555";
      ctx.beginPath();
      ctx.arc(0, 0, 39.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break; }
    case "Worker Ant": {
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 25); // Left mandible
      ctx.lineTo(80, time);
      ctx.moveTo(35, -25); // Right mandible
      ctx.lineTo(80, -time);
      ctx.stroke(); // Draw mandibles

      // Now draw the body (which will be above the mandibles)
      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-20, 0, 29.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      ctx.beginPath();
      ctx.arc(20, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      break; }
    case "Soldier Ant": {
      //let xx = 18 + (30 - 18) * (Math.sin(t/3) * 0.5 + 0.5)
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 25); // Left mandible
      ctx.lineTo(80, time);
      ctx.moveTo(35, -25); // Right mandible
      ctx.lineTo(80, -time);
      ctx.stroke(); // Draw mandibles

      // Now draw the body (which will be above the mandibles)
      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-20, 0, 29.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2));
      ctx.beginPath();
      ctx.ellipse(-30, 20, 200 / 5, 125 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 2));
      //ctx.rotate(xx)
      ctx.beginPath();
      ctx.ellipse(-30, -20, 200 / 5, 125 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(20, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      //renderSoldierAnt("#454545", "#555555");
      break; }
    case "Summoned Soldier Ant": {
      //let xx = 18 + (30 - 18) * (Math.sin(t/3) * 0.5 + 0.5)
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 25); // Left mandible
      ctx.lineTo(80, time);
      ctx.moveTo(35, -25); // Right mandible
      ctx.lineTo(80, -time);
      ctx.stroke(); // Draw mandibles

      // Now draw the body (which will be above the mandibles)
      ctx.strokeStyle = "#dddd00"; // Outline color for body
      ctx.fillStyle = "#ffff00"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-20, 0, 29.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2));
      ctx.beginPath();
      ctx.ellipse(-30, 20, 200 / 5, 125 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 2));
      //ctx.rotate(xx)
      ctx.beginPath();
      ctx.ellipse(-30, -20, 200 / 5, 125 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "#dddd00"; // Outline color for body
      ctx.fillStyle = "#ffff00"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(20, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      //renderSoldierAnt("#454545", "#555555");
      break; }
    case "Ladybug": {
      // ===== Setup Styling =====
      ctx.lineCap = "round";
      ctx.lineWidth = 10;

      // ===== Smaller Dark Circle =====
      ctx.beginPath();
      ctx.arc(24.5, 0, 25, 0, Math.PI * 2);
      ctx.fillStyle = "#202020";
      ctx.strokeStyle = blendColor("#202020", "#000000", 0.19);
      ctx.fill();
      ctx.stroke();

      // ===== Crescent Shape Path (for fill and clip) =====
      ctx.save(); // Save before clip
      ctx.beginPath();
      // Outer arc
      ctx.arc(0, 0, 50, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      // Inner arc (reverse)
      ctx.arc(45, 0, 30, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();

      // Fill the crescent shape
      ctx.fillStyle = "#eb4034";
      ctx.fill();

      // Clip to crescent shape
      ctx.clip();

      // ===== Randomized Spots (clipped and behind outline) =====
      ctx.save(); // Save translation context
      ctx.translate(-75, -75);

      ctx.fillStyle = "#202020";
      const spreadFactor = 50;
      const offsetFactor = 0;
      const spotty = 3 * Math.pow(1.05, mob.rarity) + mob.ran1;

      // Spot 1
      ctx.beginPath();
      ctx.arc(
        mob.ran1 * spreadFactor - offsetFactor,
        mob.ran2 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 2
      ctx.beginPath();
      ctx.arc(
        mob.ran2 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 3
      ctx.beginPath();
      ctx.arc(
        mob.ran1 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 4
      ctx.beginPath();
      ctx.arc(
        mob.ran2 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      ctx.restore(); // Restore translation
      ctx.restore(); // Restore from clipping

      // ===== Stroke Crescent Outline LAST =====
      ctx.beginPath();
      // Outer arc
      ctx.arc(0, 0, 50, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      // Inner arc
      ctx.arc(45, 0, 30, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();

      ctx.strokeStyle = blendColor("#eb4034", "#000000", 0.19);
      ctx.stroke();
      break; }
    case "Flesh Pillar": {
      ctx.lineWidth = 5;
      ctx.fillStyle = "#aa7777";
      ctx.strokeStyle = blendColor("#aa7777", "#000000", 0.19);

      // Draw fleshy tendrils (animated with ngpo)
      const fleshTendrilLength = 20;
      const fleshCoreRadius = 50;
      const fleshTendrilCount = 10;

      // Example random angle offsets (replace with your mob.ran1, ran2, ran3)
      const ranAngles = [mob.ran1, mob.ran2, mob.ran3, mob.ran4, mob.ran5];

      for (let i = 0; i < fleshTendrilCount; i++) {
        const sway = (i % 2 === 0 ? -ngpo/2 : ngpo/2); // alternate direction
        // Alternate angle using ran1, ran2, ran3
        const baseAngle = (i / fleshTendrilCount) * Math.PI * 2;
        const angleOffset = ranAngles[i % ranAngles.length];
        const angle = baseAngle + angleOffset;

        const baseX1 = Math.cos(angle - Math.PI / fleshTendrilCount) * fleshCoreRadius;
        const baseY1 = Math.sin(angle - Math.PI / fleshTendrilCount) * fleshCoreRadius;
        const baseX2 = Math.cos(angle + Math.PI / fleshTendrilCount) * fleshCoreRadius;
        const baseY2 = Math.sin(angle + Math.PI / fleshTendrilCount) * fleshCoreRadius;
        const tipLengthMultiplier = ranAngles[i % ranAngles.length];
        const tipX = Math.cos(angle) * (fleshCoreRadius + fleshTendrilLength * tipLengthMultiplier) + sway;
        const tipY = Math.sin(angle) * (fleshCoreRadius + fleshTendrilLength * tipLengthMultiplier) - sway;

        ctx.beginPath();
        ctx.moveTo(baseX1, baseY1);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseX2, baseY2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = "#994444";
      ctx.strokeStyle = blendColor("#994444", "#000000", 0.2);

      const fleshPillarside = 9 + mob.rarity;

      // Step 1: Compute all vertices (with random offsets) and store them in an array.
      let fleshPillarvertices = [];
      for (let i = 0; i < fleshPillarside; i++) {
        const angle = (i * 2 * Math.PI) / fleshPillarside; // Angle for each vertex
        let x = 50 * Math.cos(angle); // Base x coordinate
        let y = 50 * Math.sin(angle); // Base y coordinate

        // Use different random offsets for x and y:
        let offsetX = [mob.ran1, mob.ran2, mob.ran3][i % 3] * 5;
        let offsetY = [mob.ran1, mob.ran2, mob.ran3][(i + 1) % 3] * 5;
        x += offsetX;
        y += offsetY;

        fleshPillarvertices.push({ x: x, y: y });
      }

      // Step 2: Calculate the centroid of the vertices.
      let fleshPillarsumX = 0,
        fleshPillarsumY = 0;
      for (let i = 0; i < fleshPillarvertices.length; i++) {
        fleshPillarsumX += fleshPillarvertices[i].x;
        fleshPillarsumY += fleshPillarvertices[i].y;
      }
      let fleshPillarcentroidX = fleshPillarsumX / fleshPillarvertices.length;
      let fleshPillarcentroidY = fleshPillarsumY / fleshPillarvertices.length;

      // Step 3: Draw the polygon, shifting all vertices so the centroid is at (0,0)
      ctx.beginPath();
      for (let i = 0; i < fleshPillarvertices.length; i++) {
        // Subtract the centroid coordinates from each vertex to center the shape.
        let x = fleshPillarvertices[i].x - fleshPillarcentroidX;
        let y = fleshPillarvertices[i].y - fleshPillarcentroidY;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break; }
    case "Queen Ant": {
      ctx.save();
      ctx.translate(18,0);
      //let xx = 18 + (30 - 18) * (Math.sin(t/3) * 0.5 + 0.5)
      ctx.lineWidth = 15.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 25); // Left mandible
      ctx.lineTo(80, time);
      ctx.moveTo(35, -25); // Right mandible
      ctx.lineTo(80, -time);
      ctx.stroke(); // Draw mandibles

      // this is for drawing the queen ant's giant gyatt 🤤
      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-65, 0, 59.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle

      // Now draw the body (which will be above the mandibles)
      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-20, 0, 49.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2));
      ctx.beginPath();
      ctx.ellipse(-45, 20, 300 / 4, 100 / 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 2));
      //ctx.rotate(xx)
      ctx.beginPath();
      ctx.ellipse(-45, -20, 300 / 4, 100 / 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(20, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      ctx.restore();
      break; }
    case "Spider": {
      ctx.lineWidth = 14.5;
      // Define the leg length and angular range for clustering

      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      ctx.strokeStyle = "#333333"; // Leg color

      const longsection = 85;
      const shortsection = 65;
      const controlPoint = -30 + ngpo;
      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(longsection, shortsection); // Start at the center
      ctx.quadraticCurveTo(10, controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -controlPoint, -longsection, -shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(longsection, -shortsection); // Start at the center
      ctx.quadraticCurveTo(0, -controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, controlPoint, -longsection, shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      const alongsection = 42;
      const ashortsection = 97;
      const acontrolPoint = -10;
      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 - ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, ashortsection); // Start at the center
      ctx.quadraticCurveTo(10, acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -acontrolPoint, -alongsection, -ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 + ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, -ashortsection); // Start at the center
      ctx.quadraticCurveTo(0, -acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, acontrolPoint, -alongsection, ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      // Draw the body
      ctx.strokeStyle = "#403525"; // Outline color for body
      ctx.fillStyle = "#4f412e"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2); // Radius of 42
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      break; }
    case "Rock": {
      ctx.lineWidth = 105 / mob.radius; // Outline width
      ctx.strokeStyle = blendColor("#808080", "#000000", 0.19);
      ctx.fillStyle = "#808080";
      const rockside = 5 + mob.rarity;

      // Step 1: Compute all vertices (with random offsets) and store them in an array.
      let vertices = [];
      for (let i = 0; i < rockside; i++) {
        const angle = (i * 2 * Math.PI) / rockside; // Angle for each vertex
        let x = 50 * Math.cos(angle); // Base x coordinate
        let y = 50 * Math.sin(angle); // Base y coordinate

        // Use different random offsets for x and y:
        let offsetX = [mob.ran1, mob.ran2, mob.ran3][i % 3] * 5;
        let offsetY = [mob.ran1, mob.ran2, mob.ran3][(i + 1) % 3] * 5;
        x += offsetX;
        y += offsetY;

        vertices.push({ x: x, y: y });
      }

      // Step 2: Calculate the centroid of the vertices.
      let sumX = 0,
        sumY = 0;
      for (let i = 0; i < vertices.length; i++) {
        sumX += vertices[i].x;
        sumY += vertices[i].y;
      }
      let centroidX = sumX / vertices.length;
      let centroidY = sumY / vertices.length;

      // Step 3: Draw the polygon, shifting all vertices so the centroid is at (0,0)
      ctx.beginPath();
      for (let i = 0; i < vertices.length; i++) {
        // Subtract the centroid coordinates from each vertex to center the shape.
        let x = vertices[i].x - centroidX;
        let y = vertices[i].y - centroidY;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Draw the outline of the polygon
      break; }
    case "Gog": {
      ctx.lineWidth = 5;
      if (mob.state !== "aggro") {
        ctx.strokeStyle = "rgba(0, 155, 0, 0.8)";
        ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
      } else {
        ctx.strokeStyle = "rgba(155, 0, 0, 0.8)";
        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
      }
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#aaaaaa";
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      if (mob.state !== "aggro") {
        ctx.fillStyle = "#000000";
      } else {
        ctx.fillStyle = "#ff0000";
      }
      ctx.beginPath();
      ctx.arc(10, 0, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break; }
    case "Bee": {
      let offsett = 5;
      let missile = 30;
      // Stinger
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-45, missile);
      ctx.beginPath();
      ctx.lineTo(-45, -missile);
      ctx.lineTo(-85, 0 + ngpo);
      ctx.lineTo(-45, missile);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      // Body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#ffe763";
      ctx.beginPath();
      ctx.ellipse(offsett, 0, 145 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(offsett, 0, 145 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.rect(20,-50,21,100);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.rect(-22,-50,21,100);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.rect(-63,-50,21,100);
      ctx.fill();
      ctx.closePath();
      ctx.restore();

      // Outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#d3bd46";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(offsett, 0, 145 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // Antennae
      let ann1 = 15.3;
      let ann2 = 36.45 + (ngpo / 2);
      ctx.lineWidth = 8.5;
      ctx.strokeStyle = "#333333"; // Set stroke color for the outlines

      // Left antenna
      ctx.moveTo(90, ann1); // Move to the starting point
      ctx.beginPath(); // Start a new path
      ctx.lineTo(85, ann2); // Draw the first segment
      ctx.quadraticCurveTo(65, ann1, 50, ann1); // Draw the curve
      ctx.stroke(); // Stroke the path without closing it

      // Right antenna
      ctx.moveTo(90, -ann1); // Move to the starting point
      ctx.beginPath(); // Start a new path
      ctx.lineTo(85, -ann2); // Draw the first segment
      ctx.quadraticCurveTo(65, -ann1, 50, -ann1); // Draw the curve
      ctx.stroke(); // Stroke the path without closing it

      //antennae tip
      ctx.beginPath(); // Start a new path
      ctx.fillStyle = "#333333";
      ctx.arc(85, -ann2, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); // Stroke the path without closing it
      ctx.beginPath(); // Start a new path
      ctx.arc(85, ann2, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); // Stroke the path without closing it
      break; }
    case "Hornet": {
      let offsep = 10;
      let miss = 20;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, miss);
      ctx.beginPath();
      ctx.lineTo(-50, -miss);
      ctx.lineTo(-100, ngpo);
      ctx.lineTo(-50, miss);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();

      //body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#ffd363";
      ctx.beginPath();
      ctx.ellipse(offsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      //stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(offsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.rect(22, -45, 20, 100);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.rect(-18, -45, 20, 100);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.rect(-56, -45, 20, 100);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      //outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#d3ad46";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(offsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // Reset strokeStyle before drawing antennae
      let an1 = 15.3;
      let an3 = 13.5;
      let an4 = 40;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, an1);
      ctx.lineTo(115, an4 + ngpo);
      ctx.quadraticCurveTo(85, an3, 50, an1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -an1);
      ctx.lineTo(115, -an4 - ngpo);
      ctx.quadraticCurveTo(85, -an3, 50, -an1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    case "Missile": {
      ctx.save();
      ctx.rotate(convertAngleToRadians(180));
      ctx.translate(75, 0);
      let miss = 20;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, miss);
      ctx.beginPath();
      ctx.lineTo(-50, -miss);
      ctx.lineTo(-100, 0);
      ctx.lineTo(-50, miss);
      ctx.lineTo(-50, -miss);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
      ctx.restore();
      break; }
    case "Beetle": {
      ctx.lineJoin = "round";
      ctx.lineWidth = 8.7;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      //pincers
      let cp1x = 35, cp1y = 9.5;
      let cp2x = 25, cp2y = -3;
      ctx.save()
      ctx.translate(30, 25);
      ctx.rotate(convertAngleToRadians(fasterngpo));
      ctx.strokeStyle = "#202020"; // Set pincer stroke color
      ctx.fillStyle = "#202020"; // Set pincer fill color
      ctx.beginPath();
      ctx.moveTo(0, 0); // 30-30, 25-25
      ctx.quadraticCurveTo(cp1x, cp1y, 50, -12.9); // (65-30, 34.5-25), (80-30, 12.1-25)
      ctx.quadraticCurveTo(cp2x, cp2y, 0, -15);    // (45-30, 22-25), (30-30, 10-25)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save()
      ctx.translate(30, -25);
      ctx.rotate(convertAngleToRadians(-fasterngpo));
      ctx.strokeStyle = "#202020"; // Set pincer stroke color
      ctx.fillStyle = "#202020"; // Set pincer fill color
      ctx.beginPath();
      ctx.moveTo(0, 0); // 30-30, 25-25
      ctx.quadraticCurveTo(cp1x, -cp1y, 50, 12.9); // (65-30, 34.5-25), (80-30, 12.1-25)
      ctx.quadraticCurveTo(cp2x, -cp2y, 0, 15);    // (45-30, 22-25), (30-30, 10-25)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Now, for the body
      ctx.beginPath(); // Start a new path for the body
      ctx.fillStyle = "#8f5db0";
      ctx.strokeStyle = "#764b90"; // Set body outline color
      const pathData = "M46.3219 0c0 21.7437-17.422 33.3645-46.3219 33.3645S-46.3219 21.7437-46.3219 0-28.8999-33.3645-0-33.3645 46.3219-21.7437 46.3219 0z";
      // Create a Path2D object from the SVG path data
      const path = new Path2D(pathData);
      // Set the fill color and draw the path
      ctx.fill(path); // Set the outline width, adjust as needed
      ctx.stroke(path);

      ctx.moveTo(-22, 0);
      ctx.quadraticCurveTo(0,5, 22, 0);
      ctx.stroke();

      ctx.lineWidth = 6;

      for (let i = 0; i < 3 * 2; i++) {
        const x = ((i % 2) + 1) * 30 - 45;
        const y = Math.floor(i / 3 + 1) * 30 - 45;

        ctx.strokeStyle = "#764b90"; // body outline color
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#764b90";
        ctx.fill();
        ctx.stroke();
      }

      ctx.strokeStyle = "#764b90"; // body outline color
      ctx.beginPath();
      ctx.arc(0, 18, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#764b90";
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#764b90"; // body outline color
      ctx.beginPath();
      ctx.arc(0, -18, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#764b90";
      ctx.fill();
      ctx.stroke();
      break; }
    case "Fly": {
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      let flystuff = (time / 10 - 190) * 0.8;

      // Draw the body part (stationary)
      ctx.strokeStyle = "#454545"; // Outline color for body
      ctx.fillStyle = "#555555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(0, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      ctx.closePath();

      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.strokeStyle = "rgba(255, 255, 255, 0)"; // blue
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      // Draw the first wing with rotation
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue
      ctx.save(); // Save the current canvas state
      ctx.translate(0, 0); // Translate to the point where the wing meets the body (adjusted from the previous center)
      ctx.rotate(-flystuff); // Rotate based on time
      ctx.beginPath();
      ctx.ellipse(-170 / 5, 120 / 5, 170 / 5, 120 / 5, 0, 0, Math.PI * 2); // Adjusted the coordinates to rotate around the tip
      ctx.fill();
      ctx.restore(); // Restore the canvas to the previous state, undoing the rotation

      // Draw the second wing with rotation
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue
      ctx.save(); // Save the current canvas state
      ctx.translate(0, 0); // Translate to the point where the wing meets the body (adjusted)
      ctx.rotate(flystuff); // Rotate in the opposite direction for the second wing
      ctx.beginPath();
      ctx.ellipse(-170 / 5, -120 / 5, 170 / 5, 120 / 5, 0, 0, Math.PI * 2); // Adjusted the coordinates to rotate around the tip
      ctx.fill();
      ctx.restore(); // Restore the canvas to the previous state, undoing the rotation
      break; }
    case "Cactus": {
      const sides = mob.rarity + 9; // Total number of sides
      const radius = 50; // Fixed radius for consistent size
      ctx.lineWidth = 105 / mob.radius; // Outline width

      // --- prepare vertex angles & positions ---
      const verts = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        const vx = Math.cos(angle) * radius;
        const vy = Math.sin(angle) * radius;
        verts.push({ angle, x: vx, y: vy });
      }

      // --- draw thorns (black triangles) slightly outside each vertex ---
      // draw them first so they appear "behind" the green body (the body will be drawn on top)
      ctx.fillStyle = "#222222";
      ctx.strokeStyle = "#222222";
      for (let i = 0; i < verts.length; i++) {
        const { angle, x: vx, y: vy } = verts[i];

        // outward unit vector and perpendicular
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const px = -Math.sin(angle);
        const py = Math.cos(angle);

        // scale params for thorn size (tweak these to taste)
        const tipLen = radius * 0.09;     // how far the tip sticks out from the vertex
        const baseInset = radius * 0.21;  // how much the base is inset toward the center
        const baseHalf = radius * 0.06;   // half-width of the base of the triangular thorn

        // tip point (further out than the vertex)
        const tipX = ux * (radius + tipLen);
        const tipY = uy * (radius + tipLen);

        // base points (slightly inward from the vertex, left and right along perpendicular)
        const baseCenterX = ux * (radius - baseInset);
        const baseCenterY = uy * (radius - baseInset);
        const baseLeftX = baseCenterX + px * baseHalf;
        const baseLeftY = baseCenterY + py * baseHalf;
        const baseRightX = baseCenterX - px * baseHalf;
        const baseRightY = baseCenterY - py * baseHalf;

        // draw the triangle
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseLeftY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseRightX, baseRightY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // --- draw the green cactus body on top (using the existing bulged polygon logic) ---
      ctx.beginPath();

      for (let i = 0; i <= sides; i++) {
        // Calculate the angle for each vertex (use same paramization so shape matches thorns)
        const angle = (i / sides) * 2 * Math.PI;

        // Calculate the vertex position
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          // Move to the first vertex
          ctx.moveTo(x, y);
        } else {
          // Calculate the midpoint between the current and previous vertex
          const prevAngle = ((i - 1) / sides) * 2 * Math.PI;
          const midX =
            Math.cos(prevAngle + (angle - prevAngle) / 2) * radius * 0.8; // Bulge inward
          const midY =
            Math.sin(prevAngle + (angle - prevAngle) / 2) * radius * 0.8; // Bulge inward

          // Draw a quadratic curve
          ctx.quadraticCurveTo(midX, midY, x, y);
        }
      }

      ctx.closePath(); // Close the polygon shape
      ctx.strokeStyle = "#288841"; // Outline color
      ctx.fillStyle = "#32a953"; // Fill color
      ctx.fill(); // Fill the polygon (drawn on top of thorns)
      ctx.stroke(); // Draw the outline
      break; }
    case "Sandstorm": {
      ctx.lineWidth = 8;
      ctx.fillStyle = "#d5c7a6";
      ctx.strokeStyle = ctx.fillStyle;
      drawPolygon(ctx, 0, 0, 6, 50, t, 1, 1);
      ctx.fillStyle = "#bfb295";
      ctx.strokeStyle = ctx.fillStyle;
      drawPolygon(ctx, 0, 0, 6, 50*(2/3), -t, 1, 1);
      ctx.fillStyle = "#a99e84";
      ctx.strokeStyle = ctx.fillStyle;
      drawPolygon(ctx, 0, 0, 6, 50*(1/3), t, 1, 1);
      break; }
    case "Bubble": {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#efefef";
      ctx.fillStyle = "rgba(0, 230, 240, 0.05)";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,0,0,0)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.arc(-25, 25, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      break; }
    case "Shell": {
      ctx.lineWidth = 7.5;
      ctx.strokeStyle = "#ccb36d";
      ctx.fillStyle = ctx.strokeStyle;
      //fins
      ctx.beginPath();
      ctx.moveTo(-35, 25);
      ctx.quadraticCurveTo(-20, 0, -35, -25);
      ctx.quadraticCurveTo(10, 0, -35, 25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      //main body
      ctx.fillStyle = "#fcdd86";
      ctx.beginPath();
      ctx.moveTo(-15, 20);
      ctx.lineTo(20, 45);
      ctx.quadraticCurveTo(80, 0, 20, -45);
      ctx.lineTo(-15, -20);
      ctx.quadraticCurveTo(-40, 0, -15, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      //accents
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.beginPath();
      ctx.moveTo(-10, 10);
      ctx.lineTo(25, 25);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(25, -25);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      ctx.lineTo(35, 12);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, -3);
      ctx.lineTo(35, -12);
      ctx.closePath();
      ctx.stroke();
      break; }
    case "Hel Beetle": {
      ctx.lineWidth = 2;
      const toothCount = 6;
      const centerX = 52; // pivot x
      const centerY = 0;
      const helouterRadius = 30;
      const helinnerRadius = 18;
      const angleOffset = -Math.PI / 2 * 0.7;
      const totalAngle = Math.PI * 0.7;
      const angleStep = totalAngle / (toothCount + 1);

      ctx.fillStyle = "#202020";
      ctx.strokeStyle = "#202020";

      for (let i = 0; i < toothCount; i++) {
            const angle = angleOffset + angleStep * (i + 1);
            const offsetTeethId = 2.5 * Math.sin(2 * ((t/3) + i));

            // Offset direction vector
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            // Base left point with offset
            const baseLeftX = centerX + (helouterRadius + offsetTeethId) * Math.cos(angle - 0.07);
            const baseLeftY = centerY + (helouterRadius + offsetTeethId) * Math.sin(angle - 0.07);

            // Base right point with offset
            const baseRightX = centerX + (helouterRadius + offsetTeethId) * Math.cos(angle + 0.07);
            const baseRightY = centerY + (helouterRadius + offsetTeethId) * Math.sin(angle + 0.07);

            // Tip point with offset
            const tipX = centerX + (helinnerRadius + offsetTeethId) * dx;
            const tipY = centerY + (helinnerRadius + offsetTeethId) * dy;

            // Mirror across centerX
            const flippedBaseLeftX = 2 * centerX - baseLeftX;
            const flippedBaseRightX = 2 * centerX - baseRightX;
            const flippedTipX = 2 * centerX - tipX;

            ctx.beginPath();
            ctx.moveTo(flippedBaseLeftX, baseLeftY);
            ctx.lineTo(flippedTipX, tipY);
            ctx.lineTo(flippedBaseRightX, baseRightY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
      }

      // Now, for the body
      ctx.lineWidth = 8.7;
      ctx.beginPath(); // Start a new path for the body
      ctx.fillStyle = "#ad1717";
      ctx.strokeStyle = "#8c1313"; // Set body outline color
      const helpathData = "M -46.3219 0 c 0 21.7437 17.422 33.3645 46.3219 33.3645 c 14.4514 0 26.0328 -2.9058 34.0008 -8.5301 c -8.5295 -4.9864 -14.2593 -14.2413 -14.2593 -24.8344 c 0 -10.5931 5.7298 -19.848 14.2593 -24.8344 c -7.9681 -5.6243 -19.5494 -8.5301 -34.0008 -8.5301 c -28.8999 0 -46.3219 11.6208 -46.3219 33.3645 z";
      // Create a Path2D object from the SVG path data
      const helpath = new Path2D(helpathData);
      // Set the fill color and draw the path
      ctx.fill(helpath); // Set the outline width, adjust as needed
      ctx.stroke(helpath);

      ctx.moveTo(-22, 0);
      ctx.quadraticCurveTo(0,5, 22, 0);
      ctx.stroke();

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#8c1313"; // Set body outline color
      for (let i = 0; i < 3 * 2; i++) {
        const x = ((i % 2) + 1) * 30 - 45;
        const y = Math.floor(i / 3 + 1) * 30 - 45;

        ctx.strokeStyle = "#8c1313"; // Set body outline color
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#8c1313"; // Set body outline color
        ctx.fill();
        ctx.stroke();
      }

      ctx.strokeStyle = "#8c1313"; // Set body outline color
      ctx.beginPath();
      ctx.arc(0, 18, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#8c1313"; // Set body outline color
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#8c1313"; // Set body outline color
      ctx.beginPath();
      ctx.arc(0, -18, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#8c1313"; // Set body outline color
      ctx.fill();
      ctx.stroke();
      break; }
    case "Hel Spider": {
      ctx.lineWidth = 14.5;
      // Define the leg length and angular range for clustering

      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      ctx.strokeStyle = "#333333"; // Leg color

      const longsection = 85;
      const shortsection = 65;
      const controlPoint = -30 + ngpo;
      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(longsection, shortsection); // Start at the center
      ctx.quadraticCurveTo(10, controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -controlPoint, -longsection, -shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(longsection, -shortsection); // Start at the center
      ctx.quadraticCurveTo(0, -controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, controlPoint, -longsection, shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      const alongsection = 42;
      const ashortsection = 97;
      const acontrolPoint = -10;
      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 - ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, ashortsection); // Start at the center
      ctx.quadraticCurveTo(10, acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -acontrolPoint, -alongsection, -ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 + ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, -ashortsection); // Start at the center
      ctx.quadraticCurveTo(0, -acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, acontrolPoint, -alongsection, ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.lineWidth = 1;
      const helSpiderTeethCount = 6;
      const helSpiderTeethCenterX = 52; // pivot x
      const helSpiderTeethCenterY = 0;
      const helSpiderTeethOuterRadius = 30;
      const helSpiderTeethInnerRadius = 18;
      const helSpiderTeethAngleOffset = -Math.PI / 2 * 0.7;
      const helSpiderTeethTotalAngle = Math.PI * 0.7;
      const helSpiderTeethAngleStep = helSpiderTeethTotalAngle / (helSpiderTeethCount + 1);

      ctx.fillStyle = "#202020";
      ctx.strokeStyle = "#202020";

      for (let i = 0; i < helSpiderTeethCount; i++) {
            const helSpiderTeethAngle = helSpiderTeethAngleOffset + helSpiderTeethAngleStep * (i + 1);
            const offsetSpiderTeethId = (2.5 * Math.sin(5 * ((t/3) + i))) + 2;

            // Direction vector along the tooth's angle
            const dx = Math.cos(helSpiderTeethAngle);
            const dy = Math.sin(helSpiderTeethAngle);

            // Base left point with animated offset
            const helSpiderTeethBaseLeftX =
                  helSpiderTeethCenterX +
                  (helSpiderTeethOuterRadius + offsetSpiderTeethId) * Math.cos(helSpiderTeethAngle - 0.07);
            const helSpiderTeethBaseLeftY =
                  helSpiderTeethCenterY +
                  (helSpiderTeethOuterRadius + offsetSpiderTeethId) * Math.sin(helSpiderTeethAngle - 0.07);

            // Base right point with animated offset
            const helSpiderTeethBaseRightX =
                  helSpiderTeethCenterX +
                  (helSpiderTeethOuterRadius + offsetSpiderTeethId) * Math.cos(helSpiderTeethAngle + 0.07);
            const helSpiderTeethBaseRightY =
                  helSpiderTeethCenterY +
                  (helSpiderTeethOuterRadius + offsetSpiderTeethId) * Math.sin(helSpiderTeethAngle + 0.07);

            // Tip point with animated offset
            const helSpiderTeethTipX =
                  helSpiderTeethCenterX + (helSpiderTeethInnerRadius + offsetSpiderTeethId) * dx;
            const helSpiderTeethTipY =
                  helSpiderTeethCenterY + (helSpiderTeethInnerRadius + offsetSpiderTeethId) * dy;

            // Flipped X coordinates (mirror horizontally about centerX)
            const flippedHelSpiderTeethBaseLeftX = 2 * helSpiderTeethCenterX - helSpiderTeethBaseLeftX;
            const flippedHelSpiderTeethBaseRightX = 2 * helSpiderTeethCenterX - helSpiderTeethBaseRightX;
            const flippedHelSpiderTeethTipX = 2 * helSpiderTeethCenterX - helSpiderTeethTipX;

            ctx.beginPath();
            ctx.moveTo(flippedHelSpiderTeethBaseLeftX, helSpiderTeethBaseLeftY);
            ctx.lineTo(flippedHelSpiderTeethTipX, helSpiderTeethTipY);
            ctx.lineTo(flippedHelSpiderTeethBaseRightX, helSpiderTeethBaseRightY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
      }

      // Draw the body
      ctx.lineWidth = 14.5;
      ctx.strokeStyle = "#45241d"; // Outline color for body
      ctx.fillStyle = "#552c24"; // Body color (Hel Spider)
      ctx.beginPath();
      ctx.arc(0, 0, 42, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      ctx.arc(40, 0, 25.2, convertAngleToRadians(-125), convertAngleToRadians(125), true);
      ctx.closePath();
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      break; }
    case "Jellyfish": {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.79)";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2); // Radius of 50
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tentacles
      const tentacleLength = 80;
      const tentacleAmount = 8;
      for (let i = 0; i < tentacleAmount; i++) {
        ctx.save();
        ctx.rotate(convertAngleToRadians((360/tentacleAmount) *  i /* + (i % 2 === 0 ? -ngpo : ngpo)*/));
        ctx.beginPath();
        ctx.moveTo(tentacleLength/3, 0);
        ctx.quadraticCurveTo((tentacleLength / 3) * 1.5, 0, (tentacleLength / 3) * 3, (i % 2 === 0 ? -ngpo : ngpo));
        ctx.stroke();
        ctx.restore();
      }
      break; }
    case "Hel Jellyfish": {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(155,0,0,0.79)";
      ctx.fillStyle = "rgba(155,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2); // Radius of 50
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tentacles
      const tentacleLength = 80;
      const tentacleAmount = 16;
      for (let i = 0; i < tentacleAmount; i++) {
        ctx.save();
        ctx.rotate(convertAngleToRadians((360/tentacleAmount) *  i /* + (i % 2 === 0 ? -ngpo : ngpo)*/));
        ctx.beginPath();
        ctx.moveTo(tentacleLength/3, 0);
        ctx.quadraticCurveTo((tentacleLength / 3) * 1.5, 0, (tentacleLength / 3) * 3, (i % 2 === 0 ? -ngpo * 1.5 : ngpo * 1.5));
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.rotate(-mob.angle);

      // Eye
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#880000";
      ctx.fillStyle = "#ffff88";
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.quadraticCurveTo(0,20,30,0);
      ctx.quadraticCurveTo(0,-20,-30,0);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      ctx.save()
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.quadraticCurveTo(0,20,30,0);
      ctx.quadraticCurveTo(0,-20,-30,0);
      ctx.closePath();
      ctx.clip()

      // Pupil
      let helJellyfishPupilX = 10 * Math.cos(mob.angle);
      let helJellyfishPupilY = 10 * Math.sin(mob.angle);
      ctx.fillStyle = "#202020";
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(helJellyfishPupilX, helJellyfishPupilY, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.restore();
      break; }
    case "House M.D.": {
      ctx.drawImage(house, -50, -50, 100, 100);
      break; }
    case "Mecha Spider": {
      ctx.lineWidth = 14.5;
      // Define the leg length and angular range for clustering

      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      ctx.strokeStyle = "#333333"; // Leg color

      const longsection = 85;
      const shortsection = 65;
      const controlPoint = -30 + ngpo;
      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(longsection, shortsection); // Start at the center
      ctx.quadraticCurveTo(10, controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -controlPoint, -longsection, -shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(longsection, -shortsection); // Start at the center
      ctx.quadraticCurveTo(0, -controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, controlPoint, -longsection, shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      const alongsection = 42;
      const ashortsection = 97;
      const acontrolPoint = -10;
      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 - ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, ashortsection); // Start at the center
      ctx.quadraticCurveTo(10, acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -acontrolPoint, -alongsection, -ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 + ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, -ashortsection); // Start at the center
      ctx.quadraticCurveTo(0, -acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, acontrolPoint, -alongsection, ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      // Draw the body
      ctx.strokeStyle = "#8a8a8a"; // Outline color for body
      ctx.fillStyle = "#9b9b9b"; // Body color (Baby Ant)
      ctx.beginPath();
      drawPolygon(ctx, 0, 0, 10, 45, 0, 1, 1);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(0, -40);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 0, 0, 0)"; // Outline color for body

      // Draw the small gray circles at (+/-15, +/-20)
      ctx.fillStyle = "#8a8a8a"; // Set the gray color for the small circles

      ctx.beginPath();
      ctx.arc(15, 20, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-15, 20, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(15, -20, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-15, -20, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Draw the red circle at (0, 0)
      ctx.fillStyle = "#ee0000"; // Set the color to red
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      break; }
    case "Barrel": {
      ctx.strokeStyle = "#c4be1b";
      ctx.lineWidth = 5;
      ctx.fillStyle = "#f5ee22";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f5ee22";
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      //radioactive symbol
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 2.2;
      let barrelPath =
        "M -13.5 0.4 c 0 -7.2902 6.6098 -14.4 13.9 -14.4 c 7.2902 0 14.2 7.3098 14.2 14.6 c 0 7.2902 -7.6098 13.3 -14.9 13.3 c -7.2902 0 -13.2 -6.2098 -13.2 -13.5 z M -0.55 12.1667 c 8.1319 0.9192 12.8 -9.3386 12.8 -12.1 c 0 -2.7614 -5.8352 -11.712 -11.7 -11.7 c -2.8598 0.0058 -10.6 2.9386 -12.1 11.5 c -0.4766 2.72 3.3236 11.4323 11 12.3 z";
      let barrelSymbol = new Path2D(barrelPath);
      ctx.fill(barrelSymbol); // Set the outline width, adjust as needed
      ctx.stroke(barrelSymbol);
      ctx.beginPath();
      ctx.lineWidth = 0.5;
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Define trapezoid points relative to the center
      const innerRadius = 3;
      const outerRadius = -20.5;
      const smallBase = 5;
      const largeBase = 10;
      const height = 3;

      // Draw three trapezoids facing the center
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;

        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -innerRadius - height / 2);

        ctx.beginPath();
        ctx.moveTo(-smallBase / 2, 0);
        ctx.lineTo(-largeBase / 2, -height);
        ctx.lineTo(largeBase / 2, -height);
        ctx.lineTo(smallBase / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#7a7a7a";
      ctx.fillStyle = "#999999";
      ctx.beginPath();
      ctx.arc(40, 0, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#c4be1b";
      ctx.fillStyle = "#63bf2e";
      ctx.beginPath();
      ctx.arc(-30, 0, 8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break; }    
    case "Cube": {
      ctx.save()
      ctx.rotate(-mob.angle);
      const size = 25;
      const half = size / 2;
      const fov = 100;
      const dist = 200;
      const scale = 5;

      // 3D cube vertices
      const vertices = [
        { x: -half, y: -half, z: -half },
        { x:  half, y: -half, z: -half },
        { x:  half, y:  half, z: -half },
        { x: -half, y:  half, z: -half },
        { x: -half, y: -half, z:  half },
        { x:  half, y: -half, z:  half },
        { x:  half, y:  half, z:  half },
        { x: -half, y:  half, z:  half }
      ];

      // cube faces as quads (each a list of 4 vertex-indices)
      const faces = [
        [0,1,2,3], // back
        [4,5,6,7], // front
        [0,1,5,4], // bottom
        [2,3,7,6], // top
        [1,2,6,5], // right
        [0,3,7,4]  // left
      ];

      // update rotation angles
      const t = performance.now() / 1000;
      const ax = mob.angle;
      const ay = 0;
      const az = mob.angle;

      // precompute sines & cosines
      const cX = Math.cos(ax), sX = Math.sin(ax);
      const cY = Math.cos(ay), sY = Math.sin(ay);
      const cZ = Math.cos(az), sZ = Math.sin(az);

      // rotation helpers
      function rotX(p) { return { x: p.x, y: p.y*cX - p.z*sX, z: p.y*sX + p.z*cX }; }
      function rotY(p) { return { x: p.x*cY + p.z*sY, y: p.y,       z: -p.x*sY + p.z*cY }; }
      function rotZ(p) { return { x: p.x*cZ - p.y*sZ, y: p.x*sZ + p.y*cZ, z: p.z }; }

      // project to 2D
      function proj(p) {
        const z2 = p.z + dist;
        const sc = fov / z2 * scale;
        return { x: p.x * sc, y: p.y * sc, z: z2 };
      }

      // first rotate all vertices & project
      const rotated = vertices.map(v => rotZ(rotY(rotX(v))));
      const pts = rotated.map(proj);

      // for each face compute avg depth & normal-based intensity
      const faceData = faces.map(face => {
        // pick three verts for normal
        const p0 = rotated[face[0]];
        const p1 = rotated[face[1]];
        const p2 = rotated[face[2]];
        // two edge vectors
        const u = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
        const v = { x: p2.x - p0.x, y: p2.y - p0.y, z: p2.z - p0.z };
        // cross product = face normal
        const nx = u.y*v.z - u.z*v.y;
        const ny = u.z*v.x - u.x*v.z;
        const nz = u.x*v.y - u.y*v.x;
        // normalize
        const len = Math.hypot(nx,ny,nz) || 1;
        const nz_n = nz/len;
        // intensity 0..1 (faces pointing toward camera are +Z)
        const intensity = Math.max(0, nz_n);
        // average depth for painter's sort
        const avgZ = face.reduce((sum, idx) => sum + pts[idx].z, 0) / 4;
        return { face, intensity, avgZ };
      });

      // sort back-to-front
      faceData.sort((a,b) => b.avgZ - a.avgZ);

      // draw faces
      faceData.forEach(({ face, intensity }) => {
        // map intensity to 30..220
        const c = Math.floor(30 + intensity * 190);
        ctx.fillStyle = `rgb(${c},${c},${c * 0.5})`;
        ctx.strokeStyle = `rgb(${c * 0.75},${c * 0.75},${c * 0.5625})`;
        ctx.lineWidth = 1;

        // draw filled quad
        ctx.beginPath();
        face.forEach((idx, i) => {
          const p = pts[idx];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else         ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // finally draw edges if you still want them on top
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth   = 2;
      faces.forEach(face => {
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          const p = pts[face[i]];
          const q = pts[face[j]];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          //ctx.stroke();
        }
      });
      ctx.restore();
     break; }
    case "Dodecahedron": {
      const size  = 25;
      const fov   = 100;
      const dist  = 200;
      const scale = 5;

      // constants for golden ratio
      const φ = (1 + Math.sqrt(5)) / 2;
      const a = 1 / φ;
      const b = φ;

      // 3D dodecahedron vertices (unscaled)
      const rawVerts = [
        // (±1, ±1, ±1)
        [ 1,  1,  1], [ 1,  1, -1], [ 1, -1,  1], [ 1, -1, -1],
        [-1,  1,  1], [-1,  1, -1], [-1, -1,  1], [-1, -1, -1],
        // ( 0, ±a, ±b)
        [ 0,  a,  b], [ 0,  a, -b], [ 0, -a,  b], [ 0, -a, -b],
        // (±a, ±b, 0)
        [ a,  b,  0], [ a, -b,  0], [-a,  b,  0], [-a, -b,  0],
        // (±b, 0, ±a)
        [ b,  0,  a], [ b,  0, -a], [-b,  0,  a], [-b,  0, -a]
      ];
      // scale to desired size
      const vertices = rawVerts.map(([x,y,z]) => ({ x: x*size, y: y*size, z: z*size }));

      // dodecahedron faces (12 pentagons)
      const faces = [
        [0, 8,  10, 2, 16],
        [0, 16, 18, 6, 12],
        [0, 12, 14, 4, 8],
        [8, 4,  17, 10,  0],
        [16, 2,  13, 18,  0],
        [12, 6,  15, 14,  0],
        [1, 9,  11, 3, 17],
        [1, 17, 19, 7, 13],
        [1, 13,  2, 10,  9],
        [9, 10,  6, 18, 11],
        [11, 18, 19,  3, 9],
        [3, 19,   7, 15, 11]
      ];

      // rotation angles
      const t  = performance.now() / 1000;
      const ax = t * 1.2;
      const ay = t;
      const az = mob.angle;

      // precompute
      const cX = Math.cos(ax), sX = Math.sin(ax);
      const cY = Math.cos(ay), sY = Math.sin(ay);
      const cZ = Math.cos(az), sZ = Math.sin(az);

      function rotX(p) { return { x: p.x, y: p.y*cX - p.z*sX, z: p.y*sX + p.z*cX }; }
      function rotY(p) { return { x: p.x*cY + p.z*sY, y: p.y,       z: -p.x*sY + p.z*cY }; }
      function rotZ(p) { return { x: p.x*cZ - p.y*sZ, y: p.x*sZ + p.y*cZ, z: p.z }; }

      function proj(p) {
        const z2 = p.z + dist;
        const sc = fov / z2 * scale;
        return { x: p.x*sc, y: p.y*sc, z: z2 };
      }

      // rotate & project
      const rotated = vertices.map(v => rotZ(rotY(rotX(v))));
      const pts     = rotated.map(proj);

      // compute face depth & shading
      const faceData = faces.map(face => {
        const p0 = rotated[face[0]], p1 = rotated[face[1]], p2 = rotated[face[2]];
        const u = { x: p1.x-p0.x, y: p1.y-p0.y, z: p1.z-p0.z };
        const v = { x: p2.x-p0.x, y: p2.y-p0.y, z: p2.z-p0.z };
        const nx = u.y*v.z - u.z*v.y;
        const ny = u.z*v.x - u.x*v.z;
        const nz = u.x*v.y - u.y*v.x;
        const len = Math.hypot(nx,ny,nz) || 1;
        const intensity = Math.max(0, nz/len);
        const avgZ = face.reduce((sum, i) => sum + pts[i].z, 0) / face.length;
        return { face, intensity, avgZ };
      });

      // painter's sort
      faceData.sort((a,b) => b.avgZ - a.avgZ);

      // draw faces
      faceData.forEach(({ face, intensity }) => {
        const c = Math.floor(30 + intensity*190);
        ctx.fillStyle   = `rgb(${c},${c},${c})`;
        ctx.strokeStyle = "#000";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        face.forEach((i, k) => {
          const p = pts[i];
          if (k === 0) ctx.moveTo(p.x, p.y);
          else         ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // build a unique set of edges
      const edgeSet = new Set();
      faces.forEach(face => {
        for (let i = 0; i < face.length; i++) {
          const j = (i + 1) % face.length;
          const a = face[i], b = face[j];
          // sort the pair so "3,7" and "7,3" collide to the same key
          const key = a < b ? `${a},${b}` : `${b},${a}`;
          edgeSet.add(key);
        }
      });

      // draw each unique edge
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth   = 2;
      edgeSet.forEach(key => {
        const [i, j] = key.split(",").map(Number);
        const p = pts[i], q = pts[j];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      });
      break; }
    case "Yellowjacket": {
      let offsep = 10;
      let miss = 20;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#3E2723";
      ctx.fillStyle = "#3E2723";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, miss);
      ctx.beginPath();
      ctx.lineTo(-50, -miss);
      ctx.lineTo(-100, ngpo);
      ctx.lineTo(-50, miss);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();

      //body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#fff363";
      ctx.beginPath();
      ctx.ellipse(offsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      //stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(offsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#3E2723";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.rect(22, -45, 20, 100);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.rect(-18, -45, 20, 100);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.rect(-56, -45, 20, 100);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      //outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#d3bd46";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(offsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // Reset strokeStyle before drawing antennae
      let an1 = 14.3;
      let an3 = 12.5;
      let an4 = 50;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#3E2723";
      ctx.strokeStyle = "#3E2723"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, an1);
      ctx.lineTo(105, an4 + ngpo);
      ctx.quadraticCurveTo(85, an3, 50, an1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -an1);
      ctx.lineTo(105, -an4 - ngpo);
      ctx.quadraticCurveTo(85, -an3, 50, -an1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    case "Moth": {
      ctx.lineWidth = 16.5;
      ctx.lineEnd = "round"; // Set the line cap to round for rounded ends
      let mothstuff = (time / 10 - 190) * 0.8;

      // Draw the body part (stationary)
      ctx.strokeStyle = "#543e3e"; // Outline color for body
      ctx.fillStyle = "#705353"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(0, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      ctx.closePath();

      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.strokeStyle = "rgba(255, 255, 255, 0)"; // blue
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      // Draw the first wing with rotation
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue
      ctx.save(); // Save the current canvas state
      ctx.translate(0, 0); // Translate to the point where the wing meets the body (adjusted from the previous center)
      ctx.rotate(-mothstuff); // Rotate based on time
      ctx.beginPath();
      ctx.ellipse(-170 / 5, 120 / 5, 170 / 5, 120 / 5, 0, 0, Math.PI * 2); // Adjusted the coordinates to rotate around the tip
      ctx.fill();
      ctx.restore(); // Restore the canvas to the previous state, undoing the rotation

      // Draw the second wing with rotation
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue
      ctx.save(); // Save the current canvas state
      ctx.translate(0, 0); // Translate to the point where the wing meets the body (adjusted)
      ctx.rotate(mothstuff); // Rotate in the opposite direction for the second wing
      ctx.beginPath();
      ctx.ellipse(-170 / 5, -120 / 5, 170 / 5, 120 / 5, 0, 0, Math.PI * 2); // Adjusted the coordinates to rotate around the tip
      ctx.fill();
      ctx.restore(); // Restore the canvas to the previous state, undoing the rotation
      ctx.strokeStyle = "#222222";
      ctx.fillStyle = "#222222";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(20, 10);
      ctx.quadraticCurveTo(45, 5, 70, 30 - ngpo * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0)";
      ctx.arc(70, 30 - ngpo * 1.4, 10, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "#222222";
      ctx.moveTo(20, -10);
      ctx.quadraticCurveTo(45, -5, 70, -30 + ngpo * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0)";
      ctx.arc(70, -30 + ngpo * 1.4, 10, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      break; }
    case "Cave Spider": {
      ctx.lineWidth = 14.5;
      // Define the leg length and angular range for clustering

      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      ctx.strokeStyle = "#333333"; // Leg color

      const longsection = 170;
      const shortsection = 130;
      const controlPoint = -30 + ngpo;
      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(longsection, shortsection); // Start at the center
      ctx.quadraticCurveTo(10, controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -controlPoint, -longsection, -shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(longsection, -shortsection); // Start at the center
      ctx.quadraticCurveTo(0, -controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, controlPoint, -longsection, shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      const alongsection = 84;
      const ashortsection = 194;
      const acontrolPoint = -10;
      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 - ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, ashortsection); // Start at the center
      ctx.quadraticCurveTo(10, acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -acontrolPoint, -alongsection, -ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 + ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, -ashortsection); // Start at the center
      ctx.quadraticCurveTo(0, -acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, acontrolPoint, -alongsection, ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      // Draw the body
      ctx.strokeStyle = "#101515"; // Outline color for body
      ctx.fillStyle = "#1f111e"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2); // Radius of 42
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      break; }
    case "Karen": {
      ctx.save();
      ctx.rotate(-mob.angle);

      // HAIR (base/back)
      ctx.fillStyle = "#3b2b1b"; // dark brown hair
      ctx.strokeStyle = "#2b1a0f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0,0,56,convertAngleToRadians(160),convertAngleToRadians(20));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // FACE
      ctx.fillStyle = "#f7c58d";
      ctx.strokeStyle = "#e6b47c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#3b2b1b"; // dark brown hair
      ctx.strokeStyle = "#2b1a0f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0,0,50,convertAngleToRadians(180),convertAngleToRadians(-50));
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      break; }
    case "Leech": {
      ctx.lineWidth = 15; // Set the new line width

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#202020"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(15, 35); // Left mandible
      ctx.lineTo(80, time * 1.2);
      ctx.moveTo(15, -35); // Right mandible
      ctx.lineTo(80, -time * 1.2);
      ctx.stroke(); // Draw mandibles

      // === POINT LIST (replace the previous ring) ===
      const scaleInv = mob.radius ? (50 / mob.radius) : 1;
      const cosA = Math.cos(-mob.angle);
      const sinA = Math.sin(-mob.angle);

      if (Array.isArray(mob.tailPoints) && mob.tailPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(0, 0); // start at mob center

        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];

          // translate relative to mob
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;

          // rotate into mob-local space
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;

          // undo scaling
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.lineTo(lx, ly);
        }
        ctx.lineWidth = 100;
        ctx.strokeStyle = "#292929";
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0); // start at mob center

        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];

          // translate relative to mob
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;

          // rotate into mob-local space
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;

          // undo scaling
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.lineTo(lx, ly);
        }
        ctx.lineWidth = 75;
        ctx.strokeStyle = "#404040";
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      } else {
      }
      break; }
    case "Mecha Worm": {
      ctx.lineWidth = 15; // Set the new line width

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#202020"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(15, 35); // Left mandible
      ctx.lineTo(60, time + 18);
      ctx.lineTo(80, time + 3);
      ctx.moveTo(15, -35); // Right mandible
      ctx.lineTo(60, -time - 18);
      ctx.lineTo(80, -time - 3);
      ctx.stroke(); // Draw mandibles

      // === POINT LIST (replace the previous ring) ===
      const scaleInv = mob.radius ? (50 / mob.radius) : 1;
      const cosA = Math.cos(-mob.angle);
      const sinA = Math.sin(-mob.angle);

      if (Array.isArray(mob.tailPoints) && mob.tailPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(0, 0); // start at mob center

        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];

          // translate relative to mob
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;

          // rotate into mob-local space
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;

          // undo scaling
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.lineTo(lx, ly);
        }
        ctx.lineWidth = 100;
        ctx.strokeStyle = "#8a8a8a"; // Outline color for body
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0); // start at mob center

        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];

          // translate relative to mob
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;

          // rotate into mob-local space
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;

          // undo scaling
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.lineTo(lx, ly);
        }
        ctx.lineWidth = 75;
        ctx.strokeStyle = "#9b9b9b"; // Outline color for body
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // === Draw connecting lines (mandible color) ===
        ctx.beginPath();
        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;
          lx *= scaleInv;
          ly *= scaleInv;
          if (idx === 0) {
            ctx.moveTo(lx, ly);
          } else {
            ctx.lineTo(lx, ly);
          }
        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#202020"; // Mandible color
        ctx.stroke();

        // === Draw red dots on each tail segment ===
        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.beginPath();
          ctx.arc(lx, ly, 10, 0, Math.PI * 2);
          ctx.fillStyle = "red";
          ctx.fill();
        }
      } else {
      }
      break; }
    case "Wasp": {
      let waspoffsep = 10;
      let waspmiss = 20;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, waspmiss);
      ctx.beginPath();
      ctx.lineTo(-50, -waspmiss);
      ctx.lineTo(-100, ngpo);
      ctx.lineTo(-50, waspmiss);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();

      //body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#c8803c";
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      //stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(35, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#c8803c";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(65, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(80, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#c8803c";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(100, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      //outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#b77334";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // Reset strokeStyle before drawing antennae
      let waspan1 = 15.3;
      let waspan3 = 13.5;
      let waspan4 = 40;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, waspan1);
      ctx.lineTo(125, waspan4 + ngpo);
      ctx.quadraticCurveTo(85, waspan3, 50, waspan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -waspan1);
      ctx.lineTo(125, -waspan4 - ngpo);
      ctx.quadraticCurveTo(85, -waspan3, 50, -waspan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    case "Wasp Missile": {
      ctx.lineCap = "round";
      ctx.save();
      ctx.rotate(convertAngleToRadians(180));
      ctx.translate(75, 0);

      let waspmiss = 20;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, waspmiss);
      ctx.beginPath();
      ctx.lineTo(-50, -waspmiss);
      ctx.lineTo(-100, 0);
      ctx.lineTo(-50, waspmiss);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
      break; }
    case "Mantis": {
      let mantisoffsep = 0;
      ctx.lineWidth = 8.5;
      ctx.strokeStyle = "#333333"; // Leg color

      const mantislongsection = 45;
      const mantisshortsection = 45;
      const mantiscontrolPoint = -10 + ngpo;
      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(mantislongsection, mantisshortsection); // Start at the center
      ctx.quadraticCurveTo(10, mantiscontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -mantiscontrolPoint, -mantislongsection, -mantisshortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(mantislongsection, -mantisshortsection); // Start at the center
      ctx.quadraticCurveTo(0, -mantiscontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, mantiscontrolPoint, -mantislongsection, mantisshortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5));
      ctx.beginPath();
      ctx.moveTo(5,60); // Start at the center
      ctx.lineTo(-5,-60);
      ctx.stroke(); // Draw the line
      ctx.restore();

      //body
      ctx.strokeStyle = "#78a62e";
      ctx.fillStyle = "#9acc46";
      ctx.beginPath();
      ctx.ellipse(mantisoffsep, 0, 145 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline
     
      // Accents
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.beginPath();
      ctx.moveTo(25,25);
      ctx.quadraticCurveTo(10,0,25,-25);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(12,0);
      ctx.lineTo(-45,0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-5,30);
      ctx.quadraticCurveTo(-35,30,-45,15);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-5,-30);
      ctx.quadraticCurveTo(-35,-30,-45,-15);
      ctx.stroke();

      // Reset strokeStyle before drawing antennae
      ctx.lineWidth = 10.5;
      let mantisan1 = 15.3;
      let mantisan3 = 14.5;
      let mantisan4 = 40;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, mantisan1);
      ctx.lineTo(115, mantisan4 + ngpo);
      ctx.quadraticCurveTo(85, mantisan3, 50, mantisan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -mantisan1);
      ctx.lineTo(115, -mantisan4 - ngpo);
      ctx.quadraticCurveTo(85, -mantisan3, 50, -mantisan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    case "Mantis Pea": {
      ctx.strokeStyle = "#78a62e";
      ctx.fillStyle = "#9acc46";
      ctx.lineWidth = 100/mob.radius;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break; }
    case "Hel Wasp": {
      // draw missiles first if server-provided offsets exist
      if (typeof offsets !== "undefined" && Array.isArray(offsets) && offsets.length) {
        const missileOffset = (typeof mob !== "undefined" && mob.hitbox_size) ? mob.hitbox_size + 10 : 30;
        for (let i = 0; i < offsets.length; i++) {
          const off = offsets[i];
          const sx = Math.cos(mob.angle + off.angleOffset) * missileOffset + off.posX;
          const sy = Math.sin(mob.angle + off.angleOffset) * missileOffset + off.posY;

          ctx.save();
          ctx.translate(sx + 50, sy);
          ctx.rotate(mob.angle + off.angleOffset);

          // long dark gray triangle (pointing along +x after rotation)
          ctx.beginPath();
          ctx.moveTo(-12, -6);
          ctx.lineTo(48, 0);
          ctx.lineTo(-12, 6);
          ctx.closePath();
          ctx.fillStyle = "#333333";
          ctx.fill();

          // optional thin outline for contrast
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "#222222";
          ctx.stroke();

          ctx.restore();
        }
      }

      let helwaspoffsep = 10;

      //body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#ad1717";
      ctx.beginPath();
      ctx.ellipse(helwaspoffsep, 0, 61.3636364, 45.4545455, 0, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      ctx.ellipse(helwaspoffsep + 50, 0, 35, 35, 0, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();
      ctx.fill();

      //stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(helwaspoffsep, 0, 61.3636364, 45.4545455, 0, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      ctx.ellipse(helwaspoffsep + 65, 0, 40, 40, 0, convertAngleToRadians(-125), convertAngleToRadians(125), true);
      ctx.clip();
      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(35, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ad1717";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(65, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(80, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ad1717";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(100, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      //outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#8c1313";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(helwaspoffsep, 0, 61.3636364, 45.4545455, 0, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      ctx.ellipse(helwaspoffsep + 65, 0, 40, 40, 0, convertAngleToRadians(-125), convertAngleToRadians(125), true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline
      break; }
    case "Hel Wasp Missile": {
      ctx.save();
      ctx.rotate(convertAngleToRadians(180));
      ctx.translate(75, 0);
      let miss = 15;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, miss);
      ctx.beginPath();
      ctx.lineTo(-50, -miss);
      ctx.lineTo(-100, 0);
      ctx.lineTo(-50, miss);
      ctx.lineTo(-50, -miss);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
      ctx.restore();
      break; }
    case "Worm": {
      ctx.lineWidth = 15; // Set the new line width

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#202020"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(15, 35); // Left mandible
      ctx.lineTo(80, time * 1.2);
      ctx.moveTo(15, -35); // Right mandible
      ctx.lineTo(80, -time * 1.2);
      ctx.stroke(); // Draw mandibles

      // === POINT LIST (replace the previous ring) ===
      const scaleInv = mob.radius ? (50 / mob.radius) : 1;
      const cosA = Math.cos(-mob.angle);
      const sinA = Math.sin(-mob.angle);

      if (Array.isArray(mob.tailPoints) && mob.tailPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(0, 0); // start at mob center

        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];

          // translate relative to mob
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;

          // rotate into mob-local space
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;

          // undo scaling
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.lineTo(lx, ly);
        }
        ctx.lineWidth = 100;
        ctx.strokeStyle = "#4b2c05";
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0); // start at mob center

        for (let idx = 0; idx < mob.tailPoints.length; idx++) {
          const p = mob.tailPoints[idx];

          // translate relative to mob
          let dx = p.x - mob.x;
          let dy = p.y - mob.y;

          // rotate into mob-local space
          let lx = dx * cosA - dy * sinA;
          let ly = dx * sinA + dy * cosA;

          // undo scaling
          lx *= scaleInv;
          ly *= scaleInv;
          ctx.lineTo(lx, ly);
        }
        ctx.lineWidth = 75;
        ctx.strokeStyle = "#5c3606";
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      } else {
      }
      break; }
    case "Scorpion": {
      ctx.lineWidth = 7.5;
      ctx.strokeStyle = "#333333"; // Leg color

      const slongsection = 30;
      const sshortsection = 34;
      const scontrolPoint = -20 + ngpo;

      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(slongsection, sshortsection); // Start at the center
      ctx.quadraticCurveTo(10, scontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -scontrolPoint, -slongsection, -sshortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(slongsection, -sshortsection); // Start at the center
      ctx.quadraticCurveTo(0, -scontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, scontrolPoint, -slongsection, sshortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      const salongsection = 6;
      const sashortsection = 47;
      const sacontrolPoint = -10;
      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5));
      ctx.beginPath();
      ctx.moveTo(salongsection, sashortsection); // Start at the center
      ctx.quadraticCurveTo(10, sacontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(
        -10,
        -sacontrolPoint,
        -salongsection,
        -sashortsection
      ); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.beginPath();
      ctx.moveTo(salongsection, -sashortsection); // Start at the center
      ctx.quadraticCurveTo(0, -sacontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, sacontrolPoint, -salongsection, sashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      // pincers
      let cp1x = 35, cp1y = 9.5;
      let cp2x = 25, cp2y = -3;
      ctx.save();
      ctx.scale(0.75,0.55);
      ctx.translate(-12,0);

      ctx.save();
      ctx.translate(30, 25);
      ctx.rotate(convertAngleToRadians(fasterngpo));
      ctx.strokeStyle = "#333333"; // Set pincer stroke color
      ctx.fillStyle = "#333333"; // Set pincer fill color
      ctx.beginPath();
      ctx.moveTo(0, 0); // 30-30, 25-25
      ctx.quadraticCurveTo(cp1x, cp1y, 50, -12.9); // (65-30, 34.5-25), (80-30, 12.1-25)
      ctx.quadraticCurveTo(cp2x, cp2y, 0, -15);    // (45-30, 22-25), (30-30, 10-25)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(30, -25);
      ctx.rotate(convertAngleToRadians(-fasterngpo));
      ctx.strokeStyle = "#333333"; // Set pincer stroke color
      ctx.fillStyle = "#333333"; // Set pincer fill color
      ctx.beginPath();
      ctx.moveTo(0, 0); // 30-30, 25-25
      ctx.quadraticCurveTo(cp1x, -cp1y, 50, 12.9); // (65-30, 34.5-25), (80-30, 12.1-25)
      ctx.quadraticCurveTo(cp2x, -cp2y, 0, 15);    // (45-30, 22-25), (30-30, 10-25)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      ctx.strokeStyle = "#9e7d24"; // Outline color for body
      ctx.fillStyle = "#c69a2c"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.moveTo(-47,0)
      let cp1 = {x:-45,y:47};
      let cp2 = {x:23,y:43};
      ctx.bezierCurveTo(cp1.x,cp1.y,cp2.x,cp2.y,42,0);
      ctx.bezierCurveTo(cp2.x,-cp2.y,cp1.x,-cp1.y,-47,0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // stripes
      ctx.moveTo(20, 10);
      ctx.quadraticCurveTo(30, 0, 20, -10);
      ctx.moveTo(6, 15);
      ctx.quadraticCurveTo(9, 0, 6, -15);
      ctx.moveTo(-6, 20);
      ctx.quadraticCurveTo(-9, 0, -6, -20);
      ctx.moveTo(-20, 15);
      ctx.quadraticCurveTo(-23, 0, -20, -15);
      ctx.stroke();

      // tail
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#b18b28"; // Outline color for body
      ctx.fillStyle = "#dbab32"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.moveTo(-22,20 + ngpo/5);
      ctx.quadraticCurveTo(5,ngpo/5, -22,-20 + ngpo/5);
      ctx.bezierCurveTo(-52,-20, -52,20, -22,20 + ngpo/5);
      ctx.closePath()
      ctx.fill();
      ctx.stroke();

      ctx.moveTo(-22, 10 + ngpo/5);
      ctx.quadraticCurveTo(-30, ngpo/5, -22, -10 + ngpo/5);

      ctx.moveTo(-32, 10 + ngpo/5);
      ctx.quadraticCurveTo(-40, ngpo/5, -32, -10 + ngpo/5);
      ctx.stroke();

      let missile = 10;
      let base1 = -12, base2 = 1;
      ctx.strokeStyle = "#292929";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(base1, missile + ngpo/5);
      ctx.beginPath();
      ctx.lineTo(base1, -missile + ngpo/5);
      ctx.lineTo(base2, ngpo/5);
      ctx.lineTo(base1, missile + ngpo/5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break; }
    case "Scorpion Missile": {
      ctx.save();
      ctx.translate(7,0);
      let missile = 10;
      let base1 = -12, base2 = 1;
      ctx.strokeStyle = "#292929";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(base1, missile);
      ctx.beginPath();
      ctx.lineTo(base1, -missile);
      ctx.lineTo(base2, 0);
      ctx.lineTo(base1, missile);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break; }
    case "Mecha Wasp": {
      let waspoffsep = 10;
      let waspmiss = 20;
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#8a8a8a";
      ctx.fillStyle = "#9b9b9b";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, waspmiss);
      ctx.beginPath();
      ctx.lineTo(-50, -waspmiss);
      ctx.lineTo(-100, ngpo);
      ctx.lineTo(-50, waspmiss);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#cc0000";
      ctx.fillStyle = "#ee0000";
      ctx.beginPath();
      ctx.arc(-65,ngpo*0.35,5,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      //body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#9b9b9b"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      //stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();

      // first big black circle (x = 35) - filled, then clipped diagonal dashed yellow stripes + dashed yellow outline
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.arc(35, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // draw diagonal dashed yellow stripes inside the first circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(35, 0, 70, 0, Math.PI * 2);
      ctx.clip(); // restrict to this circle
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 7;
      for (let x = -300; x <= 400; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, -300);
        ctx.lineTo(x + 300, 300);
        ctx.stroke();
      }
      ctx.restore();

      // dashed yellow outline for the first circle
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(35, 0, 70, 0, Math.PI * 2);
      ctx.stroke();

      // second (middle) grey circle remains as-is
      ctx.fillStyle = "#9b9b9b"; // Body color (Baby Ant)
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(65, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.arc(80, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // draw diagonal dashed yellow stripes inside the second circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 0, 70, 0, Math.PI * 2);
      ctx.clip(); // restrict to this circle
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 7;
      for (let x = -300; x <= 400; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, -300);
        ctx.lineTo(x + 300, 300);
        ctx.stroke();
      }
      ctx.restore();

      // dashed yellow outline for the second circle
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(80, 0, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#9b9b9b";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(100, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "#8a8a8a";
      ctx.beginPath();
      ctx.arc(40,20,2.5,0,Math.PI*2);
      ctx.arc(40,-20,2.5,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-40,14,2.5,0,Math.PI*2);
      ctx.arc(-40,-14,2.5,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();

      //outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#8a8a8a";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reset strokeStyle before drawing antennae
      let waspan1 = 15.3;
      let waspan3 = 13.5;
      let waspan4 = 40;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, waspan1);
      ctx.lineTo(125, waspan4 + ngpo);
      ctx.quadraticCurveTo(85, waspan3, 50, waspan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#cc0000";
      ctx.fillStyle = "#ee0000";
      ctx.beginPath();
      ctx.arc(125,waspan4 + ngpo,5,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -waspan1);
      ctx.lineTo(125, -waspan4 - ngpo);
      ctx.quadraticCurveTo(85, -waspan3, 50, -waspan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#cc0000";
      ctx.fillStyle = "#ee0000";
      ctx.beginPath();
      ctx.arc(125,-waspan4 - ngpo,5,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break; }    
    case "Starfish": {
      ctx.save(); // Save the current canvas state before applying transformations

      // Determine how many arms to draw based on current HP
      const hpPercent = mob.curhp / mob.hp; // e.g., 0.6 for 60%
      const totalArms = 5;
      const armsToDraw = Math.ceil(totalArms * hpPercent); // draw proportional arms

      // Apply rotation to the mob
      ctx.rotate(t * 0.3); // Rotation
      ctx.lineWidth = 5+2/3;
      ctx.strokeStyle = "#aa403f"; // Set stroke color for the larger pentagon
      ctx.fillStyle = "#d14f4d"; // Set stroke color for the larger pentagon
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Apply the transformation for drawing
      ctx.strokeStyle = "#aa403f"; // Set stroke color for the larger pentagon
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.lineJoin = "round";
      ctx.lineWidth = 19;

      const length = 50; // Length of each line for the larger pentagon
      const curveHeight = 30; // Height of the concave curve (adjust as needed)

      // Draw the larger pentagon
      for (let i = 0; i < armsToDraw; i++) {
        const angle = (i * 2 * Math.PI) / totalArms; // Divide the circle
        const x1 = Math.cos(angle) * length;
        const y1 = Math.sin(angle) * length;
        const x2 = Math.cos(angle + (2 * Math.PI) / totalArms) * length;
        const y2 = Math.sin(angle + (2 * Math.PI) / totalArms) * length;

        const cx = (x1 + x2) / 2 - Math.cos(angle + Math.PI / 4) * curveHeight;
        const cy = (y1 + y2) / 2 - Math.sin(angle + Math.PI / 4) * curveHeight;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
      }

      // Draw the smaller pentagon
      ctx.strokeStyle = "#d14f4d"; // Set stroke color for the smaller pentagon
      ctx.fillStyle = "#d14f4d"; // Set fill color to match stroke color
      ctx.lineWidth = 12.5; // Smaller line width

      for (let i = 0; i < armsToDraw; i++) {
        const angle = (i * 2 * Math.PI) / totalArms;
        const x1 = Math.cos(angle) * length;
        const y1 = Math.sin(angle) * length;
        const x2 = Math.cos(angle + (2 * Math.PI) / totalArms) * length;
        const y2 = Math.sin(angle + (2 * Math.PI) / totalArms) * length;

        const cx = (x1 + x2) / 2 - Math.cos(angle + Math.PI / 4) * curveHeight;
        const cy = (y1 + y2) / 2 - Math.sin(angle + Math.PI / 4) * curveHeight;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
      }

      // Draw an even smaller pentagon (central)
      const smallsize = 20;
      ctx.lineWidth = 23.2;
      for (let i = 0; i < armsToDraw; i++) {
        const angle = (i * 2 * Math.PI) / totalArms;
        const x1 = Math.cos(angle) * smallsize;
        const y1 = Math.sin(angle) * smallsize;
        const x2 = Math.cos(angle + (2 * Math.PI) / totalArms) * smallsize;
        const y2 = Math.sin(angle + (2 * Math.PI) / totalArms) * smallsize;

        const cx = (x1 + x2) / 2 - Math.cos(angle + Math.PI / 4) * curveHeight;
        const cy = (y1 + y2) / 2 - Math.sin(angle + Math.PI / 4) * curveHeight;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
      }

      // Calculate positions of the smaller circles along each arm
      const starfishpentagonRadius = 50; // Radius of the larger circle that holds the centers of the smaller circles
      ctx.fillStyle = "#d4766c";
      ctx.strokeStyle = "#d4766c";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < armsToDraw; i++) {
        const angle = (i * 2 * Math.PI) / totalArms;
        const xCenter = starfishpentagonRadius * Math.cos(angle);
        const yCenter = starfishpentagonRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(xCenter, yCenter, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(xCenter * 0.65, yCenter * 0.65, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(xCenter * 0.3, yCenter * 0.3, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore(); // Restore canvas state after transformations
      break; }
    case "Dark Ladybug": {
      // ===== Setup Styling =====
      ctx.lineCap = "round";
      ctx.lineWidth = 10;

      // ===== Smaller Dark Circle =====
      ctx.beginPath();
      ctx.arc(24.5, 0, 25, 0, Math.PI * 2);
      ctx.fillStyle = "#202020";
      ctx.strokeStyle = blendColor("#202020", "#000000", 0.19);
      ctx.fill();
      ctx.stroke();

      // ===== Crescent Shape Path (for fill and clip) =====
      ctx.save(); // Save before clip
      ctx.beginPath();
      // Outer arc
      ctx.arc(0, 0, 50, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      // Inner arc (reverse)
      ctx.arc(45, 0, 30, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();

      // Fill the crescent shape
      ctx.fillStyle = "#a3272d";
      ctx.fill();

      // Clip to crescent shape
      ctx.clip();

      // ===== Randomized Spots (clipped and behind outline) =====
      ctx.save(); // Save translation context
      ctx.translate(-75, -75);

      ctx.fillStyle = "#be2e35";
      const spreadFactor = 50;
      const offsetFactor = 0;
      const spotty = 3 * Math.pow(1.05, mob.rarity) + mob.ran1;

      // Spot 1
      ctx.beginPath();
      ctx.arc(
        mob.ran1 * spreadFactor - offsetFactor,
        mob.ran2 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 2
      ctx.beginPath();
      ctx.arc(
        mob.ran2 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 3
      ctx.beginPath();
      ctx.arc(
        mob.ran1 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 4
      ctx.beginPath();
      ctx.arc(
        mob.ran2 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      ctx.restore(); // Restore translation
      ctx.restore(); // Restore from clipping

      // ===== Stroke Crescent Outline LAST =====
      ctx.beginPath();
      // Outer arc
      ctx.arc(0, 0, 50, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      // Inner arc
      ctx.arc(45, 0, 30, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();

      ctx.strokeStyle = blendColor("#a3272d", "#000000", 0.19);
      ctx.stroke();
      break; }
    case "Leafbug": {
      ctx.lineWidth = 10.5;

      //pincers
      ctx.save()
      ctx.scale(1.2,1.18);
      let cp1x = 35, cp1y = 9.5;
      let cp2x = 25, cp2y = -3;
      ctx.save()
      ctx.translate(30, 25);
      ctx.rotate(convertAngleToRadians(fasterngpo));
      ctx.strokeStyle = "#3c4030"; // Set pincer stroke color
      ctx.fillStyle = "#3c4030"; // Set pincer fill color
      ctx.beginPath();
      ctx.moveTo(0, 0); // 30-30, 25-25
      ctx.quadraticCurveTo(cp1x, cp1y, 50, -12.9); // (65-30, 34.5-25), (80-30, 12.1-25)
      ctx.quadraticCurveTo(cp2x, cp2y, 0, 10);    // (45-30, 22-25), (30-30, 10-25)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save()
      ctx.translate(30, -25);
      ctx.rotate(convertAngleToRadians(-fasterngpo));
      ctx.strokeStyle = "#3c4030"; // Set pincer stroke color
      ctx.fillStyle = "#3c4030"; // Set pincer fill color
      ctx.beginPath();
      ctx.moveTo(0, 0); // 30-30, 25-25
      ctx.quadraticCurveTo(cp1x, -cp1y, 50, 12.9); // (65-30, 34.5-25), (80-30, 12.1-25)
      ctx.quadraticCurveTo(cp2x, -cp2y, 0, -10);    // (45-30, 22-25), (30-30, 10-25)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      // Define the leg length and angular range for clustering

      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      ctx.strokeStyle = "#333333"; // Leg color

      const longsection = 45;
      const shortsection = 55;
      const controlPoint = -30 + ngpo;
      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2.5));
      ctx.beginPath();
      ctx.moveTo(longsection, shortsection); // Start at the center
      ctx.quadraticCurveTo(10, controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -controlPoint, -longsection, -shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line

      ctx.beginPath();
      ctx.moveTo(longsection, -shortsection); // Start at the center
      ctx.quadraticCurveTo(0, -controlPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, controlPoint, -longsection, shortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      const alongsection = 12;
      const ashortsection = 69;
      const acontrolPoint = -10;
      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 - ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, ashortsection); // Start at the center
      ctx.quadraticCurveTo(10, acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(-10, -acontrolPoint, -alongsection, -ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 1.5 + ngpo/2));
      ctx.beginPath();
      ctx.moveTo(alongsection, -ashortsection); // Start at the center
      ctx.quadraticCurveTo(0, -acontrolPoint, 0, 0); // Draw the leg outward
      ctx.quadraticCurveTo(0, acontrolPoint, -alongsection, ashortsection); // Draw the leg outward
      ctx.stroke(); // Draw the line
      ctx.restore();

      // Body
      ctx.strokeStyle = "#21853c";
      ctx.fillStyle = "#32a852";
      ctx.beginPath();
      ctx.moveTo(20,50);
      ctx.bezierCurveTo(90,50, 90,-50, 10,-50);
      ctx.bezierCurveTo(-100,-20, -100,20, 10, 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.moveTo(40,0);
      ctx.lineTo(-35,0);
      ctx.stroke();
      ctx.moveTo(10,24);
      ctx.lineTo(25,0);
      ctx.lineTo(10,-24);
      ctx.stroke();

      ctx.lineWidth = 8.5;
      ctx.moveTo(-20,17);
      ctx.lineTo(-5,0);
      ctx.lineTo(-20,-17);
      ctx.stroke();
      break; }
    case "Cicada": {
      let mantisoffsep = 0;
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#333333"; // Leg color

      //body
      ctx.strokeStyle = "#82603c";
      ctx.fillStyle = "#b38553";
      ctx.beginPath();
      ctx.ellipse(mantisoffsep, 0, 145 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline
     
      // Accents
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.lineWidth = 8;
      let cica = 44, cicb = 38, cicc = 30;
      ctx.beginPath();
      ctx.moveTo(-20,cica);
      ctx.lineTo(-20,-cica);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-35,cicb);
      ctx.lineTo(-35,-cicb);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-50,cicc);
      ctx.lineTo(-50,-cicc);
      ctx.stroke();

      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo));
      ctx.beginPath();
      ctx.ellipse(-30, 20, 350 / 5, 100 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo));
      //ctx.rotate(xx)
      ctx.beginPath();
      ctx.ellipse(-30, -20, 350 / 5, 100 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Thorax
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#634c34";
      ctx.fillStyle = "#92704c";
      ctx.beginPath();
      ctx.ellipse(40, 0, 75 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Eyes
      ctx.fillStyle = "#f72713";
      ctx.beginPath();
      ctx.arc(78,35,10,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(78,-35,10,0,Math.PI*2);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.strokeStyle = "#0a0a0a";
      ctx.fillStyle = "#131313";
      ctx.beginPath();
      ctx.ellipse(60, 0, 55 / 2.2, 89 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break; }
    case "Roach": {
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#333333"; // Leg color

      ctx.strokeStyle = "#522812";
      ctx.fillStyle = "#6c3619";
      ctx.beginPath();
      ctx.arc(38, 0, 26, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      //body
      ctx.strokeStyle = "#843e16";
      ctx.fillStyle = "#9b4e23";
      ctx.beginPath();
      ctx.ellipse(0, 0, 135 / 2.2, 100 / 2.2, 0, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      ctx.arc(60, 0, 34, convertAngleToRadians(-125), convertAngleToRadians(125), true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline
      
      ctx.lineWidth = 11;
      ctx.moveTo(-15,24);
      ctx.quadraticCurveTo(-25,24, -40,16);
      ctx.stroke();
      ctx.moveTo(-15,-24);
      ctx.quadraticCurveTo(-25,-24, -40,-16);
      ctx.stroke();

      ctx.fillStyle = "#843e16";
      ctx.beginPath();
      ctx.ellipse(4.5, 18, 135 / 11, 100 / 11, 45, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4.5, -18, 135 / 11, 100 / 11, -45, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      let an1 = 15.3;
      let an3 = 13.5;
      let an4 = 40;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, an1);
      ctx.lineTo(115, an4 + ngpo);
      ctx.quadraticCurveTo(85, an3, 50, an1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -an1);
      ctx.lineTo(115, -an4 - ngpo);
      ctx.quadraticCurveTo(85, -an3, 50, -an1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    case "Bumble Bee": {
      let offsett = 5;

      // Body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#ffd363";
      ctx.beginPath();
      ctx.ellipse(offsett, 0, 145 / 2.2, 120 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(offsett, 0, 145 / 2.2, 120 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.rect(20,-60,21,140);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.rect(-22,-60,21,140);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.rect(-63,-60,21,140);
      ctx.fill();
      ctx.closePath();
      ctx.restore();

      // Outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = "#cfab50";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(offsett, 0, 145 / 2.2, 120 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // Antennae
      let ann1 = 15.3;
      let ann2 = 36.45 + (ngpo / 2);
      ctx.lineWidth = 8.5;
      ctx.strokeStyle = "#333333"; // Set stroke color for the outlines

      // Left antenna
      ctx.moveTo(90, ann1); // Move to the starting point
      ctx.beginPath(); // Start a new path
      ctx.lineTo(85, ann2); // Draw the first segment
      ctx.quadraticCurveTo(65, ann1, 50, ann1); // Draw the curve
      ctx.stroke(); // Stroke the path without closing it

      // Right antenna
      ctx.moveTo(90, -ann1); // Move to the starting point
      ctx.beginPath(); // Start a new path
      ctx.lineTo(85, -ann2); // Draw the first segment
      ctx.quadraticCurveTo(65, -ann1, 50, -ann1); // Draw the curve
      ctx.stroke(); // Stroke the path without closing it

      //antennae tip
      ctx.beginPath(); // Start a new path
      ctx.fillStyle = "#333333";
      ctx.arc(85, -ann2, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); // Stroke the path without closing it
      ctx.beginPath(); // Start a new path
      ctx.arc(85, ann2, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); // Stroke the path without closing it
      break; }
    case "Pollen": {
      ctx.strokeStyle = "#cfab50";
      ctx.fillStyle = "#ffd363";
      ctx.lineWidth = 100/mob.radius;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break; }
    case "Sponge": {
      let spongeradius = 50;
      const numLines = 15;
      if (mob.ran1 < 1.33) {
        ctx.strokeStyle = blendColor("#c1a37d", "#FF0000", 0);
      } else if (1.33 < mob.ran1 < 1.66) {
        ctx.strokeStyle = blendColor("#977d90", "#FF0000", 0);
      } else if (1.66 < mob.ran1 < 2) {
        ctx.strokeStyle = blendColor("#9b81b9", "#FF0000", 0);
      } else {
        ctx.strokeStyle = blendColor("#c1a37d", "#FF0000", 0);
      }

      // Loop to draw the 16 radial lines
      for (let i = 0; i < numLines; i++) {
        const angle = (i * 2 * Math.PI) / numLines; // Angle for each line
        const spongexEnd = spongeradius * Math.cos(angle); // X coordinate of the line's end
        const spongeyEnd = spongeradius * Math.sin(angle); // Y coordinate of the line's end

        // Draw the line from the center of the circle to the end point
        ctx.lineWidth = 25;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(spongexEnd, spongeyEnd);
        ctx.stroke();
      }
      if (mob.ran1 < 1.33) {
        ctx.strokeStyle = blendColor("#efc99b", "#FF0000", 0);
      } else if (1.33 < mob.ran1 < 1.66) {
        ctx.strokeStyle = blendColor("#ad90a3", "#FF0000", 0);
      } else if (1.66 < mob.ran1 < 2) {
        ctx.strokeStyle = blendColor("#9b81b9", "#FF0000", 0);
      } else {
        ctx.strokeStyle = blendColor("#efc99b", "#FF0000", 0);
      }
      // Loop to draw the 16 radial lines
      for (let i = 0; i < numLines; i++) {
        const angle = (i * 2 * Math.PI) / numLines; // Angle for each line
        const spongexEnd = 45 * Math.cos(angle); // X coordinate of the line's end
        const spongeyEnd = 45 * Math.sin(angle); // Y coordinate of the line's end

        // Draw the line from the center of the circle to the end point
        ctx.lineWidth = 22.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(spongexEnd, spongeyEnd);
        ctx.stroke();
      }
      // Calculate positions of the 5 circles arranged in a pentagonal pattern
      const pentagonRadius = 42.5; // Radius of the larger circle that holds the centers of the 5 smaller circles
      const numCircles = 5;
      if (mob.ran1 < 1.33) {
        ctx.strokeStyle = blendColor("#c1a37d", "#FF0000", 0);
        ctx.fillStyle = blendColor("#c1a37d", "#FF0000", 0);
      } else if (1.33 < mob.ran1 < 1.66) {
        ctx.strokeStyle = blendColor("#977d90", "#FF0000", 0);
        ctx.fillStyle = blendColor("#977d90", "#FF0000", 0);
      } else if (1.66 < mob.ran1 < 2) {
        ctx.strokeStyle = blendColor("#9b81b9", "#FF0000", 0);
        ctx.fillStyle = blendColor("#9b81b9", "#FF0000", 0);
      } else {
        ctx.strokeStyle = blendColor("#c1a37d", "#FF0000", 0);
        ctx.fillStyle = blendColor("#c1a37d", "#FF0000", 0);
      }
      for (let i = 0; i < numCircles; i++) {
        const spongeangle =
          (i * 2 * Math.PI) / numCircles + convertAngleToRadians(36); // Angle for each circle center
        const spongexCenter = pentagonRadius * Math.cos(spongeangle); // X position of the circle center
        const spongeyCenter = pentagonRadius * Math.sin(spongeangle); // Y position of the circle center

        // Draw the circle at this position
        ctx.beginPath();
        ctx.arc(spongexCenter, spongeyCenter, 7, 0, 2 * Math.PI); // Circle with radius 25
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        // Draw the circle at this position
        ctx.beginPath();
        ctx.arc(spongexCenter * 0.65, spongeyCenter * 0.65, 4, 0, 2 * Math.PI); // Circle with radius 25
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        // Draw the circle at this position
        ctx.beginPath();
        ctx.arc(spongexCenter * 0.35, spongeyCenter * 0.35, 3, 0, 2 * Math.PI); // Circle with radius 25
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break; }
    case "Stonefly": {
      let xx = time * 0.015 - 60;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.lineWidth = 13.5;
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 23); // Left mandible
      ctx.quadraticCurveTo(52.5, 15, 85 - ngpo, 40.5 + ngpo);
      ctx.moveTo(35, -23); // Right mandible
      ctx.quadraticCurveTo(52.5, -15, 85 + ngpo, -40.5 + ngpo);
      ctx.stroke(); // Draw mandibles

      ctx.lineWidth = 17.5;

      // Now draw the body
      ctx.strokeStyle = "#754545"; // Outline color for body
      ctx.fillStyle = "#855555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.ellipse(-50, 0, 90, 26.7, 0, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle

      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      // Save the current context state to avoid affecting the body
      ctx.save();

      // Rotate the wings (you can modify `xx` as the rotation angle)
      ctx.translate(-20, 20); // Move the rotation point to the wing's position
      ctx.rotate(xx); // Rotate the wings by `xx` radians
      ctx.beginPath();
      ctx.ellipse(100, 0, 750 / 5, 100 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore(); // Restore the context to its original state

      // Save the current context state to avoid affecting the body again
      ctx.save();

      // Rotate the other wing
      ctx.translate(-20, -20); // Move the rotation point to the second wing's position
      ctx.rotate(-xx); // Rotate the second wing by `-xx` radians
      ctx.beginPath();
      ctx.ellipse(100, 0, 750 / 5, 100 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore(); // Restore the context to its original state

      // Draw the body part again (which should remain stationary)
      ctx.strokeStyle = "#754545"; // Outline color for body
      ctx.fillStyle = "#855555"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(15, 0, 29.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      break; }
    case "Stalagmite": {
      ctx.lineWidth = 3;
      const stalagcolor = "#304a6c";
      ctx.strokeStyle = blendColor(stalagcolor, "#000000", 0.25);
      ctx.fillStyle = stalagcolor;
      let stalSides = (mob.rarity + 1) * 3;
      let stalradius = 50;

      // Add spikes from the corners
      const spikeLength = 20; // Length of spikes
      for (let i = 0; i < stalSides; i++) {
        let angle = (i * 2 * Math.PI) / stalSides;
        const cornerX = stalradius * Math.cos(angle) * 0.8;
        const cornerY = stalradius * Math.sin(angle) * 0.8;

        // Calculate the tip of the spike
        const tipX = cornerX + spikeLength * Math.cos(angle);
        const tipY = cornerY + spikeLength * Math.sin(angle);

        // Draw a triangular spike
        const leftX = cornerX + (spikeLength / 2) * Math.cos(angle - Math.PI / 12);
        const leftY = cornerY + (spikeLength / 2) * Math.sin(angle - Math.PI / 12);
        const rightX = cornerX + (spikeLength / 2) * Math.cos(angle + Math.PI / 12);
        const rightY = cornerY + (spikeLength / 2) * Math.sin(angle + Math.PI / 12);

        ctx.beginPath();
        ctx.moveTo(leftX, leftY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw the main shape (polygon)
      ctx.beginPath();
      for (let i = 0; i < stalSides; i++) {
        let stalagAngle = (i * 2 * Math.PI) / stalSides;
        const stX = stalradius * Math.cos(stalagAngle);
        const stY = stalradius * Math.sin(stalagAngle);

        if (i === 0) {
          ctx.moveTo(stX, stY);
        } else {
          ctx.lineTo(stX, stY);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw the smaller pentagon (inner shape) with symmetric curves
      ctx.fillStyle = blendColor(stalagcolor, "#ffffff", 0.25);
      ctx.beginPath();
      for (let i = 0; i < stalSides; i++) {
        let angle0 = (i * 2 * Math.PI) / stalSides;
        let angle1 = ((i + 1) * 2 * Math.PI) / stalSides;

        const outerX = 40 * Math.cos(angle0);
        const outerY = 40 * Math.sin(angle0);
        const innerX = 35 * Math.cos((angle0 + angle1) / 2); // midpoint for control
        const innerY = 35 * Math.sin((angle0 + angle1) / 2);

        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        }
        ctx.quadraticCurveTo(innerX, innerY, 40 * Math.cos(angle1), 40 * Math.sin(angle1));
      }
      ctx.closePath();
      ctx.fill();

      break; }
    case "Pill Bug": {
      ctx.lineWidth = 8.5;
      ctx.strokeStyle = "#333333"; // Leg color

      //body
      ctx.strokeStyle = "#555555";
      ctx.fillStyle = "#666666";
      ctx.beginPath();
      ctx.ellipse(0, 0, 125 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // accents
      // clipping zone for accents
      ctx.save()
      ctx.beginPath();
      ctx.ellipse(0, 0, 125 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 95 / 2.2, 120 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 65 / 2.2, 120 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 35 / 2.2, 120 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Reset strokeStyle before drawing antennae
      ctx.lineWidth = 10.5;
      let mantisan1 = 12.3;
      let mantisan3 = 28.5;
      let mantisan4 = 60;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, mantisan1);
      ctx.lineTo(75, mantisan4 + ngpo);
      ctx.quadraticCurveTo(75, mantisan3, 50, mantisan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -mantisan1);
      ctx.lineTo(75, -mantisan4 - ngpo);
      ctx.quadraticCurveTo(75, -mantisan3, 50, -mantisan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    case "Dragonfly": {
      ctx.save();
      ctx.scale(1.5, 1.5);
      ctx.lineWidth = 4;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends
      let sizea = 0.15;
      let sizeb = 0.25;
      let offsetA = 15;
      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(55 * sizea + offsetA, 25 * sizeb); // Left mandible
      ctx.lineTo(110 * sizea + offsetA, time * sizeb);
      ctx.moveTo(55 * sizea + offsetA, -25 * sizeb); // Right mandible
      ctx.lineTo(110 * sizea + offsetA, -time * sizeb);
      ctx.stroke(); // Draw mandibles

      //tail
      ctx.lineWidth = 15;
      ctx.strokeStyle = "#093259";
      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.lineTo(17, 0);
      ctx.stroke();
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#0e4f8c";
      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.lineTo(17, 0);
      ctx.stroke();
      ctx.closePath();
      //wings
      ctx.lineWidth = 0;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)"; // Transparent stroke
      ctx.fillStyle = "rgba(250, 250, 255, 0.2)"; // blue

      // hind wings
      ctx.beginPath();
      ctx.ellipse(
        2,
        7 + time / 3,
        100 / 10,
        (130 / 10) * (time / 25),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill(); // Only fill the ellipse; do not call ctx.stroke()
      ctx.closePath();
      ctx.beginPath();
      ctx.ellipse(
        2,
        -7 - time / 3,
        100 / 10,
        (130 / 10) * (time / 25),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill(); // Only fill the ellipse; do not call ctx.stroke()
      ctx.closePath();

      // front wings
      ctx.beginPath();
      ctx.ellipse(
        12,
        9 + time / 3,
        100 / 10,
        (150 / 10) * (time / 25),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill(); // Only fill the ellipse; do not call ctx.stroke()
      ctx.closePath();
      ctx.beginPath();
      ctx.ellipse(
        12,
        -9 - time / 3,
        100 / 10,
        (150 / 10) * (time / 25),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill(); // Only fill the ellipse; do not call ctx.stroke()
      ctx.closePath();

      //head
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#10589c";
      ctx.fillStyle = "#1267b6";
      ctx.beginPath();
      ctx.arc(10.5, 0, 7, 0, Math.PI * 2);
      ctx.fill(); // Fill the head
      ctx.stroke(); // Stroke the head (if outline is needed)
      ctx.closePath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#10589c";
      ctx.fillStyle = "#1267b6";
      ctx.beginPath();
      ctx.arc(17.5, 0, 8, 0, Math.PI * 2);
      ctx.fill(); // Fill the head
      ctx.stroke(); // Stroke the head (if outline is needed)
      ctx.closePath();
      ctx.restore();
      break; }
    case "Fire Ant Burrow": {
      ctx.strokeStyle = "rgba(255, 255, 255, 0)";
      ctx.fillStyle = "#c43829";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#992c20";
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#702018";
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      break; }
    case "Soldier Fire Ant": {
      //let xx = 18 + (30 - 18) * (Math.sin(t/3) * 0.5 + 0.5)
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 25); // Left mandible
      ctx.lineTo(80, time);
      ctx.moveTo(35, -25); // Right mandible
      ctx.lineTo(80, -time);
      ctx.stroke(); // Draw mandibles

      // Now draw the body (which will be above the mandibles)
      ctx.strokeStyle = "#882200"; // Outline color for body
      ctx.fillStyle = "#a82a00"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-20, 0, 29.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      // Set the transparency of the blue color (RGBA where A is the alpha value)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // blue

      ctx.save();
      ctx.rotate(convertAngleToRadians(ngpo * 2));
      ctx.beginPath();
      ctx.ellipse(-30, 20, 200 / 5, 125 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(convertAngleToRadians(-ngpo * 2));
      //ctx.rotate(xx)
      ctx.beginPath();
      ctx.ellipse(-30, -20, 200 / 5, 125 / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "#882200"; // Outline color for body
      ctx.fillStyle = "#a82a00"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(20, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      //renderSoldierAnt("#454545", "#555555");
      break; }
    case "Worker Fire Ant": {
      //let xx = 18 + (30 - 18) * (Math.sin(t/3) * 0.5 + 0.5)
      ctx.lineWidth = 20.5;
      ctx.lineCap = "round"; // Set the line cap to round for rounded ends

      // Draw the mandibles first (so they are behind the body)
      ctx.strokeStyle = "#292929"; // Mandible outline color
      ctx.beginPath(); // Start a new path for the mandibles
      ctx.moveTo(35, 25); // Left mandible
      ctx.lineTo(80, time);
      ctx.moveTo(35, -25); // Right mandible
      ctx.lineTo(80, -time);
      ctx.stroke(); // Draw mandibles

      // Now draw the body (which will be above the mandibles)
      ctx.strokeStyle = "#882200"; // Outline color for body
      ctx.fillStyle = "#a82a00"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(-20, 0, 29.7, 0, Math.PI * 2);
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle

      ctx.strokeStyle = "#882200"; // Outline color for body
      ctx.fillStyle = "#a82a00"; // Body color (Baby Ant)
      ctx.beginPath();
      ctx.arc(20, 0, 39.7, 0, Math.PI * 2); // Radius of 39.7
      ctx.fill(); // Fill the body with the specified fillStyle
      ctx.stroke(); // Outline with strokeStyle
      //renderSoldierAnt("#454545", "#555555");
      break; }
    case "Shiny Ladybug": {
      // ===== Setup Styling =====
      ctx.lineCap = "round";
      ctx.lineWidth = 10;

      // ===== Smaller Dark Circle =====
      ctx.beginPath();
      ctx.arc(24.5, 0, 25, 0, Math.PI * 2);
      ctx.fillStyle = "#202020";
      ctx.strokeStyle = blendColor("#202020", "#000000", 0.19);
      ctx.fill();
      ctx.stroke();

      // ===== Crescent Shape Path (for fill and clip) =====
      ctx.save(); // Save before clip
      ctx.beginPath();
      // Outer arc
      ctx.arc(0, 0, 50, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      // Inner arc (reverse)
      ctx.arc(45, 0, 30, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();

      // Fill the crescent shape
      ctx.fillStyle = "#dfdf01";
      ctx.fill();

      // Clip to crescent shape
      ctx.clip();

      // ===== Randomized Spots (clipped and behind outline) =====
      ctx.save(); // Save translation context
      ctx.translate(-75, -75);

      ctx.fillStyle = "#202020";
      const spreadFactor = 50;
      const offsetFactor = 0;
      const spotty = 3 * Math.pow(1.05, mob.rarity) + mob.ran1;

      // Spot 1
      ctx.beginPath();
      ctx.arc(
        mob.ran1 * spreadFactor - offsetFactor,
        mob.ran2 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 2
      ctx.beginPath();
      ctx.arc(
        mob.ran2 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 3
      ctx.beginPath();
      ctx.arc(
        mob.ran1 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      // Spot 4
      ctx.beginPath();
      ctx.arc(
        mob.ran2 * spreadFactor - offsetFactor,
        mob.ran3 * spreadFactor - offsetFactor,
        5 * spotty,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();

      ctx.restore(); // Restore translation
      ctx.restore(); // Restore from clipping

      // ===== Stroke Crescent Outline LAST =====
      ctx.beginPath();
      // Outer arc
      ctx.arc(0, 0, 50, convertAngleToRadians(45), convertAngleToRadians(-45), false);
      // Inner arc
      ctx.arc(45, 0, 30, convertAngleToRadians(-105), convertAngleToRadians(105), true);
      ctx.closePath();

      ctx.strokeStyle = blendColor("#dfdf01", "#000000", 0.19);
      ctx.stroke();
      break; }
    case "Crab": {
      let crabSize = 2.7;
      let crabtime = 11 + (19 - 11) * (Math.sin(t * 2.4) * 0.5 + 0.5);
      let orabtime = 11 + (19 - 11) * (Math.cos(t * 2.4) * 0.5 + 0.5);
      ctx.lineWidth = 8.5;

      //claws      
      ctx.strokeStyle = "#4d2621";
      ctx.fillStyle = "#4d2621";
      ctx.save();
      ctx.translate(20, 39); // center on old (0,46)
      ctx.scale(0.8,0.8);
      ctx.rotate(convertAngleToRadians(ngpo))
      ctx.beginPath(); // Start a new path
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(50, -10, 55, -30);
      ctx.lineTo(0, 0);
      ctx.stroke(); // Draws the line
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(50, -10, 42, -36);
      ctx.stroke(); // Draws the line
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Draws the line
      ctx.restore();

      ctx.save();
      ctx.translate(20, -39); // center on old (0,46)
      ctx.scale(0.8,-0.8);
      ctx.rotate(convertAngleToRadians(ngpo))
      ctx.beginPath(); // Start a new path
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(50, -10, 55, -30);
      ctx.lineTo(0, 0);
      ctx.stroke(); // Draws the line
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(50, -10, 42, -36);
      ctx.stroke(); // Draws the line
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Draws the line
      ctx.restore();

      //legs
      ctx.fillStyle = 'rgba(255,255,255,0)';
      ctx.beginPath(); // Start a new path
      ctx.moveTo(25, 24);
      ctx.lineTo(12 * (crabtime / 10) + 5, 60);
      ctx.lineTo(20 * (crabtime / 10) + 5, 70);
      ctx.stroke();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(-25, 24);
      ctx.lineTo(-(12 * (orabtime / 10)), 60);
      ctx.lineTo(-(20 * (orabtime / 10)), 70);
      ctx.stroke();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(12.5, 27);
      ctx.lineTo(6 * (crabtime / 10) + 5, 65);
      ctx.lineTo(10 * (crabtime / 10) + 5, 75);
      ctx.stroke();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(-12.5, 27);
      ctx.lineTo(-(6 * (orabtime / 10)), 65);
      ctx.lineTo(-(10 * (orabtime / 10)), 75);
      ctx.stroke();
      //other side
      ctx.beginPath(); // Start a new path
      ctx.moveTo(25, -24);
      ctx.lineTo(12 * (crabtime / 10) + 5, -60);
      ctx.lineTo(20 * (crabtime / 10) + 5, -70);
      ctx.stroke();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(-25, -24);
      ctx.lineTo(-(12 * (orabtime / 10)), -60);
      ctx.lineTo(-(20 * (orabtime / 10)), -70);
      ctx.stroke();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(12.5, -27);
      ctx.lineTo(6 * (crabtime / 10) + 5, -65);
      ctx.lineTo(10 * (crabtime / 10) + 5, -75);
      ctx.stroke();
      ctx.beginPath(); // Start a new path
      ctx.moveTo(-12.5, -27);
      ctx.lineTo(-(6 * (orabtime / 10)), -65);
      ctx.lineTo(-(10 * (orabtime / 10)), -75);
      ctx.stroke();

      //body
      ctx.strokeStyle = "#b15a3d";
      ctx.fillStyle = "#db6f4b";
      ctx.beginPath();
      ctx.ellipse(0, 0, 100 / crabSize, 125 / crabSize, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(18.5, 15);
      ctx.quadraticCurveTo(0, 10, -18.5, 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(18.5, -15);
      ctx.quadraticCurveTo(0, -10, -18.5, -15);
      ctx.stroke();
      //ctx.closePath();
      break; }    
    case "Bush": {
      let bushsides = 5; // Number of star points
      let bushouterRadius = 100; // Outer radius for star tips
      let bushinnerRadius = 50; // Inner radius for star valleys
      let bushStartAngle = -Math.PI / 2; // Start at the top (−90°)

      // Calculate the 10 main vertices (alternating outer and inner points)
      let bushPoints = [];
      for (let i = 0; i < bushsides * 2; i++) {
        let bushAngle = bushStartAngle + (i * Math.PI) / bushsides;
        let bushRadius = i % 2 === 0 ? bushouterRadius : bushinnerRadius;
        let bushX = Math.cos(bushAngle) * bushRadius;
        let bushY = Math.sin(bushAngle) * bushRadius;
        bushPoints.push({ x: bushX, y: bushY });
      }

      // Use quadratic curves between midpoints of consecutive segments
      ctx.beginPath();
      for (let i = 0; i < bushPoints.length; i++) {
        let bushCurrent = bushPoints[i];
        let bushPrev =
          bushPoints[(i - 1 + bushPoints.length) % bushPoints.length];
        let bushNext = bushPoints[(i + 1) % bushPoints.length];

        // Calculate midpoints of the segments coming into and out of the current vertex
        let bushMid1 = {
          x: (bushPrev.x + bushCurrent.x) / 2,
          y: (bushPrev.y + bushCurrent.y) / 2,
        };
        let bushMid2 = {
          x: (bushCurrent.x + bushNext.x) / 2,
          y: (bushCurrent.y + bushNext.y) / 2,
        };

        // For the first vertex, move to the first midpoint
        if (i === 0) {
          ctx.moveTo(bushMid1.x, bushMid1.y);
        }

        // Create a quadratic curve from bushMid1 to bushMid2 with bushCurrent as the control point
        ctx.quadraticCurveTo(
          bushCurrent.x,
          bushCurrent.y,
          bushMid2.x,
          bushMid2.y
        );
      }
      ctx.closePath();

      // Style and render the shape
      ctx.fillStyle = "#008629";
      ctx.strokeStyle = blendColor(ctx.fillStyle, "#000000", 0.2);
      ctx.lineWidth = 5;
      ctx.fill();
      ctx.stroke();
      break; }
    case "Void Wasp": {
      let waspoffsep = 10;
      let waspmiss = 20;
      let crazyColor = blendColor("#ff0000", "#0000ff", (ngpo+5)/10);
      //missile
      ctx.lineCap = "round";
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#333333";
      ctx.lineWidth = 5;
      ctx.moveTo(-50, waspmiss);
      ctx.beginPath();
      ctx.lineTo(-50, -waspmiss);
      ctx.lineTo(-100, ngpo);
      ctx.lineTo(-50, waspmiss);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();

      //body
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      //stripes
      ctx.save();
      // Clipping Zone
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = crazyColor;
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(35, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(45, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = crazyColor;
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(55, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(65, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = crazyColor;
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(75, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(85, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = crazyColor;
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(95, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(105, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = crazyColor;
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(115, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#333333";
      ctx.beginPath(); // Start a new path for the rectangle
      ctx.arc(125, 0, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      //outline
      ctx.lineWidth = 10.5;
      ctx.strokeStyle = blendColor(crazyColor, "#333333", 0.75);
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.beginPath();
      ctx.ellipse(waspoffsep, 0, 135 / 2.2, 100 / 2.2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Don't forget to actually stroke the body outline

      // Reset strokeStyle before drawing antennae
      let waspan1 = 15.3;
      let waspan3 = 13.5;
      let waspan4 = 40;
      ctx.lineWidth = 8.5;
      ctx.fillStyle = "#333333";
      ctx.strokeStyle = "#333333"; // Set antennae stroke color
      //ctx.lineWidth = 10.5;  // Adjust the line width as needed
      ctx.beginPath();
      ctx.moveTo(50, waspan1);
      ctx.lineTo(125, waspan4 + ngpo);
      ctx.quadraticCurveTo(85, waspan3, 50, waspan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();

      // Reset strokeStyle before drawing antennae
      ctx.beginPath();
      ctx.moveTo(50, -waspan1);
      ctx.lineTo(125, -waspan4 - ngpo);
      ctx.quadraticCurveTo(85, -waspan3, 50, -waspan1);
      ctx.stroke(); // Actually stroke the antennae line
      ctx.fill();
      break; }
    default: {
      // fallback: simple circle
      ctx.fillStyle = "#ff4444";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
    } }
    /*ctx.beginPath();
    ctx.arc(0, 0, mob.hitbox_size * (50 / mob.radius), 0, Math.PI * 2); // Adjust radius if needed
    ctx.strokeStyle = rarityStuff[mob.rarity].color;
    ctx.lineWidth = 100 / mob.radius;
    ctx.stroke();*/

  ctx.restore();
}