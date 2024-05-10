export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getFolderAndName(src) {
  const parts = src.split('\\');
  const folder = parts[parts.length - 2];
  const file = parts[parts.length - 1];
  return folder + '\\' + file;
}

export const bicubicFragment = `#version 300 es
precision highp float;
out vec4 FragColor;
void main() {
    FragColor = vec4(0.25, 0.8, 0.9, 1.0);
}`;

export const bicubicVertex = `#version 300 es
precision highp float;
in vec2 coordinates;
void main() {
    gl_Position = vec4(coordinates, 0.0, 1.0);
}`;

export function binarySearch(arr, n) {
  let left = 0,
      right = numbers.length - 1,
      result = null;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] <= n)
      left = mid + 1;
    else {
      result = arr[mid];
      right = mid - 1;
    }
  }
  return result;
}
