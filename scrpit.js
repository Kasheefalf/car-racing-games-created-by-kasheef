// Car Racing - simple top-down lane-ish game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const speedEl = document.getElementById('speed');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

const W = canvas.width;
const H = canvas.height;

// Attempt to use uploaded local image as car sprite
// (Path recorded earlier): /mnt/data/bfc285ab-a41f-4956-bc61-7c4b3d90a72d.png
// If the path isn't accessible in the browser, the code will fallback to colored rectangle.
const carSprite = new Image();
carSprite.src = '/mnt/data/bfc285ab-a41f-4956-bc61-7c4b3d90a72d.png'; // replace with your own image if desired

let gameRunning = false;
let score = 0;
let speed = 1; // base speed
let spawnTimer = 0;
let obstacles = [];
let keys = { left: false, right: false };
let pointerX = null;

// player car
const player = {
  w: 48,
  h: 80,
  x: W / 2 - 24,
  y: H - 110,
  color: '#00d4ff'
};

// helper: rectangle collision
function rectsCollide(a,b){
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

// resize canvas to CSS size (ensure crispness)
function resize() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = 360 * ratio;
  canvas.height = 640 * ratio;
  canvas.style.width = '360px';
  canvas.style.height = '640px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// spawn obstacles (other cars)
function spawnObstacle(){
  const lanePad = 30;
  const minW = 40, maxW = 70;
  const w = Math.floor(minW + Math.random() * (maxW - minW));
  const x = Math.random() * (W - w - lanePad*2) + lanePad;
  const speedFactor = 1 + Math.random()*0.6;
  obstacles.push({
    x, y: -90, w, h: 80,
    color: '#' + Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0'),
    v: (1.5 + speed*0.6) * speedFactor
  });
}

// draw background road
function drawRoad(){
  ctx.fillStyle = '#11181e';
  ctx.fillRect(0,0,W,H);
  // center dashed lines
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 6;
  ctx.setLineDash([20, 18]);
  ctx.beginPath();
  ctx.moveTo(W/2, 0);
  ctx.lineTo(W/2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

// game loop
let lastTime = 0;
function loop(t){
  if(!gameRunning) return;
  const dt = Math.min(40, t - lastTime);
  lastTime = t;

  // update game speed slowly
  speed += 0.0008 * dt;

  // move player based on keys or pointer
  const moveSpeed = 6 + speed*2;
  if(keys.left) player.x -= moveSpeed;
  if(keys.right) player.x += moveSpeed;
  if(pointerX !== null){
    // smooth pointer follow
    player.x += (pointerX - (player.x + player.w/2)) * 0.12;
  }
  // clamp player
  player.x = Math.max(8, Math.min(W - player.w - 8, player.x));

  // spawn obstacles faster as speed increases
  spawnTimer += dt;
  const spawnInterval = Math.max(500 - speed*40, 160);
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnObstacle();
  }

  // update obstacles
  for(let i = obstacles.length -1; i >=0; i--){
    const o = obstacles[i];
    o.y += o.v * (dt/16); // frame-normalize
    // collision
    if(rectsCollide({x:player.x, y:player.y, w:player.w, h:player.h}, o)){
      endGame();
      return;
    }
    // passed screen
    if(o.y > H + 120) {
      obstacles.splice(i,1);
      score += 10;
      scoreEl.textContent = score;
    }
  }

  // draw
  drawRoad();

  // draw obstacles
  for(const o of obstacles){
    ctx.fillStyle = o.color;
    roundRect(ctx, o.x, o.y, o.w, o.h, 8, true, false);
    // small window detail
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(o.x + o.w*0.18, o.y + 10, o.w*0.64, o.h*0.45);
  }

  // draw player (try sprite, otherwise colored rect)
  if(carSprite.complete && carSprite.naturalWidth){
    // draw sprite centered inside player bounds
    ctx.drawImage(carSprite, player.x - 6, player.y - 6, player.w + 12, player.h + 12);
  } else {
    ctx.fillStyle = player.color;
    roundRect(ctx, player.x, player.y, player.w, player.h, 8, true, false);
    // windshield
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(player.x + 8, player.y + 8, player.w - 16, player.h * 0.35);
  }

  // HUD updates
  speedEl.textContent = Math.floor(speed);

  requestAnimationFrame(loop);
}

// helper: rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (typeof stroke === 'undefined') stroke = true;
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if(fill){ ctx.fill(); }
  if(stroke){ ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.stroke(); }
}

// start and end
function startGame(){
  gameRunning = true;
  score = 0;
  speed = 1;
  obstacles = [];
  spawnTimer = 0;
  lastTime = performance.now();
  scoreEl.textContent = score;
  overlay.classList.add('hidden');
  requestAnimationFrame(loop);
}
function endGame(){
  gameRunning = false;
  finalScore.textContent = score;
  overlay.classList.remove('hidden');
}

// keyboard controls
window.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft') keys.left = true;
  if(e.key === 'ArrowRight') keys.right = true;
});
window.addEventListener('keyup', e => {
  if(e.key === 'ArrowLeft') keys.left = false;
  if(e.key === 'ArrowRight') keys.right = false;
});

// pointer/touch controls
canvas.addEventListener('pointerdown', e => {
  pointerX = e.clientX - canvas.getBoundingClientRect().left;
});
canvas.addEventListener('pointermove', e => {
  if(e.pressure !== 0 && e.buttons > 0) pointerX = e.clientX - canvas.getBoundingClientRect().left;
});
canvas.addEventListener('pointerup', () => pointerX = null);

// buttons
startBtn.addEventListener('click', () => {
  startGame();
});
restartBtn.addEventListener('click', () => {
  startGame();
});

// if sprite fails to load, it will fallback to rectangle automatically
carSprite.onerror = () => {
  console.warn('Car sprite failed to load — falling back to rectangle.');
};
