type ReplayButtonProps = {
  onReplay: () => void;
};

export function ReplayButton({ onReplay }: ReplayButtonProps) {
  return (
    <button
      type="button"
      onClick={onReplay}
      className="absolute top-4 left-4 z-10 border border-line bg-void px-2 py-1 font-mono text-[11px] uppercase tracking-widest hover:bg-paper hover:text-void"
    >
      [ Replay ]
    </button>
  );
}
