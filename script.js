// ========================================
// NEON SURVIVOR
// ========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOver");
const hud = document.getElementById("hud");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const healthText = document.getElementById("health");
const scoreText = document.getElementById("score");
const killsText = document.getElementById("kills");
const waveText = document.getElementById("wave");
const finalScoreText = document.getElementById("finalScore");


// ========================================
// CANVAS
// ========================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ========================================
// TECLADO
// ========================================

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        keys.space = true;
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;

    if (event.code === "Space") {
        keys.space = false;
    }
});


// ========================================
// JOGADOR
// ========================================

const player = {
    x: 0,
    y: 0,

    radius: 18,

    speed: 5,

    health: 100,

    maxHealth: 100,

    cooldown: 0
};


// ========================================
// ARRAYS DO JOGO
// ========================================

let bullets = [];
let enemies = [];
let particles = [];

let score = 0;
let kills = 0;
let wave = 1;

let gameRunning = false;

let spawnTimer = 0;


// ========================================
// UTILIDADES
// ========================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
}


// ========================================
// PARTÍCULAS
// ========================================

function createParticles(x, y, color, amount = 10) {

    for (let i = 0; i < amount; i++) {

        particles.push({
            x: x,
            y: y,

            vx: random(-4, 4),
            vy: random(-4, 4),

            life: 1,

            size: random(2, 5),

            color: color
        });
    }
}


function updateParticles() {

    for (let i = particles.length - 1; i >= 0; i--) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.life -= 0.025;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


function drawParticles() {

    particles.forEach(p => {

        ctx.save();

        ctx.globalAlpha = p.life;

        ctx.fillStyle = p.color;

        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    });
}


// ========================================
// CRIAR INIMIGO
// ========================================

function spawnEnemy() {

    let side = Math.floor(random(0, 4));

    let x;
    let y;

    if (side === 0) {
        x = random(0, canvas.width);
        y = -40;
    }

    if (side === 1) {
        x = canvas.width + 40;
        y = random(0, canvas.height);
    }

    if (side === 2) {
        x = random(0, canvas.width);
        y = canvas.height + 40;
    }

    if (side === 3) {
        x = -40;
        y = random(0, canvas.height);
    }

    const strong = Math.random() < Math.min(.1 + wave * .01, .35);

    enemies.push({

        x,
        y,

        radius: strong ? 25 : 15,

        speed: strong
            ? random(1, 1.5)
            : random(1.5, 2.5),

        health: strong
            ? 3
            : 1,

        maxHealth: strong
            ? 3
            : 1,

        damage: strong
            ? 25
            : 10,

        color: strong
            ? "#ff1744"
            : "#ff00ff"
    });
}


// ========================================
// ATIRAR
// ========================================

function shoot() {

    if (player.cooldown > 0) return;

    let closestEnemy = null;
    let closestDistance = Infinity;

    enemies.forEach(enemy => {

        const d = distance(player, enemy);

        if (d < closestDistance) {
            closestDistance = d;
            closestEnemy = enemy;
        }
    });

    let angle;

    if (closestEnemy) {

        angle = Math.atan2(
            closestEnemy.y - player.y,
            closestEnemy.x - player.x
        );

    } else {

        angle = 0;
    }

    const speed = 12;

    bullets.push({

        x: player.x,
        y: player.y,

        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,

        radius: 5,

        damage: 1,

        life: 100
    });

    player.cooldown = 12;
}


// ========================================
// ATUALIZAR JOGADOR
// ========================================

function updatePlayer() {

    let dx = 0;
    let dy = 0;

    if (keys.w || keys.arrowup) {
        dy--;
    }

    if (keys.s || keys.arrowdown) {
        dy++;
    }

    if (keys.a || keys.arrowleft) {
        dx--;
    }

    if (keys.d || keys.arrowright) {
        dx++;
    }

    // Evita velocidade diagonal maior
    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x += dx * player.speed;
        player.y += dy * player.speed;
    }

    // Limites
    player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
    );

    player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
    );

    if (player.cooldown > 0) {
        player.cooldown--;
    }

    if (keys.space) {
        shoot();
    }
}


// ========================================
// ATUALIZAR TIROS
// ========================================

function updateBullets() {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        bullet.life--;

        if (
            bullet.life <= 0 ||
            bullet.x < -50 ||
            bullet.x > canvas.width + 50 ||
            bullet.y < -50 ||
            bullet.y > canvas.height + 50
        ) {

            bullets.splice(i, 1);
        }
    }
}


// ========================================
// ATUALIZAR INIMIGOS
// ========================================

