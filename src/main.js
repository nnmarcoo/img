const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { convertFileSrc } = window.__TAURI__.tauri;

// REMINDER: Remove dormant event handlers

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
      img.style.width = initSize * viewport.clientWidth + 'px';
      img.style.height = img.clientWidth / aspectRatio + 'px';
    }
    else {
      img.style.height = initSize * viewport.clientHeight + 'px';
      img.style.width = img.clientHeight * aspectRatio + 'px';
    }
  }

  function setImage(file) {
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
    // TODO: Implement
    console.log((img.clientWidth / img.naturalWidth) * 100);
  });

  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (imgTypes.includes(files[0].type.substring(6)))
      setImage(files[0]);
  });

  document.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1 || !isDragging) return;

    var marginTop = parseInt(img.style.marginTop) || 0;
    var marginLeft = parseInt(img.style.marginLeft) || 0;

    img.style.marginTop = marginTop + 2*(e.clientY - prevY) + 'px';
    img.style.marginLeft = marginLeft + 2*(e.clientX - prevX) + 'px';

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
