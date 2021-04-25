/* eslint-env browser */

// @ts-ignore
import CodeMirror from "codemirror";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { CodemirrorBinding } from "y-codemirror";
import "codemirror/mode/clike/clike.js";
import 'codemirror/addon/lint/lint';
import __fragmentShader from "./fragmentShader.js";
import * as THREE from "three";

var container;
var threeCam, scene, renderer;
var uniforms;

var gl;

var editor;

// meow globals
var geometry;
var material;
var mesh;

var socket;

var isDirty = false;
function initYdoc() {
  console.log("in init doc")
  const ydoc = new Y.Doc();
  var room = document.getElementById("room").value;

  const provider = new WebsocketProvider(
    "wss://demos.yjs.dev",
    room,
    ydoc
  );
  const editorContainer = document.createElement("div");
  editorContainer.setAttribute("id", "editor");
  document.body.insertBefore(editorContainer, null);
  editorContainer.insertAdjacentHTML("beforebegin", "<mark>")
  editorContainer.insertAdjacentHTML("afterend", "</mark>")

  editor = CodeMirror(editorContainer, {
    value: _fragmentShader,
    lineNumbers: true,
    mode: "x-shader/x-vertex",
    gutters: ["CodeMirror-lint-markers"],
    lint: true
  });

  const ytext = ydoc.getText("codemirror");
  // const undoManager = new Y.UndoManager(ytext, { trackedOrigins: new Set([ydoc.clientID]) })

  // ytext.delete(0)
  //ytext.insert(0, _fragmentShader)
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

  console.log("did update");
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
  var goButton = document.getElementById("goButton");
  goButton.onclick = initYdoc;
}

function init() {
  container = document.getElementById("container");

  threeCam = new THREE.Camera();
  threeCam.position.z = 1;

  // video = document.querySelector( 'video' );
  // feed = new THREE.VideoTexture( video );

  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_camRot: { type: "v3", value: new THREE.Vector3() }
    // u_feed: {type: "", value: new THREE.VideoTexture(video)}
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
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
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
  // uniforms.u_feed.value = feed;
  renderer.render(scene, threeCam);
}

function vertexShader() {
  return `        
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
  `;
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