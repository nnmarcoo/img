export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getFolderAndName(src) {
  const parts = src.split('\\');
  const folder = parts[parts.length - 2];
  const file = parts[parts.length - 1];
  return folder + '\\' + file;
}

export const bicubicVertex = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const bicubicFragment = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_textureWidth;
uniform float u_textureHeight;
out vec4 FragColor;

vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0 / 6.0);
}

vec4 textureBicubic(sampler2D sampler, vec2 texCoords) {
    vec2 texSize = vec2(u_textureWidth, u_textureHeight);
    vec2 invTexSize = 1.0 / texSize;

    texCoords = texCoords * texSize - 0.5;

    vec2 fxy = fract(texCoords);
    texCoords -= fxy;

    vec4 xcubic = cubic(fxy.x);
    vec4 ycubic = cubic(fxy.y);

    vec4 c = texCoords.xxyy + vec2(-0.5, +1.5).xyxy;

    vec2 p0 = c.xy;
    vec2 p1 = c.zy;
    vec2 p2 = c.xw;
    vec2 p3 = c.zw;

    vec4 result = vec4(0.0);

    for (int i = -1; i <= 2; i++) {
        for (int j = -1; j <= 2; j++) {
            vec2 offset = vec2(float(i), float(j));
            vec2 coord = (texCoords + offset) * invTexSize;
            vec4 texColor = texture(sampler, coord);
            result += texColor * xcubic[i + 1] * ycubic[j + 1];
        }
    }
    return result;
}

void main() {
  FragColor = textureBicubic(u_texture, v_texCoord);
}`;
