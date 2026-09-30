import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/audioSynth';

export default function CodeExportModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('react');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reactSnippet = `// 1. Install dependencies:
// npm install three lucide-react

import React from 'react';
import ModularCube3D from './components/ModularCube3D';
import CalloutCard from './components/CalloutCard';

export default function Hero3DCube() {
  const [screenPositions, setScreenPositions] = React.useState({});
  const [explodeFactor, setExplodeFactor] = React.useState(0);

  return (
    <div className="relative w-full h-[600px] bg-[#080b11] overflow-hidden rounded-3xl">
      {/* 3D Canvas Element */}
      <ModularCube3D
        theme="obsidian" // 'obsidian' | 'cyberpunk' | 'crystal' | 'titanium'
        explodeFactor={explodeFactor}
        autoRotate={true}
        showDebris={true}
        onScreenPositionsUpdate={setScreenPositions}
      />

      {/* 3D Pinned Callout Cards */}
      {screenPositions['-1,1,-1']?.isExtracted && (
        <CalloutCard cubeKey="-1,1,-1" screenPos={screenPositions['-1,1,-1']} />
      )}
      {screenPositions['1,-1,1']?.isExtracted && (
        <CalloutCard cubeKey="1,-1,1" screenPos={screenPositions['1,-1,1']} />
      )}
    </div>
  );
}`;

  const htmlSnippet = `<!-- Embed Vanilla 3D Cube via CDN -->
<div id="cube-container" style="width: 100%; height: 600px; background: #080b11; position: relative;"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
  const container = document.getElementById('cube-container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0x1e293b, 1.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(5, 8, 7);
  scene.add(dirLight);

  // 3x3x3 Subcube Grid
  const group = new THREE.Group();
  scene.add(group);
  const geo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x0b0d13, metalness: 0.9, roughness: 0.15, clearcoat: 1.0 });

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * 1.05, y * 1.05, z * 1.05);
        group.add(mesh);
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
  animate();
</script>`;

  const activeSnippet = activeTab === 'react' ? reactSnippet : htmlSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopied(true);
    soundFX.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl p-5 sm:p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Embed 3D Cube Element</h3>
              <p className="text-xs text-slate-400">Copy ready-to-use code into your existing website</p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              soundFX.playClick();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-2 my-4">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('react')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'react'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              React / Next.js
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'html'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vanilla HTML / JS
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
          </button>
        </div>

        {/* Code View */}
        <div className="relative rounded-xl bg-slate-950 border border-slate-800/80 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[340px]">
          <pre className="whitespace-pre leading-relaxed">{activeSnippet}</pre>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Works on all major desktop & mobile browsers (WebGL 2.0)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
