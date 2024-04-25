const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import * as viewport from './viewport.js';

// REMINDER: Remove dormant event handlers
// TODO: Minify with esbuild
// TODO: If mouse isn't in the image, zoom towards center?
// TODO: Scrolling over zoom text should care about margins?
// TODO: Handle multiple objects in viewport
// Should elements that are only referenced once not be saved as const?
  
const canvas = document.getElementById('canvas');
export const nextImage = document.getElementById('next-image');
export const prevImage = document.getElementById('prev-image');
export const ctx = canvas.getContext('2d');
export const zoomText = document.getElementById('zoom-text');
export const zoomTextSymbol = document.getElementById('zoom-text-symbol');

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
