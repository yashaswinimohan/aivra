"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
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
        const loadUser = async () => {
            try {
                const response = await api.get('/users/profile');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to load user profile:", error);
            }
        };
        loadUser();
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

    const enrolledCourses = courses.filter((c: any) =>
        enrollments.some((e: any) => e.course_id === c.id)
    ).map((course: any) => ({
        ...course,
        progress: enrollments.find((e: any) => e.course_id === course.id)?.progress || 0
    }));

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
                        {/* <PointsDisplay /> imported but gamification directory may be missing 
                will leave it here as requested. */}
                        <PointsDisplay
                            points={userPoints?.total_points || 0}
                            streak={userPoints?.streak_days || 0}
                        />
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

                    <Card className="border-slate-100 bg-gradient-to-br from-amber-50 to-white">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{earnedBadgeIds.length}</p>
                                    <p className="text-xs text-slate-500">Badges</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 bg-gradient-to-br from-orange-50 to-white">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <Flame className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{userPoints?.streak_days || 0}</p>
                                    <p className="text-xs text-slate-500">Day Streak</p>
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
                                                        {course.progress === 100 && (
                                                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                                                <Zap className="w-3 h-3" />
                                                                +100 points earned!
                                                            </div>
                                                        )}
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
                        {/* Recent Badges */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-500" />
                                        Badges
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recentBadges.length === 0 ? (
                                        <div className="text-center py-6 bg-slate-50 rounded-xl">
                                            <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500">Complete courses and projects to earn badges!</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {recentBadges.map((badge: any) => (
                                                <BadgeCard key={badge.id} badge={badge} earned size="sm" />
                                            ))}
                                        </div>
                                    )}
                                    <Link href={createPageUrl('Profile')} className="block mt-4">
                                        <Button variant="ghost" size="sm" className="w-full text-slate-600">
                                            View all badges
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Mini Leaderboard */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-500" />
                                        Top Learners
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {topUsers.slice(0, 5).map((up: any, index: number) => (
                                            <div key={up.id} className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                    index === 1 ? 'bg-slate-100 text-slate-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-slate-50 text-slate-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium">
                                                    {up.user_name?.[0] || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{up.user_name}</p>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-amber-600">
                                                    <Zap className="w-3.5 h-3.5" />
                                                    {up.total_points}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Link href={createPageUrl('Leaderboard')} className="block mt-4">
                                        <Button variant="ghost" size="sm" className="w-full text-purple-600">
                                            View full leaderboard
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Suggested Projects */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        Suggested Projects
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingProjects ? (
                                        <div className="space-y-4">
                                            {[1, 2].map(i => (
                                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                                            ))}
                                        </div>
                                    ) : suggestedProjects.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            No open projects available
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {suggestedProjects.slice(0, 2).map((project: any) => (
                                                <div
                                                    key={project.id}
                                                    className="p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-xl border border-slate-100"
                                                >
                                                    <h3 className="font-medium text-slate-900 mb-2 line-clamp-1">{project.title}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{project.duration}</span>
                                                        <span className="text-amber-600 flex items-center gap-1">
                                                            <Zap className="w-3 h-3" />
                                                            +50 pts
                                                        </span>
                                                    </div>
                                                    <Link href={createPageUrl(`ProjectWorkspace?id=${project.id}`)}>
                                                        <Button size="sm" variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                                            View details
                                                            <ArrowRight className="w-4 h-4 ml-1" />
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
                </div>
            </div>
        </DashboardLayout>
    );
}
