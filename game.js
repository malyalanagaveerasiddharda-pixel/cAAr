const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedValDisplay = document.getElementById('speed-val');
const coinValDisplay = document.getElementById('coin-val');

// Image assets
const coinImg = new Image();
coinImg.src = 'Screenshot 2026-09-27 163420.png';

// Audio assets
const coinSound = new Audio('allu arjun laugh.mp3.mpeg');

// Game State
let totalCoins = 0;
let trafficCars = [];
let coins = [];

// Handle window resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Touch state
const touch = {
    active: false,
    x: 0,
    y: 0
};

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touch.active = true;
    touch.x = e.touches[0].clientX;
    touch.y = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    touch.x = e.touches[0].clientX;
    touch.y = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchend', () => {
    touch.active = false;
});

class Car {
    constructor(x, y, color = '#e74c3c', isPlayer = true) {
        this.x = x;
        this.y = y;
        this.width = isPlayer ? 60 : 40;
        this.height = isPlayer ? 30 : 20;
        this.angle = 0;
        this.speed = 0;
        this.acceleration = 0.2;
        this.friction = 0.05;
        this.brakeForce = 0.3;
        this.maxSpeed = 8;
        this.boostMultiplier = 2;
        this.turnSpeed = 0.04;
        this.color = color;
        this.isPlayer = isPlayer;
    }

    update() {
        if (this.isPlayer) {
            // Handle Input (Keyboard or Touch)
            if (touch.active) {
                // Mobile Touch Logic: Follow Finger
                this.speed += this.acceleration;

                // Calculate target angle to finger
                const targetAngle = Math.atan2(touch.y - this.y, touch.x - this.x);

                // Smoothly rotate towards target angle
                let angleDiff = targetAngle - this.angle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                this.angle += angleDiff * 0.1;
            } else {
                // Keyboard Controls
                let currentAccel = this.acceleration;
                if (keys['ShiftLeft'] || keys['ShiftRight']) {
                    currentAccel *= this.boostMultiplier;
                }

                if (keys['KeyW'] || keys['ArrowUp']) {
                    this.speed += currentAccel;
                }
                if (keys['KeyS'] || keys['ArrowDown']) {
                    this.speed -= this.brakeForce;
                }

                if (!keys['KeyW'] && !keys['ArrowUp'] && !keys['KeyS'] && !keys['ArrowDown']) {
                    if (this.speed > 0) this.speed -= this.friction;
                    if (this.speed < 0) this.speed += this.friction;
                    if (Math.abs(this.speed) < this.friction) this.speed = 0;
                }

                const limit = (keys['ShiftLeft'] || keys['ShiftRight']) ? this.maxSpeed * 1.5 : this.maxSpeed;
                if (this.speed > limit) this.speed = limit;
                if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

                if (Math.abs(this.speed) > 0.1) {
                    const direction = this.speed > 0 ? 1 : -1;
                    if (keys['KeyA'] || keys['ArrowLeft']) {
                        this.angle -= this.turnSpeed * direction * (Math.abs(this.speed) / this.maxSpeed + 0.5);
                    }
                    if (keys['KeyD'] || keys['ArrowRight']) {
                        this.angle += this.turnSpeed * direction * (Math.abs(this.speed) / this.maxSpeed + 0.5);
                    }
                }
            }
        } else {
            // Simple Traffic AI
            this.speed = 2 + Math.random() * 2;
            if (Math.random() < 0.01) {
                this.angle += (Math.random() - 0.5) * 0.2;
            }
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Screen Wrap-around
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Car Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        if (this.isPlayer) {
            // Add a racing stripe for the main car
            ctx.fillStyle = 'white';
            ctx.fillRect(-this.width / 2, -2, this.width, 4);

            // Bigger windshield
            ctx.fillStyle = '#3498db';
            ctx.fillRect(this.width / 4, -this.height / 2 + 4, 8, this.height - 8);
        } else {
            // Simple windshield for traffic
            ctx.fillStyle = '#3498db';
            ctx.fillRect(this.width / 4, -this.height / 2 + 2, 5, this.height - 4);
        }

        // Headlights
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.width / 2 - 2, -this.height / 2 + 2, 2, 4);
        ctx.fillRect(this.width / 2 - 2, this.height / 2 - 6, 2, 4);

        ctx.restore();
    }
}

class Coin {
    constructor() {
        this.respawn();
    }

    respawn() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 25;
    }

    draw() {
        ctx.save();
        // Create a circular clip for the coin image
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (coinImg.complete && coinImg.naturalWidth !== 0) {
            ctx.drawImage(
                coinImg,
                this.x - this.radius,
                this.y - this.radius,
                this.radius * 2,
                this.radius * 2
            );
        } else {
            // Fallback if image fails to load
            ctx.fillStyle = '#f1c40f';
            ctx.fill();
        }
        ctx.restore();
    }
}

let player = new Car(canvas.width / 2, canvas.height / 2);

function spawnTraffic() {
    trafficCars = [];
    for (let i = 0; i < 5; i++) {
        trafficCars.push(new Car(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            `hsl(${Math.random() * 360}, 70%, 50%)`,
            false
        ));
    }
}

function spawnCoins() {
    coins = [];
    for (let i = 0; i < 10; i++) {
        coins.push(new Coin());
    }
}

function resetGame() {
    player = new Car(canvas.width / 2, canvas.height / 2);
    spawnTraffic();
    spawnCoins();
}

function checkCollision(car1, car2) {
    const dist = Math.hypot(car1.x - car2.x, car1.y - car2.y);
    return dist < 30; // Simplified collision distance
}

function init() {
    spawnTraffic();
    spawnCoins();
}

function gameLoop() {
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.fillStyle = '#555';
    for(let i=0; i<canvas.width; i+=100) {
        for(let j=0; j<canvas.height; j+=100) {
            ctx.fillRect(i, j, 2, 2);
        }
    }

    // Update and Draw Coins
    coins.forEach(coin => {
        coin.draw();
        const dist = Math.hypot(player.x - coin.x, player.y - coin.y);
        if (dist < 35) {
            totalCoins++;
            coinValDisplay.innerText = totalCoins;

            // Play audio
            coinSound.currentTime = 0; // Reset to start for rapid collection
            coinSound.play().catch(e => console.log("Audio playback failed: ", e));

            coin.respawn();
        }
    });

    // Update and Draw Traffic
    trafficCars.forEach(tCar => {
        tCar.update();
        tCar.draw();
        if (checkCollision(player, tCar)) {
            resetGame();
        }
    });

    player.update();
    player.draw();

    speedValDisplay.innerText = Math.floor(Math.abs(player.speed) * 20);

    requestAnimationFrame(gameLoop);
}

init();
gameLoop();
