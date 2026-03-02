import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressRingProps {
    progress?: number;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

export default function ProgressRing({ progress = 0, size = 120, strokeWidth = 8, children }: ProgressRingProps) {
    const center = size / 2;
    const radius = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                {/* Background circle */}
                <circle
                    className="text-slate-100"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                {/* Progress circle */}
                <circle
                    className="text-teal-500 transition-all duration-1000 ease-out"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                {children}
            </div>
        </div>
    );
}
