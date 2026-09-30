import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { soundFX } from '../utils/audioSynth';
import { Shield, Database, Zap, Terminal, Cpu } from 'lucide-react';

// ─── Themes ───────────────────────────────────────────────────────────────────
export const THEMES = {
  obsidian: {
    name: 'Obsidian Chrome',
    darkColor:  0x080c14,
    accentColor: 0x7e8fa4,
    glowColor:  0x38bdf8,
    wireColor:  0x38bdf8,
    debrisColor: 0x94a3b8,
    metalness: 0.98, roughness: 0.10, clearcoat: 1.0, clearcoatRoughness: 0.04, envIntensity: 2.0,
  },
  titanium: {
    name: 'Brushed Titanium',
    darkColor:  0x1a202c,
    accentColor: 0xcbd5e1,
    glowColor:  0x60a5fa,
    wireColor:  0x93c5fd,
    debrisColor: 0xe2e8f0,
    metalness: 0.95, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.10, envIntensity: 1.6,
  },
  cyberpunk: {
    name: 'Cyberpunk Chrome',
    darkColor:  0x120822,
    accentColor: 0xf43f5e,
    glowColor:  0x06b6d4,
    wireColor:  0x06b6d4,
    debrisColor: 0xec4899,
    metalness: 0.95, roughness: 0.14, clearcoat: 1.0, clearcoatRoughness: 0.08, envIntensity: 1.9,
  },
  gold: {
    name: 'Titanium Gold',
    darkColor:  0x1a150c,
    accentColor: 0xfbbf24,
    glowColor:  0xf59e0b,
    wireColor:  0xfde047,
    debrisColor: 0xfef08a,
    metalness: 0.98, roughness: 0.11, clearcoat: 1.0, clearcoatRoughness: 0.05, envIntensity: 2.1,
  },
};

