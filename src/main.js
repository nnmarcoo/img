const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('file-select').addEventListener('click', () => {
    const selected = open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpeg']
        }]
    })

    if (selected !== null) {
      // TODO: send it to rust?
    }
  });

  const viewport = document.getElementById('viewport');
  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    console.log(files[0]);
  });

});
