'use client';

import React, { useEffect, useRef } from 'react';

interface GlassVoteBarProps {
    voteA: number;
    voteB: number;
    title?: string; // e.g. "Region Name" or "Total Result"
    className?: string;
}

export default function GlassVoteBar({ voteA, voteB, title = 'Voting Result', className = '' }: GlassVoteBarProps) {
    const barRef = useRef<HTMLDivElement>(null);
    const totalVotes = voteA + voteB;

    useEffect(() => {
        const el = barRef.current;
        if (!el) return;

        // Color definitions (as requested)
        const colorA = { r: 30, g: 144, b: 255 }; // DodgerBlue
        const colorB = { r: 255, g: 69, b: 0 };   // OrangeRed

        if (totalVotes === 0) {
            el.style.setProperty('--glass-rgb', '150, 150, 150');
            el.style.setProperty('--glass-opacity', '0.3');
            return;
        }

        // 1. Color Mixing (Linear Interpolation)
        const ratio = voteA / totalVotes;
        const r = Math.round(colorB.r + (colorA.r - colorB.r) * ratio);
        const g = Math.round(colorB.g + (colorA.g - colorB.g) * ratio);
        const b = Math.round(colorB.b + (colorA.b - colorB.b) * ratio);

        // 2. Opacity/Concentration Calculation
        // Max opacity 0.85 at 200 votes (user logic)
        const maxVotes = 200;
        let opacity = 0.3 + (totalVotes / maxVotes) * 0.55;
        if (opacity > 0.85) opacity = 0.85;

        // 3. Inject into CSS Variables
        el.style.setProperty('--glass-rgb', `${r}, ${g}, ${b}`);
        el.style.setProperty('--glass-opacity', opacity.toFixed(2));

    }, [voteA, voteB, totalVotes]);

    return (
        <div className={`glass-vote-container ${className}`}>
            <h3 className="mb-2 text-sm font-bold text-gray-700 text-center uppercase tracking-wider opacity-80 backdrop-blur-sm bg-white/30 rounded-full px-3 py-1 inline-block mx-auto shadow-sm">
                {title}
            </h3>
            <div ref={barRef} className="glass-bar">
                <span className="text relative z-10 px-4 py-1">
                    {totalVotes === 0 ? (
                        "No Votes Yet"
                    ) : (
                        <>
                            <span className="text-blue-100 drop-shadow-md">A: {voteA.toLocaleString()}</span>
                            <span className="mx-2 opacity-50">|</span>
                            <span className="text-red-100 drop-shadow-md">B: {voteB.toLocaleString()}</span>
                        </>
                    )}
                </span>
            </div>

            <style jsx>{`
                .glass-vote-container {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .glass-bar {
                    /* 1. Size & Shape */
                    width: 100%;
                    max-width: 400px; /* Limit width */
                    height: 60px;
                    border-radius: 30px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    transition: all 0.5s ease;

                    /* 2. Default Variables */
                    --glass-rgb: 150, 150, 150; 
                    --glass-opacity: 0.3;

                    /* 3. Background & Blur (Glassmorphism Core) */
                    background: rgba(var(--glass-rgb), var(--glass-opacity));
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);

                    /* 4. Border & Highlights */
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 
                        inset 2px 2px 4px rgba(255, 255, 255, 0.6),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.1),
                        0 8px 20px -5px rgba(var(--glass-rgb), 0.4);

                    /* 5. Surface Gloss Gradient */
                    background-image: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%);
                }
            `}</style>
        </div>
    );
}
