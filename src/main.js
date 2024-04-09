const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;

// REMINDER: Remove dormant event handlers
// TODO: Minify with esbuild
// TODO: Initializing image size doesn't quite work

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const img = document.getElementById('image');
  const fileSelect = document.getElementById('file-select');
  const viewport = document.getElementById('viewport');
  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];

  let prevX = 0, prevY = 0;
  let isDragging = false;

  const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                      0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                      2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                      10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
  let zoomStep = 0;

  fileSelect.addEventListener('click', selectFile);

  function initImageSize() {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    center(img);

    if (img.naturalWidth > img.naturalHeight) {
      initZoom(img.naturalWidth, viewport.clientWidth);
      img.style.width = img.naturalWidth * zoomSteps[zoomStep] + 'px';
      img.style.height = img.clientWidth / aspectRatio + 'px';
    }
    else {
      initZoom(img.naturalHeight, viewport.clientHeight);
      img.style.height = img.naturalHeight * zoomSteps[zoomStep] + 'px';
      img.style.width = img.clientHeight * aspectRatio + 'px';
    }
  }

  function setImage(file) {
    hide(img);
    if (img.src === '')
      fileSelect.style.display = 'none';

    img.src = convertFileSrc(file);
    invoke('set_image_path', {path: file});  
  }

  img.onload = () => {
    initImageSize();
  }

  async function selectFile() {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: imgTypes
        }]
    })

    if (selected !== null) {
      setImage(selected);
      fileSelect.removeEventListener('click', selectFile);
    }
  }

  viewport.addEventListener('wheel', (e) => {
    if (e.deltaY < 0) // scroll up
        zoomStep = Math.min(zoomStep + 1, zoomSteps.length - 1);
    else
        zoomStep = Math.max(zoomStep - 1, 0);

    let marginLeft = parseInt(img.style.marginLeft) || 0;
    let marginTop = parseInt(img.style.marginTop) || 0;

    let width = img.naturalWidth * zoomSteps[zoomStep];
    let height = img.naturalHeight * zoomSteps[zoomStep];

    let dWidth = width - img.clientWidth;
    let dHeight = height - img.clientHeight;

    let offsetX = Math.round((e.clientX - img.offsetLeft) * dWidth / img.clientWidth);
    let offsetY = Math.round((e.clientY - img.offsetTop) * dHeight / img.clientHeight);

    img.style.width =  width + 'px';
    img.style.height =  height + 'px';

    img.style.marginLeft = clamp(marginLeft - offsetX, -img.clientWidth/2, img.clientWidth/2) + 'px';
    img.style.marginTop = clamp(marginTop - offsetY, -img.clientHeight/2, img.clientHeight/2) + 'px';
});

  await listen('tauri://file-drop', (e) => {
    let extension = e.payload[0].substring(e.payload[0].lastIndexOf('.') + 1);
    if (imgTypes.includes(extension))
      setImage(e.payload[0]);
  });

  document.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1 || !isDragging) return;

    let marginLeft = parseInt(img.style.marginLeft) || 0;
    let marginTop = parseInt(img.style.marginTop) || 0;

    let newMarginLeft = marginLeft + (e.clientX - prevX);
    let newMarginTop = marginTop + (e.clientY - prevY);
  
    img.style.marginLeft = clamp(newMarginLeft, -img.clientWidth/2, img.clientWidth/2) + 'px';
    img.style.marginTop = clamp(newMarginTop, -img.clientHeight/2, img.clientHeight/2) + 'px';

    prevX = e.clientX;
    prevY = e.clientY;
});

  viewport.addEventListener('mousedown', (e) => {
    if (img.src === '' || e.buttons !== 1) return;
    document.body.style.cursor = 'grabbing';
    prevX = e.clientX;
    prevY = e.clientY;
    isDragging = true;
  });

  document.addEventListener('mouseup', () => {
    if (img.src === '') return;
    document.body.style.cursor = 'default';
    isDragging = false;
  });

  function initZoom(imgLength, viewportLength) {
    for (let i = 0; i < zoomSteps.length; i++)
      if (imgLength * zoomSteps[i] > viewportLength * .8) {
        zoomStep = clamp(i-1, 0, zoomSteps.length - 1);
        return;
      }
  }

  function hide(e) {
    e.style.width = '0px';
    e.style.height = '0px';
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function center(e) {
    e.style.marginLeft = '0px';
    e.style.marginTop = '0px';
  }

});
