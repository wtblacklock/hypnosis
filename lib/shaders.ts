export const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const HEAD = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_breath;
uniform float u_depth;
uniform float u_intensity;
uniform float u_motion;
uniform float u_fade;
uniform float u_zp;
uniform float u_sp;
uniform float u_rot;
uniform vec2 u_zc;
uniform vec3 u_c0; uniform vec3 u_c1; uniform vec3 u_c2;

mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

vec3 pal(float t){
  float w0 = 0.5+0.5*cos(6.28318*t);
  float w1 = 0.5+0.5*cos(6.28318*(t-0.3333));
  float w2 = 0.5+0.5*cos(6.28318*(t-0.6666));
  return (u_c0*w0 + u_c1*w1 + u_c2*w2) / (w0+w1+w2);
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for(int i=0;i<5;i++){ v += a*noise(p); p = rot(.5)*p*2.02; a *= .5; }
  return v;
}

// Shared grade: hue-preserving highlight compression, saturation, vignette. Never exceeds a gentle ceiling.
vec3 finish(vec3 col, vec2 uv){
  vec3 bg = mix(vec3(0.012,0.018,0.05), vec3(0.02,0.03,0.09), smoothstep(1.2,0.,length(uv)));
  col = bg + col * (0.25 + 0.85*u_intensity);
  float mx = max(max(col.r, col.g), col.b);
  col *= (1. - exp(-mx * 1.15)) / max(mx, 1e-3);
  col = pow(col, vec3(1.45)) * 1.45;
  col = min(col, vec3(0.9));
  float lum = dot(col, vec3(0.299,0.587,0.114));
  col = max(mix(vec3(lum), col, 1.3), 0.);
  float v = smoothstep(1.35, 0.15, length(uv) * (0.85 + 0.35*u_depth));
  col *= mix(0.62, 1.0, v);
  col *= 1.0 - 0.10*u_depth;
  return col * u_fade;
}
`;

const MAIN_PLAIN = `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
  gl_FragColor = vec4(finish(scene(uv, 1.0), uv), 1.);
}
`;

// Endless tunnel zoom: two copies of the scene a half-octave apart, cross-faded so the descent never ends.
const MAIN_ZOOM = `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
  float K = 5.0;
  float ph = fract(u_zp), ph2 = fract(u_zp + 0.5);
  float w = pow(sin(3.14159265*ph), 2.0);
  float s1 = pow(K, ph), s2 = pow(K, ph2);
  vec3 col = scene(uv / s1, s1) * w + scene(uv / s2, s2) * (1.0 - w);
  gl_FragColor = vec4(finish(col, uv), 1.);
}
`;

// 1 — Julia fractal: kaleidoscope-centred, zooming into the repelling fixed point (always on the set), hairline filaments
export const FRACTAL = HEAD + `
vec3 scene(vec2 uv, float s){
  float t = u_time, br = u_breath;
  vec3 col = vec3(0.);
  float r0 = length(uv) + 1e-5;
  float an = atan(uv.y, uv.x);
  float N = 6.;
  float sg = 6.28318/N;
  float aa = abs(mod(an + u_rot, sg) - sg*0.5);       // mirror-fold: image is always centred, rotates with spin
  float phi0 = atan(-u_zc.y, -u_zc.x) - sg*0.25;      // aim the wedge from the pivot toward the middle of the set
  vec2 p = r0 * vec2(cos(aa + phi0), sin(aa + phi0)) * 1.6;
  vec2 z = u_zc + p;
  vec2 dz = vec2(1., 0.);
  float a = 2.25 + 0.22*sin(t*0.035) + 0.08*sin(t*0.021);
  vec2 c = 0.7885*vec2(cos(a), sin(a));
  float trap = 1e3, n = 0.;
  bool esc = false;
  for(int i=0;i<90;i++){
    dz = 2.*vec2(z.x*dz.x - z.y*dz.y, z.x*dz.y + z.y*dz.x);
    z = vec2(z.x*z.x - z.y*z.y, 2.*z.x*z.y) + c;
    trap = min(trap, abs(length(z) - 0.9 - 0.2*sin(t*0.05)));
    if(dot(z,z) > 400.){ esc = true; break; }
    n += 1.;
  }
  float lz = length(z);
  float nsm = n + 1.0 - log2(log2(max(lz, 1.0001)));   // smooth iteration count: no banding
  float de = esc ? 0.5*lz*log(lz)/max(length(dz), 1e-6) : 0.;
  float pix = 1.6 / (s * min(u_res.x, u_res.y));
  float d = de / pix;                                   // distance to the set in screen pixels
  col += pal(nsm*0.012 + r0*s*0.5 + t*0.014) * exp(-d*1.9) * 1.5;           // crisp filaments
  col += pal(0.45 + nsm*0.006 + r0*s*0.3 - t*0.01) * exp(-d*0.22) * 0.30;       // soft aura
  col += pal(0.2 + trap*0.4 + t*0.012) * exp(-trap*3.0) * (esc ? 0.0 : 0.6);   // calm interior glow
  col += pal(t*0.01) * exp(-r0*s*2.6) * (0.2 + 0.12*br*u_motion);
  return col;
}
` + MAIN_ZOOM;

// 2 — Kaleidoscopic mandala: twelve-fold folds, rings breathing in and out, endless tunnel zoom
export const MANDALA = HEAD + `
vec3 scene(vec2 uv, float s){
  float t = u_time, br = u_breath;
  vec3 col = vec3(0.);
  float r = length(uv);
  float ang = atan(uv.y, uv.x) + 0.6*sin(r*2.0 - t*0.04)*u_motion;
  float N = 12.;
  float seg = 6.28318/N;
  float a = abs(mod(ang + u_rot, seg) - seg*0.5);
  vec2 p = r * vec2(cos(a), sin(a));
  p *= 1.9 + 0.2*br*u_motion;
  vec2 q = p;
  float acc = 0.;
  for(int i=0;i<7;i++){
    q = abs(q) - vec2(0.40 + 0.06*sin(t*0.07 + float(i)), 0.17);
    q = rot(0.55 + 0.14*sin(t*0.04) + float(i)*0.2) * q;
    float d = abs(q.x*q.y);
    acc += exp(-d*48.0*s) * (0.9 / (1. + float(i)*0.45));
    col += pal(float(i)*0.15 + r*0.5 - t*0.018) * exp(-abs(q.y)*40.0*s) * 0.16;
  }
  col += pal(r*0.4 + t*0.014) * acc * 0.55;
  float rings = 0.;
  for(int k=0;k<6;k++){
    float ph = fract(u_zp*0.7 + float(k)/6.);
    float rr = ph * 1.25 + 0.06*br*u_motion;
    rings += exp(-pow((r - rr)*8.*s, 2.)) * sin(3.14159*ph);
  }
  col += pal(0.7 - r*0.6 + t*0.012) * rings * 0.26;
  col += pal(t*0.012 + 0.3) * exp(-r*s*3.4) * (0.35 + 0.15*br*u_motion);
  return col;
}
` + MAIN_ZOOM;

// 3 — Aurora: layered curtains of light over domain-warped gradients
export const AURORA = HEAD + `
vec3 scene(vec2 uv, float s){
  float t = u_time, br = u_breath;
  vec3 col = vec3(0.);
  vec2 p = uv * (1.0 + 0.12*sin(t*0.02));
  float flow = t*0.05;
  vec2 adv = vec2(-u_rot*0.5, u_zp*0.4);
  vec2 w = vec2(fbm(p*1.3 + adv + vec2(flow, -flow*0.7)), fbm(p*1.3 + adv + vec2(-flow*0.8, flow + 4.2)));
  float n = fbm(p*1.1 + adv + w*2.0 + vec2(0., flow*0.5));
  for(int i=0;i<5;i++){
    float fi = float(i);
    float y = p.y - (fi-2.)*0.22 - 0.18*sin(p.x*2.1 + t*0.07 + fi*1.7) - (n-0.5)*0.6 + 0.04*br*u_motion;
    float band = exp(-y*y*(12.0 + fi*3.0));
    float ray = 0.55 + 0.45*noise(vec2(p.x*8. + fi*3., t*0.05 + fi));
    col += pal(fi*0.2 + n*0.45 + t*0.012) * band * ray * (0.5 + 0.7*n);
  }
  col += pal(0.2 + n*0.5 - t*0.01) * pow(n, 2.6) * 0.4;
  vec2 gp = uv*38.;
  vec2 cell = floor(gp);
  vec2 off = vec2(hash(cell+1.7), hash(cell+9.2)) - 0.5;
  float st = step(0.93, hash(cell)) * smoothstep(0.22, 0.0, length(fract(gp) - 0.5 - off*0.5)) * (0.5+0.5*sin(t*0.3 + hash(cell+3.)*6.28));
  col += vec3(0.5,0.6,0.9) * st * 0.16;
  return col;
}
` + MAIN_PLAIN;

// 4 — Electric Sheep: folded-inversion flame fractal, razor-sharp glowing filaments, tunnel zoom
export const SHEEP = HEAD + `
vec3 scene(vec2 uv, float s){
  float t = u_time, br = u_breath;
  vec3 col = vec3(0.);
  vec2 p = rot(-u_rot*0.67) * uv * 1.25;
  vec2 K = vec2(0.92 + 0.10*sin(t*0.031), 0.58 + 0.09*cos(t*0.027));
  float pl = 0., acc = 0., mn = 1e9, mn2 = 1e9;
  for(int i=0;i<7;i++){
    p = abs(p) / max(dot(p,p), 8e-2) - K;
    float l = length(p);
    acc += abs(l - pl);
    pl = l;
    mn  = min(mn,  abs(p.x*p.y));
    mn2 = min(mn2, abs(p.x) + abs(p.y) - 0.6);
  }
  col += pal(acc*0.011 + t*0.012) * pow(clamp(acc*0.016, 0., 1.), 3.0) * 0.12;
  col += pal(0.33 + mn*0.4 - t*0.01) * exp(-mn*30.0*s) * 1.0;
  col += pal(0.66 + t*0.01) * exp(-abs(mn2)*34.0*s) * 0.4;
  col += pal(t*0.01) * exp(-length(uv)*3.0) * (0.2 + 0.1*br*u_motion);
  return col;
}
` + MAIN_ZOOM;

// 5 — Tunnel: log-polar infinite descent through self-similar kaleidoscopic corridors
export const TUNNEL = HEAD + `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
  float t = u_time, br = u_breath;
  float r = length(uv) + 1e-4;
  float ang = atan(uv.y, uv.x);
  float N = 8.;
  vec2 q = vec2(log(r)*1.25 - u_zp*3.0, ang*N/6.28318 + u_rot*0.67 + 0.3*sin(log(r)*2.0 - u_zp*6.0)*u_motion);
  vec2 g = fract(q) - 0.5;
  float acc = 0., mn = 1e9;
  vec2 p = g * 1.6;
  for(int i=0;i<7;i++){
    p = abs(p) - vec2(0.55 + 0.08*sin(t*0.05 + float(i)), 0.28);
    p = rot(0.6 + 0.2*sin(t*0.03) + float(i)*0.35) * p;
    mn = min(mn, abs(p.x*p.y));
    acc += exp(-abs(p.y)*18.0) / (1. + float(i)*0.5);
  }
  vec3 col = pal(q.x*0.07 + t*0.012) * (acc*0.22 + exp(-mn*22.0)*0.6);
  col += pal(0.5 + q.x*0.03 - t*0.01) * exp(-mn*90.0) * 0.6;
  col *= mix(0.25, 1.0, smoothstep(0.0, 0.5, r));
  col += pal(t*0.012) * exp(-r*5.0) * (0.55 + 0.25*br*u_motion);
  gl_FragColor = vec4(finish(col, uv), 1.);
}
`;

// 6 — Hypnosis spiral: logarithmic spiral arms flowing slowly inward or outward, colours drifting through the palette
export const SPIRAL = HEAD + `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
  float t = u_time, br = u_breath;
  float r = length(uv) + 1e-4;
  float ang = atan(uv.y, uv.x);
  float lr = log(r);
  float b = 1.15 + 0.35*sin(t*0.018) + 0.05*br*u_motion;      // tightness slowly breathes
  float f  = 6.*(ang + u_rot)/6.28318 - b*lr*1.6 - 3.*u_sp;
  float f2 = -4.*(ang + u_rot)/6.28318 - b*lr*1.1 - 2.*u_sp;
  float v  = 0.5 + 0.5*cos(6.28318*f);
  float v2 = 0.5 + 0.5*cos(6.28318*f2);
  float arm  = smoothstep(0.28, 0.72, v);
  float arm2 = smoothstep(0.7, 0.98, v2);
  float edge = smoothstep(0.0, 0.1, r) * (0.35 + 0.65*smoothstep(1.5, 0.15, r));
  float hue = lr*0.22 + t*0.02;                               // colour glides outward and through time
  vec3 col = pal(hue) * arm * 0.75 * edge;
  col += pal(hue + 0.5) * arm2 * 0.35 * edge;
  col += pal(hue + 0.25) * pow(v, 6.) * 0.35 * edge;           // luminous arm cores
  col += pal(t*0.02 + 0.2) * exp(-r*5.0) * (0.7 + 0.3*br*u_motion);
  gl_FragColor = vec4(finish(col, uv), 1.);
}
`;
