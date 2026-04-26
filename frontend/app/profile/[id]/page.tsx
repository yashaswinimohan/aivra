"use client";

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Briefcase,
    ExternalLink,
    Trophy,
    Link as LinkIcon,
    ArrowLeft,
    Sparkles,
    Award,
    MapPin,
    Calendar,
    Globe,
    Github,
    Linkedin,
    Twitter
} from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import FullCertificate from '@/components/gamification/FullCertificate';
import { AnimatePresence } from 'framer-motion';

export default function PublicProfilePage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Suspense fallback={<ProfileLoadingSkeleton />}>
                <ProfileContent />
            </Suspense>
        </div>
    );
}

function ProfileContent() {
    const { id } = useParams();

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['publicProfile', id],
        queryFn: async () => {
            const res = await api.get(`/users/public/${id}`);
            return res.data;
        },
        enabled: !!id,
        retry: 1
    });

    const { data: allProjects = [] } = useQuery({
        queryKey: ['publicProjects'],
        queryFn: async () => (await api.get('/projects')).data,
    });

    const { data: allCourses = [] } = useQuery({
        queryKey: ['publicCourses'],
        queryFn: async () => (await api.get('/courses')).data,
    });

    const [selectedCert, setSelectedCert] = React.useState<any>(null);

    if (isLoading) return <ProfileLoadingSkeleton />;
    if (error || !profile) return <ProfileNotFound />;

    const showcaseProjects = allProjects.filter((p: any) => profile.showcaseProjects?.includes(p.id));
    const showcaseCourses = allCourses.filter((c: any) => profile.showcaseCourses?.includes(c.id));

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
            <div className="flex items-center justify-between mb-8">
                <Link href={createPageUrl('/')}>
                    <div className="flex items-center gap-2 font-bold text-xl text-[#7a49e6]">
                        <Sparkles className="w-6 h-6" />
                        Aivra
                    </div>
                </Link>
                <div className="flex gap-3">
                    <Link href={createPageUrl('/login')}>
                        <Button variant="ghost" className="text-slate-600">Login</Button>
                    </Link>
                    <Link href={createPageUrl('/signup')}>
                        <Button className="bg-slate-900 hover:bg-black text-white rounded-full px-6">Join Aivra</Button>
                    </Link>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Profile Header Card */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">
                    <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative" />
                    
                    <div className="px-6 md:px-12 pb-10 -mt-12 relative">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar */}
                            <div className="w-32 h-32 rounded-[2rem] bg-white shadow-xl flex items-center justify-center border-8 border-white shrink-0">
                                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-white text-5xl font-black">
                                    {profile.full_name?.[0] || profile.displayName?.[0] || '?'}
                                </div>
                            </div>

                            <div className="flex-1 pt-14 md:pt-12">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                                            {profile.full_name || (profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.displayName || 'Showcase Profile')}
                                        </h1>
                                        <div className="flex flex-wrap gap-4 text-slate-500 font-medium text-sm">
                                            {(profile.roles && profile.roles.length > 0) ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.roles.map((role: string, i: number) => (
                                                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                                                            <Briefcase className="w-3 h-3" />
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : profile.role ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase className="w-4 h-4 text-indigo-500" />
                                                    {profile.role}
                                                </span>
                                            ) : null}
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                                                <Trophy className="w-3 h-3" />
                                                {profile.points || 0} Points
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {(profile.profileLinks || []).map((link: string, i: number) => (
                                            <a 
                                                key={i} 
                                                href={link.startsWith('http') ? link : `https://${link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100"
                                            >
                                                <SocialIcon url={link} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 grid lg:grid-cols-3 gap-12 pt-8 border-t border-slate-50">
                            <div className="lg:col-span-2 space-y-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        About Me
                                    </h2>
                                    <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {profile.bio || "No bio provided yet. I'm busy building amazing things!"}
                                    </p>
                                </div>

                                {profile.skills && profile.skills.length > 0 && (
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            Expertise
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill: string, i: number) => (
                                                <Badge key={i} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 px-4 py-2 rounded-xl text-sm font-bold">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Showcase Projects */}
                                {showcaseProjects.length > 0 && (
                                    <div className="space-y-6 pt-4">
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-indigo-600" />
                                            Featured Projects
                                        </h2>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {showcaseProjects.map((project: any) => (
                                                <div key={project.id} className="group p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                    <h3 className="font-bold text-slate-900 text-lg mb-4 line-clamp-1">{project.title}</h3>
                                                    <Link href={`/project/${project.id}`}>
                                                        <Button className="w-full h-11 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                                                            View Project
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Showcase Courses */}
                                {showcaseCourses.length > 0 && (
                                    <div className="space-y-6 pt-4">
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-teal-600" />
                                            Featured Learning
                                        </h2>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {showcaseCourses.map((course: any) => {
                                                const cert = (profile.certificates || []).find((c: any) => c.reference_id === course.id && c.type === 'course');
                                                return (
                                                    <div key={course.id} className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                        <h3 className="font-bold text-slate-900 text-lg mb-4 line-clamp-1">{course.title}</h3>
                                                        <Button 
                                                            onClick={() => cert && setSelectedCert({...cert, userName: profile.full_name || profile.displayName})}
                                                            disabled={!cert}
                                                            className="w-full h-11 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400"
                                                        >
                                                            <Award className="w-4 h-4 mr-2" />
                                                            {cert ? 'View Certificate' : 'Certificate Pending'}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-8">
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Stats & Achievements</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-indigo-500" />
                                                <span className="text-sm font-bold text-slate-600">Total Points</span>
                                            </div>
                                            <span className="text-lg font-black text-indigo-600">{profile.points || 0}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Projects</p>
                                                <p className="text-sm font-black text-slate-900">{profile.project_points || 0} pts</p>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Courses</p>
                                                <p className="text-sm font-black text-slate-900">{profile.course_points || 0} pts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-amber-500" />
                                                <span className="text-sm font-bold text-slate-600">Badges</span>
                                            </div>
                                            <span className="text-lg font-black text-amber-500">{(profile.badges?.length || 0)}</span>
                                        </div>
                                    </div>

                                    {/* Mini Badge Gallery */}
                                    {profile.badges && profile.badges.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-2">
                                                {profile.badges.slice(0, 4).map((badge: any, i: number) => (
                                                    <div key={i} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-50 flex items-center justify-center text-xl" title={badge.name}>
                                                        {badge.icon || '🏆'}
                                                    </div>
                                                ))}
                                                {profile.badges.length > 4 && (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        +{profile.badges.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="text-center py-12">
                    <p className="text-slate-400 text-sm italic mb-4">Want a profile like this? Join the future of collaborative learning.</p>
                    <Link href={createPageUrl('/signup')}>
                        <Button variant="outline" className="rounded-full px-8 border-slate-200">Create My Aivra Profile</Button>
                    </Link>
                </div>
            </motion.div>

            <AnimatePresence>
                {selectedCert && (
                    <FullCertificate 
                        certificate={selectedCert} 
                        onClose={() => setSelectedCert(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function SocialIcon({ url }: { url: string }) {
    if (url.includes('github.com')) return <Github className="w-5 h-5" />;
    if (url.includes('linkedin.com')) return <Linkedin className="w-5 h-5" />;
    if (url.includes('twitter.com') || url.includes('x.com')) return <Twitter className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
}

function ProfileLoadingSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <Skeleton className="h-40 w-full rounded-[32px] mb-8" />
            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </div>
                <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
        </div>
    );
}

function ProfileNotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <UserIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h1>
            <p className="text-slate-500 mb-8">This showcase profile doesn't exist or is currently private.</p>
            <Link href={createPageUrl('/')}>
                <Button>Explore Aivra</Button>
            </Link>
        </div>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
    );
}
