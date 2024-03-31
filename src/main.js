const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { convertFileSrc } = window.__TAURI__.tauri;

document.addEventListener('DOMContentLoaded', () => {

  const img = document.getElementById('image');
  const fileSelect = document.getElementById('file-select');
  const viewport = document.getElementById('viewport');
  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];

  function initImageSize() {
    if (img.naturalWidth > img.naturalHeight) {
      img.style.width = '70%';
      img.style.height = 'auto';
    }
    else {
      img.style.width = 'auto';
      img.style.height = '70%';
    }
    img.style.width = img.offsetWidth + 'px';
    img.style.height = img.offsetHeight + 'px';
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

  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
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


});
