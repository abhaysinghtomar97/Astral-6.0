import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import {
  EARTH_RADIUS, CAM_DIST, SAT_POOL, DEBRIS_N, PHASES, FOV_MAP,
  C, ORBIT_DEFS, ATMO,
} from "../constants/design.js";
import {
  clamp, remap, lerp, smootherstep, outExpo,
  randOnSphere, prng, orbitPos, satPos,
} from "../utils/math.js";
import { VignetteFS, GrainFS, ChromaFS } from "../shaders/postProcessing.js";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS (module-level, not exported — used only by AstralEngine)
// ═══════════════════════════════════════════════════════════════════════════

function buildStars() {
  const rng = prng(99), N = 5000;
  const p  = new Float32Array(N * 3);
  const s  = new Float32Array(N);
  const a  = new Float32Array(N);
  const tw = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const v = randOnSphere(85 + rng() * 100, rng);
    p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
    s[i]  = rng() * 2.0 + 0.3;
    a[i]  = rng() * 0.6 + 0.4;
    tw[i] = 0.15 + rng() * 1.5;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p,  3));
  g.setAttribute("size",     new THREE.BufferAttribute(s,  1));
  g.setAttribute("alpha",    new THREE.BufferAttribute(a,  1));
  g.setAttribute("twinkle",  new THREE.BufferAttribute(tw, 1));
  return g;
}

function generateSats(orbits, rng) {
  const sats = [];
  let id = 0;

  orbits.forEach((o, oi) => {
    const n = oi < 4 ? 1 : Math.ceil(SAT_POOL / orbits.length);
    for (let j = 0; j < n && id < SAT_POOL; j++) {
      sats.push({
        id: id++, oi,
        r: EARTH_RADIUS * o.r, inc: o.inc, asc: o.asc,
        phase: (j / n) * Math.PI * 2 + rng() * 0.4,
        speed: 0.08 + rng() * 0.08,
        size:  0.018 + rng() * 0.012,
      });
    }
  });

  while (sats.length < SAT_POOL) {
    const oi = Math.floor(rng() * orbits.length);
    const o  = orbits[oi];
    sats.push({
      id: sats.length, oi,
      r: EARTH_RADIUS * o.r, inc: o.inc, asc: o.asc,
      phase: rng() * Math.PI * 2,
      speed: 0.08 + rng() * 0.08,
      size:  0.018 + rng() * 0.012,
    });
  }

  return sats.slice(0, SAT_POOL);
}

