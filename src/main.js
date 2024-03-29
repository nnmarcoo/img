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

  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    console.log(files[0]);
  });

});
