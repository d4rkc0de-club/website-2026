import React from 'react';
import { Terminal, Shield, Zap, Database } from 'lucide-react';

// Pre-configured card content mimicking the screenshot's floating code badges
export const CALLOUT_DATA = {
  '-1,1,-1': {
    title: 'auth.controller.ts',
    type: 'code',
    icon: Shield,
    badge: 'ACTIVE POD',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    lines: [
      { text: 'def handle_cube_auth():', color: 'text-purple-400' },
      { text: '  status: 200 OK', color: 'text-emerald-400' },
      { text: '  security: "TLSv1.3"', color: 'text-sky-300' },
      { text: '  node: "sg-edge-01"', color: 'text-slate-400' },
      { text: '  return latency.ok', color: 'text-amber-300' },
    ],
    positionOffset: { x: -280, y: -90 },
    lineSide: 'right', // line anchors to the right of card
  },
  '1,-1,1': {
    title: 'state_tensor.json',
    type: 'json',
    icon: Database,
    badge: 'REPLICATED',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    lines: [
      { text: '{\n  "tensor_id": "0x7F2A",', color: 'text-slate-300' },
      { text: '  "cluster": "modular_mesh",', color: 'text-sky-300' },
      { text: '  "extracted": true,', color: 'text-emerald-400' },
      { text: '  "mesh_density": 1024,', color: 'text-amber-300' },
      { text: '  "encryption": "aes256"', color: 'text-purple-400' },
      { text: '}', color: 'text-slate-300' },
    ],
    positionOffset: { x: 90, y: 30 },
    lineSide: 'left',
  },
  '-1,-1,1': {
    title: 'matrix_optimizer.rs',
    type: 'rust',
    icon: Zap,
    badge: 'OPTIMIZED',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    lines: [
      { text: 'fn compute_matrix_vec() {', color: 'text-indigo-400' },
      { text: '  let load = 0.042;', color: 'text-cyan-300' },
      { text: '  dispatch_gpu(&mesh);', color: 'text-rose-400' },
      { text: '}', color: 'text-indigo-400' },
    ],
    positionOffset: { x: -260, y: 120 },
    lineSide: 'right',
  }
};

export default function CalloutCard({
  cubeKey,
  screenPos,
  data,
  containerSize = { width: 1000, height: 700 },
  onClose,
  accentColor = '#38bdf8',
}) {
  if (!screenPos || !screenPos.isVisible) return null;

  const cardConfig = data || CALLOUT_DATA[cubeKey] || {
    title: `cube[${cubeKey}]`,
    icon: Terminal,
    badge: 'EXTRACTED',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    lines: [
      { text: `key: "${cubeKey}"`, color: 'text-slate-300' },
      { text: `coords: [${cubeKey.split(',').join(', ')}]`, color: 'text-cyan-300' },
      { text: 'state: "detached"', color: 'text-emerald-400' },
      { text: 'physics: "spring_active"', color: 'text-purple-300' },
    ],
    positionOffset: { x: screenPos.x > containerSize.width / 2 ? 80 : -260, y: -40 },
    lineSide: screenPos.x > containerSize.width / 2 ? 'left' : 'right',
  };

  const Icon = cardConfig.icon || Terminal;

  // Calculate card position bounded within container
  let cardX = screenPos.x + cardConfig.positionOffset.x;
  let cardY = screenPos.y + cardConfig.positionOffset.y;

  // Responsive boundary safety clamp
  const cardWidth = 240;
  const cardHeight = 140;
  cardX = Math.max(16, Math.min(containerSize.width - cardWidth - 16, cardX));
  cardY = Math.max(16, Math.min(containerSize.height - cardHeight - 16, cardY));

  // Anchor point on the card for the leader line
  const cardAnchorX = cardConfig.lineSide === 'left' ? cardX : cardX + cardWidth;
  const cardAnchorY = cardY + 40;

  // Target point on the 3D cube
  const targetX = screenPos.x;
  const targetY = screenPos.y;

  // SVG Bezier path between card and 3D cube anchor
  const midX = (cardAnchorX + targetX) / 2;
  const pathD = `M ${cardAnchorX} ${cardAnchorY} C ${midX} ${cardAnchorY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

  return (
    <>
      {/* SVG Connecting Line & Anchor Point */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`line-grad-${cubeKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow Path */}
        <path
          d={pathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeOpacity="0.3"
          filter="url(#glow)"
        />

        {/* Crisp Line */}
        <path
          d={pathD}
          fill="none"
          stroke={`url(#line-grad-${cubeKey})`}
          strokeWidth="1.5"
          strokeDasharray="4 2"
          className="animate-pulse-slow"
        />

        {/* 3D Cube Anchor Node */}
        <circle
          cx={targetX}
          cy={targetY}
          r="4.5"
          fill={accentColor}
          stroke="#ffffff"
          strokeWidth="1.5"
          className="animate-ping opacity-75"
        />
        <circle
          cx={targetX}
          cy={targetY}
          r="4"
          fill={accentColor}
          stroke="#0f172a"
          strokeWidth="2"
        />

        {/* Card Anchor Node */}
        <circle
          cx={cardAnchorX}
          cy={cardAnchorY}
          r="3"
          fill="#38bdf8"
          stroke="#0f172a"
          strokeWidth="1"
        />
      </svg>

      {/* Floating Glassmorphic Badge / Card */}
      <div
        className="absolute z-20 pointer-events-auto transition-all duration-150 ease-out select-none"
        style={{
          transform: `translate3d(${cardX}px, ${cardY}px, 0)`,
          width: `${cardWidth}px`,
        }}
      >
        <div className="relative rounded-xl border border-slate-700/60 bg-slate-900/80 p-3.5 backdrop-blur-xl shadow-2xl shadow-black/80 hover:border-cyan-500/50 transition-colors group">
          {/* Subtle Corner Accent Glow */}
          <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl opacity-70" />
          <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-xl opacity-70" />

          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs font-mono font-medium text-slate-200 truncate">
                {cardConfig.title}
              </span>
            </div>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${cardConfig.badgeColor}`}
            >
              {cardConfig.badge}
            </span>
          </div>

          {/* Code Lines matching reference screenshot */}
          <div className="font-mono text-[11px] leading-relaxed space-y-0.5 bg-black/40 rounded-lg p-2 border border-slate-800/80">
            {cardConfig.lines.map((line, idx) => (
              <div key={idx} className={`${line.color} whitespace-pre overflow-hidden text-ellipsis`}>
                {line.text}
              </div>
            ))}
          </div>

          {/* Footer Telemetry */}
          <div className="mt-2 pt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYNCED
            </span>
            <span className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer">
              tap to toggle
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
