/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textColorClassName?: string;
  variant?: 'full' | 'icon' | 'badge';
  withContainer?: boolean;
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  showText = false,
  textColorClassName = 'text-white',
  variant = 'full',
  withContainer = false
}: LogoProps) {
  const sizeMap = {
    xs: { box: 'h-6 w-6', icon: 'h-6 w-6', text: 'text-xs' },
    sm: { box: 'h-8 w-8', icon: 'h-8 w-8', text: 'text-sm' },
    md: { box: 'h-11 w-11', icon: 'h-11 w-11', text: 'text-lg' },
    lg: { box: 'h-16 w-16', icon: 'h-16 w-16', text: 'text-2xl' },
    xl: { box: 'h-24 w-24', icon: 'h-24 w-24', text: 'text-3xl' },
    '2xl': { box: 'h-32 w-32', icon: 'h-32 w-32', text: 'text-4xl' },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div id="adsp-logo-wrapper" className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Visual Logo SVG */}
      <div 
        id="adsp-logo-icon"
        className={`${withContainer ? `${selectedSize.box} bg-white/95 rounded-2xl p-1 shadow-md border border-slate-200/80` : selectedSize.box} flex items-center justify-center shrink-0 transform hover:scale-105 transition-all duration-300`}
      >
        <svg 
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            {/* Arcs for top and bottom text along path */}
            <path id="adsp-top-arc" d="M 85 210 A 180 180 0 0 1 415 210" fill="none" />
            <path id="adsp-bottom-arc" d="M 125 340 A 175 175 0 0 0 375 340" fill="none" />

            {/* Sparkle diamond stars */}
            <g id="adsp-sparkle-blue">
              <path d="M 0,-18 Q 0,0 18,0 Q 0,0 0,18 Q 0,0 -18,0 Q 0,0 0,-18 Z" fill="#2563eb" />
              <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#93c5fd" />
            </g>
            <g id="adsp-sparkle-green">
              <path d="M 0,-16 Q 0,0 16,0 Q 0,0 0,16 Q 0,0 -16,0 Q 0,0 0,-16 Z" fill="#15803d" />
              <path d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z" fill="#86efac" />
            </g>
          </defs>

          {/* Top Curved Text: ACADEMIC DATA */}
          <text 
            fontFamily="'Impact', 'Arial Black', sans-serif" 
            fontWeight="900" 
            fontSize="29" 
            fill="#15803d" 
            letterSpacing="3.5"
          >
            <textPath href="#adsp-top-arc" startOffset="50%" textAnchor="middle">
              ACADEMIC DATA
            </textPath>
          </text>

          {/* Planetary Ring (Back Swoosh) */}
          <path 
            d="M 100 215 C 130 165, 330 155, 430 200 C 445 208, 410 220, 360 222 C 275 226, 165 230, 100 215 Z" 
            fill="#16a34a" 
            opacity="0.95" 
          />

          {/* Globe Spherical Wireframe */}
          <g id="adsp-globe">
            {/* Globe Outer Circle */}
            <circle cx="250" cy="245" r="132" fill="#ffffff" stroke="#15803d" strokeWidth="4.5" />
            
            {/* Center vertical prime meridian */}
            <line x1="250" y1="113" x2="250" y2="377" stroke="#16a34a" strokeWidth="2.6" />
            
            {/* Curved Longitude Meridians */}
            <ellipse cx="250" cy="245" rx="42" ry="132" fill="none" stroke="#16a34a" strokeWidth="2.3" />
            <ellipse cx="250" cy="245" rx="84" ry="132" fill="none" stroke="#16a34a" strokeWidth="2.3" />
            <ellipse cx="250" cy="245" rx="114" ry="132" fill="none" stroke="#16a34a" strokeWidth="2.3" />

            {/* Latitude Parallels */}
            <line x1="118" y1="245" x2="382" y2="245" stroke="#16a34a" strokeWidth="2.6" />
            <path d="M 131 205 C 160 215, 340 215, 369 205" fill="none" stroke="#16a34a" strokeWidth="2.2" />
            <path d="M 156 165 C 185 175, 315 175, 344 165" fill="none" stroke="#16a34a" strokeWidth="2.2" />
            <path d="M 193 133 C 215 140, 285 140, 307 133" fill="none" stroke="#16a34a" strokeWidth="2.2" />
            <path d="M 131 285 C 160 275, 340 275, 369 285" fill="none" stroke="#16a34a" strokeWidth="2.2" />
            <path d="M 156 325 C 185 315, 315 315, 344 325" fill="none" stroke="#16a34a" strokeWidth="2.2" />
            <path d="M 193 357 C 215 350, 285 350, 307 357" fill="none" stroke="#16a34a" strokeWidth="2.2" />
          </g>

          {/* Planetary Ring (Front Swoop with dynamic sharp tapered ends) */}
          <g id="adsp-ring-front">
            <path 
              d="M 40 236 C 25 220, 58 198, 150 206 C 245 212, 425 250, 465 272 C 480 280, 452 297, 378 297 C 255 297, 75 260, 40 236 Z" 
              fill="#15803d" 
            />
            {/* Dynamic internal motion accents */}
            <path 
              d="M 270 293 L 422 286 C 448 284, 458 278, 452 274 C 410 258, 288 234, 198 224 L 198 230 C 275 240, 395 265, 414 275 C 392 280, 330 288, 270 293 Z" 
              fill="#22c55e" 
              opacity="0.8" 
            />
          </g>

          {/* Central Bold ADSP Letters */}
          <g id="adsp-text-center" transform="translate(250, 252)">
            {/* White outline buffer to make ADSP pop cleanly against the graticule lines */}
            <text 
              x="0" 
              y="0" 
              fontFamily="'Impact', 'Arial Black', sans-serif" 
              fontWeight="900" 
              fontSize="64" 
              fill="#ffffff" 
              stroke="#ffffff" 
              strokeWidth="12" 
              strokeLinejoin="round"
              textAnchor="middle" 
              dominantBaseline="central"
              letterSpacing="2"
            >
              ADSP
            </text>
            
            {/* Main Emerald Green Fill */}
            <text 
              x="0" 
              y="0" 
              fontFamily="'Impact', 'Arial Black', sans-serif" 
              fontWeight="900" 
              fontSize="64" 
              fill="#15803d" 
              stroke="#14532d" 
              strokeWidth="2" 
              strokeLinejoin="round"
              textAnchor="middle" 
              dominantBaseline="central"
              letterSpacing="2"
            >
              ADSP
            </text>
          </g>

          {/* Diamond Sparkle Stars */}
          {/* Top-Right Blue Diamond Star */}
          <use href="#adsp-sparkle-blue" x="410" y="165" />
          
          {/* Bottom-Left Blue Diamond Star */}
          <use href="#adsp-sparkle-blue" x="102" y="305" />
          
          {/* Ring Green Sparkle (Right) */}
          <use href="#adsp-sparkle-green" x="372" y="180" />
          
          {/* Ring Green Sparkle (Left) */}
          <use href="#adsp-sparkle-green" x="138" y="286" />

          {/* Bottom Curved Text: STORE PROJECT */}
          <text 
            fontFamily="'Impact', 'Arial Black', sans-serif" 
            fontWeight="900" 
            fontSize="29" 
            fill="#15803d" 
            letterSpacing="3.5"
          >
            <textPath href="#adsp-bottom-arc" startOffset="50%" textAnchor="middle">
              STORE PROJECT
            </textPath>
          </text>
        </svg>
      </div>

      {/* Brand Text Header */}
      {showText && (
        <div id="adsp-brand-text" className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`${selectedSize.text} font-display font-black tracking-tight text-emerald-500`}>
              ADSP
            </span>
            <span className={`${selectedSize.text} font-display font-bold tracking-tight ${textColorClassName}`}>
              STORE
            </span>
          </div>
          <span className="text-[9px] text-emerald-400/90 font-mono tracking-wider uppercase font-semibold leading-none">
            Academic Data Store Project
          </span>
        </div>
      )}
    </div>
  );
}
