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

const OT = require('@opentok/client');

var container;
var threeCam, scene, renderer;
var uniforms;

var gl;

var editor;
var geometry;
var material;
var mesh;

var initilizedOpenTok = false;
var isDirty = false;
var uniformVideos = [];

var apiKey = "47217534";
var sessionId = "1_MX40NzIxNzUzNH5-MTYyMjU5MzMzMjE2NH45OW9KUlREOUlMd0RWWWNLVG5iYzdEemJ-fg";
var token = "T1==cGFydG5lcl9pZD00NzIxNzUzNCZzaWc9ODZjYjEwN2RiNjkxMDI4MjIxOTQ5NDIwZGVjNzBjMGViNTgxZDk2MzpzZXNzaW9uX2lkPTFfTVg0ME56SXhOelV6Tkg1LU1UWXlNalU1TXpNek1qRTJOSDQ1T1c5S1VsUkVPVWxNZDBSV1dXTkxWRzVpWXpkRWVtSi1mZyZjcmVhdGVfdGltZT0xNjIyNTkzMzUxJm5vbmNlPTAuNjk0Nzg3MDQ4MTAzMzc2OSZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNjI1MTg1MzUwJmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";

// Handling all of our errors here by alerting them
function handleError(error) {
  if (error) {
    alert(error.message);
  }
}


function initializeSession() {
  if (initilizedOpenTok == true){
    return;
  }
  initilizedOpenTok = true;
  console.log("init opentok")
  var session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function(event) {
    console.log(event.stream);

    var sub = session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',
      width: '0',
      height: '0',
      // insertDefaultUI: false

    }, handleError);
    sub.on('videoElementCreated', function(event) {
      console.log(event);
      console.log("session video element");
      var remoteVideo = document.getElementById("subscriber")
      var video = remoteVideo.querySelector( 'video' );
      if(video){
        uniforms.u_feed0.value = new THREE.VideoTexture(video);
      }
  
    }) 
      
    })


  // Create a publisher
  var publisher = OT.initPublisher('publisher', {
    audioSource: false,
    insertMode: 'append',
    width: '0%',
    height: '0%',

  }, handleError);

  publisher.on('videoElementCreated', function(event) {
    console.log(event);
    console.log("video element");
    var remoteVideo = document.getElementById("publisher")
    var video = remoteVideo.querySelector( 'video' );
    if(video){
      uniforms.u_feed.value = new THREE.VideoTexture(video);
    }

  }) 
  // Connect to the session
  session.connect(token, function(error) {

    // 1. maybe there is another event we xan listn for?
    // 2. because then we can set some call back video
    // 3. we can block or stick it in somne promise or something like that

    // If the connection is successful, initialize a publisher and publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);

    }
  });
   

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
  // var webcamButton = document.getElementById("webcam");
  // webcamButton.onclick = initializeSession;
  initYdoc();
}

function init() {
 // document.getElementById("webcam").style.visibility = "visible";
  container = document.getElementById("container");

  threeCam = new THREE.Camera();
  threeCam.position.z = 1;

  var video = document.querySelector( 'video' );
  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_camRot: { type: "v3", value: new THREE.Vector3() },
    u_feed: {type: "", value: new THREE.VideoTexture( video )},
    u_feed0: {type: "", value: new THREE.VideoTexture( video )},
    u_feed1: {type: "", value: new THREE.VideoTexture( video )},
    u_feed2: {type: "", value: new THREE.VideoTexture( video )},
    u_feed3: {type: "", value: new THREE.VideoTexture( video )},
    u_feed4: {type: "", value: new THREE.VideoTexture( video )},
    u_feed5: {type: "", value: new THREE.VideoTexture( video )},
    u_feed6: {type: "", value: new THREE.VideoTexture( video )},
    u_feed7: {type: "", value: new THREE.VideoTexture( video )},
    u_feed8: {type: "", value: new THREE.VideoTexture( video )},
    u_feed9: {type: "", value: new THREE.VideoTexture( video )}

  };

  uniformVideos [0] = uniforms.u_feed.value;
  uniformVideos [1] = uniforms.u_feed0.value;

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
