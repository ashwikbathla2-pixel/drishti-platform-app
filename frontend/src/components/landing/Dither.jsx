import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_mouseOn;
uniform vec3  u_wave;
uniform float u_speed;
uniform float u_freq;
uniform float u_amp;
uniform float u_colorNum;
uniform float u_pixel;
uniform float u_mouseRadius;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
float pattern(vec2 p){
  float t = u_time * u_speed;
  vec2 q = vec2(fbm(p - t), fbm(p + t));
  return fbm(p + q * 2.2);
}
// compact ordered (Bayer) dither
float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer8(vec2 a){
  float b2 = bayer2(a);
  float b4 = bayer2(0.5 * a) * 0.25 + b2;
  return bayer2(0.25 * a) * 0.25 * 0.25 + b4 * 0.25 + b2 * 0.0 + b4;
}

void main(){
  vec2 frag = floor(gl_FragCoord.xy / u_pixel) * u_pixel;
  vec2 uv = frag / u_res;
  vec2 p = uv * u_freq;
  p.x *= u_res.x / u_res.y;

  // mouse push
  if(u_mouseOn > 0.5){
    vec2 m = u_mouse;
    m.x *= u_res.x / u_res.y;
    float d = distance(p, m);
    float infl = smoothstep(u_mouseRadius, 0.0, d);
    p += normalize(p - m + 0.0001) * infl * 0.6;
  }

  float f = pattern(p) * (1.0 + u_amp);
  f = clamp(f, 0.0, 1.0);

  float threshold = bayer8(gl_FragCoord.xy / u_pixel) - 0.5;
  float v = f + threshold / u_colorNum;
  v = floor(v * u_colorNum) / u_colorNum;
  v = clamp(v, 0.0, 1.0);

  vec3 col = mix(vec3(0.0), u_wave, v);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("shader error", gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export function Dither({
  waveColor = [0.902, 0.753, 0.459],
  waveSpeed = 0.12,
  waveFrequency = 3.0,
  waveAmplitude = 0.3,
  colorNum = 4,
  pixelSize = 2,
  mouseRadius = 0.7,
  enableMouseInteraction = true,
}) {
  const canvasRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) return;
    mounted.current = true;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n) => gl.getUniformLocation(prog, n);
    const u = {
      time: U("u_time"), res: U("u_res"), mouse: U("u_mouse"), mouseOn: U("u_mouseOn"),
      wave: U("u_wave"), speed: U("u_speed"), freq: U("u_freq"), amp: U("u_amp"),
      colorNum: U("u_colorNum"), pixel: U("u_pixel"), mouseRadius: U("u_mouseRadius"),
    };

    let mouse = [0.5, 0.5];
    let mouseOn = 0;
    const onMove = (e) => {
      if (!enableMouseInteraction) return;
      const r = canvas.getBoundingClientRect();
      mouse = [((e.clientX - r.left) / r.width) * waveFrequency, (1 - (e.clientY - r.top) / r.height) * waveFrequency];
      mouseOn = 1;
    };
    const onLeave = () => { mouseOn = 0; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    let raf;
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform2f(u.mouse, mouse[0], mouse[1]);
      gl.uniform1f(u.mouseOn, mouseOn);
      gl.uniform3f(u.wave, waveColor[0], waveColor[1], waveColor[2]);
      gl.uniform1f(u.speed, waveSpeed);
      gl.uniform1f(u.freq, waveFrequency);
      gl.uniform1f(u.amp, waveAmplitude);
      gl.uniform1f(u.colorNum, colorNum);
      gl.uniform1f(u.pixel, pixelSize);
      gl.uniform1f(u.mouseRadius, mouseRadius);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" />;
}

export default Dither;