// ─── Abstract Multi-Dimensional Sculpture Definition ─────────────────────────
// Each node: pos [x,y,z], size [w,h,d], rot [rx,ry,rz] in radians,
//            isAccent, isExtracted, calloutKey, label
// ─── Abstract Multi-Dimensional Sculpture Definition ─────────────────────────
// Each node: pos [x,y,z], size [w,h,d], rot [rx,ry,rz] in radians,
//            shape ("box" | "triangularPrism"), isAccent, isExtracted, calloutKey, label
export const SCULPTURE_NODES = [

  // ── 1. Dense Central Core Mass (overlapping irregular prisms) ────────────
  { id: 'core_a',  pos: [0,    0,    0],    size: [0.92, 0.92, 0.92], rot: [0,      0,      0],    isAccent: false, shape: 'box' },
  { id: 'core_b',  pos: [0.18, 0.55, 0.1],  size: [0.72, 0.88, 0.60], rot: [0.18,  -0.22,   0.08], isAccent: false, shape: 'box' },
  { id: 'core_c',  pos: [-0.2, -0.42, 0.2], size: [0.80, 0.65, 0.85], rot: [-0.12,  0.18,  -0.1],  isAccent: false, shape: 'box' },
  { id: 'core_d',  pos: [0.12, 0.05, -0.5], size: [0.88, 0.58, 0.70], rot: [0.06,   0.30,   0.05], isAccent: false, shape: 'box' },
  { id: 'core_e',  pos: [-0.3, 0.28, 0.35], size: [0.62, 0.90, 0.55], rot: [0.14,  -0.10,   0.22], isAccent: false, shape: 'box' },

  // ── 2. Long Elongated Spine Shards (tesseract-like extrusions) ───────────
  { id: 'shard_top_right',  pos: [0.85,  1.60,  0.10], size: [0.36, 1.80, 0.30], rot: [0.12, 0.25, -0.18], isAccent: true,  shape: 'triangularPrism' },
  { id: 'shard_top_left',   pos: [-0.75, 1.45, -0.15], size: [0.28, 2.10, 0.24], rot: [-0.2, 0.10,  0.22], isAccent: false, shape: 'triangularPrism' },
  { id: 'shard_right_out',  pos: [1.70,  0.10,  0.25], size: [1.90, 0.28, 0.32], rot: [0.08, 0.14, -0.12], isAccent: true,  shape: 'triangularPrism' },
  { id: 'shard_bot_left',   pos: [-0.6, -1.50, -0.20], size: [0.30, 1.65, 0.28], rot: [0.18,-0.20,  0.30], isAccent: false, shape: 'triangularPrism' },
  { id: 'shard_diag_deep',  pos: [0.35,  0.40, -1.55], size: [0.26, 0.26, 1.80], rot: [0.22, 0.15,  0.10], isAccent: true,  shape: 'triangularPrism' },
  { id: 'shard_btm_right',  pos: [1.10, -1.20,  0.30], size: [0.40, 1.45, 0.36], rot: [0.15, 0.22, -0.28], isAccent: false, shape: 'triangularPrism' },

  // ── 3. Micro-Cube Cloud — Upper Left Corner (8 tiny voxels in tight cluster) ──
  { id: 'micro_ul_0', pos: [-1.10,  1.10,  0.20], size: [0.30, 0.30, 0.30], rot: [0.1, 0.4, 0.2],  isAccent: true,  shape: 'box' },
  { id: 'micro_ul_1', pos: [-1.40,  1.00,  0.00], size: [0.26, 0.26, 0.26], rot: [0.3,-0.2, 0.1],  isAccent: false, shape: 'box' },
  { id: 'micro_ul_2', pos: [-1.20,  1.38, -0.15], size: [0.28, 0.22, 0.28], rot: [-0.1,0.3,-0.2],  isAccent: true,  shape: 'box' },
  { id: 'micro_ul_3', pos: [-1.50,  1.30,  0.25], size: [0.20, 0.32, 0.20], rot: [0.2, 0.5,-0.1],  isAccent: false, shape: 'box' },
  { id: 'micro_ul_4', pos: [-0.95,  1.55,  0.10], size: [0.22, 0.22, 0.30], rot: [-0.3,0.1, 0.4],  isAccent: true,  shape: 'box' },
  { id: 'micro_ul_5', pos: [-1.30,  0.80,  0.30], size: [0.24, 0.38, 0.24], rot: [0.4,-0.3, 0.2],  isAccent: false, shape: 'box' },
  { id: 'micro_ul_6', pos: [-1.60,  1.15, -0.20], size: [0.18, 0.18, 0.26], rot: [-0.2,0.6,-0.3],  isAccent: true,  shape: 'box' },
  { id: 'micro_ul_7', pos: [-1.10,  1.25,  0.40], size: [0.32, 0.24, 0.20], rot: [0.5, 0.2, 0.1],  isAccent: false, shape: 'box' },

  // ── 4. Micro-Cube Cloud — Lower Right (6 tight voxels) ──────────────────
  { id: 'micro_lr_0', pos: [1.20, -0.80, -0.10], size: [0.28, 0.28, 0.28], rot: [0.2,-0.4, 0.3],  isAccent: true,  shape: 'box' },
  { id: 'micro_lr_1', pos: [1.45, -0.60, -0.30], size: [0.22, 0.30, 0.22], rot: [-0.1,0.5,-0.2],  isAccent: false, shape: 'box' },
  { id: 'micro_lr_2', pos: [1.10, -1.00,  0.20], size: [0.30, 0.20, 0.28], rot: [0.3, 0.2, 0.4],  isAccent: true,  shape: 'box' },
  { id: 'micro_lr_3', pos: [1.55, -0.90,  0.10], size: [0.20, 0.26, 0.32], rot: [-0.3,0.3,-0.1],  isAccent: false, shape: 'box' },
  { id: 'micro_lr_4', pos: [1.30, -0.50, -0.50], size: [0.24, 0.24, 0.24], rot: [0.4,-0.1, 0.5],  isAccent: true,  shape: 'box' },
  { id: 'micro_lr_5', pos: [0.95, -0.75, -0.35], size: [0.26, 0.32, 0.20], rot: [-0.2,0.4,-0.3],  isAccent: false, shape: 'box' },

  // ── 5. Mid-Size Angular Satellites (irregular, tilted) ───────────────────
  { id: 'sat_front_high', pos: [0.50,  1.10,  1.10], size: [0.55, 0.55, 0.42], rot: [0.35, 0.45, -0.20], isAccent: false, shape: 'box' },
  { id: 'sat_back_left',  pos: [-1.0,  0.10, -1.10], size: [0.48, 0.68, 0.48], rot: [-0.25, 0.30, 0.40], isAccent: true,  shape: 'box' },
  { id: 'sat_low_front',  pos: [0.20, -1.10,  0.90], size: [0.60, 0.40, 0.60], rot: [0.40,-0.30,-0.35],  isAccent: false, shape: 'box' },
  { id: 'sat_wide_right', pos: [1.60,  0.80, -0.40], size: [0.70, 0.38, 0.50], rot: [0.10, 0.55, 0.20],  isAccent: false, shape: 'box' },

  // ── 6. Wide Flat Slabs (plank-like) ─────────────────────────────────────
  { id: 'slab_top',       pos: [-0.30,  1.90,  0.00], size: [1.20, 0.20, 0.80], rot: [0.08,-0.20, 0.12], isAccent: false, shape: 'box' },
  { id: 'slab_back',      pos: [-0.10, -0.30, -1.60], size: [0.90, 0.60, 0.18], rot: [0.15, 0.10,-0.08], isAccent: true,  shape: 'box' },

  // ── 7. Floating Extracted Pods (with Callout Cards pinned) ───────────────
  {
    id: 'pod_top_left',
    pos: [-2.6, 2.2, -0.8],
    size: [0.88, 0.88, 0.88],
    rot: [0.30, 0.50, 0.20],
    isAccent: true,
    isExtracted: true,
    calloutKey: 'pod_top_left',
    label: 'auth.controller.ts',
    shape: 'box',
  },
  {
    id: 'pod_bot_right',
    pos: [2.4, -1.9, 0.9],
    size: [0.80, 0.80, 0.80],
    rot: [-0.20, 0.40,-0.30],
    isAccent: true,
    isExtracted: true,
    calloutKey: 'pod_bot_right',
    label: 'state_tensor.json',
    shape: 'box',
  },
  {
    id: 'pod_deep_left',
    pos: [-1.8, -1.6, 1.6],
    size: [0.78, 0.78, 0.78],
    rot: [0.45,-0.35, 0.25],
    isAccent: false,
    isExtracted: true,
    calloutKey: 'pod_deep_left',
    label: 'matrix_optimizer.rs',
    shape: 'box',
  },
];

