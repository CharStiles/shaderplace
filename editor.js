/* eslint-env browser */

// @ts-ignore
import CodeMirror from 'codemirror'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodemirrorBinding } from 'y-codemirror'
import 'codemirror/mode/clike/clike.js'
import __fragmentShader from './fragmentShader.js'
import * as THREE from 'three';

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

window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    'wss://demos.yjs.dev',
    'codemirror-demo',
    ydoc
  )
  const editorContainer = document.createElement('div')
  editorContainer.setAttribute('id', 'editor')
  document.body.insertBefore(editorContainer, null)

  editor = CodeMirror(editorContainer, {
    value: _fragmentShader,
    lineNumbers: true,
    mode: "x-shader/x-vertex"
  })
  
  const ytext = ydoc.getText('codemirror')
  // ytext.delete(0)
  //ytext.insert(0, _fragmentShader)
  const binding = new CodemirrorBinding(ytext, editor, provider.awareness)
  editor.setValue(_fragmentShader)
  // @ts-ignore
  window.example = { provider, ydoc, ytext, binding, Y }
  editor.on('change', onEdit);
  onEdit();
  init();
  animate();
})

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
  geometry = new THREE.PlaneBufferGeometry( 2, 2 );
  
  try {
    material = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader()
    } );
    

    
  } catch (e) {
    console.log("MY ERROR", e);
    return;
  }
  
  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );
  
  // shaderDirtyFlag = false;
}
function init(){
  
  container = document.getElementById( 'container' );

  threeCam = new THREE.Camera();
  threeCam.position.z = 1;
  
  // video = document.querySelector( 'video' );
  // feed = new THREE.VideoTexture( video );

  uniforms = {    
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_camRot: {type: "v3", value: new THREE.Vector3() },
    // u_feed: {type: "", value: new THREE.VideoTexture(video)}
  };
  
  updateScene();
  container = document.getElementById( 'container' );
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  
  gl = renderer.getContext();
  
  container.appendChild( renderer.domElement );
  
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize( event ) {
  renderer.setSize( window.innerWidth, window.innerHeight );
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  if (isDirty) {
    updateScene();
  }
  uniforms.u_time.value += 0.05;
  // uniforms.u_feed.value = feed;
  renderer.render( scene, threeCam );
}


function vertexShader() {
  return `        
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
  `
}

function fragmentShader() {

  return _fragmentShader;
}


// this returns false if the fragment shader cannot compile
// true if it can
function checkFragmentShader(shaderCode) {
  if (!gl) { return }
  let shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);

  let result = gl.getShaderParameter( shader, gl.COMPILE_STATUS );
  if (! result)
    console.log(gl.getShaderInfoLog(shader));

  return result;
}
