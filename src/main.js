const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import Viewport from './viewport.js';

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const canvas = document.getElementById('viewport');
  const viewport = new Viewport(canvas);

  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];  

  setCanvasSize();

  await listen('tauri://file-drop', (e) => {
    viewport.setImage(convertFileSrc(e.payload[0]))
  });

  window.addEventListener('resize', () => {
    setCanvasSize();
    viewport.setCenter();
    viewport.draw();
  });

  function setCanvasSize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight - 30;
  }

});
