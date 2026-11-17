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

// final shared grade: soft tonemap, vignette, depth darkening. Never exceeds a gentle ceiling.
vec3 finish(vec3 col, vec2 uv){
  vec3 bg = mix(vec3(0.012,0.018,0.05), vec3(0.02,0.03,0.09), smoothstep(1.2,0.,length(uv)));
  col = bg + col * (0.35 + 0.75*u_intensity);
  col = 1. - exp(-col * 1.2);
  float lum = dot(col, vec3(0.299,0.587,0.114));
  col = max(mix(vec3(lum), col, 1.45), 0.);
  float v = smoothstep(1.35, 0.15, length(uv) * (0.85 + 0.35*u_depth));
  col *= mix(0.55, 1.0, v);
  col *= 0.92 - 0.18*u_depth;
  return col * u_fade;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
  float t = u_time;
  float br = u_breath;
  vec3 col = vec3(0.);
`;

const FOOT = `
  gl_FragColor = vec4(finish(col, uv), 1.);
}
`;

// 1 — Slowly morphing Julia set rendered as nebulous orbit-trap glow
export const FRACTAL = HEAD + `
  vec2 p = rot(t*0.03) * uv;
  float zoom = 1.55 - 0.10*br*u_motion;
  vec2 z = p * zoom;
  float a = 2.25 + 0.38*sin(t*0.035) + 0.12*sin(t*0.021);
  vec2 c = 0.7885*vec2(cos(a), sin(a));
  float trap = 1e3, trap2 = 1e3, n = 0.;
  for(int i=0;i<44;i++){
    z = vec2(z.x*z.x - z.y*z.y, 2.*z.x*z.y) + c;
    trap  = min(trap,  length(z - vec2(0.15*sin(t*0.05), 0.1)));
    trap2 = min(trap2, abs(dot(z, vec2(0.7071, 0.7071)) - 0.3*cos(t*0.04)));
    if(dot(z,z) > 40.) break;
    n += 1.;
  }
  float esc = n / 44.;
  float g1 = exp(-trap * 2.6);
  float g2 = exp(-trap2 * 5.0);
  col += pal(trap*0.35 + t*0.012) * g1 * 0.45;
  col += pal(0.5 + trap2*0.3 - t*0.01) * g2 * 0.28;
  col += pal(esc*1.4 + t*0.015) * (0.08 + 0.45*pow(esc, 2.2)) * 0.45;
  float core = exp(-length(uv)*3.2) * (0.18 + 0.12*br*u_motion);
  col += pal(t*0.01) * core;
` + FOOT;

// 2 — Kaleidoscopic mandala with soft pulsing, expanding and contracting rings
export const MANDALA = HEAD + `
  float r = length(uv);
  float ang = atan(uv.y, uv.x);
  float N = 8.;
  float seg = 6.28318/N;
  float a = abs(mod(ang + t*0.025, seg) - seg*0.5);
  vec2 p = r * vec2(cos(a), sin(a));
  p *= 1.7 + 0.18*br*u_motion;
  vec2 q = p;
  float acc = 0.;
  for(int i=0;i<5;i++){
    q = abs(q) - vec2(0.42 + 0.05*sin(t*0.07 + float(i)), 0.18);
    q = rot(0.55 + 0.12*sin(t*0.04) + float(i)*0.18) * q;
    float d = abs(q.x*q.y);
    acc += exp(-d*14.0) * (0.55 / (1. + float(i)*0.6));
    col += pal(float(i)*0.17 + r*0.5 - t*0.015) * exp(-abs(q.y)*14.0) * 0.16;
  }
  col += pal(r*0.4 + t*0.012) * acc * 0.38;
  // rings drifting outward, breathing with the cycle
  float rings = 0.;
  for(int k=0;k<4;k++){
    float ph = fract(t*0.018 + float(k)*0.25);
    float rr = ph * 1.1 + 0.05*br*u_motion;
    rings += exp(-pow((r - rr)*9., 2.)) * sin(3.14159*ph);
  }
  col += pal(0.7 - r*0.6 + t*0.01) * rings * 0.35;
  col += pal(t*0.01 + 0.3) * exp(-r*4.0) * (0.35 + 0.15*br*u_motion);
` + FOOT;

// 3 — Aurora: flowing curtains of light over domain-warped gradients
export const AURORA = HEAD + `
  vec2 p = uv;
  float flow = t*0.045;
  vec2 w = vec2(fbm(p*1.3 + vec2(flow, -flow*0.7)), fbm(p*1.3 + vec2(-flow*0.8, flow + 4.2)));
  float n = fbm(p*1.1 + w*1.6 + vec2(0., flow*0.5));
  for(int i=0;i<3;i++){
    float fi = float(i);
    float y = p.y - (fi-1.)*0.28 - 0.16*sin(p.x*2.1 + t*0.07 + fi*2.1) - (n-0.5)*0.55 + 0.03*br*u_motion;
    float band = exp(-y*y*14.0);
    float ray = 0.6 + 0.4*noise(vec2(p.x*7. + fi*3., t*0.05));
    col += pal(fi*0.33 + n*0.45 + t*0.01) * band * ray * (0.45 + 0.5*n);
  }
  col += pal(0.2 + n*0.5 - t*0.008) * pow(n, 3.0) * 0.22;
  // faint drifting stars
  vec2 gp = uv*38.;
  vec2 cell = floor(gp);
  vec2 off = vec2(hash(cell+1.7), hash(cell+9.2)) - 0.5;
  float st = step(0.93, hash(cell)) * smoothstep(0.22, 0.0, length(fract(gp) - 0.5 - off*0.5)) * (0.5+0.5*sin(t*0.3 + hash(cell+3.)*6.28));
  col += vec3(0.5,0.6,0.9) * st * 0.12;
` + FOOT;
