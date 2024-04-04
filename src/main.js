const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { convertFileSrc } = window.__TAURI__.tauri;

// REMINDER: Remove dormant event handlers
// TODO: minify with esbuild

document.addEventListener('DOMContentLoaded', () => {
  invoke('show_window');

  const img = document.getElementById('image');
  const fileSelect = document.getElementById('file-select');
  const viewport = document.getElementById('viewport');
  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];
  const initSize = .6;

  let prevX = 0, prevY = 0;
  let isDragging = false;

  let zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                    0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                    2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                    10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
  let zoomStep = 0;

  fileSelect.addEventListener('click', selectFile);

  function initImageSize() {
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    if (img.naturalWidth > img.naturalHeight) {
      img.style.width = setAndRound(viewport.clientWidth, img.naturalWidth) + 'px';
      img.style.height = img.clientWidth / aspectRatio + 'px';
    }
    else {
      img.style.height = setAndRound(viewport.clientHeight, img.naturalHeight) + 'px';
      img.style.width = img.clientHeight * aspectRatio + 'px';
    }
  }

  function setImage(file) {
    hide(img);
    if (img.src === '')
      fileSelect.style.display = 'none';
    if (typeof file === 'string') {
      img.src = convertFileSrc(file);
    }
    else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      }
      reader.readAsDataURL(file);
    }

    img.onload = () => {
      initImageSize();
    }
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

    img.style.width = img.naturalWidth * zoomSteps[zoomStep] + 'px';
    img.style.height = img.naturalHeight * zoomSteps[zoomStep] + 'px';
  });

  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (imgTypes.includes(files[0].type.substring(6)))
      setImage(files[0]);
  });

  document.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1 || !isDragging) return;

    let marginTop = parseInt(img.style.marginTop) || 0;
    let marginLeft = parseInt(img.style.marginLeft) || 0;

    let newMarginTop = marginTop + 2*(e.clientY - prevY);
    let newMarginLeft = marginLeft + 2*(e.clientX - prevX);

    let clampedNewMarginTop = clamp(newMarginTop, -img.height, img.height);
    let clampedNewMarginLeft = clamp(newMarginLeft, -img.width, img.width);

    img.style.marginTop = clampedNewMarginTop + 'px';
    img.style.marginLeft = clampedNewMarginLeft + 'px';

    prevX = e.clientX;
    prevY = e.clientY;
});

  viewport.addEventListener('mousedown', (e) => {
    if (img.src === '') return;
    if (e.buttons !== 1) return; // Is there a better solution?
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

  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  viewport.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  function setAndRound(n1, n2) {
    let size = initSize * n1;
    let rounded = Math.round(size / (.05 * n2));
    return rounded * (.05 * n2);
  }

  function hide(e) {
    e.style.width = '0px';
    e.style.height = '0px';
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

});
