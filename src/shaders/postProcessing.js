// ═══════════════════════════════════════════════════════════════════════════
// POST-PROCESSING SHADERS
// ═══════════════════════════════════════════════════════════════════════════

export const VignetteFS = {
  uniforms: {
    tDiffuse: { value: null },
    uI: { value: 0.42 },
  },
  vertexShader: `
    varying vec2 v;
    void main(){
      v = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uI;
    varying vec2 v;
    void main(){
      vec4 c = texture2D(tDiffuse, v);
      vec2 u = v * (1. - v.yx);
      c.rgb *= pow(u.x * u.y * 15., uI * 0.45);
      gl_FragColor = c;
    }`,
};

export const GrainFS = {
  uniforms: {
    tDiffuse: { value: null },
    uT: { value: 0 },
    uI: { value: 0.04 },
  },
  vertexShader: `
    varying vec2 v;
    void main(){
      v = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uT, uI;
    varying vec2 v;
    float h(vec2 p){
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    void main(){
      vec4 c = texture2D(tDiffuse, v);
      c.rgb += (h(v * 1e3 + uT * 137.) * 2. - 1.) * uI;
      gl_FragColor = c;
    }`,
};

export const ChromaFS = {
  uniforms: {
    tDiffuse: { value: null },
    uO: { value: 0.0005 },
  },
  vertexShader: `
    varying vec2 v;
    void main(){
      v = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uO;
    varying vec2 v;
    void main(){
      vec2 d = v - .5;
      float l = length(d);
      float o = uO * l;
      gl_FragColor = vec4(
        texture2D(tDiffuse, v + d * o).r,
        texture2D(tDiffuse, v).g,
        texture2D(tDiffuse, v - d * o).b,
        1.
      );
    }`,
};
