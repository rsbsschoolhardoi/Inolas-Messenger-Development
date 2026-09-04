import React, { useRef, useState, useEffect } from 'react';

interface RunningMarqueeTextProps {
  children: React.ReactNode;
  className?: string;
}

export const RunningMarqueeText: React.FC<RunningMarqueeTextProps> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const isOverflowing = contentRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldAnimate(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap w-full relative ${className}`}>
      <div
        ref={contentRef}
        className={`inline-block ${shouldAnimate ? 'animate-marquee-running' : 'truncate'}`}
      >
        {children}
      </div>
    </div>
  );
};
