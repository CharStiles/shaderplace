/* eslint-env browser */

// @ts-ignore
import CodeMirror from "codemirror";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { CodemirrorBinding } from "y-codemirror";
import "codemirror/mode/clike/clike.js";
import 'codemirror/addon/lint/lint';
import {__fragmentShader, __vertexShader} from "./defaultShaders.js";
import * as THREE from "three";

const OT = require('@opentok/client');

var container;
var threeCam, scene, renderer;
var uniforms;

var gl;

var editor;
var geometry;
var material;
var mesh;

var isDirty = false;


// **** BEGIN webgl stuff

// let gl = null; Already exists
let glCanvas = null;
let shaderProgram;

// Aspect ratio and coordinate system
// details

let aspectRatio;
let currentScale = [1.0, 1.0];
let resolution;

// Vertex information

let vertexArray;
let vertexBuffer;
let vertexNumComponents;
let vertexCount;

// Rendering data shared with the
// scalers.

let uScalingFactor;
let uGlobalColor;
let uResolution;
let uRotationVector;
let aVertexPosition;

// Animation timing

let previousTime = 0.0;
let degreesPerSecond = 90.0;

// ******* END webgl stuff

// Handling all of our errors here by alerting them
function handleError(error) {
  if (error) {
    alert(error.message);
  }
}


function isInPresentationMode() {
  if (window.location.pathname.split('/').pop() == 'present.html') {
    return true;
  }
  return false;
}

function addCodeMirrorPresentModifier() {
  const codeMirrorDiv = document.querySelector(".CodeMirror");
  if (codeMirrorDiv) {
    codeMirrorDiv.classList.add("CodeMirror-present");
  }
}

function initYdoc() {
  console.log("in init doc")
  const ydoc = new Y.Doc();

  const searchParams = new URLSearchParams(window.location.search);
  var room = "";
  if (searchParams.has("room")){
    room = searchParams.get("room");
  }

  const provider = new WebsocketProvider(
    "wss://demos.yjs.dev",
    room,
    ydoc
  );

  var editorContainer = document.getElementById("editor");
  editor = CodeMirror(editorContainer, {
    value: _fragmentShader,
    lineNumbers: true,
    mode: "x-shader/x-vertex",
    gutters: ["CodeMirror-lint-markers"],
    lint: true//,
    // lineWrapping: !isInPresentationMode()
  });

  const ytext = ydoc.getText("codemirror");
  // const undoManager = new Y.UndoManager(ytext, { trackedOrigins: new Set([ydoc.clientID]) })
  const binding = new CodemirrorBinding(ytext, editor, provider.awareness);
  const setDefaultVal = () => {
    if (ytext.toString() === "") {
      ytext.insert(0, _fragmentShader);
    }
  };
  if (provider.synced) {
    setDefaultVal();
  } else {
    provider.once("synced", setDefaultVal);
  }

  editor.getDoc().markText(
    {
      line: 5,
      ch: 1
    },
    {
      line: 50,
      ch: 3
    },
    {
      css: "color : red"
    }
  );

  if (isInPresentationMode()) {
    addCodeMirrorPresentModifier();
  }

  // @ts-ignore
  window.example = { provider, ydoc, ytext, binding, Y };
  //editor.on("change", onEdit);
  //linter takes care of calling checkFragmentShader so we dont need
  // this editor.on function
  onEdit();
  init();
  animate();
}


// this function will trigger a change to the editor
function onEdit() {
  const fragmentCode = editor.getValue();
  updateShader(fragmentCode);
}

function updateShader(fragmentCode) {
  if (!checkFragmentShader(fragmentCode)) {
    return;
  }

  _fragmentShader = fragmentCode;

  isDirty = true;
}

function updateScene() {
  scene = new THREE.Scene();
  geometry = new THREE.PlaneBufferGeometry(2, 2);

  try {
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader()
    });
  } catch (e) {
    console.log("MY ERROR", e);
    return;
  }

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

window.onload = (event) => {
  webgl_startup();
  //initYdoc();
}

// START COPIED SECTION
// Copied from
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Basic_2D_animation_example
function animateScene() {
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    // This sets background color
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    uScalingFactor =
          gl.getUniformLocation(shaderProgram, "uScalingFactor");
    uGlobalColor =
          gl.getUniformLocation(shaderProgram, "uGlobalColor");
    uResolution =
          gl.getUniformLocation(shaderProgram, "u_resolution");

    gl.uniform2fv(uScalingFactor, currentScale);
    gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);
    gl.uniform2fv(uResolution, resolution);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    aVertexPosition =
          gl.getAttribLocation(shaderProgram, "aVertexPosition");

    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, vertexNumComponents,
            gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

    window.requestAnimationFrame(function(currentTime) {
          previousTime = currentTime;
          animateScene();
    });
}

