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
      let w6 = initSize * viewport.clientWidth;
      let nmw = Math.round(w6 / (.05 * img.naturalWidth));
      img.style.width = nmw * (.05 * img.naturalWidth) + 'px';
      img.style.height = img.clientWidth / aspectRatio + 'px';
    }
    else {
      let h6 = initSize * viewport.clientHeight;
      let nmh = Math.round(h6 / (.05 * img.naturalHeight));
      img.style.height = nmh * (0.05 * img.naturalHeight) + 'px';
      img.style.width = img.clientHeight * aspectRatio + 'px';
    }
  }

  function setImage(file) {
    img.style.width = '0px';
    img.style.height = '0px';
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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  viewport.addEventListener('wheel', (e) => {
    // TODO: Implement
    //img.style.width = img.clientWidth * 1.1 + 'px';
    //img.style.height = img.clientHeight * 1.1 + 'px';
    console.log(Math.round((img.clientWidth / img.naturalWidth) * 100));
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

});
