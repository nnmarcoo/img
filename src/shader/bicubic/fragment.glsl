#version 300 es
precision highp float;
 
in vec2 v_texcoord;
 
uniform sampler2D texture;
 
out vec4 outColor;
 
void main() {
   outColor = texture(texture, v_texcoord);
}