// ─── Callout Card Definitions ─────────────────────────────────────────────────
const CALLOUT_DATA = {
  pod_top_left: {
    title: 'auth.controller.ts',
    badge: 'ACTIVE POD',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Shield,
    offset: { x: -270, y: -80 },
    lines: [
      { text: 'def handle_cube_auth():', color: 'text-purple-400' },
      { text: '  status: 200 OK', color: 'text-emerald-400' },
      { text: '  node: "sg-edge-01"', color: 'text-sky-300' },
      { text: '  return latency.ok', color: 'text-amber-300' },
    ],
  },
  pod_bot_right: {
    title: 'state_tensor.json',
    badge: 'REPLICATED',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Database,
    offset: { x: 80, y: 30 },
    lines: [
      { text: '{ "tensor_id": "0x7F2A",', color: 'text-slate-300' },
      { text: '  "cluster": "abstract_vol",', color: 'text-sky-300' },
      { text: '  "extracted": true,', color: 'text-emerald-400' },
      { text: '  "shards_clubbed": 14 }', color: 'text-amber-300' },
    ],
  },
  pod_deep_left: {
    title: 'matrix_optimizer.rs',
    badge: 'OPTIMIZED',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Zap,
    offset: { x: -260, y: 40 },
    lines: [
      { text: 'fn scatter_voxel_mesh() {', color: 'text-indigo-400' },
      { text: '  dispatch_gpu(&shard);', color: 'text-rose-400' },
      { text: '  load: 0.042 ms', color: 'text-cyan-300' },
      { text: '}', color: 'text-indigo-400' },
    ],
  },
};

