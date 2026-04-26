"use client";

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Globe, 
    Clock, 
    ExternalLink, 
    Github, 
    Linkedin, 
    Twitter, 
    Share2, 
    ArrowLeft,
    Users,
    Tag as TagIcon,
    Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';

export default function ProjectPublicProfilePage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Suspense fallback={<ProjectLoadingSkeleton />}>
                <ProjectProfileContent />
            </Suspense>
        </div>
    );
}

function ProjectProfileContent() {
    const params = useParams();
    const id = params.id;

    const { data: project, isLoading, error } = useQuery({
        queryKey: ['project-public', id],
        queryFn: async () => {
            const res = await api.get(`/projects/${id}`);
            return res.data;
        },
        enabled: !!id
    });

    if (isLoading) return <ProjectLoadingSkeleton />;
    if (error || !project) return <ProjectNotFound />;

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: project.title,
                text: project.description,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
            {/* Navigation / Header */}
            <div className="flex items-center justify-end mb-8">
                <Button variant="outline" onClick={handleShare} className="rounded-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Project
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100"
            >
                {/* Hero Banner */}
                <div className="h-48 md:h-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                    <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
                </div>

                <div className="px-6 md:px-12 pb-12 -mt-16 relative">
                    {/* Project Icon/Logo */}
                    <div className="w-32 h-32 rounded-3xl bg-white shadow-xl flex items-center justify-center border-8 border-white mb-6">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-white text-4xl font-black">
                            {project.title?.[0] || "P"}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-10">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {project.status || "Completed"}
                                    </Badge>
                                    <span className="text-slate-400">•</span>
                                    <p className="text-slate-500 flex items-center gap-1.5 text-sm font-medium">
                                        <Clock className="w-4 h-4" />
                                        {project.duration || "4-6 weeks"}
                                    </p>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                                    {project.title}
                                </h1>
                                
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {(project.tags || []).map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 px-4 py-1.5 rounded-xl text-sm font-medium">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-indigo-500" />
                                    Project Overview
                                </h2>
                                <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {project.description || "No description provided for this project."}
                                </p>
                            </div>

                            {/* Links to Work Section */}
                            {(project.public_links && project.public_links.length > 0) && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-blue-500" />
                                        Links to Work
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {project.public_links.map((link: any, i: number) => (
                                            <a 
                                                key={i} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        <LinkIcon url={link.url} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 group-hover:text-slate-900">{link.label}</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-10">
                            {/* Team Section */}
                            <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    The Team
                                </h3>
                                <div className="space-y-4">
                                    {(project.team_members || []).map((member: any, i: number) => (
                                        <Link key={i} href={`/profile/${member.id}`}>
                                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group cursor-pointer">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm border-2 border-white shadow-sm">
                                                    {member.name?.[0] || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors truncate">{member.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{member.role || "Contributor"}</p>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Join Section */}
                            {project.status !== 'Completed' && (
                                (() => {
                                    const totalSpots = (project.roles_needed || []).reduce((acc: number, r: string) => {
                                        const match = r.match(/^(\d+)\s*x/);
                                        return acc + (match ? parseInt(match[1]) : 1);
                                    }, 0);
                                    const spotsFilled = (project.team_members || []).filter((m: any) => m.role !== 'Owner').length;
                                    
                                    if (spotsFilled < totalSpots) {
                                        return (
                                            <div className="p-1">
                                                <p className="text-xs text-slate-400 text-center mb-4 italic">
                                                    Interested in collaborating?
                                                </p>
                                                <Link href={createPageUrl('/dashboard/projects')} className="block">
                                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-2xl font-bold shadow-lg shadow-indigo-200">
                                                        Join the Team
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function LinkIcon({ url }: { url: string }) {
    if (url.includes('github.com')) return <Github className="w-5 h-5" />;
    if (url.includes('linkedin.com')) return <Linkedin className="w-5 h-5" />;
    if (url.includes('twitter.com') || url.includes('x.com')) return <Twitter className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
}

function ProjectLoadingSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <Skeleton className="h-10 w-32 mb-8" />
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-100">
                <Skeleton className="h-64 w-full" />
                <div className="px-12 pb-12 -mt-16 relative">
                    <Skeleton className="w-32 h-32 rounded-3xl mb-6 border-8 border-white" />
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-12 w-3/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-24 rounded-xl" />
                                <Skeleton className="h-8 w-24 rounded-xl" />
                            </div>
                            <Skeleton className="h-32 w-full" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-64 w-full rounded-[24px]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProjectNotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <Briefcase className="w-10 h-10 text-slate-300" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
            <p className="text-slate-500 mb-8">The project you are looking for doesn't exist or is no longer public.</p>
            <Link href={createPageUrl('/')}>
                <Button>Back to Home</Button>
            </Link>
        </div>
    );
}
