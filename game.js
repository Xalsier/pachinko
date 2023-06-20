const canvas = document.getElementById('pachinkoCanvas');
const ctx = canvas.getContext('2d');
const ballRadius = 3;
const ballTrailLength = 5;
const ballTrailColor = 'rgba(255, 255, 255, 0.2)';
const pegRadius = 2;
const pegVibrationAmplitude = 0.5;
const gravity = 0.1;
const pegVibrationDecay = 0.3;
let score = 0;
let balls = [];
let lastTime = performance.now();
let ballLimit = 9;
let ballsLeft = 0;
let ballElements = Array.from(document.querySelectorAll('.ball'));
let pegs = []; // Initialize pegs as an empty array
let throwPower = 0;
let powerInterval;
let colorInterval;
let ballStartingX = canvas.width / 2;
let ballStartingXSpeed = 1; // How fast the ball starting position moves
let level = 1;
let maxLevelReached = false;
let rewardFlag = false; // add this line
let startTime = performance.now();
let tokens = 30; // start with 30 tokens for Button 3
const maxTokens = 99;
const convertButton = document.getElementById('button3');
const lineWidth = 20;
const maxLevels = 2; // Set the max number of levels here
const maxThrowPower = 5; // The maximum power a throw can have
const throwButton = document.getElementById('button1');
const purchaseButton = document.getElementById('button2');
const gameMenu = document.getElementById('game-menu');
const gameWrapper = document.getElementById('game-wrapper');
const startGameButton = document.getElementById('start-game-button');
const returnToMenuButton = document.getElementById('button4');
const buildGameButton = document.getElementById('build-game-button');
let isBuildMode = false;
function update() {
    let elapsedTime = (performance.now() - startTime) / 1000;
    ballStartingX = (canvas.width / 2) + Math.sin(elapsedTime * ballStartingXSpeed) * (canvas.width / 2 - ballRadius);
    requestAnimationFrame(update);
}
update();
const loadPegsFromJSON = (fileName) => {
    return fetch(fileName)
        .then(res => res.json())
        .then(arr => arr.map(([x, y, type = 0]) => ({
            x,
            y,
            type,
            vibration: 0
        })));
};
function loadPegsAndStartDrawing(fileName) {
    loadPegsFromJSON(fileName)
        .then(loadedPegs => {
            pegs = loadedPegs;
            draw();
        })
        .catch(error => console.error(error));
}
// Update the color and visibility of the menu and build buttons based on rewardFlag
function updateButtonStates() {
    if (rewardFlag) {
        document.getElementById('button4').style.backgroundColor = 'cyan';
        document.getElementById('build-game-button').style.backgroundColor = 'cyan';
        document.getElementById('build-game-button').style.visibility = 'visible';
    } else {
        document.getElementById('start-game-button').style.backgroundColor = '';
        document.getElementById('build-game-button').style.visibility = 'hidden';
    }
}

function updateTokens() {
    convertButton.value = tokens;
    convertButton.innerHTML = `${tokens}`;
    purchaseButton.innerHTML = `10`;
}
startGameButton.addEventListener('click', () => {
    gameMenu.style.visibility = 'hidden';
    gameWrapper.style.visibility = 'visible';
    isBuildMode = false;
    loadPegsAndStartDrawing('lotus.json');
});
buildGameButton.addEventListener('click', () => {
    gameMenu.style.visibility = 'hidden';
    gameWrapper.style.visibility = 'visible';
    isBuildMode = true;
    loadPegsAndStartDrawing('empty.json');
});
canvas.addEventListener('click', (event) => {
    if (isBuildMode) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        pegs.push({
            x,
            y,
            type: 0,
            vibration: 0,
        });
    }
});
returnToMenuButton.addEventListener('click', () => {
    gameMenu.style.visibility = 'visible';
    gameWrapper.style.visibility = 'hidden';
});

