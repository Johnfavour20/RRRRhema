/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface GridBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showRadialFade?: boolean;
  id?: string;
}

export default function GridBackground({
  children,
  className = "",
  showRadialFade = true,
  id
}: GridBackgroundProps) {
  return (
    <div id={id} className={`relative min-h-screen bg-[#050505] text-[#F3F4F6] overflow-hidden ${className}`}>
      {/* Grid Pattern Layer */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          backgroundPosition: "center center",
        }}
        id="landing-grid-overlay"
      />

      {/* Radial fade to soften the grid into the deep black borders of the screen */}
      {showRadialFade && (
        <div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(5,5,5,0)_0%,rgba(5,5,5,1)_100%)]"
          id="landing-grid-radial-fade"
        />
      )}

      {/* Luxurious micro-glowing blurred lights centered on the hero text */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/[0.1] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[500px] h-[500px] bg-white/[0.04] blur-[120px] rounded-full pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
