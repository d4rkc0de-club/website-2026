import React, { useState } from 'react';
import ModularCube3D, { THEMES } from './components/ModularCube3D';
import ControlHUD from './components/ControlHUD';
import CubeInspectorModal from './components/CubeInspectorModal';
import CodeExportModal from './components/CodeExportModal';
import { soundFX } from './utils/audioSynth';
import {
  Box,
  Layers,
  Sparkles,
  Zap,
  Code2,
  Cpu,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('obsidian');
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDebris, setShowDebris] = useState(true);
  const [showRings, setShowRings] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeCube, setActiveCube] = useState(null);
  const [pinnedCubeKeys, setPinnedCubeKeys] = useState(['-1,1,-1', '1,-1,1']);
  const [showExportModal, setShowExportModal] = useState(false);



  // Handle cube selection/tap from 3D canvas
  const handleCubeSelect = (cubeInfo) => {
    setActiveCube(cubeInfo);
    // If user tapped a cube not currently pinned, add to pinned callouts
    if (cubeInfo.isExtracted && !pinnedCubeKeys.includes(cubeInfo.key)) {
      setPinnedCubeKeys((prev) => [...prev, cubeInfo.key]);
    }
  };

  // Toggle pinning of callout card
  const handleTogglePinCallout = (key) => {
    setPinnedCubeKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Reset scene
  const handleResetAll = () => {
    setExplodeFactor(0);
    setActiveCube(null);
    setPinnedCubeKeys(['-1,1,-1', '1,-1,1']);
  };

  // Preset scene triggers
  const triggerPreset = (type) => {
    soundFX.playClick();
    if (type === 'explode') {
      setExplodeFactor(0.85);
      soundFX.playExplode(true);
    } else if (type === 'corners') {
      setExplodeFactor(0.2);
      setPinnedCubeKeys(['-1,1,-1', '1,-1,1', '-1,-1,1', '1,1,1']);
    } else if (type === 'cyberpunk') {
      setTheme('cyberpunk');
      setShowDebris(true);
    } else if (type === 'reset') {
      handleResetAll();
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Box className="w-5 h-5 animate-pulse-slow" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white">NEXUS CUBE</span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
                3D WEB COMPONENT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition-all flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Component Code</span>
              <span className="sm:hidden">Code</span>
            </button>

            <button
              onClick={() => {
                setShowExportModal(true);
                soundFX.playClick();
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              Embed on Website
            </button>
          </div>
        </div>
      </header>

      {/* Main 3D Hero Section */}
      <main className="relative pt-16 w-full min-h-[90vh] flex flex-col justify-center items-center overflow-hidden">
        {/* Subtle Background Lighting & Radial Rings */}
        <div className="absolute inset-0 pointer-events-none radar-bg radar-rings opacity-70" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none" />

        {/* Hero Title & Subtitle Badge */}
        <div className="relative z-20 text-center px-4 pt-6 pb-2 max-w-3xl pointer-events-none select-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-cyan-300 text-[11px] font-mono mb-3 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>SEMI-DEFINED MODULAR VOXEL SCULPTURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
            Multi-Scale Metallic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Voxel Cluster</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            An organic, semi-defined composition of clubbed mini-cubes, cantilevered blocks, and floating satellite pods. Tap or drag any voxel to extract and interact.
          </p>
        </div>

        {/* 3D Interactive Canvas Viewport */}
        <div className="relative w-full h-[65vh] sm:h-[72vh] max-h-[850px] my-2">
          {/* High-Performance 3D Metallic Cube Canvas */}
          <ModularCube3D
            theme={theme}
            explodeFactor={explodeFactor}
            autoRotate={autoRotate}
            showDebris={showDebris}
            showRings={showRings}
            onCubeSelect={handleCubeSelect}
            activeCubeKey={activeCube?.id}
          />

          {/* Cube Inspector overlay if a subcube is clicked */}
          {activeCube && (
            <CubeInspectorModal
              cubeData={activeCube}
              onClose={() => setActiveCube(null)}
              onToggleExtraction={(id) => {
                const isExt = !activeCube.isExtracted;
                setActiveCube({ ...activeCube, isExtracted: isExt });
              }}
            />
          )}

          {/* Floating Control HUD */}
          <ControlHUD
            theme={theme}
            setTheme={setTheme}
            explodeFactor={explodeFactor}
            setExplodeFactor={setExplodeFactor}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            showDebris={showDebris}
            setShowDebris={setShowDebris}
            showRings={showRings}
            setShowRings={setShowRings}
            soundMuted={soundMuted}
            setSoundMuted={setSoundMuted}
            onResetAll={handleResetAll}
            onOpenExport={() => setShowExportModal(true)}
          />
        </div>
      </main>

      {/* Feature Showcase & Preset Triggers */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-mono">
            INTERACTIVE MODES & CAPABILITIES
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered as a lightweight, drop-in 3D component with zero external heavy assets.
          </p>
        </div>

        {/* Preset Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <button
            onClick={() => triggerPreset('explode')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all text-left group"
          >
            <div className="p-2 w-fit rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
              Explode Cluster
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Scatters all metallic blocks & clubbed mini-cubes into a zero-g constellation.
            </p>
          </button>

          <button
            onClick={() => triggerPreset('corners')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-purple-500/50 hover:bg-slate-900/90 transition-all text-left group"
          >
            <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono group-hover:text-purple-300 transition-colors">
              Satellite Extraction
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Extracts external pods and triggers live 3D telemetry code callouts.
            </p>
          </button>

          <button
            onClick={() => triggerPreset('cyberpunk')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-pink-500/50 hover:bg-slate-900/90 transition-all text-left group"
          >
            <div className="p-2 w-fit rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono group-hover:text-pink-300 transition-colors">
              Cyberpunk Chrome
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Switches to glowing emissive materials with orbiting polyhedral debris.
            </p>
          </button>

          <button
            onClick={() => triggerPreset('reset')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all text-left group"
          >
            <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono group-hover:text-emerald-300 transition-colors">
              Dock / Reassemble
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Locks all micro-voxels & pods back into the sculptural monolith.
            </p>
          </button>
        </div>

        {/* Feature Highlights Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-lg">
            <Smartphone className="w-6 h-6 text-cyan-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-2 font-mono">Mobile Touch Gestures</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full multi-touch inertia orbit, 2-finger pinch zoom, single tap subcube selection, and responsive collapsible HUD controls.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-lg">
            <Cpu className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-2 font-mono">3D Pinned Glassmorphic HUD</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time 3D-to-2D screen projection connecting live code and data cards to individual subcubes with glowing dynamic SVG vectors.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-lg">
            <Box className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-2 font-mono">Drop-in Modular Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Easily embed as a hero element, feature card, or interactive 3D playground in any React, Next.js, or HTML web project.
            </p>
          </div>
        </div>
      </section>

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500 font-mono">
        <p>3D Modular Interactive Cube Element • Built with Three.js, React & Tailwind CSS</p>
      </footer>
    </div>
  );
}
