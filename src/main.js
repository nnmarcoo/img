const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
import Viewport from './Viewport.js';

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const canvas = document.getElementById('viewport');
  const ctx = canvas.getContext('2d');
  const img = new Viewport(ctx);

  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];  

  setCanvasSize();

  await listen('tauri://file-drop', (e) => {
    img.setImage(convertFileSrc(e.payload[0]))
    img.animate();
  });

  window.addEventListener('resize', () => {
    setCanvasSize();
    img.setCenter(canvas.clientWidth, canvas.clientHeight);
    img.draw();
  });

  function setCanvasSize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight - 30;
  }

});
