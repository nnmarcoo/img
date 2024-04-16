const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;

// REMINDER: Remove dormant event handlers
// TODO: Minify with esbuild
// TODO: If mouse isn't in the image, zoom towards center?
// TODO: Scrolling over zoom text should care about margins?
// TODO: Handle multiple objects in viewport
// Should elements that are only referenced once not be saved as const?
// TODO: Loading bar when image is importing?
// TODO: Arrow key control next/prev image

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const img = document.getElementById('image');
  const fileSelect = document.getElementById('file-select');
  const viewport = document.getElementById('viewport');
  const zoomText = document.getElementById('zoom-text');
  const zoomTextSymbol = document.getElementById('zoom-text-symbol');
  const zoomTextGrid = document.getElementById('zoom-text-grid');
  const nextImage = document.getElementById('next-image');
  const prevImage = document.getElementById('prev-image');
  const fileSelectText = document.getElementById('file-select-text');
  const fileIcon = document.getElementById('file-icon');
  const imgTypes = await invoke('get_image_types');

  let prevX = 0, prevY = 0;
  let isDragging = false;

  const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                      0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                      2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                      10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
  let zoomStep = 0;

  let initPath = await invoke('get_image_path');
  if (initPath !== '')
    setImage(initPath);

  fileSelect.addEventListener('click', selectFile);
  img.style.imageRendering = 'pixelated';

  nextImage.addEventListener('click', async () => {
    if (img.src === '') return;
    setImage(await invoke('next_image'));
  });

  prevImage.addEventListener('click', async () => {
    if (img.src === '') return;
    setImage(await invoke('prev_image'));
  });

  viewport.addEventListener('wheel', (e) => {
    if (img.src === '') return;

    const prevWidth = img.clientWidth;
    const prevHeight = img.clientHeight;

    if (e.deltaY < 0) // scroll up
        var [newWidth, newHeight] = zoomIn();
    else
        var [newWidth, newHeight] = zoomOut();

    const marginLeft = parseInt(img.style.marginLeft) || 0;
    const marginTop = parseInt(img.style.marginTop) || 0;

    const dWidth = newWidth - prevWidth;
    const dHeight = newHeight - prevHeight;

    const offsetX = Math.round((e.clientX - img.offsetLeft) * dWidth / prevWidth);
    const offsetY = Math.round((e.clientY - img.offsetTop) * dHeight / prevHeight);

    img.style.marginLeft = clamp(marginLeft - offsetX, -img.clientWidth/2, img.clientWidth/2) + 'px'; // Could these be shortened
    img.style.marginTop = clamp(marginTop - offsetY, -img.clientHeight/2, img.clientHeight/2) + 'px';
  });

  await listen('tauri://file-drop', (e) => {
    let extension = e.payload[0].substring(e.payload[0].lastIndexOf('.') + 1); // better way?
    if (imgTypes.includes(extension))
      setImage(e.payload[0]);
  });

  document.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1 || !isDragging) return;
    if (document.body.style.cursor !== 'grabbing')
      document.body.style.cursor = 'grabbing';

    let newMarginLeft = (parseInt(img.style.marginLeft) || 0) + (e.clientX - prevX);
    let newMarginTop = (parseInt(img.style.marginTop) || 0) + (e.clientY - prevY);
  
    img.style.marginLeft = clamp(newMarginLeft, -img.clientWidth/2, img.clientWidth/2) + 'px';
    img.style.marginTop = clamp(newMarginTop, -img.clientHeight/2, img.clientHeight/2) + 'px';

    prevX = e.clientX;
    prevY = e.clientY;
});

  viewport.addEventListener('mousedown', (e) => {
    if (img.src === '' || e.buttons !== 1) return;
    prevX = e.clientX;
    prevY = e.clientY;
    isDragging = true;
  });

  document.addEventListener('mouseup', () => {
    if (img.src === '') return;
    document.body.style.cursor = 'default';
    isDragging = false;
  });

  viewport.addEventListener('dblclick', () => {
    center(img);
  });

  zoomTextGrid.addEventListener('wheel', (e) => { // Should I also set the margin?
    if (e.deltaY < 0) // scroll up
        zoomIn();
    else
        zoomOut();
  });

  zoomText.addEventListener('input', () => {
    let cleanText = zoomText.innerText.replace(/\D/g, '').slice(0, 4);
    if (cleanText !== zoomText.innerText)
      zoomText.blur();
    if (cleanText.length > 0) 
      updateZoomText(cleanText);
    else
      updateZoomText(zoomSteps[zoomStep] * 100);
    zoomCustom(zoomText.textContent / 100);
  });

  zoomText.addEventListener('focus', () => {
    let range = document.createRange();
    range.selectNodeContents(zoomText);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });

  zoomText.addEventListener('blur', () => {
    window.getSelection().removeAllRanges();
  });

  document.addEventListener('keydown', async (e) => {
    if (img.src === '') return;
    if (e.ctrlKey) {
      if (e.key === '=')
        zoomIn();
      else if (e.key === '-')
        zoomOut();
    }
    else if (e.key === 'z') {
      zoomText.blur();
      zoomText.focus();
      e.preventDefault();
    }
    else if (e.key === 'f')
      fitToViewport();
    else if (e.key === 'c')
      center(img);
    else if (e.key === 'ArrowRight')
      setImage(await invoke('next_image'))
    else if (e.key === 'ArrowLeft')
      setImage(await invoke('prev_image'))
  });

  document.addEventListener('mousedown', (e) => {
    if (e.button === 1) 
      toggleRenderMode();
  });

  img.addEventListener('load', () => {
    fileSelect.style.display = 'none';
    zoomTextSymbol.textContent = '%';
    fileSelect.removeEventListener('click', selectFile);
    initImage();
  });

  function setImage(file) {
    hide(img);
    fileSelect.style.display = 'flex';
    fileIcon.style.display = 'none';
    fileSelectText.textContent = 'Loading...';

    img.src = convertFileSrc(file);
    invoke('set_image_path', {path: file});
  }

  function initImage() {
    center(img);
    let zoom = getFitZoom();

    for (let i = 0; i < zoomSteps.length; i++) {
      if (zoomSteps[i] >= zoom) {
        zoomStep = clamp(i-1, 0, zoomSteps.length - 1);
        break;
      }
    }
    zoomCustom(zoomSteps[zoomStep]);
    updateZoomText(zoomSteps[zoomStep] * 100);
  }

  async function selectFile() {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: imgTypes
        }]
    })

    if (selected !== null)
      setImage(selected);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function hide(e) {
    e.style.width = '0px';
    e.style.height = '0px';
  }

  function center(e) {
    e.style.marginLeft = '0px';
    e.style.marginTop = '0px';
  }

  function fitToViewport() {
    let zoom = getFitZoom();
    center(img);
    zoomCustom(zoom);
    updateZoomText(Math.round(zoom * 100));
  }

  function getFitZoom() {
    let scaleWidth = viewport.clientWidth / img.naturalWidth;
    let scaleHeight = viewport.clientHeight / img.naturalHeight;
    return Math.min(scaleWidth, scaleHeight);
  }

  function updateZoomText(text) {
    zoomText.textContent = text;
  }

  function zoomIn() {
    zoomStep = Math.min(zoomStep + 1, zoomSteps.length - 1);
    zoomCustom(zoomSteps[zoomStep]);
    updateZoomText(zoomSteps[zoomStep] * 100);
    return [img.clientWidth, img.clientHeight];
  }

  function zoomOut() {
    zoomStep = Math.max(zoomStep - 1, 0);
    zoomCustom(zoomSteps[zoomStep]);
    updateZoomText(zoomSteps[zoomStep] * 100);
    return [img.clientWidth, img.clientHeight];
  }

  function zoomCustom(percent) {
    img.style.width = img.naturalWidth * percent + 'px';
    img.style.height = img.naturalHeight * percent + 'px';

    // This is stupid
    let newZoomStep = 0;
    for (let i = 0; i < zoomSteps.length; i++)
      if (percent >= zoomSteps[i])
        newZoomStep = i;
    zoomStep = newZoomStep;
  }

  function toggleRenderMode() {
    img.style.imageRendering =  img.style.imageRendering === 'pixelated' ? 'auto' : 'pixelated';
  }

});
