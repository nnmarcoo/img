import { bicubicVertex, bicubicFragment } from "./util.js";

export class glc {
  constructor() {
    this.gl = canvas.getContext('webgl2');
    this.vs = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.program = this.gl.createProgram();
    this.texture =this.gl.createTexture();

    this.coord;
    this.vao = this.gl.createVertexArray();
    this.vbo = this.gl.createBuffer();
    this.ibo = this.gl.createBuffer();

    this.vertices = new Float32Array(8);
    this.edges = new Uint16Array([0, 1, 2, 3, 0, 2]);
  }

  init() {
    if (!this.gl) // TODO: Fall back to DOM display
      return;

    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.edges, this.gl.STATIC_DRAW);

    this.gl.shaderSource(this.vs, bicubicVertex);
    this.gl.compileShader(this.vs);
    this.gl.shaderSource(this.fs, bicubicFragment);
    this.gl.compileShader(this.fs);

    this.gl.attachShader(this.program, this.vs);
    this.gl.attachShader(this.program, this.fs);
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);

    this.coord =this.gl.getAttribLocation(this.program, 'coordinates');
    this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.coord);

    this.gl.bindVertexArray(null);
    this.draw(); // TODO: Remove
  }

  setTexture(src) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }
  
  draw(x, y, w, h) {
    if (typeof x !== 'undefined') {
      const imgWidthHalf = w / 2,
            imgHeightHalf = h / 2,
            canvasWidthHalf = canvas.width / 2,
            canvasHeightHalf = canvas.height / 2,
            xLeftRatio = (x - imgWidthHalf) / canvasWidthHalf,
            yLeftRatio = (y - imgHeightHalf) / canvasHeightHalf,
            xRightRatio = (x + imgWidthHalf) / canvasWidthHalf,
            yRightRatio = (y + imgHeightHalf) / canvasHeightHalf,
            arr = [
              xLeftRatio, 
              yLeftRatio, 
              xRightRatio, 
              yLeftRatio, 
              xRightRatio, 
              yRightRatio, 
              xLeftRatio, 
              yRightRatio];
            
      this.vertices.set(arr);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
    }

    //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.edges.length, this.gl.UNSIGNED_SHORT, 0);
  }

  fill() {
    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }
};

