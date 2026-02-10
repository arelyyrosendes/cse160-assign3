export const VSHADER = `
attribute vec3 a_Position;
attribute vec2 a_UV;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec2 v_UV;

void main() {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);
  v_UV = a_UV;
}
`;

export const FSHADER = `
precision mediump float;

varying vec2 v_UV;

uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform int u_WhichTexture;

uniform vec4 u_BaseColor;
uniform float u_TexColorWeight;

void main() {
  vec4 texColor = vec4(1.0);
  if (u_WhichTexture == 0) texColor = texture2D(u_Sampler0, v_UV);
  else if (u_WhichTexture == 1) texColor = texture2D(u_Sampler1, v_UV);

  gl_FragColor = (1.0 - u_TexColorWeight) * u_BaseColor + u_TexColorWeight * texColor;
}
`;
