import React from 'react';

interface INolasLogoProps {
  height?: number;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  showText?: boolean;
}

export const INolasLogo: React.FC<INolasLogoProps> = ({
  height = 36,
  className = '',
  theme = 'auto',
  showText = true
}) => {
  // Scale factor based on viewbox height 110
  const width = showText ? Math.round(height * 3.4) : Math.round(height * 1.1);

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 380 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        <defs>
          <linearGradient id="inolasLogoGrad" x1="20" y1="10" x2="110" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E082FF" />
            <stop offset="45%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* Top Slanted Parallelogram with Pink-to-Blue Gradient */}
        <polygon
          points="20,10 72,10 112,60 60,60"
          fill="url(#inolasLogoGrad)"
        />

        {/* Bottom Left Square with Electric Blue */}
        <rect
          x="20"
          y="60"
          width="40"
          height="40"
          fill="#0066FF"
        />

        {/* Brand Name Text: INolas */}
        {showText && (
          <text
            x="132"
            y="75"
            fill="currentColor"
            style={{
              fontFamily: "Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: 700,
              fontSize: "64px",
              letterSpacing: "-0.03em"
            }}
            className={
              theme === 'light'
                ? 'text-[#0a0e27]'
                : theme === 'dark'
                ? 'text-white'
                : 'text-[#0a0e27] dark:text-white'
            }
          >
            INolas
          </text>
        )}
      </svg>
    </div>
  );
};
