import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Download, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CertificateCard({ certificate }: { certificate: any }) {
    const formattedDate = certificate.issued_at
        ? new Date(certificate.issued_at._seconds ? certificate.issued_at._seconds * 1000 : certificate.issued_at).toLocaleDateString()
        : 'Unknown Date';

    return (
        <Card className="border-slate-100 overflow-hidden relative transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="w-24 h-24 text-slate-900" />
            </div>
            <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <Badge variant="outline" className="mb-1 text-xs">{certificate.type === 'course' ? 'Course Certificate' : 'Project Completion'}</Badge>
                        <h4 className="font-semibold text-slate-900 line-clamp-2">{certificate.title}</h4>
                    </div>
                </div>
                
                <div className="flex items-center text-sm text-slate-500 mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    Issued: {formattedDate}
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between gap-2 z-10">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => alert('Viewing not implemented yet')}>
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View
                </Button>
                <Button size="sm" className="w-full text-xs" onClick={() => alert('Downloading not implemented yet')}>
                    <Download className="w-3 h-3 mr-2" />
                    Download
                </Button>
            </CardFooter>
        </Card>
    );
}
