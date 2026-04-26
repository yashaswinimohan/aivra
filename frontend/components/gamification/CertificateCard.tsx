import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Download, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import FullCertificate from './FullCertificate';

export function CertificateCard({ certificate }: { certificate: any }) {
    const [showFullCert, setShowFullCert] = React.useState(false);

    const formattedDate = certificate.issued_at
        ? new Date(certificate.issued_at._seconds ? certificate.issued_at._seconds * 1000 : certificate.issued_at).toLocaleDateString()
        : 'Unknown Date';

    return (
        <>
            <Card className="border border-slate-100 overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-white group">
                {/* Elegant Left Accent Gradient */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-600 via-indigo-500 to-purple-600 opacity-80" />
                
                {/* Background Watermark - More Subtle */}
                <div className="absolute -top-12 -right-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 pointer-events-none">
                    <Award className="w-64 h-64 text-slate-900 transform rotate-12" />
                </div>

                <CardContent className="pt-10 pb-8 px-8 relative z-10 text-left">
                    <div className="flex gap-6">
                        {/* Premium Seal Icon */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-700">
                                <Award className="w-8 h-8 text-amber-600" />
                            </div>
                            {/* Decorative Ribbon Tails */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-60">
                                <div className="w-2 h-4 bg-amber-200 rounded-b-sm clip-path-ribbon" />
                                <div className="w-2 h-4 bg-amber-200 rounded-b-sm clip-path-ribbon" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    {certificate.type === 'course' ? 'Official Course Certificate' : 'Project Completion'}
                                </span>
                            </div>
                            
                            <h4 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4 group-hover:text-indigo-900 transition-colors duration-300">
                                {certificate.title}
                            </h4>

                            <div className="flex items-center text-xs font-semibold text-slate-400">
                                <Calendar className="w-3.5 h-3.5 mr-2" />
                                Issued {formattedDate}
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 z-10">
                    <Button 
                        className="w-full h-11 text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white transition-all duration-300 rounded-xl shadow-md hover:shadow-indigo-200"
                        onClick={() => setShowFullCert(true)}
                    >
                        <Award className="w-4 h-4 mr-2" />
                        View Certificate
                    </Button>
                </CardFooter>
            </Card>

            <AnimatePresence>
                {showFullCert && (
                    <FullCertificate 
                        certificate={certificate} 
                        onClose={() => setShowFullCert(false)} 
                    />
                )}
            </AnimatePresence>
        </>
    );
}
