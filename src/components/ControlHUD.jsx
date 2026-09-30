import React, { useState } from 'react';
import {
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Code,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { THEMES } from './ModularCube3D';
import { soundFX } from '../utils/audioSynth';

export default function ControlHUD({
  theme,
  setTheme,
  explodeFactor,
  setExplodeFactor,
  autoRotate,
  setAutoRotate,
  showDebris,
  setShowDebris,
  showRings,
  setShowRings,
  soundMuted,
  setSoundMuted,
  onResetAll,
  onOpenExport,
  onOpenInfo,
}) {
  const [isCollapsedMobile, setIsCollapsedMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('controls'); // 'controls' | 'themes'

  const handleExplodeChange = (e) => {
    const val = parseFloat(e.target.value);
    setExplodeFactor(val);
    if (val === 0 || val === 1) {
      soundFX.playExplode(val > 0);
    }
  };

  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundFX.setMuted(next);
    if (!next) {
      soundFX.playClick();
    }
  };

  return (
    <aside aria-label="3D Controls" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-xl transition-all duration-300 pointer-events-auto">
      <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/85 backdrop-blur-2xl p-3 sm:p-4 shadow-2xl shadow-black/80">
        {/* Glow Accent Header line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Mobile Collapse Toggle Bar */}
        <div className="flex sm:hidden items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300">
              3D CUBE MATRIX
            </span>
          </div>
          <button
            onClick={() => setIsCollapsedMobile(!isCollapsedMobile)}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Toggle controls view"
          >
            {isCollapsedMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Content (collapsible on mobile) */}
        <div className={`${isCollapsedMobile ? 'hidden sm:block' : 'block'} space-y-3`}>
          {/* Top Bar: Explode Slider + Quick Toggles */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            {/* Explode / Deconstruct Slider */}
            <div className="flex-1 flex items-center gap-2.5 bg-black/40 px-3 py-2 rounded-xl border border-slate-800">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>DECONSTRUCT MATRIX</span>
                  <span className="text-cyan-300 font-semibold">{Math.round(explodeFactor * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodeFactor}
                  onChange={handleExplodeChange}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {/* Auto Rotate Toggle */}
              <button
                onClick={() => {
                  setAutoRotate(!autoRotate);
                  soundFX.playClick();
                }}
                title={autoRotate ? 'Pause Orbit' : 'Auto Orbit'}
                className={`p-2.5 rounded-xl border transition-all text-xs font-mono flex items-center gap-1.5 ${
                  autoRotate
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">Orbit</span>
              </button>

              {/* Orbiting Debris Toggle */}
              <button
                onClick={() => {
                  setShowDebris(!showDebris);
                  soundFX.playClick();
                }}
                title="Toggle Floating Particles & Ring"
                className={`p-2.5 rounded-xl border transition-all text-xs font-mono flex items-center gap-1.5 ${
                  showDebris
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Debris</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                title={soundMuted ? 'Unmute Audio Haptics' : 'Mute Sound'}
                className={`p-2.5 rounded-xl border transition-all text-xs font-mono ${
                  !soundMuted
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Reset Layout */}
              <button
                onClick={() => {
                  onResetAll();
                  soundFX.playRetract();
                }}
                title="Reset All Cubes & Camera"
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-xs font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Theme Selector Strip */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              <span className="text-[10px] font-mono text-slate-500 uppercase mr-1 hidden sm:inline">Theme:</span>
              {Object.entries(THEMES).map(([key, t]) => {
                const isActive = theme === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key);
                      soundFX.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-slate-700/90 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-400/20 font-semibold'
                        : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: key === 'obsidian' ? '#38bdf8' : key === 'cyberpunk' ? '#ec4899' : key === 'crystal' ? '#93c5fd' : '#eab308'
                      }}
                    />
                    {t.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Embed / Export Code Button */}
            <button
              onClick={() => {
                onOpenExport();
                soundFX.playClick();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all shrink-0 active:scale-95"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Embed Code</span>
            </button>
          </div>
        </div>

        {/* Mobile helper hint */}
        <div className="mt-2 text-center text-[10px] text-slate-500 font-mono flex items-center justify-center gap-3">
          <span>👆 Drag to rotate</span>
          <span>•</span>
          <span>🤏 Pinch to zoom</span>
          <span>•</span>
          <span>✨ Tap block to detach</span>
        </div>
      </div>
    </aside>
  );
}
