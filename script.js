const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");


// =====================================
// TAMANHO DA TELA
// =====================================

function resize() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;
}

resize();

window.addEventListener("resize", resize);


// =====================================
// ELEMENTOS
// =====================================

const menu =
    document.getElementById("menu");

const hud =
    document.getElementById("hud");

const gameOver =
    document.getElementById("gameOver");

const playButton =
    document.getElementById("playButton");

const restartButton =
    document.getElementById("restartButton");

const health1 =
    document.getElementById("health1");

const health2 =
    document.getElementById("health2");

const scoreText =
    document.getElementById("score");

const waveText =
    document.getElementById("wave");

const finalScore =
    document.getElementById("finalScore");


// =====================================
// TECLADO
// =====================================

const keys = {};

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight") {

        e.preventDefault();
    }
});


window.addEventListener("keyup", e => {

    keys[e.key.toLowerCase()] = false;
});


// =====================================
// JOGADORES
// =====================================

const player1 = {

    x: 0,
    y: 0,

    radius: 18,

    speed: 5,

    health: 100,
    maxHealth: 100,

    color: "#00ffff",

    shootCooldown: 0,

    alive: true
};


const player2 = {

    x: 0,
    y: 0,

    radius: 18,

    speed: 5,

    health: 100,
    maxHealth: 100,

    color: "#ff1744",

    shootCooldown: 0,

    alive: true
};


// =====================================
// ARRAYS
// =====================================

let bullets = [];

let enemies = [];

let particles = [];


// =====================================
// GAME
// =====================================

let running = false;

let score = 0;

let wave = 1;

let spawnTimer = 0;


// =====================================
// FUNÇÕES
// =====================================

function random(min, max) {

    return Math.random() *
        (max - min) + min;
}


function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}


// =====================================
// COMEÇAR
// =====================================

function startGame() {

    menu.style.display = "none";

    gameOver.style.display = "none";

    hud.style.display = "flex";


    player1.x =
        canvas.width * .35;

    player1.y =
        canvas.height * .5;

    player1.health = 100;

    player1.alive = true;


    player2.x =
        canvas.width * .65;

    player2.y =
        canvas.height * .5;

    player2.health = 100;

    player2.alive = true;


    bullets = [];

    enemies = [];

    particles = [];


    score = 0;

    wave = 1;

    spawnTimer = 30;

    running = true;

    requestAnimationFrame(loop);
}


// =====================================
// MOVIMENTO PLAYER 1
// =====================================

function movePlayer1() {

    if (!player1.alive)
        return;


    let dx = 0;

    let dy = 0;


    if (keys.w)
        dy--;

    if (keys.s)
        dy++;

    if (keys.a)
        dx--;

    if (keys.d)
        dx++;


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;

        dy /= length;

        player1.x +=
            dx * player1.speed;

        player1.y +=
            dy * player1.speed;
    }


    limitPlayer(player1);
}


// =====================================
// MOVIMENTO PLAYER 2
// =====================================

function movePlayer2() {

    if (!player2.alive)
        return;


    let dx = 0;

    let dy = 0;


    if (keys.arrowup)
        dy--;

    if (keys.arrowdown)
        dy++;

    if (keys.arrowleft)
        dx--;

    if (keys.arrowright)
        dx++;


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;

        dy /= length;

        player2.x +=
            dx * player2.speed;

        player2.y +=
            dy * player2.speed;
    }


    limitPlayer(player2);
}


// =====================================
// LIMITAR JOGADOR
// =====================================

function limitPlayer(player) {

    player.x = Math.max(
        player.radius,
        Math.min(
            canvas.width - player.radius,
            player.x
        )
    );


    player.y = Math.max(
        player.radius,
        Math.min(
            canvas.height - player.radius,
            player.y
        )
    );
}


// =====================================
// TIRO PLAYER 1
// =====================================

function shootPlayer1() {

    if (!player1.alive)
        return;

    if (player1.shootCooldown > 0)
        return;


    const target =
        findNearestEnemy(player1);


    let angle = 0;


    if (target) {

        angle =
            Math.atan2(
                target.y - player1.y,
                target.x - player1.x
            );
    }


    bullets.push({

        x: player1.x,

        y: player1.y,

        vx: Math.cos(angle) * 12,

        vy: Math.sin(angle) * 12,

        radius: 5,

        damage: 1,

        owner: 1,

        color: player1.color,

        life: 100
    });


    player1.shootCooldown = 12;
}


// =====================================
// TIRO PLAYER 2
// =====================================