// ─── Studio HDR Environment Map ───────────────────────────────────────────────
function createStudioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0,    '#1e293b');
  bg.addColorStop(0.35, '#0f172a');
  bg.addColorStop(0.5,  '#020617');
  bg.addColorStop(1,    '#020617');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 512);

  const key = ctx.createRadialGradient(512, 100, 8, 512, 100, 290);
  key.addColorStop(0, 'rgba(255,255,255,1.0)');
  key.addColorStop(0.3, 'rgba(224,242,254,0.75)');
  key.addColorStop(0.65, 'rgba(56,189,248,0.25)');
  key.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = key; ctx.fillRect(0, 0, 1024, 400);

  const left = ctx.createRadialGradient(150, 260, 5, 150, 260, 210);
  left.addColorStop(0, 'rgba(56,189,248,0.95)');
  left.addColorStop(0.4, 'rgba(14,165,233,0.35)');
  left.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = left; ctx.fillRect(0, 100, 400, 360);

  const right = ctx.createRadialGradient(870, 260, 5, 870, 260, 200);
  right.addColorStop(0, 'rgba(241,245,249,0.9)');
  right.addColorStop(0.4, 'rgba(148,163,184,0.35)');
  right.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = right; ctx.fillRect(660, 100, 400, 360);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}

