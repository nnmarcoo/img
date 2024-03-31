const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { convertFileSrc } = window.__TAURI__.tauri;
const { appDataDir, join } = window.__TAURI__.path;

document.addEventListener('DOMContentLoaded', () => {

  
  const img = document.getElementById('image');
  const fileSelect = document.getElementById('file-select');
  const viewport = document.getElementById('viewport');
  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];

  async function setImage(file) {
    if (img.src === '')
      fileSelect.style.display = 'none';

    if (typeof file === 'string') {
      img.src = convertFileSrc(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const imageUrl = event.target.result;
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }

  fileSelect.addEventListener('click', async () => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: imgTypes
        }]
    })

    if (selected !== null) {
      setImage(selected);
      // TODO: send it to rust?
    }
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
    console.log('test');
    document.body.style.cursor = 'default';
  });



});