function shootPlayer2() {

    if (!player2.alive)
        return;

    if (player2.shootCooldown > 0)
        return;


    const target =
        findNearestEnemy(player2);


    let angle = 0;


    if (target) {

        angle =
            Math.atan2(
                target.y - player2.y,
                target.x - player2.x
            );
    }


    bullets.push({

        x: player2.x,

        y: player2.y,

        vx: Math.cos(angle) * 12,

        vy: Math.sin(angle) * 12,

        radius: 5,

        damage: 1,

        owner: 2,

        color: player2.color,

        life: 100
    });


    player2.shootCooldown = 12;
}


// =====================================
// ACHAR INIMIGO MAIS PRÓXIMO
// =====================================

function findNearestEnemy(player) {

    let nearest = null;

    let nearestDistance = Infinity;


    for (const enemy of enemies) {

        const d =
            distance(player, enemy);


        if (d < nearestDistance) {

            nearestDistance = d;

            nearest = enemy;
        }
    }


    return nearest;
}


// =====================================
// CRIAR INIMIGO
// =====================================

function spawnEnemy() {

    const side =
        Math.floor(random(0, 4));


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


    const strong =
        Math.random() < .15;


    enemies.push({

        x: x,

        y: y,

        radius:
            strong ? 26 : 16,

        speed:
            strong
            ? 1.2
            : random(1.5, 2.3),

        health:
            strong
            ? 3
            : 1,

        maxHealth:
            strong
            ? 3
            : 1,

        damage:
            strong
            ? 25
            : 10,

        color:
            strong
            ? "#ff6600"
            : "#a020f0"
    });
}


// =====================================
// ATUALIZAR JOGADORES
// =====================================

function updatePlayers() {

    movePlayer1();

    movePlayer2();


    if (player1.shootCooldown > 0)
        player1.shootCooldown--;


    if (player2.shootCooldown > 0)
        player2.shootCooldown--;


    if (keys.f)
        shootPlayer1();


    if (keys.l)
        shootPlayer2();
}


// =====================================
// ATUALIZAR TIROS
// =====================================

function updateBullets() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];


        bullet.x += bullet.vx;

        bullet.y += bullet.vy;

        bullet.life--;


        if (

            bullet.life <= 0 ||

            bullet.x < -50 ||

            bullet.x >
            canvas.width + 50 ||

            bullet.y < -50 ||

            bullet.y >
            canvas.height + 50

        ) {

            bullets.splice(i, 1);
        }
    }
}


// =====================================
// ATUALIZAR INIMIGOS
// =====================================

function updateEnemies() {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy = enemies[i];


        // Escolher jogador mais próximo

        const d1 =
            player1.alive
            ? distance(enemy, player1)
            : Infinity;


        const d2 =
            player2.alive
            ? distance(enemy, player2)
            : Infinity;


        const target =
            d1 < d2
            ? player1
            : player2;


        if (!target.alive)
            continue;


        // Movimento

        const angle =
            Math.atan2(
                target.y - enemy.y,
                target.x - enemy.x
            );


        enemy.x +=
            Math.cos(angle) *
            enemy.speed;


        enemy.y +=
            Math.sin(angle) *
            enemy.speed;


        // Bater no jogador

        if (
            distance(enemy, target)
            <
            enemy.radius +
            target.radius
        ) {

            target.health -=
                enemy.damage;


            createParticles(
                target.x,
                target.y,
                target.color,
                15
            );


            enemies.splice(i, 1);


            if (target.health <= 0) {

                target.health = 0;

                target.alive = false;
            }


            continue;
        }


        // Colisão com tiros

        for (
            let j = bullets.length - 1;
            j >= 0;
            j--
        ) {

            const bullet =
                bullets[j];


            if (
                distance(enemy, bullet)
                <
                enemy.radius +
                bullet.radius
            ) {

                enemy.health -=
                    bullet.damage;


                bullets.splice(j, 1);


                createParticles(
                    bullet.x,
                    bullet.y,
                    bullet.color,
                    6
                );


                if (
                    enemy.health <= 0
                ) {

                    score +=
                        enemy.maxHealth > 1
                        ? 50
                        : 10;


                    createParticles(
                        enemy.x,
                        enemy.y,
                        enemy.color,
                        25
                    );


                    enemies.splice(i, 1);

                    break;
                }
            }
        }
    }
}


// =====================================
// PARTÍCULAS
// =====================================

function createParticles(
    x,
    y,
    color,
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            vx: random(-4, 4),

            vy: random(-4, 4),

            size: random(2, 5),

            life: 1,

            color: color
        });
    }
}


