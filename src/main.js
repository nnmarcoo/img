const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import ViewportImage from './ViewportImage.js';


document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const viewport = document.getElementById('viewport');
  const ctx = viewport.getContext('2d');
  const img = new ViewportImage(ctx);

  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];  

  setCanvasSize();

  await listen('tauri://file-drop', (e) => {
    img.setImage(convertFileSrc(e.payload[0]))
    img.animate();
  });

  window.addEventListener('resize', () => {
    setCanvasSize();
    img.setCenter(viewport.clientWidth, viewport.clientHeight);
    img.draw();
  });

  function setCanvasSize() {
    viewport.width = viewport.parentElement.offsetWidth;
    viewport.height = viewport.parentElement.offsetHeight - 30;
  }

});
