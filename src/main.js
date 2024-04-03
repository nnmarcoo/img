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

    let current = img.clientWidth / img.naturalWidth;
    let mult = 0;

    if (current <= .2) // TODO: Change
      mult = .05;
    else if (current <= 1)
      mult = .1;
    else if (current <= 2)
      mult = .25;
    else if (current <= 4)
      mult = .5;
    else if (current <= 8)
      mult = 1;
    else if (current <= 12)
      mult = 2;
    else if (current <= 21)
      mult = 3;
    else if (current <= 25)
      mult = 4;
    else
      mult = 5;

    let distX = img.naturalWidth * mult;
    let distY = img.naturalHeight * mult;

    if (e.deltaY < 0) { // up
    if ((img.clientWidth + distX) / img.naturalWidth > 40) return;
      img.style.width = img.clientWidth + distX + 'px';
      img.style.height = img.clientHeight + distY + 'px';
    }
    else { // down
    if ((img.clientWidth - distX) / img.naturalWidth < .05) return;
      img.style.width = img.clientWidth - distX + 'px';
      img.style.height = img.clientHeight - distY + 'px';
    }
    console.log(img.clientWidth / img.naturalWidth * 100);
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
