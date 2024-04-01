const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { convertFileSrc } = window.__TAURI__.tauri;

document.addEventListener('DOMContentLoaded', () => {
  invoke('show_window');

  const img = document.getElementById('image');
  const fileSelect = document.getElementById('file-select');
  const viewport = document.getElementById('viewport');
  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];
  const initSize = .6;

  function initImageSize() {
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    if (img.naturalWidth > img.naturalHeight) {
      img.style.width = initSize * viewport.clientWidth + 'px';
      img.style.height = img.offsetWidth / aspectRatio + 'px';
    }
    else {
      img.style.height = initSize * viewport.clientHeight + 'px';
      img.style.width = img.offsetHeight * aspectRatio + 'px';
    }
  }

  async function setImage(file) {
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

  fileSelect.addEventListener('click', async () => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: imgTypes
        }]
    })

    if (selected !== null)
      setImage(selected);
  });

  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (imgTypes.includes(files[0].type.substring(6)))
      setImage(files[0]);
  });

  viewport.addEventListener('mousedown', () => {
    if (img.src !== '')
      document.body.style.cursor = 'grabbing';
  });

  viewport.addEventListener('mouseup', () => {
    document.body.style.cursor = 'default';
  });

  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  viewport.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

});
