const info = document.getElementById("info");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const radius = 60;
const padding = 20;

const leftCenterX = padding + radius;
const rightCenterX = canvas.width - padding - radius;
const centerY = canvas.height / 2;

let gamepadIndex = null;

window.addEventListener("gamepadconnected", (e) => {
    gamepadIndex = e.gamepad.index;
    console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
    console.log(e.gamepad.axes);
    updateLoop();
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected");
    gamepadIndex = null;
    info.textContent = "Геймпад відключено.";
    clearCanvas();
});

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawStick(centerX, centerY, xAxis, yAxis) {
    // Квадратна зона
    const size = radius * 2;
    const topLeftX = centerX - radius;
    const topLeftY = centerY - radius;

    ctx.strokeStyle = "#999";
    ctx.setLineDash([]); // суцільна рамка
    ctx.strokeRect(topLeftX, topLeftY, size, size);

    // Пунктирні осі
    ctx.strokeStyle = "#ccc";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    // вертикальна лінія
    ctx.moveTo(centerX, topLeftY);
    ctx.lineTo(centerX, topLeftY + size);
    // горизонтальна лінія
    ctx.moveTo(topLeftX, centerY);
    ctx.lineTo(topLeftX + size, centerY);
    ctx.stroke();

    // Поточне положення
    const x = centerX + xAxis * radius;
    const y = centerY + yAxis * radius;

    ctx.setLineDash([]); // скидаємо пунктир
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function updateLoop() {
    if (gamepadIndex !== null) {
        const gp = navigator.getGamepads()[gamepadIndex];
        if (gp) {
            // Текстова інформація
            let output = `${gp.id}`;
            info.textContent = output;

            // Отримуємо значення осей
            const lx = gp.axes[0] || 0; // правий стік X
            const ly = gp.axes[1] || 0; // правий стік Y
            const rx = gp.axes[2] || 0; // лівий стік X
            const ry = gp.axes[3] || 0; // лівий стік Y

            // Малюємо обидва стики
            clearCanvas();
            drawStick(rightCenterX, centerY, lx, -ly); // Правий стік
            drawStick(leftCenterX, centerY, ry, -rx); // Лівий стік
        }
        requestAnimationFrame(updateLoop);
    }
}
