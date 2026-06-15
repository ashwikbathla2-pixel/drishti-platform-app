import { useRef, useState } from "react";

export function SpotlightCard({ children, className = "", ...rest }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative overflow-hidden rounded-2xl glass p-6 transition-colors duration-500 hover:border-white/15 ${className}`}
      {...rest}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, rgba(230,192,117,0.10), transparent 70%)` }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default SpotlightCard;
