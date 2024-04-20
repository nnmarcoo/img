const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import Viewport from './viewport.js';


document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const canvas = document.getElementById('canvas');
  const viewport = new Viewport(canvas);
  const imgTypes = await invoke('get_image_types');

  viewport.fillParent();

  await listen('tauri://file-drop', (e) => {
    let extension = e.payload[0].substring(e.payload[0].lastIndexOf('.') + 1); // better way?
    if (imgTypes.includes(extension))
      viewport.setImage(convertFileSrc(e.payload[0]));
  });

  window.addEventListener('resize', () => {
    viewport.fillParent();
    viewport.draw();
  });

});
