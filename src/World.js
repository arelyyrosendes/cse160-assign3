import { Mat4 } from "./math.js";
import { Cube } from "./Cube.js";

export class World {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;

    this.size = 32;
    this.maxH = 4;

    // 0..4 heights
    this.map = this.makeMap();

    // reusable cube
    this.cube = new Cube(gl, program);
  }

  makeMap() {
    const N = this.size;
    const map = Array.from({ length: N }, () => Array(N).fill(0));

    // Border walls
    for (let i = 0; i < N; i++) {
      map[0][i] = 4; map[N - 1][i] = 4;
      map[i][0] = 4; map[i][N - 1] = 4;
    }

    // Some corridors/rooms (hardcoded, editable)
    for (let x = 3; x < 29; x++) map[8][x] = 2;
    for (let z = 10; z < 27; z++) map[z][12] = 3;
    for (let x = 10; x < 22; x++) map[18][x] = 1;

    // Pillars
    map[16][16] = 4;
    map[20][20] = 3;
    map[6][24]  = 3;

    // A “gate”
    map[24][12] = 0;
    map[25][12] = 0;

    return map;
  }

  inBounds(x, z) {
    return x >= 0 && x < this.size && z >= 0 && z < this.size;
  }

  addBlock(x, z) {
    if (!this.inBounds(x, z)) return;
    this.map[z][x] = Math.min(this.maxH, this.map[z][x] + 1);
  }

  removeBlock(x, z) {
    if (!this.inBounds(x, z)) return;
    this.map[z][x] = Math.max(0, this.map[z][x] - 1);
  }

  drawGround() {
    const c = this.cube;

    c.model = new Mat4()
      .translate(this.size / 2, -0.55, this.size / 2)
      .scale(this.size, 0.1, this.size);

    c.baseColor = [1, 1, 1, 1];
    c.texWeight = 1.0;
    c.whichTex = 0; // ✅ dirt texture (minecraft-dirt.png)
    c.render();
  }

  drawSky() {
    const c = this.cube;

    c.model = new Mat4()
      .translate(this.size / 2, this.size / 2, this.size / 2)
      .scale(200, 200, 200);

    c.baseColor = [0.35, 0.55, 0.95, 1.0];
    c.texWeight = 0.0; // ✅ solid color sky
    c.whichTex = 0;
    c.render();
  }

  drawWalls() {
    const c = this.cube;

    for (let z = 0; z < this.size; z++) {
      for (let x = 0; x < this.size; x++) {
        const h = this.map[z][x];
        if (h <= 0) continue;

        for (let y = 0; y < h; y++) {
          c.model = new Mat4().translate(x + 0.5, y + 0.0, z + 0.5);

          c.baseColor = [1, 1, 1, 1];
          c.texWeight = 1.0;
          c.whichTex = 1; // ✅ wall texture (wall.png)
          c.render();
        }
      }
    }
  }

  render() {
    this.drawSky();
    this.drawGround();
    this.drawWalls();
  }
}