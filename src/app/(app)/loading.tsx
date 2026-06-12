export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] h-full w-full animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse */}
        <div className="absolute w-16 h-16 border-4 border-secondary/20 rounded-full animate-ping duration-1000"></div>
        {/* Inner high-speed loading spinner */}
        <div className="w-10 h-10 border-4 border-primary border-t-secondary rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-xs font-bold text-on-surface-variant/70 tracking-widest font-mono uppercase animate-pulse">
        Loading Workspace...
      </p>
    </div>
  );
}
