/* eslint-env browser */

// @ts-ignore
import CodeMirror from "codemirror";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { CodemirrorBinding } from "y-codemirror";
import "codemirror/mode/clike/clike.js";
import 'codemirror/addon/lint/lint';
import {_fragmentShaderC, _vertexShaderC} from "./defaultShaders.js";

// Element storage
var gl;
var editor;
let glCanvas = null;
let _fragmentShader = _fragmentShaderC;

// Current state storage
var isDirty = false;
let shaderProgram;

// Aspect ratio and coordinate system
// details
let aspectRatio;
let resolution;

// Vertex information
let vertexArray;
let vertexBuffer;
let vertexNumComponents;
let vertexCount;

// Rendering data shared with the
// scalers.
let uResolution;
let uTime;
let uVol;
let aVertexPosition;

// Animation timing
let previousTime = 0.0;
// this script is from cut-ruby.glitch.me

// so good
var FFT_SIZE = 512;
var vol;

if (window.isProduction && window.location.protocol !== "https:") {
  window.location = "https://" + window.location.hostname;
}

class Camera {
  constructor() {
    this.video = document.createElement("video");
    this.video.setAttribute("muted", true);
    this.video.setAttribute("playsinline", false);

    this.selfie = false;

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  _startCapture() {
    return navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then((stream) => {
        this.stream = stream;
        var source = this.audioCtx.createMediaStreamSource(stream);

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.9;
        this.analyser.fftSize = FFT_SIZE;
        source.connect(this.analyser);
      });
  }
  init() {
    this._startCapture();
    return this._startCapture();
  }
  flip() {
    this.selfie = !this.selfie;
    this._startCapture();
  }
}

let button = document.querySelector("button");
let camera = new Camera();
//document.querySelector("body").appendChild(camera.video);

document.addEventListener("click", function (e) {
  camera
    .init()
    .then(start)
    .catch((e) => console.error(e));
});

(function () {
  camera
    .init()
    .then(start)
    .catch((e) => console.error(e));
})();

function start() {}



// from here https://hackernoon.com/creative-coding-using-the-microphone-to-make-sound-reactive-art-part1-164fd3d972f3
// A more accurate way to get overall volume
function getRMS(spectrum) {
  var rms = 0;
  for (var i = 0; i < spectrum.length; i++) {
    rms += spectrum[i] * spectrum[i];
  }
  rms /= spectrum.length;
  rms = Math.sqrt(rms);
  let norm = rms / 128;
  return (norm - 0.99) * 100;
}

function isInPresentationMode() {
  if (window.location.pathname.split('/').pop() == 'present.html') {
    return true;
  }
  return false;
}

function isLockedPresent(){
  const queryString = window.location.search;
  console.log(queryString);
  const urlParams = new URLSearchParams(queryString);
  const pw = urlParams.get('pw')
  const room = urlParams.get('room')
  console.log(room)
 // if you hack into my classroom I will cry in front of everyone :,( 
  if(pw != "WhyDoesDotEnvEvadeMe" && room.toLowerCase()== "classroom"){
    return true;
	  console.log("youre a student, in student mode")
  }
  
  return false;
}

function addCodeMirrorPresentModifier() {
  const codeMirrorDiv = document.querySelector(".CodeMirror");
  if (codeMirrorDiv) {
    codeMirrorDiv.classList.add("CodeMirror-present");
  }
}

function addCodeMirrorEditorModifier() {
  const codeMirrorDiv = document.querySelector(".CodeMirror");
  if (codeMirrorDiv) codeMirrorDiv.classList.add("CodeMirror-editor");
}

function initYdoc() {
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
    lint: true,
    lineWrapping: !isInPresentationMode(),
    readOnly: isLockedPresent()
	  //editable: false //!isLockedPresent()
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
  } else {
    addCodeMirrorEditorModifier();
  }

  // @ts-ignore
  window.example = { provider, ydoc, ytext, binding, Y };
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

window.onload = (event) => {
  webgl_startup();
  initYdoc();
}

function animateScene() {
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    // This sets background color
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    uResolution =
          gl.getUniformLocation(shaderProgram, "u_resolution");
    uTime =
          gl.getUniformLocation(shaderProgram, "u_time");
    uVol =
          gl.getUniformLocation(shaderProgram, "u_vol");

    gl.uniform2fv(uResolution, resolution);
    gl.uniform1f(uTime, previousTime);
    if (camera && camera.analyser) {
      var bufferLength = camera.analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
  
      camera.analyser.getByteTimeDomainData(dataArray);
      gl.uniform1f(uVol, getRMS(dataArray));
    }
    else{
      gl.uniform1f(uVol, 0.0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    aVertexPosition =
          gl.getAttribLocation(shaderProgram, "aVertexPosition");

    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, vertexNumComponents,
            gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

    window.requestAnimationFrame(function(currentTime) {
      previousTime = previousTime + .05;
      // TODO here check dirty bit and recompile?
      if (isDirty) {
        // recompile and clear dirty bit
        shaderProgram = buildShaderProgram();
        isDirty = false;
      }
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
  let shader = compileShader(gl.VERTEX_SHADER, vertexShader());
  gl.attachShader(program, shader);

  // Compile fragment shader
  shader = compileShader(gl.FRAGMENT_SHADER, fragmentShader());
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
  if (glCanvas.width != glCanvas.clientWidth) {
    glCanvas.width = glCanvas.clientWidth;
  }
  if (glCanvas.height != glCanvas.clientHeight) {
    glCanvas.height = glCanvas.clientHeight;
  }
  gl = glCanvas.getContext("webgl");

  shaderProgram = buildShaderProgram();

  aspectRatio = glCanvas.width/glCanvas.height;
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


function vertexShader() {
  return _vertexShaderC;
}

function fragmentShader() {
  return _fragmentShader;
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
