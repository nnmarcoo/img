const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                    0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                    2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                    10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
let zoomStep = 0;

export default class Viewport {
  #canvas;
  #ctx;
  #centerX;
  #centerY;

  #image;
  #width;
  #height;
  #posX;
  #posY;
  
  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = this.#canvas.getContext('2d');
    this.#image = new Image();

    this.#canvas.addEventListener('click', this.#click.bind(this));
  }

  #click(e) {

  }


  setImage(image) {
    this.renderLoading();
    this.#image.onload = () => {
      this.clearImage();
      this.#width = this.#image.naturalWidth;
      this.#height = this.#image.naturalHeight;
      this.centerImage();
      this.#setCenter();
      this.draw();
    };
    this.#image.src = image;
  }

  draw() {
    this.#ctx.imageSmoothingEnabled = false;
    if (this.#image.src === '') {
      this.renderFileSelect();
      return;
    }
    this.#ctx.drawImage(this.#image, this.#centerX + this.#posX, this.#centerY + this.#posY, this.#width, this.#height);
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
    this.#ctx.fillStyle = '#EEEEEE';
    this.#ctx.textAlign = 'center';
    this.#ctx.font = '16px Trebuchet MS';
    this.#ctx.fillText('Loading...', canvas.clientWidth/2, canvas.clientHeight/2 + 8);
  }

  clearImage() {
    this.#ctx.clearRect(this.#centerX + this.#posX, this.#centerY + this.#posY, this.#width, this.#height);
  }

  fillParent() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    this.#setCenter();
  }

  centerImage() {
      this.#posX = 0;
      this.#posY = 0;
  }

  #setCenter() {
    this.#centerX = this.#canvas.clientWidth/2 - this.#width/2;
    this.#centerY = this.#canvas.clientHeight/2 - this.#height/2;
  }
  
}