function updateEnemies() {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        const angle = Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;


        // Colisão com jogador

        const playerDistance = distance(
            player,
            enemy
        );

        if (
            playerDistance <
            player.radius + enemy.radius
        ) {

            player.health -= enemy.damage;

            createParticles(
                player.x,
                player.y,
                "#00ffff",
                15
            );

            enemies.splice(i, 1);

            if (player.health <= 0) {
                endGame();
                return;
            }

            continue;
        }


        // Colisão com tiros

        for (let j = bullets.length - 1; j >= 0; j--) {

            const bullet = bullets[j];

            if (
                distance(enemy, bullet) <
                enemy.radius + bullet.radius
            ) {

                enemy.health -= bullet.damage;

                bullets.splice(j, 1);

                createParticles(
                    bullet.x,
                    bullet.y,
                    enemy.color,
                    5
                );

                if (enemy.health <= 0) {

                    createParticles(
                        enemy.x,
                        enemy.y,
                        enemy.color,
                        20
                    );

                    score += enemy.radius > 20
                        ? 50
                        : 10;

                    kills++;

                    enemies.splice(i, 1);

                    break;
                }
            }
        }
    }
}


// ========================================
// DESENHAR JOGADOR
// ========================================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.fillStyle = "#00ffff";

    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00ffff";

    ctx.beginPath();

    ctx.moveTo(22, 0);
    ctx.lineTo(-15, -13);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-15, 13);

    ctx.closePath();

    ctx.fill();

    // Núcleo
    ctx.fillStyle = "#ffffff";

    ctx.shadowBlur = 10;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


// ========================================
// DESENHAR TIROS
// ========================================

function drawBullets() {

    bullets.forEach(bullet => {

        ctx.save();

        ctx.fillStyle = "#ffff00";

        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ffff00";

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    });
}


// ========================================
// DESENHAR INIMIGOS
// ========================================

function drawEnemies() {

    enemies.forEach(enemy => {

        ctx.save();

        ctx.fillStyle = enemy.color;

        ctx.shadowBlur = 25;
        ctx.shadowColor = enemy.color;

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // núcleo
        ctx.fillStyle = "#ffffff";

        ctx.shadowBlur = 5;

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius * .3,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();


        // Barra de vida

        if (enemy.maxHealth > 1) {

            const width = enemy.radius * 2;

            ctx.fillStyle = "#222";

            ctx.fillRect(
                enemy.x - width / 2,
                enemy.y - enemy.radius - 10,
                width,
                4
            );

            ctx.fillStyle = "#ff1744";

            ctx.fillRect(
                enemy.x - width / 2,
                enemy.y - enemy.radius - 10,
                width * (enemy.health / enemy.maxHealth),
                4
            );
        }
    });
}


// ========================================
// FUNDO
// ========================================

function drawBackground() {

    ctx.fillStyle = "#050510";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Grade futurista

    ctx.strokeStyle = "rgba(0,255,255,.05)";
    ctx.lineWidth = 1;

    const gridSize = 50;

    for (
        let x = 0;
        x < canvas.width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);

        ctx.stroke();
    }

    for (
        let y = 0;
        y < canvas.height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);

        ctx.stroke();
    }
}


// ========================================
// ATUALIZAR HUD
// ========================================

function updateHUD() {

    healthText.textContent =
        Math.max(0, player.health);

    scoreText.textContent =
        score;

    killsText.textContent =
        kills;

    waveText.textContent =
        wave;
}


// ========================================
// ONDAS
// ========================================

function updateWave() {

    wave =
        Math.floor(kills / 10) + 1;
}


// ========================================
// LOOP PRINCIPAL
// ========================================

function gameLoop() {

    if (!gameRunning) return;

    drawBackground();

    updatePlayer();
    updateBullets();
    updateEnemies();
    updateParticles();

    updateWave();

    drawBullets();
    drawEnemies();
    drawParticles();
    drawPlayer();

    updateHUD();

    // Spawn progressivo
    spawnTimer--;

    if (spawnTimer <= 0) {

        const amount =
            Math.min(1 + Math.floor(wave / 3), 5);

        for (let i = 0; i < amount; i++) {
            spawnEnemy();
        }

        spawnTimer =
            Math.max(15, 60 - wave * 3);
    }

    requestAnimationFrame(gameLoop);
}


// ========================================
// COMEÇAR JOGO
// ========================================

function startGame() {

    menu.style.display = "none";
    gameOverScreen.style.display = "none";
    hud.style.display = "flex";

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    player.health = 100;
    player.cooldown = 0;

    bullets = [];
    enemies = [];
    particles = [];

    score = 0;
    kills = 0;
    wave = 1;

    spawnTimer = 20;

    gameRunning = true;

    gameLoop();
}


// ========================================
// GAME OVER
// ========================================

function endGame() {

    gameRunning = false;

    finalScoreText.textContent = score;

    gameOverScreen.style.display = "flex";
    hud.style.display = "none";
}


// ========================================
// BOTÕES
// ========================================

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);
Como rodar
Crie uma pasta, coloque os três arquivos dentro dela:

NEON-SURVIVOR
│
├── index.html
├── style.css
└── script.js