const { invoke, convertFileSrc} = window.__TAURI__.tauri;
import { bottomBarText, nextImage, prevImage, zoomText, zoomTextSymbol } from './elements.js';
import { clamp, getFolderAndName } from './util.js';
import { Filter } from './filter.js';
import { glc } from './gl.js';

// TODO: save image data as normalized clip values

const gl = new glc();

const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                    0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                    2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                    10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
let zoomStep = 0;

let img = {
  element: new Image(),
  width: 0,
  height: 0,
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
    centerImage();
    const zoom = getFitZoom();

    // TODO: Set gl texture
    
    for (let i in zoomSteps)
      if (zoomSteps[i] >= zoom) { 
        zoomStep = clamp(i-1, 0, zoomSteps.length-1);
        break;
      }

    zoomCustom(zoomSteps[zoomStep]);
  };
}

export function init() {
  fillParent();
  gl.init();

  window.addEventListener('resize', fillParent);
  canvas.addEventListener('mousedown', mouseDown);
  document.addEventListener('mouseup', mouseUp);
  document.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('wheel', wheel);
  canvas.addEventListener('dblclick', centerImage);
}

function wheel(e) {
  if (img.element.src === '') return;

  const pW = img.width,
        pH = img.height;

  if (e.deltaY < 0) // scroll up
    zoomIn(false);
  else
    zoomOut(false);

  const dW = img.width - pW,
        dH = img.height - pH,
        offsetX = (e.clientX - (img.x + canvas.width/2)) * dW / pW,
        offsetY = (e.clientY - (img.y + canvas.height/2)) * dH / pH;

  img.x = clampImageX(img.x - offsetX);
  img.y = clampImageY(img.y + offsetY);

  gl.draw(img.x, img.y, img.width, img.height);
}

function zoomIn(render = true) {
  zoomStep = Math.min(zoomStep + 1, zoomSteps.length - 1);
  zoomCustom(zoomSteps[zoomStep], render);
}

function zoomOut(render = true) {
  zoomStep = Math.max(zoomStep - 1, 0);
  zoomCustom(zoomSteps[zoomStep], render);
}

function zoomCustom(p, render = true) {
  img.width = p * img.element.naturalWidth;
  img.height = p * img.element.naturalHeight;

  if (render)
    gl.draw(img.x, img.y, img.width, img.height);

  /*
  let newZoomStep = 0;
    for (let i = 0; i < zoomSteps.length; i++)
      if (p >= zoomSteps[i])
        newZoomStep = i;
    zoomStep = newZoomStep;
    */
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

  gl.draw(img.x, img.y, img.width, img.height);
}

function fillParent() {
  // TODO: Fix device pixel ratio
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight;
  gl.fill();
  gl.draw(img.x, img.y, img.width, img.height);
}

function getFitZoom() {
  const scaleW = canvas.width / img.element.naturalWidth,
      scaleH = canvas.height / img.element.naturalHeight;
  return Math.min(scaleW, scaleH);
}

function centerImage() {
  img.x = img.y = 0;
  gl.draw(img.x, img.y, img.width, img.height);
}

function clampImageX(v) {
  const hW = img.width/2;
  return clamp(v, -hW, hW);
}
  
function clampImageY(v) {
  const hH = img.height/2
  return clamp(v, -hH, hH);
}
