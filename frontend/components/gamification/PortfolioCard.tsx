import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PortfolioCard({ portfolioItem }: { portfolioItem: any }) {
    const formattedDate = portfolioItem.issued_at
        ? new Date(portfolioItem.issued_at._seconds ? portfolioItem.issued_at._seconds * 1000 : portfolioItem.issued_at).toLocaleDateString()
        : 'Unknown Date';

    return (
        <Card className="border-slate-200 overflow-hidden bg-white hover:bg-slate-50 transition-colors">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-slate-900 mb-1">{portfolioItem.title}</h4>
                    <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                        <Calendar className="w-3 h-3" />
                        Completed on {formattedDate}
                    </p>
                    {portfolioItem.skills && portfolioItem.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                            {portfolioItem.skills.map((skill: string, idx: number) => (
                                <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="shrink-0 mt-4 sm:mt-0">
                    <Link href={`/dashboard/projects/${portfolioItem.reference_id}`}>
                        <Button variant="outline" size="sm" className="whitespace-nowrap">
                            View Details <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
