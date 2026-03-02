import React from 'react';

interface BadgeCardProps {
    badge: any;
    earned?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function BadgeCard({ badge, earned = false, size = 'md' }: BadgeCardProps) {
    return (
        <div className={`p-4 rounded-xl text-center border ${earned ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-slate-100 bg-slate-50 opacity-60'} ${size === 'sm' ? 'w-24 h-24 text-xs' : 'w-32 h-32 text-sm'}`}>
            <div className={`mx-auto rounded-full bg-white flex items-center justify-center shadow-sm ${size === 'sm' ? 'w-10 h-10 mb-2' : 'w-14 h-14 mb-3'}`}>
                {badge?.icon || '🏆'}
            </div>
            <p className="font-semibold text-slate-800 line-clamp-2">{badge?.name || 'Badge'}</p>
        </div>
    );
}
