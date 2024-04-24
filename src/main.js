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
  const zoomText = document.getElementById('zoom-text');
  const zoomTextSymbol = document.getElementById('zoom-text-symbol');

  canvas.addEventListener('click', selectFile);

  await listen('tauri://file-drop', (e) => {
    let extension = e.payload[0].substring(e.payload[0].lastIndexOf('.') + 1); // better way?
    if (imgTypes.includes(extension))
      viewport.setImage(convertFileSrc(e.payload[0]));
      canvas.removeEventListener('click', selectFile);
  });

  window.addEventListener('resize', () => {
    viewport.fillParent();
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

  document.addEventListener('zoomchange', (e) => {
    zoomText.textContent = e.detail.value;
  });

  document.addEventListener('init', () => {
    zoomTextSymbol.textContent = '%';
  });

  zoomText.addEventListener('input', () => {
    viewport.clearImage();
    let cleanText = zoomText.innerText.replace(/\D/g, '').slice(0, 4);
    if (cleanText !== zoomText.innerText)
      zoomText.blur();
    if (cleanText.length > 0) 
      zoomText.textContent = cleanText;
    else
      zoomText.textConntent = viewport.getZoom * 100;
    viewport.zoomCustom(zoomText.textContent / 100);
  });

  zoomText.addEventListener('focus', () => {
    let range = document.createRange();
    range.selectNodeContents(zoomText);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });

  zoomText.addEventListener('blur', () => {
    window.getSelection().removeAllRanges();
  });
  
});
