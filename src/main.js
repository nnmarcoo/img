const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog

document.getElementById('fileSelect').addEventListener('click', () => {
  const selected = open({
    multiple: false,
    filters: [{
      name: 'Image',
      extensions: ['png', 'jpeg']
    }]
  });

  if (selected !== null) {
    // TODO: set image display
  }
});
