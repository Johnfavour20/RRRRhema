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
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "center top",
        }}
        id="landing-grid-overlay"
      />

      {/* Radial fade to soften the grid into the deep black borders of the screen */}
      {showRadialFade && (
        <div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,0)_0%,rgba(5,5,5,0.95)_85%)]"
          id="landing-grid-radial-fade"
        />
      )}

      {/* Luxurious micro-glowing blurred lights */}
      <div className="absolute top-[30%] left-[5%] w-[350px] h-[350px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] bg-white/[0.05] blur-[120px] rounded-full pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
