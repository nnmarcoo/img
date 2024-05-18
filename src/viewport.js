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
  zoomTextSymbol.textContent = '%';

  img.element.onload = () => {
    centerImage();
    const zoom = getFitZoom();

    for (let i in zoomSteps)
      if (zoomSteps[i] >= zoom) { 
        zoomStep = clamp(i-1, 0, zoomSteps.length-1);
        break;
      }

    zoomCustom(zoomSteps[zoomStep]);
    
    gl.setTexture(img);
  };
}

export function init() {
  fillParent();
  gl.init();

  img.element.crossOrigin = 'anonymous';

  window.addEventListener('resize', fillParent);
  canvas.addEventListener('mousedown', mouseDown);
  document.addEventListener('mouseup', mouseUp);
  document.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('wheel', wheel);
  canvas.addEventListener('dblclick', centerImage);
  nextImage.addEventListener('click', cycleNextImage);
  prevImage.addEventListener('click', cyclePrevImage);

  zoomText.addEventListener('focus', focusZoomText);
  zoomText.addEventListener('blur', blurZoomText);
  zoomText.addEventListener('input', inputZoomText);
}

async function cycleNextImage() {
  if (img.element.src === '') return;
  setImage(await invoke('next_image'));
}

async function cyclePrevImage() {
  if (img.element.src === '') return;
  setImage(await invoke('prev_image'));
}

function wheel(e) {
  if (img.element.src === '') return;

  const prevW = img.width,
        prevH = img.height;

  if (e.deltaY < 0) // scroll up
    zoomIn(false);
  else
    zoomOut(false);

  const diffW = img.width - prevW,
        diffH = img.height - prevH,
        offsetX = (e.clientX - ( img.x + canvas.clientWidth/2)) * diffW / prevW,
        offsetY = (e.clientY - (-img.y + canvas.clientHeight/2)) * diffH / prevH;

  img.x = clampImageX(img.x - offsetX);
  img.y = clampImageY(img.y + offsetY);

  draw();
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
    draw();

  
  let newZoomStep = 0; // change this
    for (let i = 0; i < zoomSteps.length; i++)
      if (p >= zoomSteps[i])
        newZoomStep = i;
    zoomStep = newZoomStep;
  
   updateZoomText(p * 100);
}

function updateZoomText(text) {
    zoomText.textContent = text;
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

  draw();
}

function fillParent() {

  let ratio = (() => {
      let dpr = window.devicePixelRatio || 1,
          bsr = gl.webkitBackingStorePixelRatio ||
                gl.mozBackingStorePixelRatio ||
                gl.msBackingStorePixelRatio ||
                gl.oBackingStorePixelRatio ||
                gl.backingStorePixelRatio || 1;
      return dpr / bsr;
    })();

  let addX = canvas.parentElement.offsetWidth * ratio % 2 === 0 ? 1 : 0;
  let addY = canvas.parentElement.offsetHeight * ratio % 2 === 0 ? 1 : 0; // kinda jank?

  canvas.width = canvas.parentElement.offsetWidth * ratio + addX;
  canvas.height = canvas.parentElement.offsetHeight * ratio + addY;
  canvas.style.width = canvas.parentElement.offsetWidth + addX + 'px';
  canvas.style.height = canvas.parentElement.offsetHeight + addY + 'px';
  gl.fill();
  draw();
}

function getFitZoom() {
  const scaleW = canvas.clientWidth / img.element.naturalWidth,
        scaleH = canvas.clientHeight / img.element.naturalHeight;
  return Math.min(scaleW, scaleH);
}

function centerImage() {
  img.x = img.y = 0;
  draw();
}

function clampImageX(v) {
  const hW = img.width/2;
  return clamp(v, -hW, hW);
}
  
function clampImageY(v) {
  const hH = img.height/2
  return clamp(v, -hH, hH);
}

function draw() {
  gl.draw(img.x, img.y, img.width, img.height);
}

function inputZoomText() {
    let cleanText = zoomText.innerText.replace(/\D/g, '').slice(0, 4);
    if (cleanText !== zoomText.innerText)
      zoomText.blur();
    if (cleanText.length > 0) 
      updateZoomText(cleanText);
    else
      updateZoomText(zoomSteps[zoomStep] * 100);
    zoomCustom(zoomText.textContent / 100);
}

function focusZoomText() {
    let range = document.createRange();
    range.selectNodeContents(zoomText);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function blurZoomText() {
    window.getSelection().removeAllRanges();
}
