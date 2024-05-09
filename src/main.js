const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import * as viewport from './viewport.js';

// TODO: Minify with esbuild
// TODO: If mouse isn't in the image, zoom towards center?

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const imgTypes = await invoke('get_image_types');
  viewport.init();

  canvas.addEventListener('click', selectFile);

  await listen('tauri://file-drop', (e) => {
    let extension = e.payload[0].substring(e.payload[0].lastIndexOf('.') + 1); // better way?
    if (imgTypes.includes(extension))
      viewport.setImage(e.payload[0]);
      canvas.removeEventListener('click', selectFile);
  });

  async function selectFile() {
    const file = await open({
      multiple: false,
      filters: [{
        name: 'Image',
        extensions: imgTypes
        }]
    })

    if (file !== null) {
      viewport.setImage(file);
      canvas.removeEventListener('click', selectFile);
    }
  }
  
});
