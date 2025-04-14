// Get canvas and context
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight * 0.8;

// Game variables
let asteroids = [];
let bullets = [];
let spaceship = { x: canvas.width / 2, y: canvas.height / 2, size: 30 };
let paused = false;
let totalAsteroids = 0;  // Track how many asteroids spawned
let highscore = 0;
let gameOver = false;
let level = 1;
//sounds
let asteroidSound = new Audio('sounds/Explosion.mp3');
asteroidSound.volume = 0.5;
let laserSound = new Audio('sounds/laser-gun.mp3'); 
laserSound.volume = 0.5;
// mute
let isMuted = false; 

// Restart button properties
let restartButton = {
    x: canvas.width / 2 - 50,
    y: canvas.height / 2,
    width: 100,
    height: 40
};

let continueButton = {
    x: canvas.width / 2 - 50,
    y: canvas.height / 2 + 50,
    width: 100,
    height: 40
};

// Difficulty
let difficultyMultiplier = 1;
let spawnInterval = 900;

function levelUp() {
    if (level < 6) {
        level++;  // Increase the level
    }
}

function increaseDifficulty() {
    if (level < 6) {
    difficultyMultiplier += 0.3;  // Gradually increase asteroid speed by 0.1 every time
    spawnInterval = Math.max(500, spawnInterval - 100);  // Decrease spawn interval by 50ms, but ensure it doesn't go below 500ms
    }
}

setInterval(() => {
    if (level < 5) {
        levelUp();  // Level up after every interval (e.g., 10 seconds)
        increaseDifficulty();  // Increase difficulty based on the level
    }
    console.log(`Level: ${level}, Difficulty Multiplier: ${difficultyMultiplier}, Spawn Interval: ${spawnInterval}`);
}, 10000);


// Hide cursor
canvas.style.cursor = "none";

// Draw spaceship
function drawSpaceship() {
    ctx.beginPath();
    ctx.moveTo(spaceship.x + spaceship.size / 2, spaceship.y);
    ctx.lineTo(spaceship.x - spaceship.size / 2, spaceship.y - spaceship.size / 2);
    ctx.lineTo(spaceship.x - spaceship.size / 2, spaceship.y + spaceship.size / 2);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
}

// Mouse movement
canvas.addEventListener("mousemove", (event) => {
    if (gameOver) return;
    let rect = canvas.getBoundingClientRect();
    spaceship.x = event.clientX - rect.left;
    spaceship.y = event.clientY - rect.top;

    
    // Constrain spaceship's X position within canvas bounds
    spaceship.x = Math.max(spaceship.size / 2, Math.min(spaceship.x, canvas.width - spaceship.size / 2));

    // Constrain spaceship's Y position within canvas bounds
    spaceship.y = Math.max(spaceship.size / 2, Math.min(spaceship.y, canvas.height - spaceship.size / 2));
});

// Draw asteroid
function drawAsteroid(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "gray";
    ctx.fill();
}

// Spawn asteroid
function spawnAsteroid() {
    if (gameOver || paused) return;

    let asteroidCount = 4;
    if (level === 2) asteroidCount = 5;
    else if (level === 3) asteroidCount = 7;
    else if (level >= 4) asteroidCount = 9;
    else if (level >= 5) asteroidCount = 11;
    else if (level >= 6) asteroidCount = 13;
    totalAsteroids += asteroidCount;

    for(let i = 0; i < asteroidCount; i++) {
    let radius = Math.random() * 30 + 10;
    let x = canvas.width + radius;
    let y;

        // Randomly decide whether to spawn in the top half or bottom half of the right side
        if (Math.random() < 0.5) {
            y = Math.random() * (canvas.height / 2); // Top half
        } else {
            y = Math.random() * (canvas.height / 2) + (canvas.height / 2); // Bottom half
        }
        
    let speed = (Math.random() * 6 + 2) * difficultyMultiplier;

    asteroids.push({ x, y, radius, speed });
    }

    setTimeout(spawnAsteroid, spawnInterval);
}

// Update asteroid positions
function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].x -= asteroids[i].speed;
        
        if (asteroids[i].x + asteroids[i].radius < 0) {
            asteroids.splice(i, 1); // Remove asteroid safely
        }

        if (checkCollision(spaceship, asteroids[i])) {
            endGame();
        }
    }
}

