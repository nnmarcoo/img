const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('fileSelect').addEventListener('click', () => {
      const selected = open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', ]
        }]
      })

      if (selected !== null) {
        // TODO: send it to rust?
      }
    });
    
});

