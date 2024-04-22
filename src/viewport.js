export default class Viewport {
  #canvas;
  #ctx;
  #centerX;
  #centerY;

  #img;
  #width;
  #height;
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
    this.#img = new Image(); // should this live outside of viewport?
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
    this.#canvas.addEventListener('wheel', this.#wheel.bind(this))
  }

  #wheel(e) {
    if (this.#img.src === '') return;
    this.clearImage();

    const pW = this.#width;
    const pH = this.#height;

    if (e.deltaY < 0) // scroll up
      this.zoomIn();
    else
      this.zoomOut();

    const dW = this.#width - pW;
    const dH = this.#height - pH;

    const offsetX = (e.clientX - this.#imgX) * dW / pW;
    const offsetY = (e.clientY - this.#imgY) * dH / pH;

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
    this.clearImage();

    if (this.#canvas.style.cursor !== 'grabbing')
      this.#canvas.style.cursor = 'grabbing';

    this.#imgX = (this.#imgX + (e.clientX - this.#mousePrevX));
    this.#imgY = (this.#imgY + (e.clientY - this.#mousePrevY));

    this.#mousePrevX = e.clientX;
    this.#mousePrevY = e.clientY;

    this.draw();
  }

  setImage(image) {
    this.renderLoading();
    this.#img.src = image;
    this.#img.onload = () => {
      this.clearImage();
      this.#width = this.#img.width;
      this.#height = this.#img.height;
      this.#initImage();
      this.#setCenter();
      this.draw();
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
  }

  draw() {
    if (this.#img.src === '') {
      this.renderFileSelect();
      return;
    }
    this.#ctx.drawImage(this.#img, Math.floor(this.#centerX + this.#imgX), Math.floor(this.#centerY + this.#imgY), this.#width, this.#height);
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
    this.#ctx.clearRect(Math.floor(this.#centerX + this.#imgX), Math.floor(this.#centerY + this.#imgY), this.#width, this.#height);
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
  }

  centerImage() {
      this.#imgX = 0;
      this.#imgY = 0;
  }

  #setCenter() {
    this.#centerX = this.#canvas.clientWidth/2 - this.#width/2;
    this.#centerY = this.#canvas.clientHeight/2 - this.#height/2;
  }

  #clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  #clampImageX(v) {
    let hW = this.#width/2;
    return this.#clamp(v, -hW, hW);
  }
  
  #clampImageY(v) {
    let hH = this.#height/2
    return this.#clamp(v, -hH, hH);
  }

  zoomIn() {
    this.#zoomStep = Math.min(this.#zoomStep + 1, this.#zoomSteps.length - 1);
    this.zoomCustom(this.#zoomSteps[this.#zoomStep]);
  }

  zoomOut() {
    this.#zoomStep = Math.max(this.#zoomStep - 1, 0);
    this.zoomCustom(this.#zoomSteps[this.#zoomStep]);
  }

  zoomCustom(p) { // ex: 0.05 : 5%
    this.#width = p * this.#img.width;
    this.#height = p * this.#img.height;
  }

  #getFitZoom() {
    let scaleWidth = canvas.parentElement.clientWidth / this.#img.width,
        scaleHeight = canvas.parentElement.clientHeight / this.#img.height;
    return Math.min(scaleWidth, scaleHeight);
  }
  
}