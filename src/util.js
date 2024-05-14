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

vec4 cubic(float v){
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);
}

vec4 textureBicubic(sampler2D sampler, vec2 texCoords){
   vec2 texSize = vec2(u_textureWidth, u_textureHeight);
   vec2 invTexSize = 1.0 / texSize;
   
   texCoords = texCoords * texSize - 0.5;

   vec2 fxy = fract(texCoords);
   texCoords -= fxy;

   vec4 xcubic = cubic(fxy.x);
   vec4 ycubic = cubic(fxy.y);

   vec4 c = texCoords.xxyy + vec2 (-0.5, +1.5).xyxy;
    
   vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
   vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
    
   offset *= invTexSize.xxyy;
    
   vec4 sample0 = texture(sampler, offset.xz);
   vec4 sample1 = texture(sampler, offset.yz);
   vec4 sample2 = texture(sampler, offset.xw);
   vec4 sample3 = texture(sampler, offset.yw);

   float sx = s.x / (s.x + s.y);
   float sy = s.z / (s.z + s.w);

   return mix(
       mix(sample3, sample2, sx), mix(sample1, sample0, sx)
    , sy);
}

void main() {
  FragColor = textureBicubic(u_texture, v_texCoord);
}`;
