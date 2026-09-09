import React, { useRef, useState, useEffect } from 'react';

interface RunningMarqueeTextProps {
  children: React.ReactNode;
  className?: string;
  speedSec?: number;
  pauseSec?: number;
}

export const RunningMarqueeText: React.FC<RunningMarqueeTextProps> = ({ 
  children, 
  className = '',
  speedSec = 11,
  pauseSec = 1.8
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const isOverflowing = contentRef.current.scrollWidth > containerRef.current.clientWidth + 2;
        setShouldAnimate(isOverflowing);
        if (isOverflowing) {
          // Distance needed to scroll the entire text completely out of the left side
          setOverflowDistance(contentRef.current.scrollWidth);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 150);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap w-full relative ${className}`}>
      <div
        ref={contentRef}
        className={`inline-block ${shouldAnimate ? 'animate-marquee-smooth-loop' : 'truncate'}`}
        style={shouldAnimate ? {
          '--marquee-overflow-width': `${overflowDistance}px`,
          animationDuration: `${speedSec}s`
        } as React.CSSProperties : undefined}
      >
        {children}
      </div>
    </div>
  );
};

