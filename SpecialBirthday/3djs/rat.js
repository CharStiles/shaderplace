import * as THREE from './three.js-master/build/three.module.js';
import Stats from './three.js-master/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js';
// import __fragmentShader from "./fragmentShader.js";
// import __vertShader from "./vertShader.js";
import { FBXLoader } from './three.js-master/examples/jsm/loaders/FBXLoader.js';

const _vertShader = `
varying vec2 v_uv;
uniform float interp;
void main() {
  v_uv = uv;
  vec3 pos = position;
  pos.z -= 0.2;
  vec3 newPos = vec3(sign(pos.x)* ceil(pos.x),sign(pos.y)* ceil(pos.y), ceil(pos.z));
  newPos *=2.6;
  newPos -=1.5;
  newPos.x +=.5;
  newPos.y -=1.2 ;
  newPos.y *=1.25 ;
  newPos.z -=2.2;
  newPos.z *=1.2;
  vec4 nicePos =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec4 cubePos =  projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  gl_Position = mix(cubePos, nicePos,clamp(interp,0.,1.));

}
`
const _fragmentShader = `
varying vec2 v_uv;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform float u_time;

void main() {
  vec2 v = u_mouse / u_resolution;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  gl_FragColor = vec4(uv.x,uv.y, sin(u_time /2.) + 0.5, 1.0).rgba;
}
`

document.addEventListener( 'click', startAnimation, true);


const uniforms = {
  u_mouse: { value: { x: window.innerWidth / 2, y: window.innerHeight / 2 } },
	u_resolution: { value: { x: window.innerWidth, y: window.innerHeight } },
  u_time: { value: 0.0 },
  interp: { value: 0.0 },
  u_color: { value: new THREE.Color(0xFF0000) }
}


var animationStart = false;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 50);
//var uniforms;

camera.position.z = 5;
camera.position.y = 2;
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: document.getElementById('gl-canvas')
});
//gl = renderer.getContext();

// renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(512, 512);
renderer.setClearColor(0x000000, 1);
var clock = new THREE.Clock();
var mixer;
// const loaderImg = new THREE.TextureLoader();
//   loaderImg.load('assets/backgrounds/golan.jpg', function(bg) {
//     scene.background = bg;
//     scene.background.needsUpdate = true;
//   });

scene.background = new THREE.Color( 0x33333333 );

var orbit = new OrbitControls(camera, renderer.domElement);

var lights = [];
// lights[0] = new THREE.PointLight(0xffff00, 1, 0);
 //lights[1] = new THREE.PointLight(0xff00ff, 1, 0);
// lights[2] = new THREE.PointLight(0x00ffff, 1, 0);
lights[0] = new THREE.PointLight(0xaeecee, 1, 0);
lights[1] = new THREE.PointLight(0x999999, 1, 0);
//lights[2] = new THREE.PointLight(0xccffff,1, 0 );
lights[0].position.set(0, 200, 0);
//lights[1].position.set(100, 200, 100);
//lights[2].position.set(-100, -200, -100);

scene.add(lights[0]);
scene.add(lights[1]);
//scene.add(lights[2]);
var backgrounds = [
  'snowflakes.jpg',
  'hearth.jpg',
  'leaves.jpg',
  'winter_landscape.jpg'
];
var backgroundPreviews = document.getElementsByClassName('background-preview');

var group = new THREE.Group();

var geometry = new THREE.BufferGeometry();
geometry.addAttribute('position', new THREE.Float32BufferAttribute([], 3));

var lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5
});
var meshMaterial = new THREE.MeshPhongMaterial({
  color: 0xffff00,
  emissive: 0xccce00,
  side: THREE.DoubleSide,
  flatShading: true
});


group.add(new THREE.LineSegments(geometry, lineMaterial));
group.add(new THREE.Mesh(geometry, meshMaterial));
var loadedRat = false;
var texture;
var curSrc = "";

