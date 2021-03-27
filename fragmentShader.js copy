
var _fragmentShader = `      
      
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec4 u_camRot;
uniform vec4 u_camQuat;
uniform vec3 u_camPos;
uniform float u_vol;

uniform sampler2D u_feed;
#define PI 3.14159265
#define TAU (2*PI)
#define PHI (sqrt(5)*0.5 + 0.5)
// Define some constants
const int steps = 128; // This is the maximum amount a ray can march.
const float smallNumber = 0.001;
const float maxDist = 10.; // This is the maximum distance a ray can travel.
 

vec3 rotateQuat( vec4 quat, vec3 vec )
{
return vec + 2.0 * cross( cross( vec, quat.xyz ) + quat.w * vec, quat.xyz );
}

vec3 lookAt(vec2 uv, vec3 camOrigin, vec3 camTarget){
    vec3 zAxis = normalize(camTarget - camOrigin);
    vec3 up = vec3(0,1,0);
    vec3 xAxis = normalize(cross(up, zAxis));
    vec3 yAxis = normalize(cross(zAxis, xAxis));
    
    float fov = 2.;
    
    vec3 dir = (normalize(uv.x * xAxis + uv.y * yAxis + zAxis * fov));
    
    return dir;
}

float sphere(vec3 p) {
  float l = length(p) ;
	return l - 1.5 ;
}

float scene(vec3 position){
  
    float b = sphere(vec3(
            position.x, 
            position.y, 
            position.z - 10.)
        );
 

    return b;
}

vec4 trace (vec3 origin, vec3 direction){
    
    float dist = 0.;
    float totalDistance = 0.;
    vec3 positionOnRay = origin;
    
    for(int i = 0 ; i < steps; i++){
        
        dist = scene(positionOnRay);
        
        // Advance along the ray trajectory the amount that we know the ray
        // can travel without going through an object.
        positionOnRay += dist * direction;
        
        // Total distance is keeping track of how much the ray has traveled
        // thus far.
        totalDistance += dist;
        
        // If we hit an object or are close enough to an object,
        if (dist < smallNumber){
            // return the distance the ray had to travel normalized so be white
            // at the front and black in the back.
            return 1. - (vec4(totalDistance) / maxDist);
 
        }
        
        if (totalDistance > maxDist){
 
            return texture2D(u_feed, gl_FragCoord.xy/u_resolution); // Background color.
        }
    }
    
    return texture2D(u_feed, gl_FragCoord.xy/u_resolution);
}
 
// main is a reserved function that is going to be called first
void main(void)
{
    vec2 normCoord = gl_FragCoord.xy/u_resolution;

    vec2 uv = -1. + 2. * normCoord;
    // Unfortunately our screens are not square so we must account for that.
    uv.x *= (u_resolution.x / u_resolution.y);
    
    vec3 rayOrigin = vec3(uv, 0.);
    vec3 camOrigin = u_camPos; //vec3(0., 0., -1.);
    
    

    vec3 zAxis = vec3(0,0,1);
    vec3 up = vec3(0,1,0);
    vec3 xAxis = normalize(cross(up, zAxis));
    vec3 yAxis = normalize(cross(zAxis, xAxis));

    // we need to apply rotate 3 times each with rotation on the relative object, 
    // then we can get the lookat direction that we need. SO lets start with looking at forward

    vec3 dirToLook = zAxis;//normalize(camOrigin + rayOrigin);
    dirToLook = rotateQuat(u_camQuat,dirToLook);    


    // according to 3js docs Default order is 'XYZ'

    vec3 dir = lookAt(uv, camOrigin, dirToLook);

    // ((Hello This is CARL! The performance is about to begin :))
    gl_FragColor = trace(camOrigin, dir);
}

`;