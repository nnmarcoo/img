class Viewport {
  #ctx;

  #image;
  #width;
  #height;
  #posX;
  #posY;
  
  #centerX;
  #centerY;

  constructor(ctx) {
    this.#ctx = ctx;
    this.#image = new Image();
  }

  setImage(image) {
    this.#image.onload = () => {
      this.#width = this.#image.naturalWidth;
      this.#height = this.#image.naturalHeight;
      this.#posX = 0;
      this.#posY = 0;
      this.#centerX = viewport.clientWidth/2 - this.#width/2;
      this.#centerY = viewport.clientHeight/2 - this.#height/2;
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

  setCenter(x, y) {
    this.#centerX = x/2 - this.#width/2;
    this.#centerY = y/2 - this.#height/2;
  }
  
}
export default Viewport;