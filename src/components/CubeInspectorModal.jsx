import React from 'react';
import { X, Box, Layers, Cpu, Radio, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/audioSynth';

export default function CubeInspectorModal({
  cubeData,
  onClose,
  onToggleExtraction,
}) {
  if (!cubeData) return null;

  const isMiniVoxel = cubeData.id?.startsWith('mini_');
  const isPod = cubeData.id?.startsWith('extracted_pod');

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-40 w-[90%] max-w-sm transition-all duration-300 pointer-events-auto animate-fadeIn">
      <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl p-4 shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isMiniVoxel
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : isPod
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {isMiniVoxel ? <Sparkles className="w-4 h-4" /> : <Box className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <span>{cubeData.id?.toUpperCase()}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  cubeData.isExtracted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {cubeData.isExtracted ? 'DETACHED' : 'DOCKED'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {isMiniVoxel ? 'Compound Micro-Voxel' : isPod ? 'Detachable Satellite Pod' : 'Monolith Backbone'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              soundFX.playClick();
            }}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="my-3 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-slate-400">Cluster Type</span>
            <span className="text-cyan-300 font-semibold">
              {isMiniVoxel ? 'Mini-Cube Club' : 'Metallic Voxel'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-slate-400">Physics State</span>
            <span className="text-emerald-400 font-semibold">
              {cubeData.isExtracted ? 'Floating (Zero-G)' : 'Locked in Matrix'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-slate-400">Surface Finish</span>
            <span className="text-amber-300 font-semibold">Obsidian Chrome 98%</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onToggleExtraction(cubeData.id);
            }}
            className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold transition-all text-center"
          >
            {cubeData.isExtracted ? 'Dock into Monolith' : 'Extract / Detach Pod'}
          </button>
        </div>
      </div>
    </div>
  );
}