function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];


        p.x += p.vx;

        p.y += p.vy;


        p.vx *= .95;

        p.vy *= .95;


        p.life -= .03;


        if (p.life <= 0) {

            particles.splice(i, 1);
        }
    }
}


// =====================================
// FUNDO
// =====================================

function drawBackground() {

    ctx.fillStyle = "#050510";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Grade

    ctx.strokeStyle =
        "rgba(0,255,255,.06)";

    ctx.lineWidth = 1;


    const size = 50;


    for (
        let x = 0;
        x < canvas.width;
        x += size
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y < canvas.height;
        y += size
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();
    }
}


// =====================================
// DESENHAR JOGADOR
// =====================================

function drawPlayer(player) {

    if (!player.alive)
        return;


    ctx.save();


    ctx.translate(
        player.x,
        player.y
    );


    ctx.fillStyle =
        player.color;


    ctx.shadowBlur = 25;

    ctx.shadowColor =
        player.color;


    ctx.beginPath();

    ctx.moveTo(22, 0);

    ctx.lineTo(-15, -13);

    ctx.lineTo(-8, 0);

    ctx.lineTo(-15, 13);

    ctx.closePath();

    ctx.fill();


    // Núcleo

    ctx.fillStyle = "white";

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


// =====================================
// DESENHAR INIMIGOS
// =====================================

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.save();


        ctx.fillStyle =
            enemy.color;


        ctx.shadowBlur = 25;

        ctx.shadowColor =
            enemy.color;


        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Núcleo

        ctx.fillStyle =
            "#ffffff";


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


        // Vida dos fortes

        if (enemy.maxHealth > 1) {

            const width =
                enemy.radius * 2;


            ctx.fillStyle =
                "#222";


            ctx.fillRect(
                enemy.x - width / 2,
                enemy.y - enemy.radius - 10,
                width,
                4
            );


            ctx.fillStyle =
                "#ff1744";


            ctx.fillRect(
                enemy.x - width / 2,
                enemy.y - enemy.radius - 10,
                width *
                (enemy.health /
                enemy.maxHealth),
                4
            );
        }
    }
}


// =====================================
// DESENHAR TIROS
// =====================================

function drawBullets() {

    for (const bullet of bullets) {

        ctx.save();


        ctx.fillStyle =
            bullet.color;


        ctx.shadowBlur = 20;

        ctx.shadowColor =
            bullet.color;


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
    }
}


// =====================================
// DESENHAR PARTÍCULAS
// =====================================

function drawParticles() {

    for (const p of particles) {

        ctx.save();


        ctx.globalAlpha =
            p.life;


        ctx.fillStyle =
            p.color;


        ctx.shadowBlur = 15;

        ctx.shadowColor =
            p.color;


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
    }
}


// =====================================
// HUD
// =====================================

function updateHUD() {

    health1.style.width =
        (player1.health /
        player1.maxHealth *
        100) + "%";


    health2.style.width =
        (player2.health /
        player2.maxHealth *
        100) + "%";


    scoreText.textContent =
        "PONTOS: " + score;


    waveText.textContent =
        "ONDA: " + wave;
}


// =====================================
// VERIFICAR GAME OVER
// =====================================

function checkGameOver() {

    if (
        !player1.alive &&
        !player2.alive
    ) {

        endGame();
    }
}


// =====================================
// LOOP
// =====================================

function loop() {

    if (!running)
        return;


    drawBackground();


    updatePlayers();

    updateBullets();

    updateEnemies();

    updateParticles();


    // Spawn

    spawnTimer--;


    if (spawnTimer <= 0) {

        spawnEnemy();


        if (score > 0 &&
            score % 500 === 0) {

            spawnEnemy();
        }


        spawnTimer =
            Math.max(
                15,
                60 - wave * 3
            );
    }


    wave =
        Math.floor(score / 300) + 1;


    drawBullets();

    drawEnemies();

    drawParticles();


    drawPlayer(player1);

    drawPlayer(player2);


    updateHUD();

    checkGameOver();


    requestAnimationFrame(loop);
}


// =====================================
// GAME OVER
// =====================================

function endGame() {

    running = false;

    hud.style.display = "none";

    gameOver.style.display = "flex";

    finalScore.textContent =
        "Pontuação: " + score;
}


// =====================================
// BOTÕES
// =====================================

playButton.addEventListener(
    "click",
    startGame
);


restartButton.addEventListener(
    "click",
    startGame
);