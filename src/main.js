const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;

document.addEventListener('DOMContentLoaded', async () => {
  invoke('show_window');

  const viewport = document.getElementById('viewport');
  const c = viewport.getContext('2d');
  const img = new Image();

  const imgTypes = ['png', 'jpeg', 'jpg', 'webp'];  

  setCanvasSize();

  await listen('tauri://file-drop', (e) => {
    img.src = convertFileSrc(e.payload[0]);
    console.log(img.src);
  });

  img.addEventListener('load', () => {
    c.drawImage(img, 50, 50, 100, 100);
  });

  function setCanvasSize() {
    viewport.width = viewport.parentElement.offsetWidth;
    viewport.height = viewport.parentElement.offsetHeight - 30;
  }

  


});