// ─── Beveled Box Geometry ─────────────────────────────────────────────────────
function createBeveledBox(w, h, d, bevel = 0.04) {
  const geo = new THREE.BoxGeometry(w, h, d, 4, 4, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const hx = w/2 - bevel, hy = h/2 - bevel, hz = d/2 - bevel;
    const dx = Math.max(0, Math.abs(x) - hx);
    const dy = Math.max(0, Math.abs(y) - hy);
    const dz = Math.max(0, Math.abs(z) - hz);
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist > 0) {
      const f = bevel / dist;
      const sx = Math.sign(x)||1, sy = Math.sign(y)||1, sz = Math.sign(z)||1;
      x = sx*hx + (x - sx*hx)*f;
      y = sy*hy + (y - sy*hy)*f;
      z = sz*hz + (z - sz*hz)*f;
      pos.setXYZ(i, x, y, z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ModularCube3D({
  theme = 'obsidian',
  explodeFactor = 0,
  autoRotate = true,
  showDebris = true,
  showRings = true,
  onCubeSelect,
  activeCubeKey,
}) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);

  // Three.js refs
  const rendererRef     = useRef(null);
  const cameraRef       = useRef(null);
  const sculptureGrpRef = useRef(null);
  const nodeMeshMapRef  = useRef(new Map());
  const raycasterRef    = useRef(new THREE.Raycaster());
  const mouseRef        = useRef(new THREE.Vector2());

  // Interaction
  const isDraggingRef      = useRef(false);
  const prevPtrRef         = useRef({ x: 0, y: 0 });
  const downPtrRef         = useRef({ x: 0, y: 0 });
  const pinchDistRef       = useRef(0);
  const targetRotRef       = useRef({ x: 0.30, y: -0.55 });
  const currentRotRef      = useRef({ x: 0.30, y: -0.55 });
  const cameraZRef         = useRef(7.5);
  const targetZRef         = useRef(7.5);
  const hoveredRef         = useRef(null);

  // Direct-DOM overlay refs (no React re-renders in the RAF loop)
  const cardElsRef     = useRef(new Map());
  const svgPathsRef    = useRef(new Map());
  const svgDotsRef     = useRef(new Map());

  // Node animation states
  const nodeStatesRef = useRef(new Map());

  // Init states
  useEffect(() => {
    SCULPTURE_NODES.forEach(node => {
      const dirVec = new THREE.Vector3(...node.pos);
      if (dirVec.length() < 0.001) dirVec.set(0, 1, 0);
      nodeStatesRef.current.set(node.id, {
        isExtracted: !!node.isExtracted,
        displacement: node.isExtracted ? 1.0 : 0,
        targetDisplacement: node.isExtracted ? 1.0 : 0,
        hoverDisp: 0,
        targetHoverDisp: 0,
        dirVec: dirVec.normalize(),
      });
    });
  }, []);

  // activeCubeKey sync
  useEffect(() => {
    if (!activeCubeKey) return;
    const s = nodeStatesRef.current.get(activeCubeKey);
    if (s) { s.isExtracted = true; s.targetDisplacement = 1.0; }
  }, [activeCubeKey]);

  const toggleNode = useCallback((id) => {
    const s = nodeStatesRef.current.get(id);
    if (!s) return;
    s.isExtracted = !s.isExtracted;
    s.targetDisplacement = s.isExtracted ? 1.0 : 0;
    s.isExtracted ? soundFX.playExtract() : soundFX.playRetract();
    onCubeSelect?.({ key: id, id, isExtracted: s.isExtracted });
  }, [onCubeSelect]);

  // ── Scene Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080b11, 0.028);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 120);
    camera.position.set(0, 0, cameraZRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // Environment
    const envMap = createStudioEnvironment(renderer);
    scene.environment = envMap;

    // Lights
    scene.add(new THREE.AmbientLight(0x0f172a, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(6, 10, 8); scene.add(key);
    const rim = new THREE.DirectionalLight(0x38bdf8, 4.5);
    rim.position.set(-8, -5, -6); scene.add(rim);
    const fill = new THREE.PointLight(0x818cf8, 2.5, 30);
    fill.position.set(4, -5, 5); scene.add(fill);
    const top = new THREE.SpotLight(0xe0f2fe, 3.5, 20, Math.PI/4, 0.3);
    top.position.set(0, 8, 3); scene.add(top);

    // Sculpture Group
    const sculptureGrp = new THREE.Group();
    sculptureGrp.rotation.x = currentRotRef.current.x;
    sculptureGrp.rotation.y = currentRotRef.current.y;
    scene.add(sculptureGrp);
    sculptureGrpRef.current = sculptureGrp;

    const t = THEMES[theme] || THEMES.obsidian;

    const matDark = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(t.darkColor), metalness: t.metalness,
      roughness: t.roughness, clearcoat: t.clearcoat,
      clearcoatRoughness: t.clearcoatRoughness, reflectivity: 1.0,
      envMapIntensity: t.envIntensity,
    });
    const matAccent = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(t.accentColor), metalness: t.metalness,
      roughness: t.roughness + 0.04, clearcoat: t.clearcoat,
      clearcoatRoughness: t.clearcoatRoughness + 0.02, reflectivity: 1.0,
      envMapIntensity: t.envIntensity * 1.2,
    });
    const matEdge = new THREE.LineBasicMaterial({
      color: new THREE.Color(t.wireColor), transparent: true, opacity: 0.32,
    });

    // Geometry cache keyed by "WxHxD"
    const geoCache  = new Map();
    const edgeCache = new Map();

    const getGeo = (w, h, d) => {
      const k = `${w.toFixed(3)}x${h.toFixed(3)}x${d.toFixed(3)}`;
      if (!geoCache.has(k)) {
        const g = createBeveledBox(w, h, d, Math.min(w, h, d) * 0.055);
        geoCache.set(k, g);
        edgeCache.set(k, new THREE.EdgesGeometry(g, 25));
      }
      return { geo: geoCache.get(k), edge: edgeCache.get(k) };
    };

    nodeMeshMapRef.current.clear();

    SCULPTURE_NODES.forEach(node => {
      const [w, h, d] = node.size;
      const { geo, edge } = getGeo(w, h, d);
      const wrapper = new THREE.Group();
      wrapper.position.set(...node.pos);
      // Apply node's designed rotation
      wrapper.rotation.set(...(node.rot || [0,0,0]));

      const mesh = new THREE.Mesh(geo, node.isAccent ? matAccent : matDark);
      mesh.userData = { id: node.id, basePos: new THREE.Vector3(...node.pos) };

      const lines = new THREE.LineSegments(edge, matEdge);
      mesh.add(lines);
      wrapper.add(mesh);
      sculptureGrp.add(wrapper);

      nodeMeshMapRef.current.set(node.id, {
        wrapper,
        mesh,
        basePos: new THREE.Vector3(...node.pos),
        dirVec: new THREE.Vector3(...node.pos).normalize().lengthSq() > 0.001
          ? new THREE.Vector3(...node.pos).normalize()
          : new THREE.Vector3(0, 1, 0),
        isPod: !!node.isExtracted,
      });
    });

    // ── Floating Debris ──────────────────────────────────────────────────
    const debrisGrp = new THREE.Group();
    scene.add(debrisGrp);
    const debrisMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(t.debrisColor), metalness: 0.98,
      roughness: 0.11, clearcoat: 1.0, envMapIntensity: 2.0,
    });
    const debrisList = [];

    const addDebris = (geo, px, py, pz, orbitR, angleInit, speed, rspd) => {
      const m = new THREE.Mesh(geo, debrisMat);
      m.position.set(px, py, pz);
      debrisGrp.add(m);
      debrisList.push({ mesh: m, orbitRadius: orbitR, angle: angleInit, speed, yBase: py, rotSpd: rspd });
    };

    // Torus
    addDebris(new THREE.TorusGeometry(0.42, 0.075, 20, 64),
      -2.6, 2.6, -0.5, 3.5, 2.3, 0.0022, new THREE.Vector3(0.008, 0.012, 0.005));
    // Shards
    [
      [new THREE.OctahedronGeometry(0.27),  2.7,  2.3,  0.8, 0.0020],
      [new THREE.TetrahedronGeometry(0.25), 3.1, -0.4,  1.2, 0.0024],
      [new THREE.IcosahedronGeometry(0.21),-2.9, -2.0,  0.4, 0.0018],
      [new THREE.SphereGeometry(0.14,16,16), 0.2,-3.0,  0.6, 0.0022],
      [new THREE.OctahedronGeometry(0.20), -3.1,  1.0, -1.1, 0.0016],
      [new THREE.TetrahedronGeometry(0.29),  2.5,-2.5, -0.7, 0.0020],
    ].forEach(([g, px, py, pz, spd], i) => {
      const orbitR = Math.sqrt(px*px + pz*pz);
      addDebris(g, px, py, pz, orbitR, Math.atan2(pz, px), spd,
        new THREE.Vector3(0.009 + i*0.001, 0.013 - i*0.001, 0.006 + i*0.002));
    });

    // ── Radar Rings ──────────────────────────────────────────────────────
    const ringsGrp = new THREE.Group();
    ringsGrp.position.z = -4;
    scene.add(ringsGrp);
    const ringMat = new THREE.MeshBasicMaterial({
      color: t.glowColor, transparent: true, opacity: 0.045, side: THREE.DoubleSide,
    });
    [2.4, 4.0, 5.8, 7.6, 9.5].forEach(r => {
      ringsGrp.add(new THREE.Mesh(new THREE.RingGeometry(r-0.016, r, 96), ringMat));
    });

    // ── Resize ───────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animation Loop ───────────────────────────────────────────────────
    let raf;
    const clock = new THREE.Clock();
    const tmpV  = new THREE.Vector3();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Zoom
      cameraZRef.current += (targetZRef.current - cameraZRef.current) * 0.12;
      camera.position.z = cameraZRef.current;

      // Auto-rotate
      if (autoRotate && !isDraggingRef.current)
        targetRotRef.current.y += 0.0030;

      // Damp rotation
      currentRotRef.current.x += (targetRotRef.current.x - currentRotRef.current.x) * 0.10;
      currentRotRef.current.y += (targetRotRef.current.y - currentRotRef.current.y) * 0.10;
      sculptureGrp.rotation.x = currentRotRef.current.x;
      sculptureGrp.rotation.y = currentRotRef.current.y;

      // Gentle float
      sculptureGrp.position.y = Math.sin(elapsed * 1.3) * 0.06;

      const cW = container.clientWidth  || W;
      const cH = container.clientHeight || H;

      // Animate nodes
      nodeMeshMapRef.current.forEach((item, id) => {
        const s = nodeStatesRef.current.get(id);
        if (!s) return;

        s.displacement  += (s.targetDisplacement  - s.displacement)  * 0.13;
        s.hoverDisp     += (s.targetHoverDisp      - s.hoverDisp)     * 0.22;

        const isPod = item.isPod;
        const extractAmt = isPod ? 0.25 : 1.30;
        const total = s.displacement * extractAmt + explodeFactor * 2.0 + s.hoverDisp * 0.22;

        item.wrapper.position.set(
          item.basePos.x + item.dirVec.x * total,
          item.basePos.y + item.dirVec.y * total,
          item.basePos.z + item.dirVec.z * total,
        );

        if (s.displacement > 0.04) {
          item.mesh.rotation.x = s.displacement * item.dirVec.x * 0.14;
          item.mesh.rotation.y = s.displacement * item.dirVec.y * 0.14;
          item.mesh.rotation.z = s.displacement * item.dirVec.z * 0.14;
        } else {
          item.mesh.rotation.set(0, 0, 0);
        }

        // Direct DOM callout card update (zero React re-renders)
        const cardEl  = cardElsRef.current.get(id);
        const pathEl  = svgPathsRef.current.get(id);
        const glowEl  = svgPathsRef.current.get(`${id}-glow`);
        const dotEl   = svgDotsRef.current.get(id);

        if (cardEl && CALLOUT_DATA[id]) {
          item.mesh.getWorldPosition(tmpV);
          const sp = tmpV.clone().project(camera);
          const visible = sp.z < 1.0;

          if (visible) {
            const px = ((sp.x + 1) / 2) * cW;
            const py = ((-sp.y + 1) / 2) * cH;
            const cfg = CALLOUT_DATA[id];
            const cw = 245, ch = 145;
            let cx = Math.max(16, Math.min(cW - cw - 16, px + cfg.offset.x));
            let cy = Math.max(16, Math.min(cH - ch - 16, py + cfg.offset.y));

            cardEl.style.display = 'block';
            cardEl.style.transform = `translate3d(${cx}px,${cy}px,0)`;

            const ancX = cx > px ? cx : cx + cw;
            const ancY = cy + 35;
            const midX = (ancX + px) / 2;
            const d = `M${ancX} ${ancY} C${midX} ${ancY},${midX} ${py},${px} ${py}`;

            if (pathEl) pathEl.setAttribute('d', d);
            if (glowEl) glowEl.setAttribute('d', d);
            if (dotEl)  { dotEl.setAttribute('cx', px); dotEl.setAttribute('cy', py); dotEl.style.display = 'block'; }
          } else {
            cardEl.style.display = 'none';
            if (pathEl) pathEl.setAttribute('d', '');
            if (glowEl) glowEl.setAttribute('d', '');
            if (dotEl)  dotEl.style.display = 'none';
          }
        }
      });

      // Debris
      if (showDebris) {
        debrisList.forEach(d => {
          d.angle += d.speed;
          d.mesh.position.x = Math.cos(d.angle) * d.orbitRadius;
          d.mesh.position.z = Math.sin(d.angle) * d.orbitRadius;
          d.mesh.position.y = d.yBase + Math.sin(elapsed * 1.5 + d.orbitRadius) * 0.14;
          d.mesh.rotation.x += d.rotSpd.x;
          d.mesh.rotation.y += d.rotSpd.y;
          d.mesh.rotation.z += d.rotSpd.z;
        });
      }
      debrisGrp.visible  = showDebris;
      ringsGrp.visible   = showRings;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose(); envMap.dispose();
      geoCache.forEach(g => g.dispose());
      edgeCache.forEach(g => g.dispose());
      matDark.dispose(); matAccent.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, autoRotate, showDebris, showRings, explodeFactor]);

  // ── Pointer Handlers ─────────────────────────────────────────────────────
  const onDown = (e) => {
    isDraggingRef.current = true;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    prevPtrRef.current  = { x: cx, y: cy };
    downPtrRef.current  = { x: cx, y: cy };
    if (e.touches?.length === 2) {
      pinchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  };

  const onMove = (e) => {
    const container = mountRef.current; if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    if (e.touches?.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                           e.touches[0].clientY - e.touches[1].clientY);
      if (pinchDistRef.current > 0)
        targetZRef.current = Math.max(4, Math.min(11, targetZRef.current + (pinchDistRef.current - d) * 0.012));
      pinchDistRef.current = d;
      return;
    }

    if (isDraggingRef.current) {
      targetRotRef.current.y += (cx - prevPtrRef.current.x) * 0.007;
      targetRotRef.current.x += (cy - prevPtrRef.current.y) * 0.007;
      targetRotRef.current.x  = Math.max(-1.3, Math.min(1.3, targetRotRef.current.x));
      prevPtrRef.current = { x: cx, y: cy };
    }

    if (!e.touches && cameraRef.current && sculptureGrpRef.current) {
      mouseRef.current.x = ((cx - rect.left) / rect.width)  * 2 - 1;
      mouseRef.current.y = -((cy - rect.top)  / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const hits = raycasterRef.current.intersectObjects(sculptureGrpRef.current.children, true);

      if (hits.length) {
        let m = hits[0].object;
        while (m && !m.userData?.id && m.parent) m = m.parent;
        const hitId = m?.userData?.id;
        if (hitId && hoveredRef.current !== hitId) {
          if (hoveredRef.current) {
            const prev = nodeStatesRef.current.get(hoveredRef.current);
            if (prev) prev.targetHoverDisp = 0;
          }
          hoveredRef.current = hitId;
          const cur = nodeStatesRef.current.get(hitId);
          if (cur) { cur.targetHoverDisp = 1.0; soundFX.playHover(); }
          container.style.cursor = 'pointer';
        }
      } else if (hoveredRef.current) {
        const prev = nodeStatesRef.current.get(hoveredRef.current);
        if (prev) prev.targetHoverDisp = 0;
        hoveredRef.current = null;
        container.style.cursor = 'grab';
      }
    }
  };

  const onUp = (e) => {
    isDraggingRef.current = false; pinchDistRef.current = 0;
    const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    if (Math.hypot(cx - downPtrRef.current.x, cy - downPtrRef.current.y) < 8
        && cameraRef.current && sculptureGrpRef.current && mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mv = new THREE.Vector2(
        ((cx - rect.left) / rect.width) * 2 - 1,
        -((cy - rect.top) / rect.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(mv, cameraRef.current);
      const hits = raycasterRef.current.intersectObjects(sculptureGrpRef.current.children, true);
      if (hits.length) {
        let m = hits[0].object;
        while (m && !m.userData?.id && m.parent) m = m.parent;
        if (m?.userData?.id) toggleNode(m.userData.id);
      }
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    targetZRef.current = Math.max(4, Math.min(11, targetZRef.current + e.deltaY * 0.004));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* WebGL canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onWheel={onWheel}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      />

      {/* Direct-DOM Callout Overlay */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-20">
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
            </linearGradient>
            <filter id="fg" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feComposite in="SourceGraphic" in2="b" operator="over" />
            </filter>
          </defs>
          {Object.keys(CALLOUT_DATA).map(id => (
            <React.Fragment key={id}>
              <path ref={el => el && svgPathsRef.current.set(`${id}-glow`, el)}
                fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeOpacity="0.35" filter="url(#fg)" />
              <path ref={el => el && svgPathsRef.current.set(id, el)}
                fill="none" stroke="url(#lg)" strokeWidth="1.6" strokeDasharray="4 2" />
              <circle ref={el => el && svgDotsRef.current.set(id, el)}
                r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
            </React.Fragment>
          ))}
        </svg>

        {Object.entries(CALLOUT_DATA).map(([id, data]) => {
          const Icon = data.icon || Terminal;
          return (
            <div key={id}
              ref={el => el && cardElsRef.current.set(id, el)}
              style={{ display: 'none', willChange: 'transform' }}
              className="absolute top-0 left-0 pointer-events-auto"
            >
              <div onClick={() => toggleNode(id)}
                className="w-[245px] rounded-xl border border-slate-700/80 bg-slate-950/88 backdrop-blur-xl p-3 shadow-2xl shadow-black/90 hover:border-cyan-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs font-mono font-medium text-slate-200 truncate">{data.title}</span>
                  </div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border font-semibold ${data.badgeColor}`}>{data.badge}</span>
                </div>
                <div className="font-mono text-[10.5px] leading-relaxed space-y-0.5 bg-black/60 rounded-lg p-2 border border-slate-800/80">
                  {data.lines.map((ln, i) => (
                    <div key={i} className={`${ln.color} whitespace-pre overflow-hidden text-ellipsis`}>{ln.text}</div>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE</span>
                  <span className="text-cyan-400/80 group-hover:text-cyan-300">tap to dock</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
