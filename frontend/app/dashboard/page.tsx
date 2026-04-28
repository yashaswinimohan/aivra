"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BookOpen,
    Briefcase,
    ArrowRight,
    Play,
    Sparkles,
    Users,
    Clock,
    Trophy,
    Zap,
    Flame,
    Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PointsDisplay, BadgeCard } from '@/components/gamification';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
            if (currentUser) {
                try {
                    const response = await api.get('/users/profile');
                    setUser(response.data);
                } catch (error) {
                    console.error("Failed to load user profile:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
        queryKey: ['enrollments', user?.email],
        queryFn: async () => (await api.get('/enrollments', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const { data: courses = [], isLoading: loadingCourses } = useQuery({
        queryKey: ['courses'],
        queryFn: async () => (await api.get('/courses')).data,
    });

    const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
        queryKey: ['memberships', user?.email],
        queryFn: async () => (await api.get('/projectmemberships', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const { data: projects = [], isLoading: loadingProjects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => (await api.get('/projects')).data,
    });

    const { data: userPoints } = useQuery({
        queryKey: ['userPoints', user?.email],
        queryFn: async () => {
            const points = await (await api.get('/userpointss', { params: { user_email: user?.email } })).data;
            return points[0] || { total_points: 0, course_points: 0, project_points: 0, streak_days: 0 };
        },
        enabled: !!user?.email,
    });

    const { data: badges = [] } = useQuery({
        queryKey: ['badges'],
        queryFn: async () => (await api.get('/badges')).data,
    });

    const { data: userBadges = [] } = useQuery({
        queryKey: ['userBadges', user?.email],
        queryFn: async () => (await api.get('/userbadges', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const { data: topUsers = [] } = useQuery({
        queryKey: ['topUsers'],
        queryFn: async () => (await api.get('/userpointss')).data,
    });
    
    const { data: certificates = [] } = useQuery({
        queryKey: ['certificates', user?.email],
        queryFn: async () => (await api.get('/certificates', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const enrolledCourses = courses.filter((c: any) =>
        enrollments.some((e: any) => (e.courseId || e.course_id) === c.id)
    ).map((course: any) => {
        const enrollment = enrollments.find((e: any) => (e.courseId || e.course_id) === course.id);
        const hasCertificate = certificates.some((cert: any) => cert.reference_id === course.id && cert.type === 'course');
        
        return {
            ...course,
            progress: hasCertificate ? 100 : (enrollment?.progress || 0)
        };
    });

    const userProjects = projects.filter((p: any) =>
        memberships.some((m: any) => m.project_id === p.id)
    ).map((project: any) => ({
        ...project,
        role: memberships.find((m: any) => m.project_id === project.id)?.role
    }));

    const suggestedProjects = projects.filter((p: any) =>
        p.status === 'Open' && !memberships.some((m: any) => m.project_id === p.id)
    ).slice(0, 3);

    const earnedBadgeIds = userBadges.map((ub: any) => ub.badge_id);
    const recentBadges = badges.filter((b: any) => earnedBadgeIds.includes(b.id)).slice(0, 4);

    const firstName = user?.full_name?.split(' ')[0] || 'there';

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header with Points */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Welcome back, {firstName} 👋
                            </h1>
                            <p className="text-slate-600">
                                Continue your learning journey and build something amazing.
                            </p>
                        </div>

                    </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <Card className="border-slate-100 bg-gradient-to-br from-teal-50 to-white">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{enrolledCourses.length}</p>
                                    <p className="text-xs text-slate-500">Courses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 bg-gradient-to-br from-purple-50 to-white">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{userProjects.length}</p>
                                    <p className="text-xs text-slate-500">Projects</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>




                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Your Courses */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-teal-600" />
                                        Your Courses
                                    </CardTitle>
                                    <Link href={createPageUrl('Courses')}>
                                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                                            View all
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {loadingCourses || loadingEnrollments ? (
                                        <div className="space-y-4">
                                            {[1, 2].map(i => (
                                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                            ))}
                                        </div>
                                    ) : enrolledCourses.length === 0 ? (
                                        <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl">
                                            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                                                <BookOpen className="w-6 h-6 text-teal-600" />
                                            </div>
                                            <h3 className="font-medium text-slate-900 mb-2">No courses yet</h3>
                                            <p className="text-sm text-slate-500 mb-4">Start learning by enrolling in a course</p>
                                            <Link href={createPageUrl('Courses')}>
                                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                                    Browse Courses
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {enrolledCourses.map((course: any) => (
                                                <div
                                                    key={course.id}
                                                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                                                >
                                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center shrink-0">
                                                        <BookOpen className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-slate-900 truncate">{course.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Progress value={course.progress as number} className="h-2 flex-1" />
                                                            <span className="text-xs text-slate-500 shrink-0">{course.progress}%</span>
                                                        </div>

                                                    </div>
                                                    <Link href={createPageUrl(`CourseDetail?id=${course.id}`)}>
                                                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 rounded-full">
                                                            <Play className="w-4 h-4 mr-1" />
                                                            Continue
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Your Projects */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-purple-600" />
                                        Your Projects
                                    </CardTitle>
                                    <Link href={createPageUrl('Projects')}>
                                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                                            View all
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {loadingProjects || loadingMemberships ? (
                                        <div className="space-y-4">
                                            {[1, 2].map(i => (
                                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                            ))}
                                        </div>
                                    ) : userProjects.length === 0 ? (
                                        <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl">
                                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <h3 className="font-medium text-slate-900 mb-2">No projects yet</h3>
                                            <p className="text-sm text-slate-500 mb-4">Join a project to gain real experience</p>
                                            <Link href={createPageUrl('Projects')}>
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                                    Find Projects
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {userProjects.map((project: any) => (
                                                <div
                                                    key={project.id}
                                                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                                                >
                                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-rose-500 flex items-center justify-center shrink-0">
                                                        <Briefcase className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-slate-900 truncate">{project.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className={`text-xs ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                                project.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                                                                    'bg-teal-100 text-teal-700'
                                                                }`}>
                                                                {project.status}
                                                            </Badge>
                                                            {project.role && (
                                                                <span className="text-xs text-slate-500">{project.role}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Link href={createPageUrl(`ProjectWorkspace?id=${project.id}`)}>
                                                        <Button size="sm" variant="outline" className="rounded-full">
                                                            Open workspace
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">





                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
