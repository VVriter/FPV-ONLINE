import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Світло
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Земля як зелена шахматна дошка
// Створення canvas для генерації текстури
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 512;
const ctx = canvas.getContext('2d');

const squares = 8; // шахова дошка 8x8
const squareSize = canvas.width / squares;
const darkGreen = '#228822'; // темно-зелений
const lightGreen = '#88bb88'; // світло-зелений

// Малюємо шаховий паттерн
for (let i = 0; i < squares; i++) {
  for (let j = 0; j < squares; j++) {
    ctx.fillStyle = (i + j) % 2 === 0 ? darkGreen : lightGreen;
    ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
  }
}

// Створення текстури з canvas
const texture = new THREE.CanvasTexture(canvas);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(10, 10); // регулюємо кількість повторень текстури

const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Сонце – яскрава куля в небі
const sunGeo = new THREE.SphereGeometry(5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(50, 80, -100); // налаштуйте позицію за потреби
scene.add(sun);

// Орієнтири
const boxGeometry = new THREE.BoxGeometry(1, 30, 1);
const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF0080, wireframe: false });

for (let i = 0; i < 10; i++) {
    const cube = new THREE.Mesh(boxGeometry, boxMaterial);
    cube.position.set(
        Math.random() * 50 - 25,
        0.5,
        Math.random() * 50 - 25
    );
    scene.add(cube);
}

// Камера над сценою
let angle = 0;
const radius = 30;
const height = 20;

const info = document.getElementById("info");
let gamepadConnected = false;

// Обробка підключення геймпада
window.addEventListener("gamepadconnected", (e) => {
    console.log("Геймпад підключено:", e.gamepad.id);
    gamepadConnected = true;
    info.style.display = "block";
    animate();
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Геймпад відключено");
    gamepadConnected = false;
    info.style.display = "none";
});

// Початкові параметри FPV
let velocity = new THREE.Vector3(0, 0, 0);
let acceleration = new THREE.Vector3(0, 0, 0);
const gravity = -0.002;
const damping = 0.98; // гальмування
let rotation = new THREE.Euler(0, 0, 0, 'YXZ');
let cameraTarget = new THREE.Object3D();
scene.add(cameraTarget);
cameraTarget.add(camera);

function animate() {
    requestAnimationFrame(animate);

    if (!gamepadConnected) return;

    const gp = navigator.getGamepads()[0];
    if (gp) {
        const rx = gp.axes[0] || 0; // правий стік X
        const ry = gp.axes[1] || 0; // правий стік Y
        const ly = gp.axes[2] || 0; // лівий стік X
        const lx = gp.axes[3] || 0; // лівий стік Y

        const yawSpeed = lx * 0.05;
        const throttle = ((ly + 1) / 2) * 0.1; // [0, 1]
        const pitch = -ry * 0.03;
        const roll = rx * 0.03;

        // Оновлення обертання
        rotation.y -= yawSpeed;
        rotation.x = THREE.MathUtils.clamp(rotation.x + pitch, -Math.PI / 2, Math.PI / 2);
        rotation.z = THREE.MathUtils.clamp(rotation.z - roll, -Math.PI / 2, Math.PI / 2);
        cameraTarget.rotation.copy(rotation);

        // Гравітація та рух
        acceleration.set(0, gravity, 0); // вниз
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation).multiplyScalar(throttle * 0.1);
        acceleration.add(forward);

        // Оновлюємо швидкість та позицію
        velocity.add(acceleration);
        velocity.multiplyScalar(damping); // гальмування
        cameraTarget.position.add(velocity);

        // Колізія з землею
        if (cameraTarget.position.y < 0.1) {
            cameraTarget.position.y = 0.1;
            velocity.y = Math.max(0, velocity.y); // не падати вниз
        }
    }

    renderer.render(scene, camera);
    drawHUD();
}


const hudCanvas = document.getElementById('interface');
const hudCtx = hudCanvas.getContext('2d');
hudCanvas.width = window.innerWidth;
hudCanvas.height = window.innerHeight;
hudCtx.lineWidth = 2;
hudCtx.strokeStyle = 'white';
hudCtx.font = '16px monospace';
hudCtx.fillStyle = 'lime';

function drawHUD() {
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

    const centerX = hudCanvas.width / 2;
    const centerY = hudCanvas.height / 2;

    // Обчислення нахилу та обертання (roll і pitch)
    const pitch = THREE.MathUtils.radToDeg(rotation.x);
    const roll = THREE.MathUtils.radToDeg(rotation.z);

    // Горизонтальна лінія (штучний горизонт)
    hudCtx.save();
    hudCtx.translate(centerX, centerY - 160);
    hudCtx.rotate(rotation.z); // обертання горизонту відповідно до roll
    hudCtx.strokeStyle = "#ccc";
    hudCtx.setLineDash([5, 5]);
    hudCtx.beginPath();
    hudCtx.moveTo(-150, pitch);
    hudCtx.lineTo(150, pitch);
    hudCtx.stroke();
    hudCtx.restore();

    // Центрувальний хрестик з чистим стилем (без dash)
    hudCtx.save();
    hudCtx.setLineDash([]); // скидаємо dash
    hudCtx.strokeStyle = "#ccc";
    hudCtx.beginPath();
    hudCtx.moveTo(centerX - 10, centerY);
    hudCtx.lineTo(centerX + 10, centerY);
    hudCtx.moveTo(centerX, centerY - 10);
    hudCtx.lineTo(centerX, centerY + 10);
    hudCtx.stroke();
    hudCtx.restore();

    // Бокові вертикальні лінії FPV-інтерфейсу
    hudCtx.save();
    hudCtx.strokeStyle = "#ccc";
    hudCtx.setLineDash([5, 5]);
    hudCtx.beginPath();
    // Ліва лінія
    hudCtx.moveTo(centerX - 200, 320);
    hudCtx.lineTo(centerX - 200, 600);
    // Права лінія
    hudCtx.moveTo(centerX + 200, 320);
    hudCtx.lineTo(centerX + 200, 600);
    hudCtx.stroke();
    hudCtx.restore();

    // Текстові елементи
    hudCtx.fillText("FPV ONLINE", 20, 30);
    hudCtx.fillText("HEIGHT: " + Math.round(cameraTarget.position.y.toFixed(1)) + "m", 20, 55);

    // Індикатор швидкості (обчислюємо швидкість як довжину velocity)
    const speed = velocity.length();
    hudCtx.fillText("SPEED: " + Math.round(speed.toFixed(2) * 150) + " m/s", 20, 80);
}

