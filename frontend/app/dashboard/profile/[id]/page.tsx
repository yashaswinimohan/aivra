"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function PublicProfile() {
    const { id } = useParams();
    const router = useRouter();

    const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
        queryKey: ['publicProfile', id],
        queryFn: async () => {
            const res = await api.get(`/users/public/${id}`);
            return res.data;
        },
        enabled: !!id,
        retry: 1
    });

    const { data: courses = [], isLoading: coursesLoading } = useQuery({
        queryKey: ['instructorCourses', id],
        queryFn: async () => {
            const res = await api.get(`/courses?instructorId=${id}`);
            return res.data;
        },
        enabled: !!id
    });

    if (profileLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-48 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </DashboardLayout>
        );
    }

    if (profileError || !profile) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto text-center py-20">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Profile Not Found</h2>
                    <p className="text-slate-500 mb-8">The user profile you are looking for does not exist or is unavailable.</p>
                    <Button onClick={() => router.back()} variant="outline">Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </button>

                <div className="space-y-6">
                    {/* Profile Banner Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-slate-100 overflow-hidden shadow-sm">
                            <div className="h-32 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600" />

                            <CardContent className="-mt-16 pb-8 px-8">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-6">
                                    {/* Avatar */}
                                    <div className="w-32 h-32 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white shrink-0">
                                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-5xl font-bold">
                                            {profile.full_name?.[0] || profile.displayName?.[0] || '?'}
                                        </div>
                                    </div>

                                    <div className="flex-1 pb-2">
                                        <h1 className="text-3xl font-bold text-slate-900 mb-1">{profile.full_name || profile.displayName || 'Anonymous User'}</h1>
                                        {profile.roles && profile.roles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {profile.roles.map((role: string, i: number) => (
                                                    <Badge key={i} className="bg-purple-100 text-purple-700 border-0 hover:bg-purple-200">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8 mt-8">
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Bio */}
                                        {profile.bio && (
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-3">About</h3>
                                                <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
                                            </div>
                                        )}

                                        {/* Skills */}
                                        {profile.skills && profile.skills.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-3">Skills</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.skills.map((skill: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {/* Profile Links */}
                                        {profile.profileLinks && profile.profileLinks.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-3">Links</h3>
                                                <ul className="space-y-3">
                                                    {profile.profileLinks.map((link: string, i: number) => {
                                                        let displayLink = link;
                                                        try {
                                                            const url = new URL(link);
                                                            displayLink = url.hostname.replace('www.', '');
                                                        } catch (e) {}
                                                        
                                                        return (
                                                            <li key={i}>
                                                                <a 
                                                                    href={link.startsWith('http') ? link : `https://${link}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 shrink-0">
                                                                        <LinkIcon className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="truncate font-medium">{displayLink}</span>
                                                                </a>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Published Courses Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-teal-500" />
                            Published Courses
                        </h2>

                        {coursesLoading ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Skeleton className="h-40 rounded-xl" />
                                <Skeleton className="h-40 rounded-xl" />
                            </div>
                        ) : courses.length === 0 ? (
                            <Card className="border-slate-100 bg-slate-50">
                                <CardContent className="py-12 text-center">
                                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 text-lg">This instructor hasn't published any courses yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-6">
                                {courses.map((course: any) => (
                                    <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
                                        <Card className="h-full hover:shadow-lg transition-shadow border-slate-100 cursor-pointer overflow-hidden group">
                                            <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-500 group-hover:h-3 transition-all" />
                                            <CardContent className="p-6">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {course.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {course.domain && <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">{course.domain}</Badge>}
                                                    {course.level && course.level !== 'Beginner' && <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">{course.level}</Badge>}
                                                </div>
                                                <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                                                    {course.description}
                                                </p>
                                                <div className="flex justify-between items-center text-sm font-medium text-slate-400 mt-auto pt-4 border-t border-slate-50">
                                                    <span>{course.modules?.length || 0} Modules</span>
                                                    <span className="flex items-center text-blue-600 group-hover:underline">
                                                        View Course <ExternalLink className="w-3 h-3 ml-1" />
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
