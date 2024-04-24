import { ctx, zoomText, zoomTextSymbol } from './main.js';
import { clamp } from './util.js';

let centerX = 0;
let centerY = 0;

let img = new Image();
let imgX = 0;
let imgY = 0;
let imgW = 0;
let imgH = 0;

const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                    0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                    2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                    10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
let zoomStep = 0;

let mPrevX = 0;
let mPrevY = 0;
let isDragging = false;

export function fillParent() {
    let ratio = (() => {
      let dpr = window.devicePixelRatio || 1,
          bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;
      return dpr / bsr;
    })();

    canvas.width = canvas.parentElement.offsetWidth * ratio;
    canvas.height = canvas.parentElement.offsetHeight * ratio;
    canvas.style.width = canvas.parentElement.offsetWidth + 'px';
    canvas.style.height = canvas.parentElement.offsetHeight + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    setCenter();
    draw();
}

export function init() {
    fillParent();
    renderFileSelect();

    canvas.addEventListener('mousedown', mouseDown);
    document.addEventListener('mouseup', mouseUp);
    document.addEventListener('mousemove', mouseMove);
    canvas.addEventListener('wheel', wheel);
    window.addEventListener('resize', fillParent);

    zoomText.addEventListener('focus', focusZoomText);
    zoomText.addEventListener('blur', blurZoomText);
    zoomText.addEventListener('input', inputZoomText);
}

export function setImage(src) {
    renderLoading();
    img.src = src;
    zoomTextSymbol.textContent = '%';

    img.onload = () => {
        clearImage();
        initImage();
    }
}

function initImage() {
    centerImage();
    let zoom = getFitZoom();

    for (let i = 0; i < zoomSteps.length; i++) {
        if (zoomSteps[i] >= zoom) {
            zoomStep = clamp(i-1, 0, zoomSteps.length-1);
            break;
        }
    }
    zoomCustom(zoomSteps[zoomStep]);
}

function draw() {
    if (img.src === '') {
        renderFileSelect();
        return;
    }
    ctx.drawImage(img, Math.floor(centerX + imgX - imgW/2),
                       Math.floor(centerY + imgY - imgH/2),
                       Math.floor(imgW), Math.floor(imgH));
}

function zoomCustom(p, render = true) {
    imgW = p * img.naturalWidth;
    imgH = p * img.naturalHeight;

    if (render) {
        clearImage();
        draw();
    }

    let newZoomStep = 0;
    for (let i = 0; i < zoomSteps.length; i++)
      if (p >= zoomSteps[i])
        newZoomStep = i;
    zoomStep = newZoomStep;

    updateZoomText(p * 100);
}

function zoomIn(render = true) {
    zoomStep = Math.min(zoomStep + 1, zoomSteps.length - 1);
    zoomCustom(zoomSteps[zoomStep], render);
}

function zoomOut(render = true) {
    zoomStep = Math.max(zoomStep - 1, 0);
    zoomCustom(zoomSteps[zoomStep], render);
}

function centerImage() {
    imgX = 0;
    imgY = 0;
}

function getFitZoom() {
    let scaleW = canvas.clientWidth / img.naturalWidth,
        scaleH = canvas.clientHeight / img.naturalHeight;
    return Math.min(scaleW, scaleH);
}

function setCenter() {
    centerX = canvas.clientWidth/2;
    centerY = canvas.clientHeight/2;
}

function renderFileSelect() {
    canvas.style.cursor = 'pointer';
    ctx.fillStyle = '#EEEEEE';
    ctx.textAlign = 'center';
    // Draw icon
    ctx.font = '80px Trebuchet MS';
    ctx.fillText('🗎', canvas.clientWidth/2, canvas.clientHeight/2 + 14);
    // Draw text
    ctx.font = '16px Trebuchet MS';
    ctx.fillText('Drag or select file to begin', canvas.clientWidth/2, canvas.clientHeight/2 + 41);
}

function renderLoading() {
    canvas.style.cursor = 'default';
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillText('Loading...', canvas.clientWidth/2, canvas.clientHeight/2 + 8);
}


function clearImage() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

export function mouseDown(e) {
    if (img.src === '' || e.buttons !== 1) return;
    mPrevX = e.clientX;
    mPrevY = e.clientY;
    isDragging = true;
}

export function mouseUp() {
    if (img.src === '') return;
    canvas.style.cursor = 'default';
    isDragging = false;
}

export function mouseMove(e) {
    if (e.buttons !== 1 || !isDragging) return;
    if (canvas.style.cursor !== 'grabbing')
        canvas.style.cursor = 'grabbing';

    clearImage();

    imgX = clampImageX(imgX + (e.clientX - mPrevX));
    imgY = clampImageY(imgY + (e.clientY - mPrevY));

    mPrevX = e.clientX;
    mPrevY = e.clientY;

    draw();
      
}

export function wheel(e) {
    if (img.src === '') return;
    clearImage();

    const pW = imgW;
    const pH = imgH;

    if (e.deltaY < 0) // scroll up
      zoomIn(false);
    else
      zoomOut(false);

    const dW = imgW - pW;
    const dH = imgH - pH;

    const offsetX = (e.clientX - (imgX + canvas.clientWidth/2)) * dW / pW;
    const offsetY = (e.clientY - (imgY + canvas.clientHeight/2)) * dH / pH;

    imgX = clampImageX(imgX - offsetX);
    imgY = clampImageY(imgY - offsetY);

    draw();
}


function clampImageX(v) {
  let hW = imgW/2;
  return clamp(v, -hW, hW);
}
  
function clampImageY(v) {
    let hH = imgH/2
    return clamp(v, -hH, hH);
}

function updateZoomText(text) {
    zoomText.textContent = text;
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