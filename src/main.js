const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import Viewport from './viewport.js';

// REMINDER: Remove dormant event handlers
// TODO: Minify with esbuild
// TODO: If mouse isn't in the image, zoom towards center?
// TODO: Scrolling over zoom text should care about margins?
// TODO: Handle multiple objects in viewport
// Should elements that are only referenced once not be saved as const?

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const canvas = document.getElementById('canvas');
  const viewport = new Viewport(canvas);
  const imgTypes = await invoke('get_image_types');

  viewport.fillParent();
  viewport.draw();
 
  canvas.addEventListener('click', selectFile);

  await listen('tauri://file-drop', (e) => {
    let extension = e.payload[0].substring(e.payload[0].lastIndexOf('.') + 1); // better way?
    if (imgTypes.includes(extension))
      viewport.setImage(convertFileSrc(e.payload[0]));
  });

  window.addEventListener('resize', () => {
    viewport.fillParent();
    viewport.draw();
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
      viewport.setImage(convertFileSrc(file));
      canvas.removeEventListener('click', selectFile);
    }
  }
  
});
