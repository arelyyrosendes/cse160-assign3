import { Mat4 } from "./math.js";
import { Cube } from "./Cube.js";

export class World {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;

    this.size = 32;
    this.maxH = 4;

    // world map: 0..4 wall heights
    this.map = this.makeMap();

    // reusable cube
    this.cube = new Cube(gl, program);

    // performance: prebuild list of blocks (x,y,z)
    this.blocks = [];
    this.rebuildBlocks();

    // story/game: relics + portal
    this.relics = this.makeRelics(); // array of {x,z,collected}
    this.relicsTotal = this.relics.length;
    this.relicsCollected = 0;

    this.portal = { x: 27, z: 27 }; // exit tile
    this.hasWon = false;

    this._message = "Collect all relics, then reach the portal (glowing tile).";
    this._messageUntil = 0;

    // performance culling radius (in tiles)
    this.cullRadius = 14; // draw only nearby blocks (fast)
  }

  getMessage() {
    if (performance.now() < this._messageUntil) return this._message;
    return this.hasWon ? "✅ You escaped! (Refresh to play again)" : "";
  }

  toast(msg, ms = 2200) {
    this._message = msg;
    this._messageUntil = performance.now() + ms;
  }

  makeMap() {
    const N = this.size;
    const map = Array.from({ length: N }, () => Array(N).fill(0));

    // Border walls (height 4)
    for (let i = 0; i < N; i++) {
      map[0][i] = 4; map[N - 1][i] = 4;
      map[i][0] = 4; map[i][N - 1] = 4;
    }

    // Some corridors/rooms (editable)
    for (let x = 3; x < 29; x++) map[8][x] = 2;
    for (let z = 10; z < 27; z++) map[z][12] = 3;
    for (let x = 10; x < 22; x++) map[18][x] = 1;

    // Pillars
    map[16][16] = 4;
    map[20][20] = 3;
    map[6][24] = 3;

    // gate opening
    map[24][12] = 0;
    map[25][12] = 0;

    // keep portal area open-ish
    map[27][27] = 0;
    map[27][26] = 0;
    map[26][27] = 0;

    return map;
  }

  makeRelics() {
    // fixed positions (easy to grade + consistent)
    return [
      { x: 6, z: 6, collected: false },
      { x: 24, z: 6, collected: false },
      { x: 6, z: 24, collected: false },
      { x: 20, z: 16, collected: false },
      { x: 26, z: 22, collected: false },
    ].filter(r => this.inBounds(r.x, r.z));
  }

  inBounds(x, z) {
    return x >= 0 && x < this.size && z >= 0 && z < this.size;
  }

  rebuildBlocks() {
    // build block list from map once (and only rebuild when map changes)
    this.blocks.length = 0;
    for (let z = 0; z < this.size; z++) {
      for (let x = 0; x < this.size; x++) {
        const h = this.map[z][x];
        for (let y = 0; y < h; y++) {
          this.blocks.push({ x, y, z });
        }
      }
    }
  }

  addBlock(x, z) {
    if (!this.inBounds(x, z)) return;
    this.map[z][x] = Math.min(this.maxH, this.map[z][x] + 1);
    this.rebuildBlocks();
  }

  removeBlock(x, z) {
    if (!this.inBounds(x, z)) return;
    this.map[z][x] = Math.max(0, this.map[z][x] - 1);
    this.rebuildBlocks();
  }

  // ----- Story/game update -----
  updateGame(camera, nowMs) {
    if (this.hasWon) return;

    // TILE-BASED player position (robust + matches voxel world)
    const cellX = Math.floor(camera.eye.x);
    const cellZ = Math.floor(camera.eye.z);

    // collect relics when standing on their tile
    for (const r of this.relics) {
      if (r.collected) continue;

      if (cellX === r.x && cellZ === r.z) {
        r.collected = true;
        this.relicsCollected++;
        this.toast(`✨ Relic collected! (${this.relicsCollected}/${this.relicsTotal})`);

        if (this.relicsCollected === this.relicsTotal) {
          this.toast("🌀 All relics collected! Go to the portal to escape!", 3500);
        }
      }
    }

    // win condition: stand on portal tile after collecting all relics
    if (
      this.relicsCollected === this.relicsTotal &&
      cellX === this.portal.x &&
      cellZ === this.portal.z
    ) {
      this.hasWon = true;
      this.toast("✅ You escaped! Nice.", 6000);
    }
  }

  // ----- Rendering helpers -----
  drawGround() {
    const c = this.cube;

    c.model = new Mat4()
      .translate(this.size / 2, -0.55, this.size / 2)
      .scale(this.size, 0.1, this.size);

    c.baseColor = [1, 1, 1, 1];
    c.texWeight = 1.0;
    c.whichTex = 0; // dirt texture (minecraft-dirt.png)
    c.render();
  }

  drawSky() {
    const c = this.cube;

    c.model = new Mat4()
      .translate(this.size / 2, this.size / 2, this.size / 2)
      .scale(200, 200, 200);

    c.baseColor = [0.35, 0.55, 0.95, 1.0];
    c.texWeight = 0.0; // solid color sky
    c.whichTex = 0;
    c.render();
  }

  drawPortal(nowMs) {
    const c = this.cube;

    // pulsing color
    const t = nowMs * 0.003;
    const pulse = 0.5 + 0.5 * Math.sin(t);

    c.model = new Mat4().translate(this.portal.x + 0.5, 0.0, this.portal.z + 0.5);

    // portal uses color blending (wow)
    c.whichTex = 1; // wall texture underneath
    c.baseColor = [0.2, 1.0, 0.9, 1.0];
    c.texWeight = 0.35 + 0.35 * pulse; // mixed texture + glow color
    c.render();
  }

  drawRelics(nowMs) {
    // render as small glowing cubes you can find
    const c = this.cube;
    const t = nowMs * 0.004;
    const bob = 0.08 * Math.sin(t);

    for (const r of this.relics) {
      if (r.collected) continue;

      c.model = new Mat4()
        .translate(r.x + 0.5, 0.35 + bob, r.z + 0.5)
        .scale(0.45, 0.45, 0.45);

      c.whichTex = 0; // dirt tex
      c.baseColor = [1.0, 0.9, 0.25, 1.0];
      c.texWeight = 0.15; // mostly color (gold) with a tiny texture hint
      c.render();
    }
  }

  drawWallsCulled(camera) {
    const c = this.cube;

    // draw only nearby blocks for performance
    const cx = camera.eye.x;
    const cz = camera.eye.z;
    const r = this.cullRadius;
    const r2 = r * r;

    for (const b of this.blocks) {
      const dx = (b.x + 0.5) - cx;
      const dz = (b.z + 0.5) - cz;
      if ((dx * dx + dz * dz) > r2) continue;

      c.model = new Mat4().translate(b.x + 0.5, b.y + 0.0, b.z + 0.5);
      c.baseColor = [1, 1, 1, 1];
      c.texWeight = 1.0;
      c.whichTex = 1; // wall texture (wall.png)
      c.render();
    }
  }

  render(camera, nowMs) {
    // order: sky, ground, walls, relics/portal (game)
    this.drawSky();
    this.drawGround();
    this.drawWallsCulled(camera);

    this.drawRelics(nowMs);

    if (!this.hasWon) this.drawPortal(nowMs);

    // When won, make portal brighter
    if (this.hasWon) {
      const c = this.cube;
      c.model = new Mat4().translate(this.portal.x + 0.5, 0.0, this.portal.z + 0.5);
      c.whichTex = 1;
      c.baseColor = [0.9, 1.0, 0.2, 1.0];
      c.texWeight = 0.55;
      c.render();
    }
  }
}

/*
========================================================
STORY / GAME DESCRIPTION (CSE 160 – Voxel World)

In this project, the player is placed inside a 32x32
voxel-based maze world. The goal is to explore the world
and collect a set of hidden relics scattered throughout
the map.

Each relic is represented as a small glowing cube that
is collected by walking onto its tile. The player’s
progress is displayed on the on-screen HUD.

Once all relics have been collected, a portal becomes
the escape point. The player must navigate to the portal
to win, creating a simple exploration game with a clear
objective and win condition.
========================================================
*/