// ═══════════════════════════════════════════════════════════════════════════
// ASTRAL ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class AstralEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock  = new THREE.Clock();

    // State fed from React each frame
    this.progress       = 0;
    this.mx = 0; this.my = 0;
    this.isScrolling    = true;
    this.isDragging     = false;
    this.dragDX = 0; this.dragDY = 0;
    this.scrollVelocity = 0;
    this.disposed       = false;
    this.currentFov     = FOV_MAP[0];

    // Reusable scratch objects (avoids GC pressure)
    this._d  = new THREE.Object3D();
    this._tc = new THREE.Color();
    this._tv = new THREE.Vector3();
    this._tv2= new THREE.Vector3();

    // Camera state
    this.camSph       = new THREE.Spherical(CAM_DIST, Math.PI / 2 - 0.08, 0);
    this.camTarget    = new THREE.Spherical(CAM_DIST, Math.PI / 2 - 0.08, 0);
    this.camUserTheta = 0;
    this.camUserPhi   = 0;
    this.camFree      = false;

    this.camLocked = [
      { th: 0,   ph: Math.PI / 2 - 0.08, d: CAM_DIST       },
      { th: 0.3, ph: Math.PI / 2,         d: CAM_DIST + 1.5 },
      { th: 0.1, ph: Math.PI / 2 - 0.12, d: CAM_DIST - 1.5 },
      { th: 0,   ph: Math.PI / 2 + 0.08, d: CAM_DIST - 3.0 },
      { th: 0,   ph: Math.PI / 2,         d: CAM_DIST + 0.5 },
    ];

    // Collision state
    this.collisionDone = false;
    this.collisionTime = 0;
    this.collisionPt   = new THREE.Vector3();
    this.collisionR    = 0;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initPost();
    this._initLights();
    this._initStars();
    this._initNebula();
    this._initEarth();
    this._initAtmo();
    this._initOrbits();
    this._initSats();
    this._initDebris();
    this._initFlash();

    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  // ── INITIALIZERS ──────────────────────────────────────────────────────────

  _initRenderer() {
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(window.innerWidth, window.innerHeight);
    r.toneMapping         = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    r.outputColorSpace    = THREE.SRGBColorSpace;
    this.renderer = r;

    this._ro = new ResizeObserver(() => {
      const w = window.innerWidth, h = window.innerHeight;
      r.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.composer?.setSize(w, h);
    });
    this._ro.observe(document.body);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.bg);
    this.scene.fog = new THREE.FogExp2(C.bg, 0.0025);
    this.root = new THREE.Group();
    this.scene.add(this.root);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      FOV_MAP[0],
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.setFromSpherical(this.camSph);
    this.camera.lookAt(0, 0, 0);
  }

  _initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.28, 1.0, 0.78
    );
    this.composer.addPass(this.bloom);

    this.chroma = new ShaderPass(ChromaFS);
    this.composer.addPass(this.chroma);

    this.vig = new ShaderPass(VignetteFS);
    this.composer.addPass(this.vig);

    this.grain = new ShaderPass(GrainFS);
    this.composer.addPass(this.grain);
  }

  _initLights() {
    this.scene.add(
      new THREE.DirectionalLight(0xfff5e0, 2.6)
        .translateX(8).translateY(4).translateZ(6)
    );
    this.scene.add(
      new THREE.DirectionalLight(0x3a6fff, 0.4)
        .translateX(-6).translateY(-2).translateZ(-4)
    );
    this.scene.add(
      new THREE.DirectionalLight(0x553399, 0.1)
        .translateY(-5).translateZ(3)
    );
    this.scene.add(new THREE.AmbientLight(0x0d1a2e, 0.85));

    this.colLight = new THREE.PointLight(0xff4400, 0, 18);
    this.root.add(this.colLight);
  }

  _initStars() {
    const g = buildStars();
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size, alpha, twinkle;
        varying float vA;
        uniform float uTime;
        void main(){
          vA = alpha * (0.5 + 0.5 * sin(uTime * twinkle + alpha * 30.));
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = size * (260. / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - .5);
          if(d > .5) discard;
          float a = smoothstep(.5, 0., d);
          gl_FragColor = vec4(mix(vec3(.7,.85,1.), vec3(1.), a), a * vA);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.starMat = m;
    this.stars   = new THREE.Points(g, m);
    this.scene.add(this.stars);
  }

  _initNebula() {
    const rng = prng(42), N = 400;
    const p = new Float32Array(N * 3), s = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const v = randOnSphere(30 + rng() * 50, rng);
      p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
      s[i] = rng() * 20 + 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("size",     new THREE.BufferAttribute(s, 1));

    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying float vA;
        uniform float uTime;
        void main(){
          vA = 0.012 * (0.8 + 0.2 * sin(uTime * 0.06 + position.x));
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = size * (160. / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - .5);
          if(d > .5) discard;
          gl_FragColor = vec4(0.12, 0.25, 0.6, smoothstep(.5, 0., d) * vA);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.nebMat = m;
    this.scene.add(new THREE.Points(g, m));
  }

  _initEarth() {
    const fg = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);
    const fm = new THREE.MeshStandardMaterial({
      color: 0x2255aa,
      roughness: 0.65,
      metalness: 0.05,
      emissive: 0x0a1530,
      emissiveIntensity: 0.12,
    });
    this.earth = new THREE.Mesh(fg, fm);
    this.root.add(this.earth);

    const cg = new THREE.SphereGeometry(EARTH_RADIUS * 1.006, 96, 96);
    const cm = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
    });
    this.clouds = new THREE.Mesh(cg, cm);
    this.root.add(this.clouds);

    new GLTFLoader().load(
      "/earth.glb",
      gltf => {
        this.root.remove(this.earth);
        const mdl = gltf.scene;
        const s = EARTH_RADIUS /
          new THREE.Box3()
            .setFromObject(mdl)
            .getBoundingSphere(new THREE.Sphere()).radius;
        mdl.scale.setScalar(s);
        mdl.traverse(c => {
          if (c.isMesh && c.material) {
            const hsl = {};
            c.material.color?.getHSL(hsl);
            if (hsl.s !== undefined) {
              c.material.color.setHSL(
                hsl.h,
                Math.min(hsl.s * 1.35, 1),
                hsl.l * 1.05
              );
            }
            c.material.needsUpdate = true;
          }
        });
        this.earth = mdl;
        this.root.add(this.earth);
      },
      undefined,
      () => {}
    );
  }

  _initAtmo() {
    this.atmoLayers = [];
    ATMO.forEach(layer => {
      const g = new THREE.SphereGeometry(EARTH_RADIUS * layer.r, 96, 96);
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(layer.color) },
          uRim:   { value: layer.rim },
          uOp:    { value: layer.op  },
          uTime:  { value: 0         },
          uWarn:  { value: 0         },
        },
        vertexShader: `
          varying vec3 vN, vP, vW;
          void main(){
            vN = normalize(normalMatrix * normal);
            vP = (modelViewMatrix * vec4(position, 1.)).xyz;
            vW = (modelMatrix    * vec4(position, 1.)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          }`,
        fragmentShader: `
          uniform vec3  uColor;
          uniform float uRim, uOp, uTime, uWarn;
          varying vec3 vN, vP, vW;
          void main(){
            float rim     = 1. - abs(dot(normalize(vN), normalize(-vP)));
            rim           = pow(rim, uRim);
            float shimmer = 1. + 0.06 * sin(uTime * 0.5 + vW.y * 5. + vW.x * 3.);
            vec3  col     = mix(uColor, vec3(0.95, 0.2, 0.05), uWarn * 0.35);
            gl_FragColor  = vec4(col, rim * uOp * shimmer);
          }`,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(g, m);
      this.root.add(mesh);
      this.atmoLayers.push({ mesh, mat: m });
    });
  }

  _initOrbits() {
    this.orbitRings = [];

    ORBIT_DEFS.forEach(o => {
      const pts = [];
      for (let i = 0; i <= 512; i++) {
        const a = (i / 512) * Math.PI * 2;
        pts.push(orbitPos(EARTH_RADIUS * o.r, o.inc, o.asc, a));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);

      const m = new THREE.ShaderMaterial({
        uniforms: {
          uColor:   { value: new THREE.Color(o.color) },
          uOpacity: { value: 0.0 },
          uTime:    { value: 0   },
          uGlow:    { value: 0.3 },
        },
        vertexShader: `
          varying float vDist;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vDist   = -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3  uColor;
          uniform float uOpacity, uTime, uGlow;
          varying float vDist;
          void main(){
            float brightness = 0.6 + 0.4 * sin(uTime * 0.3 + vDist * 2.0);
            vec3  col        = uColor * brightness + uColor * uGlow;
            gl_FragColor     = vec4(col, uOpacity * brightness);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(g, m);
      this.root.add(line);
      this.orbitRings.push({ line, mat: m, def: o });
    });

    // Danger orbit pair
    this.dangerOrbitA = { r: EARTH_RADIUS * 1.42, inc:  0.35, asc: 0.4 };
    this.dangerOrbitB = { r: EARTH_RADIUS * 1.42, inc: -0.3,  asc: 0.4 };

    [
      ["dRingA", "dRingMatA", this.dangerOrbitA],
      ["dRingB", "dRingMatB", this.dangerOrbitB],
    ].forEach(([mn, mm, o]) => {
      const pts = [];
      for (let i = 0; i <= 512; i++) {
        pts.push(orbitPos(o.r, o.inc, o.asc, (i / 512) * Math.PI * 2));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uColor:   { value: new THREE.Color("#ff2020") },
          uOpacity: { value: 0   },
          uTime:    { value: 0   },
          uGlow:    { value: 0.5 },
        },
        vertexShader: `varying float vDist;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vDist=-mv.z;gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `uniform vec3 uColor;uniform float uOpacity,uTime,uGlow;varying float vDist;void main(){float b=0.5+0.5*sin(uTime*2.+vDist*3.);vec3 c=uColor*(b+uGlow);gl_FragColor=vec4(c,uOpacity*b);}`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const l = new THREE.Line(g, m);
      this.root.add(l);
      this[mn] = l;
      this[mm] = m;
    });
  }

  _initSats() {
    const rng = prng(13);
    this.satData   = generateSats(ORBIT_DEFS, rng);
    this.activeIdx = [0, 7, 14, 22, 31, 38, 47, 55, 63, 74, 88, 101, 130, 155];

    this._buildInstanced(this._buildSatGeo());

    // Attempt to replace with GLTF satellite model
    new GLTFLoader().load(
      "/satellite.glb",
      gltf => {
        let g = null;
        gltf.scene.traverse(c => { if (c.isMesh && !g) g = c.geometry.clone(); });
        if (g) {
          g.computeBoundingSphere();
          const s = 0.045 / g.boundingSphere.radius;
          g.scale(s, s, s);
          this.root.remove(this.satInst);
          this._buildInstanced(g);
        }
      },
      undefined,
      () => {}
    );

    // Danger satellites (collision pair)
    this.dA = { r: this.dangerOrbitA.r, inc: this.dangerOrbitA.inc, asc: this.dangerOrbitA.asc, phase: 0,              speed: 0.20 };
    this.dB = { r: this.dangerOrbitB.r, inc: this.dangerOrbitB.inc, asc: this.dangerOrbitB.asc, phase: Math.PI * 0.82, speed: 0.23 };

    const dg   = this._buildSatGeo();
    this.dMatA = new THREE.MeshPhongMaterial({ color: C.satNormal, emissive: C.satNormal, emissiveIntensity: 0.3, shininess: 100 });
    this.dMatB = this.dMatA.clone();
    this.dMeshA = new THREE.Mesh(dg,         this.dMatA); this.dMeshA.scale.setScalar(2.0); this.dMeshA.visible = false;
    this.dMeshB = new THREE.Mesh(dg.clone(), this.dMatB); this.dMeshB.scale.setScalar(2.0); this.dMeshB.visible = false;
    this.root.add(this.dMeshA);
    this.root.add(this.dMeshB);

    // Replace danger sats with GLTF model if available
    new GLTFLoader().load(
      "/satellite.glb",
      gltf => {
        let g = null;
        gltf.scene.traverse(c => { if (c.isMesh && !g) g = c.geometry.clone(); });
        if (g) {
          g.computeBoundingSphere();
          const s = 0.05 / g.boundingSphere.radius;
          g.scale(s, s, s);
          this.root.remove(this.dMeshA);
          this.root.remove(this.dMeshB);
          this.dMeshA = new THREE.Mesh(g,         this.dMatA); this.dMeshA.scale.setScalar(2.0); this.dMeshA.visible = false;
          this.dMeshB = new THREE.Mesh(g.clone(), this.dMatB); this.dMeshB.scale.setScalar(2.0); this.dMeshB.visible = false;
          this.root.add(this.dMeshA);
          this.root.add(this.dMeshB);
        }
      },
      undefined,
      () => {}
    );

    // Glow sprites for danger sats
    const gt  = this._glowTex(255, 50, 30);
    this.gMA  = new THREE.SpriteMaterial({ map: gt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.gMB  = this.gMA.clone();
    this.dGlowA = new THREE.Sprite(this.gMA); this.dGlowA.scale.setScalar(0);
    this.dGlowB = new THREE.Sprite(this.gMB); this.dGlowB.scale.setScalar(0);
    this.root.add(this.dGlowA);
    this.root.add(this.dGlowB);

    // Active-satellite highlight meshes + sprites
    const ag = this._buildSatGeo();
    this.actMeshes = this.activeIdx.map(() => {
      const m = new THREE.Mesh(
        ag.clone(),
        new THREE.MeshPhongMaterial({
          color: C.satActive,
          emissive: C.satActive,
          emissiveIntensity: 2.0,
          shininess: 120,
          transparent: true,
        })
      );
      m.visible = false;
      this.root.add(m);
      return m;
    });

    const at = this._glowTex(0, 255, 200);
    this.actSprites = this.activeIdx.map(() => {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: at,
          color: 0x00ffc8,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0,
        })
      );
      sp.scale.setScalar(0.4);
      this.root.add(sp);
      return sp;
    });

    this._initFrags();
  }

  _initFrags() {
    const rng = prng(88);
    this.frags = [[], []];

    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 80; i++) {
        const g = new THREE.TetrahedronGeometry(0.006 + rng() * 0.018, 0);
        const m = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(0.04 + rng() * 0.05, 0.95, 0.35 + rng() * 0.25),
          emissive: new THREE.Color(0xff3300),
          emissiveIntensity: 2.5,
          shininess: 50,
          transparent: true,
          opacity: 0,
        });
        const mesh = new THREE.Mesh(g, m);
        mesh.visible = false;
        this.root.add(mesh);
        this.frags[s].push({
          mesh,
          mat: m,
          pos:     new THREE.Vector3(),
          vel:     new THREE.Vector3(),
          rotAxis: new THREE.Vector3(rng() - .5, rng() - .5, rng() - .5).normalize(),
          rotSpd:  (rng() - .5) * 12,
          life: 1,
        });
      }
    }
  }

  _buildSatGeo() {
    const b  = new THREE.BoxGeometry(0.048, 0.018, 0.032);
    const p  = new THREE.BoxGeometry(0.065, 0.003, 0.022);
    const pL = p.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(-0.058, 0, 0));
    const pR = p.clone().applyMatrix4(new THREE.Matrix4().makeTranslation( 0.058, 0, 0));
    const a  = new THREE.CylinderGeometry(0.001, 0.001, 0.018, 4);
    a.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.018, 0));
    const mg = mergeGeometries([b, pL, pR, a]);
    b.dispose(); p.dispose(); pL.dispose(); pR.dispose(); a.dispose();
    return mg;
  }

  _buildInstanced(g) {
    const m = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x182840),
      emissiveIntensity: 0.3,
      shininess: 65,
    });
    this.satMat  = m;
    this.satInst = new THREE.InstancedMesh(g, m, SAT_POOL);
    this.satInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.satInst.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(SAT_POOL * 3).fill(1), 3
    );
    this.root.add(this.satInst);
  }

  _glowTex(r, g, b) {
    const s  = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0,   `rgba(${r},${g},${b},1)`   );
    grd.addColorStop(0.2, `rgba(${r},${g},${b},0.75)`);
    grd.addColorStop(0.5, `rgba(${r},${g},${b},0.25)`);
    grd.addColorStop(1,   `rgba(${r},${g},${b},0)`   );
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  _initDebris() {
    const rng = prng(55);
    this.debrisP = Array.from({ length: DEBRIS_N }, () => ({
      pos:    new THREE.Vector3(),
      vel:    new THREE.Vector3(),
      life:   rng(),
      size:   rng() * 0.02 + 0.006,
      col:    new THREE.Color().setHSL(0.02 + rng() * 0.06, 0.95, 0.3 + rng() * 0.3),
      active: false,
    }));

    const p = new Float32Array(DEBRIS_N * 3);
    const s = new Float32Array(DEBRIS_N);
    const c = new Float32Array(DEBRIS_N * 3);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("pSize",    new THREE.BufferAttribute(s, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("pColor",   new THREE.BufferAttribute(c, 3).setUsage(THREE.DynamicDrawUsage));

    const m = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float pSize;
        attribute vec3  pColor;
        varying vec3 vC;
        void main(){
          vC = pColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = pSize * (500. / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vC;
        void main(){
          float d    = length(gl_PointCoord - .5);
          if(d > .5) discard;
          float core = smoothstep(.5, 0., d);
          vec3  fc   = vC + vec3(.35, .06, 0.) * core;
          gl_FragColor = vec4(fc, core + smoothstep(.5, .1, d) * .4);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.debrisGeo    = g;
    this.debrisMat    = m;
    this.debrisPoints = new THREE.Points(g, m);
    this.root.add(this.debrisPoints);

    // Kessler cascade cloud
    const kN = 1800, kr = prng(77);
    const kp = new Float32Array(kN * 3);
    const ks = new Float32Array(kN);
    const kc = new Float32Array(kN * 3);

    for (let i = 0; i < kN; i++) {
      const v = randOnSphere(EARTH_RADIUS * (1.28 + kr() * 0.48), kr);
      kp[i * 3] = v.x; kp[i * 3 + 1] = v.y; kp[i * 3 + 2] = v.z;
      ks[i] = kr() * 1.8 + 0.3;
      const cc = new THREE.Color().setHSL(0.02 + kr() * 0.06, 0.9, 0.25 + kr() * 0.2);
      kc[i * 3] = cc.r; kc[i * 3 + 1] = cc.g; kc[i * 3 + 2] = cc.b;
    }

    const kg = new THREE.BufferGeometry();
    kg.setAttribute("position", new THREE.BufferAttribute(kp, 3));
    kg.setAttribute("size",     new THREE.BufferAttribute(ks, 1));
    kg.setAttribute("color",    new THREE.BufferAttribute(kc, 3));

    this.kesslerMat = new THREE.ShaderMaterial({
      uniforms: {
        uOp:  { value: 0 },
        uTime:{ value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3  color;
        varying vec3 vC;
        uniform float uTime;
        void main(){
          vC = color;
          float s = size * (0.8 + 0.2 * sin(uTime * 0.35 + position.x * 5.));
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = s * (260. / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vC;
        uniform float uOp;
        void main(){
          float d = length(gl_PointCoord - .5);
          if(d > .5) discard;
          gl_FragColor = vec4(vC, smoothstep(.5, 0., d) * uOp);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.root.add(new THREE.Points(kg, this.kesslerMat));
  }

  _initFlash() {
    this.flashDiv = document.createElement("div");
    Object.assign(this.flashDiv.style, {
      position: "fixed",
      inset: "0",
      background: "radial-gradient(ellipse at center,rgba(255,180,80,.35) 0%,rgba(255,40,0,.4) 35%,transparent 65%)",
      opacity: "0",
      pointerEvents: "none",
      zIndex: "50",
    });
    document.body.appendChild(this.flashDiv);
  }

  // ── MAIN LOOP ─────────────────────────────────────────────────────────────

  _loop() {
    if (this.disposed) return;
    this._raf = requestAnimationFrame(this._loop.bind(this));

    const t  = this.clock.getElapsedTime();
    const p  = this.progress;
    const p0 = smootherstep(remap(p, PHASES.P0, PHASES.P1));
    const p1 = smootherstep(remap(p, PHASES.P1, PHASES.P2));
    const p2 = smootherstep(remap(p, PHASES.P2, PHASES.P3));
    const p3 = smootherstep(remap(p, PHASES.P3, PHASES.P4));
    const p4 = smootherstep(remap(p, PHASES.P4, 1.0));
    const ch = p < PHASES.P1 ? 0 : p < PHASES.P2 ? 1 : p < PHASES.P3 ? 2 : p < PHASES.P4 ? 3 : 4;

    this._updateCamera(t, ch, p3);
    this._updatePost(t, ch, p3, p4);

    this.starMat.uniforms.uTime.value = t;
    this.stars.rotation.y = t * 0.0018;
    this.nebMat.uniforms.uTime.value = t;

    if (this.earth)  this.earth.rotation.y  = t * 0.028;
    if (this.clouds) {
      this.clouds.rotation.y = t * 0.035;
      this.clouds.rotation.x = t * 0.004;
    }

    this._updateAtmo(t, p1, ch);
    this._updateOrbits(t, ch, p0, p1);
    this._updateSats(t, ch, p0, p1, p2, p3, p4);
    this._updateDanger(t, ch, p3, p4);
    this._updateDebris(t, ch, p3, p4);
    this._updateFrags(t);
    this._updateColLight(t, ch);

    this.composer.render();
  }

  // ── UPDATE METHODS ────────────────────────────────────────────────────────

  _updateCamera(t, ch, p3) {
    const tf = FOV_MAP[ch];
    this.currentFov += (tf - this.currentFov) * 0.022;
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    this.camFree = !this.isScrolling;

    if (this.camFree) {
      if (this.isDragging) {
        this.camUserTheta += this.dragDX * 0.004;
        this.camUserPhi   -= this.dragDY * 0.004;
        this.camUserPhi    = clamp(this.camUserPhi, -Math.PI * 0.38, Math.PI * 0.38);
      } else {
        this.camUserTheta += 0.003;
      }
    } else {
      this.camUserTheta *= 0.93;
      this.camUserPhi   *= 0.93;
    }

    const L = this.camLocked[ch];
    let th = L.th, ph = L.ph, dist = L.d;

    if (ch === 3) {
      const cp = this._tv.addVectors(satPos(this.dA, t), satPos(this.dB, t)).multiplyScalar(0.5);
      const sp = new THREE.Spherical().setFromVector3(cp);
      th   = lerp(L.th, sp.theta, p3 * 0.6);
      ph   = lerp(L.ph, sp.phi,   p3 * 0.4);
      dist = lerp(L.d,  L.d - 1.8, p3);
    }

    this.camTarget.theta  = th   + this.camUserTheta;
    this.camTarget.phi    = ph   + this.camUserPhi;
    this.camTarget.radius = dist;

    this.camSph.theta  += (this.camTarget.theta  - this.camSph.theta)  * 0.035;
    this.camSph.phi    += (this.camTarget.phi    - this.camSph.phi)    * 0.035;
    this.camSph.radius += (this.camTarget.radius - this.camSph.radius) * 0.035;
    this.camSph.phi     = clamp(this.camSph.phi, 0.15, Math.PI - 0.15);

    this.camera.position.setFromSpherical(this.camSph);

    // Scroll-velocity distortion
    const velSkew = this.scrollVelocity * 15;
    this.camera.position.y += velSkew * 0.3;

    // Camera shake on collision
    if (this._shakeOn) {
      const el = t - this._shakeT;
      if (el > 1.8) {
        this._shakeOn = false;
      } else {
        const env = Math.exp(-el * 3.2);
        const a   = 0.22 * env;
        this.camera.position.x += a * (Math.sin(t * 93) * .5 + Math.sin(t * 47) * .3 + Math.sin(t * 211) * .2);
        this.camera.position.y += a * (Math.sin(t * 78) * .45 + Math.sin(t * 34) * .35 + Math.sin(t * 157) * .2);
      }
    }
    this.camera.lookAt(0, 0, 0);
  }

  _updatePost(t, ch, p3, p4) {
    this.bloom.strength = ch === 4
      ? lerp(0.28, 0.55, p4)
      : ch === 3
        ? lerp(0.28, 0.4, p3)
        : 0.28;
    this.chroma.uniforms.uO.value = ch >= 3
      ? lerp(0.0005, 0.002, ch === 4 ? p4 : p3)
      : 0.0005;
    this.grain.uniforms.uT.value = t;
    this.grain.uniforms.uI.value = ch === 4 ? 0.07 : 0.035;
  }

  _updateAtmo(t, p1, ch) {
    const w = ch >= 1 ? Math.min(p1, 1) : 0;
    this.atmoLayers.forEach(a => {
      a.mat.uniforms.uTime.value  = t;
      a.mat.uniforms.uWarn.value += (w - a.mat.uniforms.uWarn.value) * 0.025;
    });
  }

  _updateOrbits(t, ch, p0, p1) {
    this.orbitRings.forEach(o => {
      let target;
      if      (ch === 0) target = 0.12 * p0;
      else if (ch === 1) target = 0.25;
      else if (ch === 2) target = 0.15;
      else               target = 0.08;

      o.mat.uniforms.uOpacity.value += (target - o.mat.uniforms.uOpacity.value) * 0.035;
      o.mat.uniforms.uTime.value     = t;
    });
  }

  _updateSats(t, ch, p0, p1, p2, p3, p4) {
    const d = this._d, tc = this._tc;
    const vis = ch === 0
      ? 4
      : ch === 1
        ? Math.round(lerp(4, SAT_POOL, outExpo(remap(this.progress, PHASES.P1, PHASES.P2))))
        : SAT_POOL;

    for (let i = 0; i < SAT_POOL; i++) {
      const s   = this.satData[i];
      const pos = satPos(s, t);

      if (i < vis) {
        d.position.copy(pos);
        d.lookAt(this._tv.set(0, 0, 0));
        d.rotation.z += s.phase * 0.5;
        d.updateMatrix();
        this.satInst.setMatrixAt(i, d.matrix);
      } else {
        d.position.set(9999, 9999, 9999);
        d.updateMatrix();
        this.satInst.setMatrixAt(i, d.matrix);
      }

      const isAct = this.activeIdx.includes(i);
      if (ch === 0) {
        tc.set(C.satNormal);
      } else if (ch === 1) {
        tc.set(C.satNormal).lerp(new THREE.Color("#ffbb33"), p1 * 0.65);
      } else if (ch === 2) {
        tc.set(isAct ? C.satActive : C.satDim);
      } else {
        tc.set(isAct ? C.satActive : C.satDim)
          .lerp(new THREE.Color("#444466"), ch >= 3 ? p3 * 0.45 : 0);
      }
      this.satInst.setColorAt(i, tc);
    }

    this.satInst.instanceMatrix.needsUpdate = true;
    if (this.satInst.instanceColor) this.satInst.instanceColor.needsUpdate = true;

    const sa = ch === 2 || ch === 3;
    this.activeIdx.forEach((si, ai) => {
      const pos = satPos(this.satData[si], t);
      const m   = this.actMeshes[ai];
      const sp  = this.actSprites[ai];

      if (sa) {
        const pulse = 0.7 + 0.3 * Math.sin(t * 2.5 + ai * 0.8);
        const alpha = ch === 2 ? clamp(p2 * 3) : clamp(1 - p3 * 2);
        m.visible = true;
        m.position.copy(pos);
        m.lookAt(0, 0, 0);
        m.material.emissiveIntensity = 2.0 * pulse * alpha;
        m.material.opacity           = alpha;
        sp.position.copy(pos);
        sp.material.opacity = 0.5 * pulse * alpha;
        sp.scale.setScalar(0.45 * (0.85 + 0.15 * pulse));
      } else {
        m.visible           = false;
        sp.material.opacity = 0;
      }
    });
  }

  _updateDanger(t, ch, p3, p4) {
    if (ch < 3) {
      this.dMeshA.visible = false;
      this.dMeshB.visible = false;
      this.dGlowA.visible = false;
      this.dGlowB.visible = false;
      this.dRingMatA.uniforms.uOpacity.value = 0;
      this.dRingMatB.uniforms.uOpacity.value = 0;
      if (this.collisionDone) {
        this.collisionDone = false;
        this.frags.forEach(fl => fl.forEach(f => {
          f.mesh.visible = false;
          f.mat.opacity  = 0;
        }));
      }
      return;
    }

    this.dRingMatA.uniforms.uTime.value = t;
    this.dRingMatB.uniforms.uTime.value = t;

    const pA = satPos(this.dA, t);
    const pB = satPos(this.dB, t);

    if (ch === 3 && !this.collisionDone) {
      this.dMeshA.visible = true;
      this.dMeshB.visible = true;
      this.dGlowA.visible = true;
      this.dGlowB.visible = true;

      const mid = this._tv.addVectors(pA, pB).multiplyScalar(0.5);
      const aA  = pA.clone().lerp(mid, p3 * 0.88);
      const aB  = pB.clone().lerp(mid, p3 * 0.88);

      this.dMeshA.position.copy(aA); this.dMeshA.lookAt(0, 0, 0);
      this.dMeshB.position.copy(aB); this.dMeshB.lookAt(0, 0, 0);
      this.dGlowA.position.copy(aA);
      this.dGlowB.position.copy(aB);

      const freq  = 4 + p3 * 18;
      const pulse = 0.5 + 0.5 * Math.sin(t * freq);
      const dc    = new THREE.Color().setHSL(0.02, 1, 0.28 + 0.32 * pulse);
      this.dMatA.color.copy(dc); this.dMatA.emissive.copy(dc); this.dMatA.emissiveIntensity = 1.8 * pulse;
      this.dMatB.color.copy(dc); this.dMatB.emissive.copy(dc); this.dMatB.emissiveIntensity = 1.8 * pulse;

      const gs = 0.15 + p3 * 1.4;
      this.dGlowA.scale.setScalar(gs);
      this.dGlowB.scale.setScalar(gs);
      this.gMA.opacity = 0.9 * pulse;
      this.gMB.opacity = 0.9 * pulse;

      this.dRingMatA.uniforms.uOpacity.value = p3 * 0.45 * pulse;
      this.dRingMatB.uniforms.uOpacity.value = p3 * 0.45 * pulse;

    } else if (ch === 4 && !this.collisionDone) {
      // ── COLLISION EVENT ──────────────────────────────────────────────
      this.collisionDone = true;
      this.collisionTime = t;
      this.collisionPt.copy(
        this._tv.addVectors(pA, pB).multiplyScalar(0.5)
      );
      this.collisionR = this.collisionPt.length();

      this.dMeshA.visible = false;
      this.dMeshB.visible = false;
      this.dGlowA.visible = false;
      this.dGlowB.visible = false;

      // Spawn fragments
      const rng = prng(999);
      this.frags.forEach((fl) => {
        fl.forEach(f => {
          f.pos.copy(this.collisionPt).add(
            new THREE.Vector3((rng() - .5) * .04, (rng() - .5) * .04, (rng() - .5) * .04)
          );
          const tan = new THREE.Vector3()
            .crossVectors(f.pos.clone().normalize(), new THREE.Vector3(0, 1, 0))
            .normalize();
          f.vel.copy(tan)
            .multiplyScalar(1.8 + rng() * 3.5)
            .add(new THREE.Vector3((rng() - .5) * 1.2, (rng() - .5) * 1.2, (rng() - .5) * 1.2));
          f.mesh.visible         = true;
          f.mat.opacity          = 1;
          f.mat.emissiveIntensity = 3.0;
          f.life                 = 1;
        });
      });

      // Spread debris in orbital shell
      const dr = prng(1234);
      this.debrisP.forEach(d => {
        d.pos.copy(this.collisionPt).add(
          new THREE.Vector3((dr() - .5) * .08, (dr() - .5) * .08, (dr() - .5) * .08)
        );
        const up  = d.pos.clone().normalize();
        const tan = new THREE.Vector3()
          .crossVectors(up, new THREE.Vector3(dr() - .5, dr() - .5, dr() - .5))
          .normalize();
        d.vel.copy(tan)
          .multiplyScalar(1.2 + dr() * 4.5)
          .add(up.multiplyScalar((dr() - .5) * .6));
        d.active = true;
        d.col.setHSL(0.02 + dr() * 0.06, 0.95, 0.3 + dr() * 0.35);
      });

      // Camera shake + screen flash
      this._shakeOn = true;
      this._shakeT  = t;
      this.flashDiv.style.transition = "opacity 0.04s";
      this.flashDiv.style.opacity    = "1";
      setTimeout(() => {
        this.flashDiv.style.transition = "opacity 1.2s ease-out";
        this.flashDiv.style.opacity    = "0";
      }, 70);

    } else if (ch === 4 && this.collisionDone) {
      this.dMeshA.visible = false;
      this.dMeshB.visible = false;
      this.dGlowA.visible = false;
      this.dGlowB.visible = false;
      this.dRingMatA.uniforms.uOpacity.value *= 0.98;
      this.dRingMatB.uniforms.uOpacity.value *= 0.98;
    }
  }

  _updateDebris(t, ch, p3, p4) {
    const pb = this.debrisGeo.attributes.position.array;
    const sb = this.debrisGeo.attributes.pSize.array;
    const cb = this.debrisGeo.attributes.pColor.array;

    if (ch >= 4 && this.collisionDone) {
      const dt = Math.max(0, t - this.collisionTime);

      this.debrisP.forEach((d, i) => {
        if (!d.active) {
          pb[i * 3] = 9999; pb[i * 3 + 1] = 9999; pb[i * 3 + 2] = 9999;
          return;
        }
        const decay = Math.exp(-dt * 0.12);
        d.pos.x += d.vel.x * decay * 0.01;
        d.pos.y += d.vel.y * decay * 0.01;
        d.pos.z += d.vel.z * decay * 0.01;

        const len = d.pos.length();
        if (len > this.collisionR * 1.18) d.pos.setLength(this.collisionR * 1.18);
        if (len < this.collisionR * 0.85) d.pos.setLength(this.collisionR * 0.85);
        if (len < EARTH_RADIUS * 1.03)    d.pos.setLength(EARTH_RADIUS * 1.03);

        const drift = 0.035 + d.life * 0.05;
        d.pos.x += Math.sin(t * drift + i * 0.031) * 0.0025;
        d.pos.z += Math.cos(t * drift + i * 0.7)   * 0.0025;

        pb[i * 3] = d.pos.x; pb[i * 3 + 1] = d.pos.y; pb[i * 3 + 2] = d.pos.z;

        const cool = clamp(1 - dt * 0.018, 0.2, 1);
        sb[i] = (4.0 + d.life * 5.5) * cool * (0.8 + 0.2 * Math.sin(t * 5 + i * 1.1));

        const hot = clamp(1 - dt * 0.03, 0.1, 1);
        cb[i * 3]     = d.col.r * (0.45 + 0.55 * hot);
        cb[i * 3 + 1] = d.col.g * hot * 0.5;
        cb[i * 3 + 2] = d.col.b * hot * 0.15;
      });

      this.debrisGeo.attributes.position.needsUpdate = true;
      this.debrisGeo.attributes.pSize.needsUpdate    = true;
      this.debrisGeo.attributes.pColor.needsUpdate   = true;
      this.kesslerMat.uniforms.uOp.value   = clamp(p4 * 2.0, 0, 0.8);
      this.kesslerMat.uniforms.uTime.value = t;

    } else {
      for (let i = 0; i < DEBRIS_N; i++) {
        pb[i * 3] = 9999; pb[i * 3 + 1] = 9999; pb[i * 3 + 2] = 9999;
      }
      this.debrisGeo.attributes.position.needsUpdate = true;
      this.kesslerMat.uniforms.uOp.value = 0;
    }
  }

  _updateFrags(t) {
    if (!this.collisionDone) return;
    const dt = Math.max(0, t - this.collisionTime);

    this.frags.forEach(fl => fl.forEach(f => {
      if (!f.mesh.visible) return;
      const decay = Math.exp(-dt * 0.25);
      f.pos.x += f.vel.x * decay * 0.008;
      f.pos.y += f.vel.y * decay * 0.008;
      f.pos.z += f.vel.z * decay * 0.008;

      const len = f.pos.length();
      if (len > this.collisionR * 1.35) f.pos.setLength(this.collisionR * 1.35);
      if (len < EARTH_RADIUS * 1.01)    f.pos.setLength(EARTH_RADIUS * 1.01);

      f.mesh.position.copy(f.pos);
      f.mesh.rotateOnAxis(f.rotAxis, f.rotSpd * 0.014);

      f.life                  = Math.max(0, 1 - dt * 0.1);
      f.mat.opacity           = f.life;
      f.mat.emissiveIntensity = 3.0 * f.life;

      const hot = clamp(1 - dt * 0.06, 0, 1);
      f.mat.color.setHSL(0.03 + (1 - hot) * 0.02, 0.9, 0.18 + hot * 0.45);
      f.mat.emissive.setHSL(0.02, 1, hot * 0.45);

      if (f.life < 0.005) f.mesh.visible = false;
    }));
  }

  _updateColLight(t, ch) {
    if (ch === 4 && this.collisionDone) {
      this.colLight.intensity = Math.max(
        0,
        22 * Math.exp(-(t - this.collisionTime) * 1.8)
      );
      this.colLight.position.copy(this.collisionPt);
    } else {
      this.colLight.intensity = 0;
    }
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

  setProgress(p)            { this.progress       = p; }
  setMouse(x, y)            { this.mx = x; this.my = y; }
  setScrolling(v)           { this.isScrolling    = v; }
  setDragging(v)            { this.isDragging     = v; }
  setDragDelta(dx, dy)      { this.dragDX = dx; this.dragDY = dy; }
  setScrollVelocity(v)      { this.scrollVelocity = v; }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this._raf);
    this.renderer.dispose();
    this._ro.disconnect();
    if (this.flashDiv?.parentNode) {
      this.flashDiv.parentNode.removeChild(this.flashDiv);
    }
  }
}
