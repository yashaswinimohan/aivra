import React from 'react';
import { Sparkles, X, Printer, Download, FileJson, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { generateCertificateCanvas } from '@/lib/certificate-generator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FullCertificateProps {
    certificate: any;
    onClose: () => void;
}

export default function FullCertificate({ certificate, onClose }: FullCertificateProps) {
    const certificateRef = React.useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = React.useState(false);

    const formattedDate = certificate.issued_at
        ? new Date(certificate.issued_at._seconds ? certificate.issued_at._seconds * 1000 : certificate.issued_at).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        })
        : 'Unknown Date';


    const downloadAsPNG = async () => {
        setIsExporting(true);
        try {
            const canvas = await generateCertificateCanvas(certificate);
            const link = document.createElement('a');
            link.download = `certificate-${certificate.id || 'download'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('PNG export failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const downloadAsPDF = async () => {
        setIsExporting(true);
        try {
            const canvas = await generateCertificateCanvas(certificate);
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Create PDF in landscape
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificate-${certificate.id || 'download'}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md print:bg-white print:p-0"
        >
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10 print:shadow-none print:max-h-none print:rounded-none">
                {/* Header Actions */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={isExporting} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl h-11 transition-all">
                                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Download Certificate
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 p-2 rounded-xl shadow-xl border-slate-100">
                                <DropdownMenuItem onClick={downloadAsPDF} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors">
                                    <FileText className="w-4 h-4 text-red-500" />
                                    Download as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={downloadAsPNG} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors">
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                    Download as PNG
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 w-11 h-11 transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </Button>
                </div>

                {/* Certificate Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 print:overflow-visible print:p-0" style={{ backgroundColor: '#f8fafc' }}>
                    <div 
                        ref={certificateRef}
                        className="w-full max-w-4xl mx-auto border-[20px] p-2 relative print:shadow-none print:border-[10px]"
                        style={{ backgroundColor: '#ffffff', color: '#1e293b', borderColor: '#ffffff', boxShadow: '0 0 50px -12px rgba(0,0,0,0.12)' }}
                    >
                        <div className="border-2 p-8 md:p-16 text-center relative overflow-hidden" style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9' }}>
                            
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 left-0 w-48 h-48 border-t-8 border-l-8" style={{ borderColor: 'rgba(45, 212, 191, 0.1)' }} />
                            <div className="absolute bottom-0 right-0 w-48 h-48 border-b-8 border-r-8" style={{ borderColor: 'rgba(168, 85, 247, 0.1)' }} />
                            
                            {/* Aivra Logo */}
                            <div className="flex items-center justify-center gap-3 mb-12">
                                <div className="flex aspect-square size-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(to bottom right, #2dd4bf, #a855f7)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                                    <Sparkles size={32} color="#ffffff" />
                                </div>
                                <span className="font-extrabold text-3xl tracking-tight" style={{ color: '#0f172a' }}>Aivra</span>
                            </div>
                            
                            <h1 className="text-4xl md:text-6xl font-serif mb-6 tracking-wide uppercase font-medium" style={{ color: '#1e293b' }}>Certificate of Completion</h1>
                            <p className="text-xl uppercase tracking-[0.3em] mb-12 font-medium" style={{ color: '#64748b' }}>This is to certify that</p>
                            
                            <h2 className="text-4xl md:text-5xl font-bold border-b-2 border-[#e2e8f0] inline-block px-16 pb-3 mb-12 leading-tight" style={{ color: '#0f172a' }}>
                                {certificate.userName || 'Valued Student'}
                            </h2>
                            
                            <p className="text-xl mb-4" style={{ color: '#475569' }}>has successfully completed the official course</p>
                            <h3 className="text-3xl md:text-4xl font-black mb-8 px-4" style={{ color: '#2563eb' }}>
                                {certificate.title?.replace('Course Completion: ', '') || 'Academic Excellence'}
                            </h3>
                            
                            {certificate.skills ? (
                                <div className="inline-block px-8 py-4 rounded-2xl mb-16 max-w-2xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#94a3b8' }}>Key Skills Mastered</p>
                                    <p className="text-lg font-semibold" style={{ color: '#1e293b' }}>{certificate.skills}</p>
                                </div>
                            ) : (
                                <div className="h-16 mb-16" /> 
                            )}
                            
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-end px-12 mt-12 gap-12 md:gap-0">
                                <div className="text-left order-2 md:order-1">
                                    <p className="text-xl font-bold pb-2 mb-2 min-w-[200px] text-center" style={{ color: '#1e293b', borderBottom: '2px solid #f1f5f9' }}>{formattedDate}</p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: '#94a3b8' }}>Date Issued</p>
                                </div>
                                
                                <div className="text-center min-w-[240px] order-1 md:order-2">
                                    <div className="pb-2 mb-3 relative h-20 flex items-end justify-center" style={{ borderBottom: '2px solid #f1f5f9' }}>
                                        {certificate.instructorName ? (
                                            <span className="text-5xl tracking-tighter" style={{ fontFamily: "'Brush Script MT', 'Cedarville Cursive', cursive", color: '#1e293b' }}>
                                                {certificate.instructorName}
                                            </span>
                                        ) : (
                                            <span className="italic text-sm mb-4" style={{ color: '#e2e8f0' }}>Official Signature</span>
                                        )}
                                    </div>
                                    <p className="text-lg font-extrabold leading-none" style={{ color: '#0f172a' }}>{certificate.instructorName || 'Lead Instructor'}</p>
                                    <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: '#94a3b8' }}>{certificate.designation || 'Aivra Academy'}</p>
                                </div>
                            </div>

                            {/* Verification Badge */}
                            <div className="mt-16 pt-8 flex items-center justify-center gap-4 opacity-40 grayscale" style={{ borderTop: '1px solid #f8fafc' }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Verified Certificate ID: {certificate.id?.substring(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
