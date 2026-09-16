function AvaAvatar() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-10 h-10 shrink-0"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="21" fill="none" stroke="#2a415a" strokeWidth="1" className="ava-ring-outer" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="#e8a33d" strokeWidth="1.25" opacity="0.6" className="ava-ring-inner" />
      <circle cx="24" cy="24" r="6" fill="#e8a33d" className="ava-core" />
      <circle cx="24" cy="9" r="1.6" fill="#e8a33d" className="ava-orbit" />
    </svg>
  );
}

export function Ava({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <AvaAvatar />
      <div className="flex-1 pt-1.5">
        <div className="font-mono text-[11px] text-paper-500 mb-1.5 flex items-center gap-2">
          Ava — your AI strategy guide
          <span className="inline-flex gap-0.5">
            <span className="ava-typing-dot w-1 h-1 bg-signal-500 rounded-full" style={{ animationDelay: "0ms" }} />
            <span className="ava-typing-dot w-1 h-1 bg-signal-500 rounded-full" style={{ animationDelay: "160ms" }} />
            <span className="ava-typing-dot w-1 h-1 bg-signal-500 rounded-full" style={{ animationDelay: "320ms" }} />
          </span>
        </div>
        <p className="text-lg md:text-xl text-paper-100 leading-relaxed font-display">
          {children}
        </p>
      </div>
    </div>
  );
}
