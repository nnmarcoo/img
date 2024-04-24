export default class Viewport {
  #canvas;
  #ctx;
  #centerX;
  #centerY;

  #img;
  #imgW;
  #imgH;
  #imgX;
  #imgY;

  #mousePrevX;
  #mousePrevY;
  #isDragging;

  #zoomSteps;
  #zoomStep;
  
  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = this.#canvas.getContext('2d');
    this.#img = new Image();
    this.#zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                        0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                        2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                        10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
    this.#zoomStep = 0;

    this.#imgX = 0;
    this.#imgY = 0;

    this.#isDragging = false;
    this.#canvas.addEventListener('mousedown', this.#mouseDown.bind(this));
    document.addEventListener('mouseup', this.#mouseUp.bind(this));
    document.addEventListener('mousemove', this.#mouseMove.bind(this));
    this.#canvas.addEventListener('wheel', this.#wheel.bind(this));
    document.addEventListener('keydown', this.#keydown.bind(this));
    this.fillParent();
  }

  #wheel(e) {
    if (this.#img.src === '') return;
    this.clearImage();

    const pW = this.#imgW;
    const pH = this.#imgH;

    if (e.deltaY < 0) // scroll up
      this.zoomIn(false);
    else
      this.zoomOut(false);

    const dW = this.#imgW - pW;
    const dH = this.#imgH - pH;

    const offsetX = (e.clientX - (this.#imgX + this.#canvas.clientWidth/2)) * dW / pW;
    const offsetY = (e.clientY - (this.#imgY + this.#canvas.clientHeight/2)) * dH / pH;

    this.#imgX = this.#clampImageX(this.#imgX - offsetX);
    this.#imgY = this.#clampImageY(this.#imgY - offsetY);

    this.draw();
  }

  #mouseDown(e) {
    if (this.#img.src === '' || e.buttons !== 1) return;
    this.#mousePrevX = e.clientX;
    this.#mousePrevY = e.clientY;
    this.#isDragging = true;
  }
  #mouseUp() {
    if (this.#img.src === '') return;
    this.#canvas.style.cursor = 'default';
    this.#isDragging = false;
  }

  #mouseMove(e) {
    if (e.buttons !== 1 || !this.#isDragging) return;

    if (this.#canvas.style.cursor !== 'grabbing')
      this.#canvas.style.cursor = 'grabbing';

    this.clearImage();

    this.#imgX = this.#clampImageX(this.#imgX + (e.clientX - this.#mousePrevX));
    this.#imgY = this.#clampImageY(this.#imgY + (e.clientY - this.#mousePrevY));

    this.#mousePrevX = e.clientX;
    this.#mousePrevY = e.clientY;

    this.draw();
  }

  setImage(image) {
    this.renderLoading();
    this.#img.src = image;

    this.#img.onload = () => {
      this.clearImage();
      this.#imgW = this.#img.width;
      this.#imgH = this.#img.height;
      this.#initImage();
    };
  }

  #initImage() {
    this.centerImage();
    let zoom = this.#getFitZoom();

     for (let i = 0; i < this.#zoomSteps.length; i++) {
      if (this.#zoomSteps[i] >= zoom) {
        this.#zoomStep = this.#clamp(i-1, 0, this.#zoomSteps.length - 1);
        break;
      }
    }
    this.zoomCustom(this.#zoomSteps[this.#zoomStep]);

    const e = new CustomEvent('init');
    document.dispatchEvent(e);
  }

  draw() {
    if (this.#img.src === '') {
      this.renderFileSelect();
      return;
    }
    this.#ctx.drawImage(this.#img, Math.floor(this.#centerX + this.#imgX - this.#imgW/2), 
                                   Math.floor(this.#centerY + this.#imgY - this.#imgH/2), 
                                   this.#imgW, this.#imgH);
  }

  renderFileSelect() {
    this.#canvas.style.cursor = 'pointer';
    this.#ctx.fillStyle = '#EEEEEE';
    this.#ctx.textAlign = 'center';
    // Draw icon
    this.#ctx.font = '80px Trebuchet MS';
    this.#ctx.fillText('🗎', canvas.clientWidth/2, canvas.clientHeight/2 + 14);
    // Draw text
    this.#ctx.font = '16px Trebuchet MS';
    this.#ctx.fillText('Drag or select file to begin', canvas.clientWidth/2, canvas.clientHeight/2 + 41);
  }

  renderLoading() {
    this.#canvas.style.cursor = 'default';
    this.#ctx.clearRect(0, 0, this.#canvas.clientWidth, this.#canvas.clientHeight);
    this.#ctx.fillText('Loading...', canvas.clientWidth/2, canvas.clientHeight/2 + 8);
  }

  clearImage() {
    this.#ctx.clearRect(Math.floor(this.#centerX + this.#imgX - this.#imgW/2), Math.floor(this.#centerY + this.#imgY - this.#imgH/2), this.#imgW, this.#imgH);
    //this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  fillParent() {
    let ratio = (() => {
      let dpr = window.devicePixelRatio || 1,
          bsr = this.#ctx.webkitBackingStorePixelRatio ||
                this.#ctx.mozBackingStorePixelRatio ||
                this.#ctx.msBackingStorePixelRatio ||
                this.#ctx.oBackingStorePixelRatio ||
                this.#ctx.backingStorePixelRatio || 1;
      return dpr / bsr;
    })();

    this.#canvas.width = canvas.parentElement.offsetWidth * ratio;
    this.#canvas.height = canvas.parentElement.offsetHeight * ratio;
    this.#canvas.style.width = canvas.parentElement.offsetWidth + 'px';
    this.#canvas.style.height = canvas.parentElement.offsetHeight + 'px';
    this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.#setCenter();
    this.draw();
  }
  
  #setCenter() {
    this.#centerX = this.#canvas.clientWidth/2;
    this.#centerY = this.#canvas.clientHeight/2;
  }

  centerImage() {
      this.#imgX = 0;
      this.#imgY = 0;
  }

  #clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  #clampImageX(v) {
    let hW = this.#imgW/2;
    return this.#clamp(v, -hW, hW);
  }
  
  #clampImageY(v) {
    let hH = this.#imgH/2
    return this.#clamp(v, -hH, hH);
  }

  zoomIn(draw = true) {
    this.#zoomStep = Math.min(this.#zoomStep + 1, this.#zoomSteps.length - 1);
    this.zoomCustom(this.#zoomSteps[this.#zoomStep], draw);
  }

  zoomOut(draw = true) {
    this.#zoomStep = Math.max(this.#zoomStep - 1, 0);
    this.zoomCustom(this.#zoomSteps[this.#zoomStep], draw);
  }

  zoomCustom(p, draw = true) { // ex: 0.05 : 5%
    this.#imgW = p * this.#img.width;
    this.#imgH = p * this.#img.height;
    
    if (draw) {
      this.clearImage();
      this.draw();
    } 

    let newZoomStep = 0;
    for (let i = 0; i < this.#zoomSteps.length; i++)
      if (p >= this.#zoomSteps[i])
        newZoomStep = i;
    this.#zoomStep = newZoomStep;
    
    this.updateZoomText(p * 100);
  }

  #getFitZoom() {
    let scaleWidth = canvas.parentElement.clientWidth / this.#img.width,
        scaleHeight = canvas.parentElement.clientHeight / this.#img.height;
    return Math.min(scaleWidth, scaleHeight);
  }

  updateZoomText(value) {
    const e = new CustomEvent('zoomchange', { detail: { value } });
    document.dispatchEvent(e);
  }

  getZoom() {
    return this.#zoomSteps[this.#zoomStep];
  }

  async #keydown(e) { // TODO: Fix
    if (this.#img.src === '') return;
    if (e.ctrlKey) {
      if (e.key === '=')
        this.zoomIn();
      else if (e.key === '-')
        this.zoomOut();
      else if (e.key === 'r')
        e.preventDefault();
    }
    else if (e.key === 'z') { // TODO: Fix
      zoomText.blur();
      zoomText.focus();
      e.preventDefault();
    }
    else if (e.key === 'f')
      fitToViewport();
    else if (e.key === 'c')
      center(img);
    else if (e.key === 'ArrowRight')
      setImage(await invoke('next_image'))
    else if (e.key === 'ArrowLeft')
      setImage(await invoke('prev_image'))
    else if (e.key === 'F5' || (e.metaKey && e.key === 'r'))
      e.preventDefault();
  }

  fitToViewport() { // TODO: Fix
    let zoom = this.#getFitZoom();
    this.centerImage(img);
    zoomCustom(zoom);
    updateZoomText(Math.round(zoom * 100));
  }
}