function setBackgroundImage (event){
  const loaderImg = new THREE.TextureLoader();
  loaderImg.load('assets/backgrounds/golan.jpg', function(bg) {
    scene.background = bg;
    scene.background.needsUpdate = true;
  });
  //   var inNum = 0;
  // for (let i = 0; i < backgroundPreviews.length; i++) {
  //   let bg = backgroundPreviews[i];
  //   var bgn= bg.getAttribute("data-backgroundName")

  //   if (bg.classList.contains('background-preview-active')) {
  //       if (bgn != curSrc){
  //         const loaderImg = new THREE.TextureLoader();
  //         loaderImg.load('assets/backgrounds/' + bgn, function(bg) {
  //           scene.background = bg;
  //           scene.background.needsUpdate = true;
  //         });
  //         curSrc = bgn;
  //       }
  //   }
  // }
}



function loadRat() {

  

  // let ratvas = document.getElementById('ratvas'); // get the canvas and connect to texture
  // let ctx = ratvas.getContext('2d');

  // texture = new THREE.CanvasTexture(ctx.canvas); //,THREE.UVMapping,THREE.RepeatWrapping,THREE.RepeatWrapping);
  // const material = new THREE.MeshBasicMaterial({
  //   map: texture
  // });
  // texture.needsUpdate = true;
  var textureRat = new THREE.TextureLoader().load( './3dAssets/ratTex.png' );
  var loader = new FBXLoader();
    console.log("in set load");

  loader.load('./3dAssets/sweaterFinal.fbx', function(object) {

    object.traverse(function(child) {
      if (child.isMesh) {
        child.material =  new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertShader(),
          fragmentShader: fragmentShader()
        });
        child.geometry.uvsNeedUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(object);
  });
let objectTD = new THREE.Object3D();
  loader.load('./3dAssets/rat_moves.fbx', function(object) {

    object.traverse(function(child) {
      if (child.isMesh) {
        var diffuseColor = new THREE.Color().setHSL(Math.random(), 0.3, 0.8);
        child.material = new THREE.MeshToonMaterial({
          map: textureRat,
          reflectivity: 0.0,
          shininess: 0.0,
          bumpScale: 1.0
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
     //objectTD = object;
     // mixer = new THREE.AnimationMixer( object );
     // var action = mixer.clipAction( object.animations[ 0 ] );
     // action.play();
    group.add(object);
  });
}
//var options = chooseFromHash( group );

// scene.background.warpS = scene.background.warpT = THREE.RepeatWrapping;
// scene.background.repeat.set(30,30);
group.position.y -= 0.8;
scene.add(group);

var prevFog = false;

var render = function() {
  uniforms.u_time.value += 0.05;

 // uniforms.time.value += 0.05;
  // we need all the p5 code in canvas.js to run before we can grab the canvas
if (loadedRat == false ) {
    loadRat();
    loadedRat = true;
 }
  // if (loadedRat == true) {
  //   texture.needsUpdate = true;
  // }
  requestAnimationFrame(render);

    //floating around
    if(animationStart){
      uniforms.interp.value += 0.005;
      group.rotation.y += 0.02;
      var x = document.getElementById("title");
      var y = document.getElementById("mar");
      var z = document.getElementById("around");
              
      //if (x.innerHTML === "Welcome to GeeksforGeeks") {
          x.innerHTML = "HAPPY BIRTHDAY!!";

          y.innerHTML ="I Hope Your Birthday Is Filled with Surprises!!!!"
          z.innerHTML ="WHO KNEW THE SPINNING CUBE WAS A RAT ALL ALONG"
      
    }
    else{
      group.rotation.z += 0.001;
    }
    group.rotation.x += Math.sin(group.rotation.z * 10) * 0.0001;
  group.position.y += Math.sin(group.rotation.z * 5) * 0.0001;
   
  //  var delta = clock.getDelta();
  // if ( mixer ) mixer.update( delta );
  renderer.render(scene, camera);

};
function fragmentShader() {
  return _fragmentShader;
}
function vertShader() {
  return _vertShader;
}

function startAnimation(){

  animationStart = true;
}

window.addEventListener(
  'resize',
  function() {
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
  // uniforms.resolution.value.x = renderer.domElement.width;
  // uniforms.resolution.value.y = renderer.domElement.height;
    //renderer.setSize( window.innerWidth, window.innerHeight );
  },
  false
);

render();