function compileShader(type, code) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, code);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
          console.log(gl.getShaderInfoLog(shader));
        }
    return shader;
}


function buildShaderProgram() {
  let program = gl.createProgram();
    
  // Compile vertex shader
  let shader = compileShader(gl.VERTEX_SHADER, vertexShaderNew());
  gl.attachShader(program, shader);

  // Compile fragment shader
  shader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderNew());
  gl.attachShader(program, shader);

  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Error linking shader program:");
        console.log(gl.getProgramInfoLog(program));
  }

  return program;
}


function webgl_startup() {
  glCanvas = document.getElementById("glcanvas");
  gl = glCanvas.getContext("webgl");

  shaderProgram = buildShaderProgram();

  aspectRatio = glCanvas.width/glCanvas.height;
  currentScale = [1.0, aspectRatio];
  resolution = [glCanvas.width, glCanvas.height];

  vertexArray = new Float32Array([
      -1, 1,
      1, 1,
      1, -1,
      -1, 1,
      1, -1,
     -1, -1
  ]);

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

  vertexNumComponents = 2;
  vertexCount = vertexArray.length/vertexNumComponents;

  animateScene();
}


// DONE WITH COPIED SECTION

function init() {
  container = document.getElementById("container");

  threeCam = new THREE.Camera();
  threeCam.position.z = 1;

  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_camRot: { type: "v3", value: new THREE.Vector3() },
  };

  updateScene();
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);

  gl = renderer.getContext();

  container.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize(event) {
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  if (isInPresentationMode()) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
  uniforms.resolution.value.x = renderer.domElement.width;
  uniforms.resolution.value.y = renderer.domElement.height;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  if (isDirty) {
    updateScene();
  }
  uniforms.u_time.value += 0.05;
  uniforms.time.value += 0.05;
  renderer.render(scene, threeCam);
}

function vertexShader() {
  return `        
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
  `;
}

function vertexShaderNew() {
  return `
attribute vec2 aVertexPosition;

uniform vec2 uScalingFactor;

void main() {
      gl_Position = vec4(aVertexPosition * uScalingFactor, 0.0, 1.0);
}
`;
}

function fragmentShader() {
  return _fragmentShader;
}

function fragmentShaderNew() {
  return `
#ifdef GL_ES
    precision highp float;
  #endif

  uniform vec4 uGlobalColor;
  uniform vec2 u_resolution;

  void main() {
        gl_FragColor = vec4(gl_FragCoord.y / u_resolution.y, gl_FragCoord.x / u_resolution.x, 0.,1.0);
}
  `;
}

// this returns false if the fragment shader cannot compile
// true if it can
function checkFragmentShader(shaderCode, lint = false) {
  if (!gl) {
    return;
  }
  let shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);
  let infoLog = gl.getShaderInfoLog(shader);
  let result = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  let ret = [];
  if (!result) {
    console.log(infoLog);
    var errors = infoLog.split(/\r|\n/);
    for (let error of errors){
      var splitResult = error.split(":")
      ret.push( {
        message: splitResult[3] + splitResult[4],
        character: splitResult[1],
        line: splitResult[2]
      })
    }
  }
  
  if (result) {
    console.log("did update");
    _fragmentShader = shaderCode;
    isDirty = true;
  }

  return ret;
}


(function(mod) {
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function validator(text, options) {
    var result = [];
    var errors = checkFragmentShader(text, true);
    if (errors) parseErrors(errors, result);
    return result;
  }

  CodeMirror.registerHelper("lint", "x-shader/x-vertex", validator);

  function parseErrors(errors, output) {
    for ( var i = 0; i < errors.length; i++) {
      var error = errors[i];
      if (error) {
        if (Number(error.line) <= 0) {
          console.warn("Cannot display error (invalid line " + error.line + ")", error);
          continue;
        }

        var start = error.character - 1, end = start + 1;


        // Convert to format expected by validation service
        var hint = {
          message: error.message,
          severity: "error",
          from: CodeMirror.Pos(Number(error.line) - 1, start),
          to: CodeMirror.Pos(Number(error.line) - 1, end)
        };

        output.push(hint);
      }
    }
  }
});
