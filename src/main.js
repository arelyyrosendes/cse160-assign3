import { VSHADER, FSHADER } from "./shaders.js";
import { Camera } from "./Camera.js";
import { World } from "./World.js";

const canvas = document.getElementById("webgl");
const gl = canvas.getContext("webgl");
if (!gl) throw new Error("WebGL not supported");

// HUD elements
const hudPos = document.getElementById("hudPos");
const hudFPS = document.getElementById("hudFPS");
const hudRelics = document.getElementById("hudRelics");
const hudMsg = document.getElementById("hudMsg");

// ---------- Shader compile/link ----------
function compile(type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || "Shader compile error");
  }
  return s;
}

function createProgram(vsSrc, fsSrc) {
  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "Program link error");
  }
  return p;
}

const program = createProgram(VSHADER, FSHADER);
gl.useProgram(program);

// uniforms
const u_View = gl.getUniformLocation(program, "u_ViewMatrix");
const u_Proj = gl.getUniformLocation(program, "u_ProjectionMatrix");
const u_Sampler0 = gl.getUniformLocation(program, "u_Sampler0");
const u_Sampler1 = gl.getUniformLocation(program, "u_Sampler1");

// ---------- GL state ----------
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);

// ---------- Camera + World ----------
const camera = new Camera(canvas);
const world = new World(gl, program);

// ---------- Texture loading (FROM FILESYSTEM) ----------
function initTextures() {
  const tex0 = gl.createTexture();
  const tex1 = gl.createTexture();

  const img0 = new Image();
  const img1 = new Image();

  let loaded = 0;
  const checkDone = () => {
    loaded++;
    if (loaded === 2) {
      gl.uniform1i(u_Sampler0, 0);
      gl.uniform1i(u_Sampler1, 1);
      requestAnimationFrame(tick);
    }
  };

  img0.onload = () => { loadTexture(tex0, img0, 0); checkDone(); };
  img1.onload = () => { loadTexture(tex1, img1, 1); checkDone(); };

  img0.src = "assets/minecraft-dirt.png"; // unit 0
  img1.src = "assets/wall.png";          // unit 1
}

function loadTexture(texture, image, unit) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

// ---------- Controls ----------
const keys = new Set();

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);

  // Minecraft add/remove
  if (k === "f") {
    const { x, z } = camera.cellInFront(1.2);
    world.addBlock(x, z);
  }
  if (k === "r") {
    const { x, z } = camera.cellInFront(1.2);
    world.removeBlock(x, z);
  }
});

document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

// Pointer lock mouse look
canvas.addEventListener("click", () => canvas.requestPointerLock());
document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== canvas) return;
  camera.look(e.movementX, e.movementY);
});

function handleKeys() {
  if (keys.has("w")) camera.moveForward();
  if (keys.has("s")) camera.moveBack();
  if (keys.has("a")) camera.moveLeft();
  if (keys.has("d")) camera.moveRight();
  if (keys.has("q")) camera.panLeft();
  if (keys.has("e")) camera.panRight();
}

// ---------- FPS calc ----------
let lastT = performance.now();
let fpsSMA = 60;

function updateHUD(dt) {
  const e = camera.eye;

  hudPos.textContent = `pos: (${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`;

  const fps = 1 / Math.max(1e-6, dt);
  fpsSMA = fpsSMA * 0.9 + fps * 0.1;
  hudFPS.textContent = `fps: ${fpsSMA.toFixed(0)}`;

  hudRelics.textContent = `relics: ${world.relicsCollected}/${world.relicsTotal}`;

  const msg = world.getMessage();
  hudMsg.textContent = msg || "";
}

// ---------- Render loop ----------
function tick(now) {
  const dt = (now - lastT) / 1000;
  lastT = now;

  handleKeys();
  camera.updateView();

  // game logic (story)
  world.updateGame(camera, now);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_View, false, camera.view.m);
  gl.uniformMatrix4fv(u_Proj, false, camera.proj.m);

  // render with performance culling
  world.render(camera, now);

  updateHUD(dt);

  requestAnimationFrame(tick);
}

// Start by loading textures
initTextures();
