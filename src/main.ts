import "./style.css";

let m3 = {
  multiply: function (a: number[], b: number[]) {
    const c = new Array(9).fill(0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          c[i * 3 + j] += b[i * 3 + k] * a[k * 3 + j];
        }
      }
    }
    return c;
  },

  translation: function (tx: number, ty: number) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },

  rotation: function (angleInDegress: number) {
    let c = Math.cos(angleInDegress);
    let s = Math.sin(angleInDegress);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  },

  scaling: function (sx: number, sy: number) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },

  identify: function () {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },
};

let vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will recieve data from a buffer
in vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

// all shaders have a main function
void main(){
    vec2 position = (u_matrix * vec3(a_position,1)).xy;

    // Convert position from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;
    
    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;
  
    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

let fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need 
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main(){
    // Just set the output to a constant reddish-purple
    outColor = u_color;
}
`;

// to create a shader -> upload to GLSL source -> compile the shader
function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  let shader = gl.createShader(type);
  if (!shader) {
    alert("Can't create shader");
    return;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  alert("Can't compile shader");
  gl.deleteShader(shader);
}

// to create a shader program -> link the vertex and fragment shaders
function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  let program = gl.createProgram();
  if (!program) {
    alert("Can't create program");
    return;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  let success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  alert("Can't link shaders");
  gl.deleteProgram(program);
}

// resize canvas
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  // Lookup the size the browser is displaying the canvas in pixels
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size
  const needResize =
    canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}

// Draw Squrares
function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(
  gl: WebGL2RenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (!gl) {
    return;
  }
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

function drawRectangles(
  gl: WebGL2RenderingContext,
  colorLocation: WebGLUniformLocation | null
) {
  if (!colorLocation) {
    alert("Color uniform is null");
    return;
  }
  if (!gl) {
    alert("WebGL not initialized");
    return;
  }
  const range = 300;
  for (let i = 0; i < 50; i++) {
    const x = randomInt(range);
    const y = randomInt(range);
    const width = randomInt(range);
    const height = randomInt(range);

    setRectangle(gl, x, y, width, height);

    // Setting color
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw Rectangle
    let primitiveType = gl.TRIANGLES;
    let offset = 0;
    let count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function setGeometry(gl: WebGL2RenderingContext) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column
      0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

      // top rung
      30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

      // middle rung
      30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
    ]),
    gl.STATIC_DRAW
  );
}

function main() {
  // get canvas element
  const canvas: HTMLCanvasElement | null = document.querySelector("#canvas");
  if (!canvas) {
    alert("Failed to initialize");
    return;
  }

  // initialize WebGL2 context
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL2 not supported!");
    return;
  }

  // Create Shaders
  let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  let fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  if (!vertexShader || !fragmentShader) {
    alert("Unable to initialize shaders");
    return;
  }

  // Create Shader Program
  let program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) {
    alert("Unable to initiaze program");
    return;
  }

  // Setting Data

  // Attributes
  let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  let resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );
  let colorLocation = gl.getUniformLocation(program, "u_color");
  let matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Buffers -> create a buffer -> bind it -> set buffer data and usage
  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // let positions = [0, 0, 0, 0.5, 0.7, 0]; // Triangle
  let positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30]; // Rectangle using two Triangles
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // State -> Create vertex array object (sort of a lookup) -> bind it to current context
  // set positionAttributeLocation to our vao
  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  // fetch data
  let size = 2; // 2 component per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normailze
  let stride = 0; // 0 = nive forward size * sizeof(type) each iteration to get next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  var color = [Math.random(), Math.random(), Math.random(), 1];

  // Translation Demo
  const translation = [0, 0];

  const xRange: HTMLInputElement = document.createElement("input");
  xRange.type = "range";
  xRange.value = "0";
  xRange.max = gl.canvas.width.toString();
  const xLabel = document.createElement("div");
  xLabel.innerHTML = "x : " + xRange.value;
  const xContainer = document.createElement("div");
  xContainer.appendChild(xLabel);
  xContainer.appendChild(xRange);
  xContainer.style.display = "flex";
  xRange.style.marginLeft = "8px";
  xRange.addEventListener("input", (e) => {
    xLabel.innerHTML = "x: " + (e.target as HTMLInputElement)?.value;
    translation[0] = parseInt((e.target as HTMLInputElement)?.value);
    drawScene();
  });

  const yRange: HTMLInputElement = document.createElement("input");
  yRange.type = "range";
  yRange.value = "0";
  yRange.max = gl.canvas.height.toString();
  const yLabel = document.createElement("div");
  yLabel.innerHTML = "y : " + yRange.value;
  const yContainer = document.createElement("div");
  yContainer.appendChild(yLabel);
  yContainer.appendChild(yRange);
  yContainer.style.display = "flex";
  yRange.style.marginLeft = "8px";
  yRange.addEventListener("input", (e) => {
    yLabel.innerHTML = "y: " + (e.target as HTMLInputElement)?.value;
    translation[1] = parseInt((e.target as HTMLInputElement)?.value);
    drawScene();
  });

  const translationControlContainer = document.createElement("div");
  translationControlContainer.innerHTML = "Translation:";
  translationControlContainer.appendChild(xContainer);
  translationControlContainer.appendChild(yContainer);
  translationControlContainer.style.margin = "12px";

  // Rotation demo
  let rotation = [0, 1];
  let rotationInRadians = 0;
  const rotationRange: HTMLInputElement = document.createElement("input");
  rotationRange.type = "range";
  rotationRange.value = "0";
  rotationRange.max = "360";
  const rotationLabel = document.createElement("div");
  rotationLabel.innerHTML = "angle: " + rotationRange.value;
  const rotationContainer = document.createElement("div");
  rotationContainer.appendChild(rotationLabel);
  rotationContainer.appendChild(rotationRange);
  rotationContainer.style.display = "flex";
  rotationRange.style.marginLeft = "8px";
  rotationRange.addEventListener("input", (e) => {
    rotationLabel.innerHTML =
      "rotation: " + (e.target as HTMLInputElement)?.value;
    const angleInDegress = parseInt((e.target as HTMLInputElement)?.value);
    const angleInRadians = (angleInDegress * Math.PI) / 180;
    rotationInRadians = angleInRadians;
    rotation[0] = Math.sin(angleInRadians);
    rotation[1] = Math.cos(angleInRadians);
    drawScene();
  });

  const rotationControlContainer = document.createElement("div");
  rotationControlContainer.innerHTML = "Rotation:";
  rotationControlContainer.appendChild(rotationContainer);
  rotationControlContainer.style.margin = "12px";

  // scale demo
  let scale = [1, 1];

  const scaleXRange: HTMLInputElement = document.createElement("input");
  scaleXRange.type = "range";
  scaleXRange.value = "1.0";
  scaleXRange.min = "-5.0";
  scaleXRange.max = "5.0";
  scaleXRange.step = "0.01";
  const scaleXLabel = document.createElement("div");
  scaleXLabel.innerHTML = "x : " + scaleXRange.value;
  const scaleXContainer = document.createElement("div");
  scaleXContainer.appendChild(scaleXLabel);
  scaleXContainer.appendChild(scaleXRange);
  scaleXContainer.style.display = "flex";
  scaleXRange.style.marginLeft = "8px";
  scaleXRange.addEventListener("input", (e) => {
    scaleXLabel.innerHTML = "x: " + (e.target as HTMLInputElement)?.value;
    scale[0] = parseFloat((e.target as HTMLInputElement)?.value);
    drawScene();
  });

  const scaleYRange: HTMLInputElement = document.createElement("input");
  scaleYRange.type = "range";
  scaleYRange.value = "1.0";
  scaleYRange.min = "-5.0";
  scaleYRange.max = "5.0";
  scaleYRange.step = "0.01";
  const scaleYLabel = document.createElement("div");
  scaleYLabel.innerHTML = "y : " + scaleYRange.value;
  const scaleYContainer = document.createElement("div");
  scaleYContainer.appendChild(scaleYLabel);
  scaleYContainer.appendChild(scaleYRange);
  scaleYContainer.style.display = "flex";
  scaleYRange.style.marginLeft = "8px";
  scaleYRange.addEventListener("input", (e) => {
    scaleYLabel.innerHTML = "y: " + (e.target as HTMLInputElement)?.value;
    scale[1] = parseFloat((e.target as HTMLInputElement)?.value);
    drawScene();
  });

  const scaleControlContainer = document.createElement("div");
  scaleControlContainer.innerHTML = "Scale:";
  scaleControlContainer.appendChild(scaleXContainer);
  scaleControlContainer.appendChild(scaleYContainer);
  scaleControlContainer.style.margin = "12px";

  const controls = document.createElement("div");
  controls.id = "controls";
  controls.style.position = "fixed";
  controls.style.right = "0";
  controls.style.top = "0";

  controls?.appendChild(translationControlContainer);
  controls?.appendChild(rotationControlContainer);
  controls?.appendChild(scaleControlContainer);
  document.querySelector("body")?.appendChild(controls);

  // Set Geometry
  setGeometry(gl);

  drawScene();

  function drawScene() {
    if (!gl || !program) {
      return;
    }
    // Resize on zoom
    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // Clip Space to Canvas Space
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // use program
    gl.useProgram(program);

    // bind the attribute/buffer set we want
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Trasnformation Matrices
    let translationMatrix = m3.translation(translation[0], translation[1]);
    let rotationMatrix = m3.rotation(rotationInRadians);
    let scaleMatrix = m3.scaling(scale[0], scale[1]);

    let matrix = m3.identify();
    for (let i = 0; i < 5; i++) {
      // Calculating the resulting matrix
      matrix = m3.multiply(matrix, translationMatrix);
      matrix = m3.multiply(matrix, rotationMatrix);
      matrix = m3.multiply(matrix, scaleMatrix);

      // Setting matrix attribute for shader
      gl.uniformMatrix3fv(matrixLocation, false, matrix);

      // setting the color
      gl.uniform4fv(colorLocation, color);

      // execute program - Draw geomertry
      let primitiveType = gl.TRIANGLES;
      let offset = 0;
      let count = 18;
      gl.drawArrays(primitiveType, offset, count);
    }
  }
}

document.addEventListener("DOMContentLoaded", main);
