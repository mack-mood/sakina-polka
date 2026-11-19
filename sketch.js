let particles = [];
let spacing = 13;
let cols, rows;

let currentRadius = 0;
let maxRadius = 650;
let expansionSpeed = 0.5;

// SOUND
let vibrationSound;
let audioUnlocked = false;

// FREEZE SETTINGS
let freezeDuration = 4000;
let pressStart = 0;
let interactionStarted = false;
let interactionHeld = false;

// INTERACTION POSITION
let interactionX = 0;
let interactionY = 0;

// COLOURS
let colours = [
  [255, 70, 90],
  [255, 145, 50],
  [255, 220, 70],
  [100, 220, 140],
  [60, 200, 220],
  [80, 120, 255],
  [160, 90, 255],
  [255, 100, 200]
];

// VIBRATION SETTINGS
let vibrationAmount = 1.8;
let vibrationSpeed = 0.3;


function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  rectMode(CENTER);

  createField();

  // AUDIO
  vibrationSound = new Audio('sound.mp3');
  vibrationSound.loop = true;
  vibrationSound.volume = 0.4;

  // PREVENT TOUCH SCROLLING
  let canvasElement = document.querySelector('canvas');

  if (canvasElement) {
    canvasElement.style.touchAction = 'none';
    canvasElement.style.display = 'block';
  }

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.touchAction = 'none';
}


function createField() {
  particles = [];

  cols = floor(width / spacing);
  rows = floor(height / spacing);

  let startX = (width - cols * spacing) / 2;
  let startY = (height - rows * spacing) / 2;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {

      let x = startX + i * spacing;
      let y = startY + j * spacing;

      particles.push({
        ox: x,
        oy: y,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        angle: random(TWO_PI),
        baseAngle: random(-0.25, 0.25),
        size: random(2, 3),
        colour: random(colours),

        phaseX: random(TWO_PI),
        phaseY: random(TWO_PI),
        frequency: random(0.7, 1.5)
      });
    }
  }
}


function draw() {
  background(0);

  // CHECK FREEZE TIMER

  if (interactionHeld && !interactionStarted) {

    if (millis() - pressStart >= freezeDuration) {

      interactionStarted = true;

      // INITIAL PARTICLE BURST

      for (let p of particles) {

        let d = dist(
          interactionX,
          interactionY,
          p.x,
          p.y
        );

        if (d < 150 && d > 0) {

          let force = map(d, 0, 150, 9, 0);

          let angle = atan2(
            p.y - interactionY,
            p.x - interactionX
          );

          p.vx += cos(angle) * force;
          p.vy += sin(angle) * force;

          p.angle += random(-1.5, 1.5);
        }
      }
    }
  }

  // BLACK HOLE EXPANSION

  if (interactionHeld && interactionStarted) {

    currentRadius += expansionSpeed;

    currentRadius = min(
      currentRadius,
      maxRadius
    );
  }

  // PARTICLE MOVEMENT

  for (let p of particles) {

    let dx = p.x - interactionX;
    let dy = p.y - interactionY;

    let d = sqrt(dx * dx + dy * dy);

    // SWIRLING INTERACTION

    if (
      interactionHeld &&
      interactionStarted &&
      d < currentRadius &&
      d > 0
    ) {

      let force = map(
        d,
        0,
        currentRadius,
        3.5,
        0
      );

      let angle = atan2(dy, dx);

      p.vx += cos(angle) * force;
      p.vy += sin(angle) * force;

      p.vx += -sin(angle) * force * 0.8;
      p.vy += cos(angle) * force * 0.8;

      p.angle += random(-0.18, 0.18);
    }

    if (
      interactionHeld &&
      interactionStarted &&
      d < currentRadius
    ) {

      p.angle += random(-0.07, 0.07);
    }

    // SPRING MOVEMENT

    let spring = 0.012;

    p.vx += (p.ox - p.x) * spring;
    p.vy += (p.oy - p.y) * spring;

    p.vx *= 0.94;
    p.vy *= 0.94;

    p.x += p.vx;
    p.y += p.vy;

    p.angle += (p.baseAngle - p.angle) * 0.025;

    let speed = abs(p.vx) + abs(p.vy);

    let size = p.size + min(speed * 0.15, 1);

    // IDLE VIBRATION

    let vibrationX = 0;
    let vibrationY = 0;

    if (!interactionHeld) {

      let t = frameCount * vibrationSpeed * p.frequency;

      vibrationX =
        sin(t + p.phaseX) * vibrationAmount;

      vibrationY =
        cos(t * 1.3 + p.phaseY) * vibrationAmount;
    }

    // DRAW PARTICLES

    push();

    translate(
      p.x + vibrationX,
      p.y + vibrationY
    );

    rotate(p.angle);

    noStroke();

    fill(
      p.colour[0],
      p.colour[1],
      p.colour[2]
    );

    rect(0, 0, size, size);

    pop();
  }
}


// START INTERACTION

function startInteraction(x, y) {

  if (interactionHeld) return;

  interactionX = x;
  interactionY = y;

  interactionHeld = true;

  pressStart = millis();

  interactionStarted = false;
  currentRadius = 0;
}


// END INTERACTION

function endInteraction() {

  if (!interactionHeld) return;

  interactionHeld = false;

  currentRadius = 0;
  interactionStarted = false;

  // START SOUND AFTER RELEASE
  if (vibrationSound && audioUnlocked) {

    vibrationSound.play().catch(error => {
      console.log("Audio playback error:", error);
    });
  }
}


// MOUSE CONTROLS

function mousePressed() {

  audioUnlocked = true;

  if (vibrationSound) {
    vibrationSound.pause();
    vibrationSound.currentTime = 0;
  }

  startInteraction(mouseX, mouseY);

  return false;
}


function mouseDragged() {

  interactionX = mouseX;
  interactionY = mouseY;

  return false;
}


function mouseReleased() {

  endInteraction();

  return false;
}


// IPAD TOUCH CONTROLS

function touchStarted() {

  if (touches.length > 0) {

    let t = touches[0];

    interactionX = t.x;
    interactionY = t.y;

    // UNLOCK SOUND ON FIRST TOUCH
    if (!audioUnlocked && vibrationSound) {

      audioUnlocked = true;

      vibrationSound.play().then(() => {
        vibrationSound.pause();
        vibrationSound.currentTime = 0;
      }).catch(error => {
        console.log("Audio unlock:", error);
      });
    }

    if (vibrationSound) {
      vibrationSound.pause();
      vibrationSound.currentTime = 0;
    }

    startInteraction(t.x, t.y);
  }

  return false;
}


function touchMoved() {

  if (touches.length > 0) {

    interactionX = touches[0].x;
    interactionY = touches[0].y;
  }

  return false;
}


function touchEnded() {

  endInteraction();

  return false;
}


// RESIZE

function windowResized() {

  resizeCanvas(windowWidth, windowHeight);

  createField();

  currentRadius = 0;
  interactionStarted = false;
  interactionHeld = false;
}