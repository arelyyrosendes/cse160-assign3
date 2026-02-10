import { Mat4 } from "./math.js";

export class Cube {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;

    this.model = new Mat4();
    this.baseColor = [1,1,1,1];
    this.texWeight = 1.0;
    this.whichTex = 0;

    if (!Cube._buffer) Cube._initShared(gl, program);
  }

  static _initShared(gl, program) {
    // position xyz + uv
    const v = new Float32Array([
      // +Z (front)
      -0.5,-0.5, 0.5,  0,0,   0.5,-0.5, 0.5,  1,0,   0.5, 0.5, 0.5,  1,1,
      -0.5,-0.5, 0.5,  0,0,   0.5, 0.5, 0.5,  1,1,  -0.5, 0.5, 0.5,  0,1,
      // -Z (back)
       0.5,-0.5,-0.5,  0,0,  -0.5,-0.5,-0.5,  1,0,  -0.5, 0.5,-0.5,  1,1,
       0.5,-0.5,-0.5,  0,0,  -0.5, 0.5,-0.5,  1,1,   0.5, 0.5,-0.5,  0,1,
      // +X (right)
       0.5,-0.5, 0.5,  0,0,   0.5,-0.5,-0.5,  1,0,   0.5, 0.5,-0.5,  1,1,
       0.5,-0.5, 0.5,  0,0,   0.5, 0.5,-0.5,  1,1,   0.5, 0.5, 0.5,  0,1,
      // -X (left)
      -0.5,-0.5,-0.5,  0,0,  -0.5,-0.5, 0.5,  1,0,  -0.5, 0.5, 0.5,  1,1,
      -0.5,-0.5,-0.5,  0,0,  -0.5, 0.5, 0.5,  1,1,  -0.5, 0.5,-0.5,  0,1,
      // +Y (top)
      -0.5, 0.5, 0.5,  0,0,   0.5, 0.5, 0.5,  1,0,   0.5, 0.5,-0.5,  1,1,
      -0.5, 0.5, 0.5,  0,0,   0.5, 0.5,-0.5,  1,1,  -0.5, 0.5,-0.5,  0,1,
      // -Y (bottom)
      -0.5,-0.5,-0.5,  0,0,   0.5,-0.5,-0.5,  1,0,   0.5,-0.5, 0.5,  1,1,
      -0.5,-0.5,-0.5,  0,0,   0.5,-0.5, 0.5,  1,1,  -0.5,-0.5, 0.5,  0,1,
    ]);

    Cube._count = 36;

    Cube._buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

    Cube._aPos = gl.getAttribLocation(program, "a_Position");
    Cube._aUV  = gl.getAttribLocation(program, "a_UV");

    Cube._uModel = gl.getUniformLocation(program, "u_ModelMatrix");
    Cube._uBase  = gl.getUniformLocation(program, "u_BaseColor");
    Cube._uW     = gl.getUniformLocation(program, "u_TexColorWeight");
    Cube._uWhich = gl.getUniformLocation(program, "u_WhichTexture");
  }

  render() {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._buffer);
    const stride = 5 * 4;

    gl.vertexAttribPointer(Cube._aPos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(Cube._aPos);

    gl.vertexAttribPointer(Cube._aUV, 2, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(Cube._aUV);

    gl.uniformMatrix4fv(Cube._uModel, false, this.model.m);
    gl.uniform4f(Cube._uBase, ...this.baseColor);
    gl.uniform1f(Cube._uW, this.texWeight);
    gl.uniform1i(Cube._uWhich, this.whichTex);

    gl.drawArrays(gl.TRIANGLES, 0, Cube._count);
  }
}
