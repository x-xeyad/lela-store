import React, { useEffect, useState } from "react";

export const FloatingButterflies = () => {
  const [butterflies, setButterflies] = useState([]);

  useEffect(() => {
    // Generate a set of butterflies with random starting positions and animation delays
    const items = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 10}s`,
      scale: 0.4 + Math.random() * 0.6,
      animationClass: i % 3 === 0 
        ? "animate-[float1_15s_ease-in-out_infinite]" 
        : i % 3 === 1 
          ? "animate-[float2_18s_ease-in-out_infinite]" 
          : "animate-[float3_22s_ease-in-out_infinite]"
    }));
    setButterflies(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {butterflies.map((b) => (
        <svg
          key={b.id}
          className={`absolute opacity-0 text-primary/30 dark:text-secondary/20 fill-current ${b.animationClass}`}
          style={{
            left: b.left,
            animationDelay: b.delay,
            transform: `scale(${b.scale})`,
          }}
          width="40"
          height="40"
          viewBox="0 0 24 24"
        >
          {/* Elegant outline butterfly path */}
          <path d="M12 10c-.07-.38-.27-.72-.56-.96C10.56 8.32 8.7 8 7 8c-2.2 0-4 1.8-4 4 0 1.57.91 2.92 2.22 3.56C4.46 16.71 4 17.8 4 19c0 .55.45 1 1 1 2.2 0 4-1.8 4-4v-1.1c.92.59 2 .93 3 .93 1 0 2.08-.34 3-.93V16c0 2.2 1.8 4 4 4 .55 0 1-.45 1-1 0-1.2-.46-2.29-1.22-3.44C20.09 14.92 21 13.57 21 12c0-2.2-1.8-4-4-4-1.7 0-3.56.32-4.44 1.04-.29.24-.49.58-.56.96zM7 10c1.33 0 2.65.23 3.44.82C9.64 11.75 9 12.8 9 14v1c0 .73-.39 1.36-1 1.73-.25-.33-.6-.59-1-.73-.55-.18-1.1-.18-1.65 0C5.14 15.65 5 15 5 14c0-1.1.9-2 2-2z" />
        </svg>
      ))}
    </div>
  );
};