// Collision detection
function checkCollision(spaceship, asteroid) {
    let dx = spaceship.x - asteroid.x;
    let dy = spaceship.y - asteroid.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < spaceship.size / 2 + asteroid.radius;
}

// Draw all asteroids
function drawAsteroids() {
    for (let asteroid of asteroids) {
        drawAsteroid(asteroid.x, asteroid.y, asteroid.radius);
    }
}

//bullet times
let lastShotTime = 0;

canvas.addEventListener("click", () => {
    if (paused || gameOver) return;

    const shotCooldown = 500;
    let currentTime = Date.now();

    if (currentTime - lastShotTime >= shotCooldown) {
        let bullet = {
            x: spaceship.x + spaceship.size,
            y: spaceship.y,
            speed: 5,
            radius: 5
        };
        bullets.push(bullet);

        if (!isMuted) {
            laserSound.currentTime = 0;  // Restart sound to avoid overlap
            laserSound.play();
        }
        

        lastShotTime = currentTime; // Update last shot time
    }
});


function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].speed;

        if (bullets[i].x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    ctx.fillStyle = "red";
    for (let bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Bullet collisions
function checkBulletCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            let dx = bullets[i].x - asteroids[j].x;
            let dy = bullets[i].y - asteroids[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bullets[i].radius + asteroids[j].radius) {
                bullets.splice(i, 1);
                asteroids.splice(j, 1);

                if (!isMuted){
                    asteroidSound.currentTime = 0;
                asteroidSound.play();
                }
                 

                break;
            }
        }
    }
}

// Draw Score
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${totalAsteroids}`, 20, 40);
    ctx.fillText(`High Score: ${highscore}`, 20, 70);
}

// Restart game
function restart() {
    if (totalAsteroids > highscore) {
        highscore = totalAsteroids;
    }

    totalAsteroids = 0;
    gameOver = false;
    asteroids = [];
    bullets = [];
    spaceship.x = canvas.width / 2;
    spaceship.y = canvas.height / 2;
    level = 1;

    difficultyMultiplier = 1;
    spawnInterval = 1000;

    canvas.style.cursor = "none";

    gameLoop();
    spawnAsteroid();
}

// Draw Restart Button
function drawRestartButton() {
    ctx.fillStyle = "red";
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Restart", restartButton.x + 15, restartButton.y + 27);
}

function drawPauseScreen() {
    canvas.style.cursor = "default";  // Show cursor when paused

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("PAUSED", canvas.width / 2 - 60, canvas.height / 2 - 30);

    ctx.fillStyle = "green";
    ctx.fillRect(continueButton.x, continueButton.y, continueButton.width, continueButton.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial"; 
    ctx.fillText("Continue", continueButton.x + 15, continueButton.y + 27);
}

// End game
function endGame() {
    gameOver = true;
    canvas.style.cursor = "default";
    drawRestartButton();
}

// Handle Restart/Continue Button Click
canvas.addEventListener("click", (event) => {
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    // Continue button
    if (paused && clickX >= continueButton.x && clickX <= continueButton.x + continueButton.width &&
        clickY >= continueButton.y && clickY <= continueButton.y + continueButton.height) {
        paused = false;
        gameLoop();
        spawnAsteroid();  // Restart asteroid spawning
    }

    // Restart button
    if (gameOver && clickX >= restartButton.x && clickX <= restartButton.x + restartButton.width &&
        clickY >= restartButton.y && clickY <= restartButton.y + restartButton.height) {
        restart();
    }
});

// Pause functionality
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        paused = !paused;
        
        if (paused) {
            drawPauseScreen();
        } else {
            gameLoop();  
            spawnAsteroid();  // Resume asteroid spawning
        }
    }

    if (event.key === "m"){
        isMuted = !isMuted; 

        laserSound.volume = isMuted ? 0 : 0.5;
        asteroidSound.volume = isMuted ? 0 : 0.5;
    }
});
// Game loop
function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (paused) {
        drawPauseScreen();
        return;
    }

    drawSpaceship();
    updateAsteroids();
    updateBullets();
    drawBullets();
    drawAsteroids();
    checkBulletCollisions();
    drawScore();
    if (gameOver) drawRestartButton();

    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
spawnAsteroid();
