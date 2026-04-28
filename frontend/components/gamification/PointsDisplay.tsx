import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Star } from 'lucide-react';

interface PointsDisplayProps {
    points?: number;
    streak?: number;
}

export default function PointsDisplay({ points = 0, streak = 0 }: PointsDisplayProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-full px-4 py-2 items-center gap-2 text-slate-700 font-semibold">
                {points}
            </div>

        </div>
    );
}
