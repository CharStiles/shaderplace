
var _fragmentShader = `      
      
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// main is a reserved function that is going to be called first
void main(void)
{
    vec2 normCoord = gl_FragCoord.xy/u_resolution;
    
    float time = u_time/5.0; //slow down time

    vec2 uv = -1. + 2. * normCoord;
    float r = sin(time + uv.x); 
    // x is left to right, why we see red moving from right to left think about us as a camera moving around
    // sin returns a number from -1 to 1, and colors are from 0 to 1, so it clips to no red half the time
	
	float g = sin(-time + uv.y * 20.); // higher frequency green stripes
	
	float b = mod(uv.x / uv.y,1.0);
	// when x is eual to y the colors will be brighter, mod repeats the space
	// mod is like a sawtooth function
	
    vec4 color = vec4(r,g,b,1);
    gl_FragColor = color;
}

`;

var _vertexShader = `
attribute vec2 aVertexPosition;

uniform vec2 uScalingFactor;

void main() {
  gl_Position = vec4(aVertexPosition * uScalingFactor, 0.0, 1.0);
}

`;

