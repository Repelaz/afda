const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;
const speedIncrement = 2; // Incremento de velocidade da bola a cada toque no paddle
const paddleSpeed = 4; // Velocidade dos paddles
const winningScore = 5; // Pontuação para vencer
const effectDuration = 100; // Duração do efeito visual em milissegundos
const maxBallSpeed = 10; // Velocidade máxima da bola

let paddleLeft = { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, dy: 0, color: '#00bfff', targetY: canvas.height / 2 - paddleHeight / 2 };
let paddleRight = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, dy: 0, color: '#00bfff', targetY: canvas.height / 2 - paddleHeight / 2 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, size: ballSize, dx: 0, dy: 0, hue: 0 }; // Adiciona `hue` para controle da cor

let scoreLeft = 0;
let scoreRight = 0;
let gamePaused = true; // Controla o estado do jogo
let showStartScreen = true; // Controla a exibição da tela inicial

// Carregar os arquivos de áudio
const scoreSound = new Audio('assets/sounds/score.mp3');
const hitSound = new Audio('assets/sounds/hit.mp3');
const wallHitSound = new Audio('assets/sounds/wallHit.mp3');
const paddleHitSound = new Audio('assets/sounds/paddleHit.mp3');

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function handleKeyDown(e) {
    if (e.key === 'Enter' && showStartScreen) {
        showStartScreen = false;
        gamePaused = false;
        resetBall(); // Iniciar a bola quando o jogo começa
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
            paddleRight.dy = -paddleSpeed;
            break;
        case 'ArrowDown':
            paddleRight.dy = paddleSpeed;
            break;
        case 'w':
            paddleLeft.dy = -paddleSpeed;
            break;
        case 's':
            paddleLeft.dy = paddleSpeed;
            break;
    }
}

function handleKeyUp(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            paddleRight.dy = 0;
            break;
        case 'w':
        case 's':
            paddleLeft.dy = 0;
            break;
    }
}

function updatePaddles() {
    // Atualizar a posição alvo dos paddles
    paddleLeft.targetY += paddleLeft.dy;
    paddleRight.targetY += paddleRight.dy;

    // Limitar as posições alvo dos paddles para que não saiam da tela
    paddleLeft.targetY = Math.max(0, Math.min(canvas.height - paddleHeight, paddleLeft.targetY));
    paddleRight.targetY = Math.max(0, Math.min(canvas.height - paddleHeight, paddleRight.targetY));

    // Mover os paddles suavemente para as posições alvo
    const paddleMovementSpeed = 0.1; // Ajuste a velocidade do movimento dos paddles aqui
    paddleLeft.y += (paddleLeft.targetY - paddleLeft.y) * paddleMovementSpeed;
    paddleRight.y += (paddleRight.targetY - paddleRight.y) * paddleMovementSpeed;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradiente de fundo dinâmico
    let time = new Date().getTime() * 0.002; // Efeito de transição suave
    let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${(time % 360)}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${(time + 180) % 360}, 70%, 50%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showStartScreen) {
        // Tela inicial
        ctx.font = '48px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Bem-vindo ao Ping!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Pressione Enter para começar', canvas.width / 2, canvas.height / 2 + 20);
    } else {
        // Desenhar paddles
        ctx.fillStyle = paddleLeft.color;
        ctx.strokeStyle = '#1e90ff';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.rect(paddleLeft.x, paddleLeft.y, paddleLeft.width, paddleLeft.height);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = paddleRight.color;

        ctx.beginPath();
        ctx.rect(paddleRight.x, paddleRight.y, paddleRight.width, paddleRight.height);
        ctx.stroke();
        ctx.fill();

        // Atualiza a cor da bola com base no valor de hue
        let ballColor = `hsl(${ball.hue}, 100%, 50%)`;
        ctx.fillStyle = ballColor;

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar placar
        ctx.font = '32px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(scoreLeft, canvas.width / 4, 50);
        ctx.fillText(scoreRight, 3 * canvas.width / 4, 50);

        // Mensagem de fim de jogo
        if (gamePaused) {
            ctx.font = '48px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('Você é bom!', canvas.width / 2, canvas.height / 2);
        }
    }
}

function update() {
    if (gamePaused || showStartScreen) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Atualiza a cor da bola
    ball.hue = (ball.hue + 1) % 360;

    // Verificar colisão com as paredes
    if (ball.y + ball.size > canvas.height || ball.y - ball.size < 0) {
        ball.dy *= -1;
        wallHitSound.play(); // Tocar som de colisão com a parede
    }

    // Verificar colisão com os paddles
    if (ball.x - ball.size < paddleLeft.x + paddleLeft.width && ball.y > paddleLeft.y && ball.y < paddleLeft.y + paddleLeft.height) {
        ball.dx *= -1;
        increaseBallSpeed();
        paddleHitSound.play(); // Tocar som de colisão com o paddle
        activatePaddleEffect(paddleLeft); // Ativar efeito no paddle
    }

    if (ball.x + ball.size > paddleRight.x && ball.y > paddleRight.y && ball.y < paddleRight.y + paddleRight.height) {
        ball.dx *= -1;
        increaseBallSpeed();
        paddleHitSound.play(); // Tocar som de colisão com o paddle
        activatePaddleEffect(paddleRight); // Ativar efeito no paddle
    }

    // Verificar se a bola saiu da tela
    if (ball.x - ball.size < 0) {
        scoreRight++;
        scoreSound.play(); // Tocar som de pontuação
        checkWin();
        if (!gamePaused) resetBall();
    } else if (ball.x + ball.size > canvas.width) {
        scoreLeft++;
        scoreSound.play(); // Tocar som de pontuação
        checkWin();
        if (!gamePaused) resetBall();
    }

    updatePaddles();
}

function increaseBallSpeed() {
    // Aumentar a velocidade da bola, sem ultrapassar a velocidade máxima
    let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (speed < maxBallSpeed) {
        let angle = Math.atan2(ball.dy, ball.dx);
        speed += speedIncrement;
        if (speed > maxBallSpeed) speed = maxBallSpeed;
        ball.dx = speed * Math.cos(angle);
        ball.dy = speed * Math.sin(angle);
    }
}

function activatePaddleEffect(paddle) {
    paddle.color = '#ff6f61'; // Cor do efeito
    setTimeout(() => paddle.color = '#00bfff', effectDuration); // Voltar à cor original após a duração do efeito
}

function checkWin() {
    if (scoreLeft === winningScore || scoreRight === winningScore) {
        gamePaused = true;
        setTimeout(() => {
            scoreLeft = 0;
            scoreRight = 0;
            resetBall();
            showStartScreen = true; // Mostrar tela inicial após 5 segundos
        }, 5000); // Mensagem de vitória por 5 segundos
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const angle = Math.random() * Math.PI / 4 - Math.PI / 8; // Ângulo aleatório entre -22.5 e 22.5 graus
    const speed = 5;
    ball.dx = speed * (Math.random() > 0.5 ? 1 : -1) * Math.cos(angle);
    ball.dy = speed * (Math.random() > 0.5 ? 1 : -1) * Math.sin(angle);
}

function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

gameLoop();
