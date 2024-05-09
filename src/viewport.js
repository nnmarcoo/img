const { invoke, convertFileSrc} = window.__TAURI__.tauri;
import { bottomBarText, nextImage, prevImage, zoomText, zoomTextSymbol } from './elements.js';
import { clamp, getFolderAndName } from './util.js';
import { Filter } from './filter.js';
import { glc } from './gl.js';

const gl = new glc();

const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                    0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                    2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                    10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
let zoomStep = 0;

let img = {
  element: new Image(),
  width: 200,
  height: 200,
  x: 0,
  y: 0,
};

let mPrevX = 0,
    mPrevY = 0,
    isDragging = false;

export function setImage(src) {
  invoke('set_image_path', {path: src});
  img.element.src = convertFileSrc(src);
  img.element.onload = () => {
    // TODO
  };
}

export function init() {
  fillParent();
  gl.init();

  window.addEventListener('resize', fillParent);
  canvas.addEventListener('mousedown', mouseDown);
  document.addEventListener('mouseup', mouseUp);
  document.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('dblclick', centerImage);
}

function mouseDown(e) {
  if (img.element.src === '' || e.buttons !== 1) return;
  mPrevX = e.clientX;
  mPrevY = e.clientY;
  isDragging = true;
}

function mouseUp() {
  if (img.element.src === '') return;
  canvas.style.cursor = 'default';
  isDragging = false;
}

function mouseMove(e) {
  if (e.buttons !== 1 || !isDragging) return;
  canvas.style.cursor = 'grabbing';

  // TODO: Clamp
  img.x = clampImageX(img.x + (e.clientX - mPrevX));
  img.y = clampImageY(img.y - (e.clientY - mPrevY));

  mPrevX = e.clientX;
  mPrevY = e.clientY;

  gl.clipVertices(img.x, img.y, img.width, img.height);
}

function initImage() {
  centerImage();
  let zoom = getFitZoom();

  for (let i = 0; i < zoomSteps.length; i++)
    if (zoomSteps[i] >= zoom) {
      zoomStep = clamp(i-1, 0, zoomSteps.length-1);
      break;
    }
    // TODO: zoomCustom..
}

function fillParent() {
  // TODO: Fix device pixel ratio
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight;
  gl.fill();
  gl.clipVertices(img.x, img.y, img.width, img.height);
}

function getFitZoom() {
  const scaleW = canvas.width / img.element.naturalWidth,
      scaleH = canvas.height / img.element.naturalHeight;
  return Math.min(scaleW, scaleH);
}

function centerImage() {
  img.x = img.y = 0;
  gl.clipVertices(img.x, img.y, img.width, img.height);
}

function clampImageX(v) {
  const hW = img.width/2;
  return clamp(v, -hW, hW);
}
  
function clampImageY(v) {
  const hH = img.height/2
  return clamp(v, -hH, hH);
}
