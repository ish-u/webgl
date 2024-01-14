import "./style.css";
let vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will recieve data from a buffer
in vec2 a_position;

uniform vec2 u_resolution;

// all shaders have a main function
void main(){
    // Convert position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;
    
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

// we need to declare an output for the fragment shader
out vec4 outColor;

void main(){
    // Just set the output to a constant reddish-purple
    outColor = vec4(1, 0, 0.5, 1);
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

  // execute program
  {
    let primitiveType = gl.TRIANGLES;
    let offset = 0;
    let count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

document.addEventListener("DOMContentLoaded", main);
