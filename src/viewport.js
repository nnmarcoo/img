const zoomSteps = [ 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60,
                      0.70, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00,
                      2.50, 3.00, 3.50, 4.00, 5.00, 6.00, 7.00, 8.00, 
                      10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 35.0 ];
let zoomStep = 0;

export default class Viewport {
  #canvas;
  #ctx;

  #image;
  #width;
  #height;
  #posX;
  #posY;
  
  #centerX;
  #centerY;

  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = this.#canvas.getContext('2d');
    this.#image = new Image();
  }

  setImage(image) {
    this.#image.onload = () => {
      this.clear();
      this.#width = this.#image.naturalWidth;
      this.#height = this.#image.naturalHeight;
      this.#posX = 0;
      this.#posY = 0;
      this.#centerX = this.#canvas.clientWidth/2 - this.#width/2;
      this.#centerY = this.#canvas.clientHeight/2 - this.#height/2;
      this.draw();
    };
    this.#image.src = image;
  }

  draw() {
    this.#ctx.drawImage(this.#image, this.#centerX + this.#posX, this.#centerY + this.#posY, this.#width, this.#height);
  }

  clear() {
    this.#ctx.clearRect(this.#centerX + this.#posX, this.#centerY + this.#posY, this.#width, this.#height);
  }

  fillParent() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    this.#setCenter();
  }

  #setCenter() {
    this.#centerX = this.#canvas.clientWidth/2 - this.#width/2;
    this.#centerY = this.#canvas.clientHeight/2 - this.#height/2;
  }
  
}