function drawPeg(ctx, {
    x,
    y,
    type,
    vibration
}) {
    ctx.beginPath();
    ctx.arc(x, y + (vibration || 0), pegRadius, 0, Math.PI * 2);
    if (type === 1) {
        const rainbowColor = `hsl(${(performance.now() / 10) % 360}, 100%, 50%)`;
        ctx.fillStyle = rainbowColor;
    } else if (type === 2) {
        ctx.fillStyle = 'brown';
        ctx.fillRect(x - lineWidth / 2, y, lineWidth, pegRadius * 2);
    } else if (type === 3) {
        ctx.fillStyle = 'red';
    } else {
        ctx.fillStyle = 'cyan';
    }
    ctx.fill();
    ctx.closePath();
}
convertButton.addEventListener('click', () => {
    if (score > 0) {
        tokens += score;
        if (tokens > maxTokens) {
            tokens = maxTokens;
        }
        score = 0;
    }
    updateTokens();
});
purchaseButton.addEventListener('click', () => {
    if (ballsLeft < ballLimit) {
        ballsLeft++;
        if (tokens >= 10) { // check if enough tokens are there to make a purchase
            tokens -= 10; // reduce the tokens by the cost
        } else {
            purchaseButton.style.backgroundColor = 'red'; // make the purchase button flash red
            setTimeout(() => {
                purchaseButton.style.backgroundColor = '';
            }, 500); // revert the color back after 500 ms
            ballsLeft--; // revert the increment of ballsLeft
            return; // exit the function
        }
    }
    updateTokens();
});
throwButton.addEventListener('mouseup', () => {
    if (ballsLeft > 0 && balls.length < ballLimit) {
        ballsLeft--;
        resetBall(1);
    }
});
function drawPegs(ctx, pegs, pegVibrationDecay) {
    if (pegs.length === 0) {
        return; // Return early if pegs is empty
    }
    for (let i = 0; i < pegs.length; i++) {
        const peg = pegs[i];
        drawPeg(ctx, peg); // Pass the ctx and peg object to drawPeg function
        if (peg.vibration) {
            peg.vibration *= (1 - pegVibrationDecay);
        }
    }
}
function drawHighScoreMeter() {
    const container = document.getElementById('container');
    const meterHeight = (score / 100) * container.offsetHeight;
    document.getElementById('heat').style.height = `${meterHeight}px`;
}
function drawAvailableBalls() {
    for (let i = 0; i < ballLimit; i++) {
        if (i < ballsLeft) {
            ballElements[i].classList.remove('inactive');
            ballElements[i].classList.add('active');
        } else {
            ballElements[i].classList.remove('active');
            ballElements[i].classList.add('inactive');
        }
    }
}
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
    const prevPositions = ball.prevPositions.slice().reverse();
    for (let i = 0; i < prevPositions.length - 1; i++) {
        const p1 = prevPositions[i];
        const p2 = prevPositions[i + 1];
        const alpha = (i + 1) / ballTrailLength;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = ballTrailColor.replace(/, ([0-9.]+)\)$/, `, ${alpha})`);
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
function ballPegCollision(ball, pegX, pegY) {
    const dx = ball.x - pegX;
    const dy = ball.y - pegY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ballRadius + pegRadius;
    if (distance < minDistance) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDistance - distance;
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;
        const nx = dx / distance;
        const ny = dy / distance;
        applyImpulse(ball, nx, ny, 0.8);
        const peg = pegs.find(p => p.x === pegX && p.y === pegY);
        if (peg) {
            peg.vibration += pegVibrationAmplitude;
            if (peg.type === 0) {
                score += 2;
            } else if (peg.type === 1) {
                score += 3;
            }
        }
    }
}
function checkCollisions(ball) {
    for (let i = 0; i < pegs.length; i++) {
        ballPegCollision(ball, pegs[i].x, pegs[i].y);
    }
    if (ball.x + ballRadius > canvas.width) {
        ball.speedX = -(Math.random() * 3 + 1);
    } else if (ball.x - ballRadius < 0) {
        ball.speedX = Math.random() * 3 + 1;
    }
    if (ball.y + ballRadius > canvas.height) {
        balls = balls.filter((b) => b !== ball);
        tokens += score; // Add the lost score to the tokens
        if (tokens > maxTokens) {
            tokens = maxTokens;
        }
        score = 0;
        updateTokens();
    } else if (ball.y - ballRadius < 0) {
        ball.speedY = Math.abs(ball.speedY);
    }
}
function drawPredictivePath(angle, length) {
    ctx.clearRect(ballStartingX - ballRadius, 20 - ballRadius, ballRadius * 2, canvas.height - 20 + ballRadius); // clear previous path
    const endX = ballStartingX - Math.cos(angle) * length;
    const endY = 20 + Math.sin(angle) * length;
    ctx.beginPath();
    ctx.arc(ballStartingX, 20, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}
function applyImpulse(ball, nx, ny, restitution) {
    const impulse = -(1 + restitution) * (ball.speedX * nx + ball.speedY * ny) / (nx * nx + ny * ny);
    ball.speedX += impulse * nx;
    ball.speedY += impulse * ny;
}
function resetBall(power) {
    const angle = Math.PI / 2; // 90 degrees
    const speed = power; // Use the throw power as the speed
    const newBall = {
        x: ballStartingX,
        y: 20,
        speedY: Math.sin(angle) * speed,
        speedX: -Math.cos(angle) * speed,
        prevPositions: [],
    };
    balls.push(newBall);
}
function updateBall(ball, elapsedTime) {
    ball.prevPositions.push({
        x: ball.x,
        y: ball.y
    });
    if (ball.prevPositions.length > ballTrailLength) {
        ball.prevPositions.shift();
    }
    ball.x += ball.speedX * elapsedTime;
    ball.y += ball.speedY * elapsedTime;
    ball.speedY += gravity * elapsedTime;
    checkCollisions(ball);
    drawBall(ball);
}
const draw = () => {
    const elapsedTime = ((performance.now() - lastTime) / 1000) * 60;
    lastTime = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    balls.forEach(ball => updateBall(ball, elapsedTime));
    drawHighScoreMeter();
    if (ballsLeft > 0) { // Only draw the predictive path when there are balls available
        drawPredictivePath(Math.PI / 2, 50);
    }
    pegs.length > 0 && drawPegs(ctx, pegs);
    drawAvailableBalls();
    score >= 100 && (score = 0, rewardFlag = true, updateButtonStates());
    requestAnimationFrame(draw);
};
loadPegsFromJSON() // Load base pegs
    .then(loadedPegs => {
        pegs = loadedPegs;
        draw(); // Start the animation after pegs have been loaded
        drawPegs(ctx, pegs, pegVibrationDecay);
    })
    .catch(error => console.error(error));