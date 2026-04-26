"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    User as UserIcon,
    LogOut,
    BookOpen,
    Briefcase,
    Edit2,
    ExternalLink,
    Award,
    Plus,
    X,
    CheckCircle2,
    Trophy,
    Zap,
    Flame,
    Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BadgeCard, PointsDisplay, ProgressRing, CertificateCard, PortfolioCard } from '@/components/gamification';
import DashboardLayout from '@/components/DashboardLayout';

const roleOptions = ['Product Manager', 'UX Designer', 'Developer', 'Data Analyst', 'AI Engineer'];

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    interface EditData {
        first_name: string;
        last_name: string;
        bio: string;
        roles: string[];
        skills: string[];
        profileLinks: string[];
    }

    const [editData, setEditData] = useState<EditData>({
        first_name: '',
        last_name: '',
        bio: '',
        roles: [],
        skills: [],
        profileLinks: []
    });
    const [newSkill, setNewSkill] = useState('');
    const [newLink, setNewLink] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
            if (currentUser) {
                try {
                    const response = await api.get('/users/profile');
                    setUser(response.data);
                    setEditData({
                        first_name: response.data.first_name || response.data.firstName || '',
                        last_name: response.data.last_name || response.data.lastName || '',
                        bio: response.data.bio || '',
                        roles: response.data.roles || [],
                        skills: response.data.skills || [],
                        profileLinks: response.data.profileLinks || []
                    });
                } catch (error) {
                    console.error("Failed to load user profile:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const { data: enrollments = [] } = useQuery({
        queryKey: ['enrollments', user?.email],
        queryFn: async () => (await api.get('/enrollments', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const { data: courses = [] } = useQuery({
        queryKey: ['courses'],
        queryFn: async () => (await api.get('/courses')).data,
    });

    const { data: memberships = [] } = useQuery({
        queryKey: ['memberships', user?.email],
        queryFn: async () => (await api.get('/projectmemberships', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const { data: projects = [] } = useQuery({
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

    const { data: allUserPoints = [] } = useQuery({
        queryKey: ['allUserPoints'],
        queryFn: async () => (await api.get('/userpointss')).data,
    });

    const { data: certificates = [], refetch: refetchCertificates } = useQuery({
        queryKey: ['certificates', user?.email],
        queryFn: async () => (await api.get('/certificates', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const completedEnrollments = enrollments.filter((e: any) => {
        // Check progress or if a certificate exists (source of truth)
        const isProgressComplete = (e.progress || 0) >= 100;
        const hasCertificate = certificates.some((cert: any) => cert.reference_id === (e.courseId || e.course_id) && cert.type === 'course');
        return isProgressComplete || hasCertificate;
    });
    const completedCourses = courses.filter((c: any) =>
        completedEnrollments.some((e: any) => (e.courseId || e.course_id) === c.id)
    );

    const userProjects = projects.filter((p: any) =>
        memberships.some((m: any) => m.project_id === p.id)
    );
    const completedProjects = userProjects.filter((p: any) => p.status === 'Completed');

    const earnedBadgeIds = userBadges.map((ub: any) => ub.badge_id);
    const earnedBadges = badges.filter((b: any) => earnedBadgeIds.includes(b.id));
    const unearnedBadges = badges.filter((b: any) => !earnedBadgeIds.includes(b.id));

    const currentRank = allUserPoints.findIndex((up: any) => up.user_email === user?.email) + 1;
    const totalUsers = allUserPoints.length || 1;
    const percentile = Math.round(((totalUsers - currentRank + 1) / totalUsers) * 100);

    const saveMutation = useMutation({
        mutationFn: async () => {
            await api.put('/users/profile', editData);
            const updated = (await api.get('/users/profile')).data;
            setUser(updated);
        },
        onSuccess: () => setIsEditing(false),
    });

    const claimCertificateMutation = useMutation({
        mutationFn: async (payload: any) => {
            await api.post('/certificates', payload);
        },
        onSuccess: () => refetchCertificates(),
    });

    const addSkill = () => {
        if (newSkill && !editData.skills.includes(newSkill)) {
            setEditData({ ...editData, skills: [...editData.skills, newSkill] });
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setEditData({ ...editData, skills: editData.skills.filter((s: string) => s !== skill) });
    };

    const addLink = () => {
        if (newLink && !editData.profileLinks.includes(newLink)) {
            setEditData({ ...editData, profileLinks: [...editData.profileLinks, newLink] });
            setNewLink('');
        }
    };

    const removeLink = (link: string) => {
        setEditData({ ...editData, profileLinks: editData.profileLinks.filter((l: string) => l !== link) });
    };

    const toggleRole = (role: string) => {
        if (editData.roles.includes(role)) {
            setEditData({ ...editData, roles: editData.roles.filter((r: string) => r !== role) });
        } else {
            setEditData({ ...editData, roles: [...editData.roles, role] });
        }
    };

    if (!user) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-48 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
                <p className="text-slate-600">
                    Manage your profile and showcase your achievements.
                </p>
            </motion.div>

            <div className="space-y-6">
                {/* Profile Card with Gamification */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-slate-100 overflow-hidden">
                        {/* Banner */}
                        <div className="h-24 bg-gradient-to-r from-teal-400 via-purple-500 to-rose-400" />

                        <CardContent className="-mt-12 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-slate-900">{user.full_name || 'User'}</h2>
                                    <p className="text-slate-500">{user.email}</p>
                                    {currentRank > 0 && (
                                        <Badge className="mt-2 bg-amber-100 text-amber-700 border-0">
                                            <Trophy className="w-3 h-3 mr-1" />
                                            Rank #{currentRank} • Top {percentile}%
                                        </Badge>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                    className="self-start sm:self-auto"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </div>

                            {/* Points Display */}
                            <div className="mb-6">
                                <PointsDisplay
                                    points={userPoints?.total_points || 0}
                                    streak={userPoints?.streak_days || 0}
                                />
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <p className="text-slate-600 mb-6">{user.bio}</p>
                            )}

                            {/* Roles */}
                            {user.roles?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-slate-500 mb-2">Roles</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.map((role: string, i: number) => (
                                            <Badge key={i} className="bg-purple-100 text-purple-700 border-0">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {user.skills?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 mb-2">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.skills.map((skill: string, i: number) => (
                                            <Badge key={i} variant="outline" className="bg-white">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Stats with Progress Ring */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid sm:grid-cols-4 gap-4"
                >
                    <Card className="border-slate-100 bg-gradient-to-br from-amber-50 to-yellow-50">
                        <CardContent className="pt-6 text-center">
                            <ProgressRing progress={Math.min((userPoints?.total_points || 0) / 50, 100)} size={80}>
                                <Zap className="w-6 h-6 text-amber-500" />
                            </ProgressRing>
                            <p className="text-2xl font-bold text-slate-900 mt-2">{userPoints?.total_points || 0}</p>
                            <p className="text-sm text-slate-500">Total Points</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{enrollments.length}</p>
                                    <p className="text-sm text-slate-500">Courses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{userProjects.length}</p>
                                    <p className="text-sm text-slate-500">Projects</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Award className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{earnedBadges.length}</p>
                                    <p className="text-sm text-slate-500">Badges</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Badges Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Card className="border-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Badges & Achievements
                            </CardTitle>
                            <Link href={createPageUrl('Leaderboard')}>
                                <Button variant="ghost" size="sm" className="text-purple-600">
                                    View Leaderboard
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {badges.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl">
                                    <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No badges available yet</p>
                                </div>
                            ) : (
                                <>
                                    {/* Earned Badges */}
                                    {earnedBadges.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-medium text-slate-700 mb-4">Earned ({earnedBadges.length})</h4>
                                            <div className="flex flex-wrap gap-6">
                                                {earnedBadges.map((badge: any) => (
                                                    <BadgeCard key={badge.id} badge={badge} earned size="md" />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Locked Badges */}
                                    {unearnedBadges.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-500 mb-4">Locked ({unearnedBadges.length})</h4>
                                            <div className="flex flex-wrap gap-6">
                                                {unearnedBadges.map((badge: any) => (
                                                    <BadgeCard key={badge.id} badge={badge} earned={false} size="md" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Points Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="w-5 h-5 text-teal-600" />
                                Points Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-teal-50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <BookOpen className="w-5 h-5 text-teal-600" />
                                        <span className="font-medium text-slate-900">Course Points</span>
                                    </div>
                                    <p className="text-2xl font-bold text-teal-700">{userPoints?.course_points || 0}</p>
                                </div>

                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Briefcase className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium text-slate-900">Project Points</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-700">{userPoints?.project_points || 0}</p>
                                </div>

                                <div className="p-4 bg-orange-50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Flame className="w-5 h-5 text-orange-600" />
                                        <span className="font-medium text-slate-900">Streak Days</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-700">{userPoints?.streak_days || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Completed Courses */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <Card className="border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                                Completed Courses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {completedCourses.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl">
                                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No completed courses yet</p>
                                    <Link href={createPageUrl('Courses')}>
                                        <Button variant="link" className="mt-2 text-teal-600">Browse Courses</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {completedCourses.map((course: any) => (
                                        <div key={course.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                                                <span className="text-white text-xl font-medium flex items-center justify-center h-full w-full">
                                                    <UserIcon className="w-6 h-6" />
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{course.title}</p>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                <Badge className="bg-emerald-100 text-emerald-700 border-0">Completed</Badge>
                                                {!certificates.some((c: any) => c.reference_id === course.id) && (
                                                    <Button variant="outline" size="sm" onClick={() => claimCertificateMutation.mutate({
                                                        user_email: user.email,
                                                        type: 'course',
                                                        reference_id: course.id,
                                                        title: `Course Completion: ${course.title}`
                                                    })} disabled={claimCertificateMutation.isPending}>
                                                        Claim Certificate
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Completed Projects */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-600" />
                                Completed Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {completedProjects.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl">
                                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No completed projects yet</p>
                                    <Link href={createPageUrl('Projects')}>
                                        <Button variant="link" className="mt-2 text-purple-600">Find Projects</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {completedProjects.map((project: any) => (
                                        <div key={project.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-rose-500 flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{project.title}</p>
                                                <p className="text-sm text-slate-500">{project.duration}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {!certificates.some((c: any) => c.reference_id === project.id) && (
                                                    <Button variant="outline" size="sm" onClick={() => claimCertificateMutation.mutate({
                                                        user_email: user.email,
                                                        type: 'project',
                                                        reference_id: project.id,
                                                        title: `Project Completed: ${project.title}`,
                                                        skills: project.tags || project.skills || []
                                                    })} disabled={claimCertificateMutation.isPending}>
                                                        Claim Portfolio Credit
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm">
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Certificates Section */}
                {certificates.filter((c: any) => c.type === 'course').length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <Card className="border-slate-100">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    Course Certificates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {certificates.filter((c: any) => c.type === 'course').map((cert: any) => {
                                        // Find corresponding course to get instructor details
                                        const course = courses.find((crs: any) => crs.id === cert.reference_id);
                                        return (
                                            <CertificateCard 
                                                key={cert.id} 
                                                certificate={{
                                                    ...cert, 
                                                    userName: user.full_name || user.displayName || user.email,
                                                    instructorName: course?.certificate?.instructorName || course?.instructorName || 'Lead Instructor',
                                                    designation: course?.certificate?.designation || 'Aivra Academy',
                                                    skills: (cert.skills && cert.skills.length > 0) 
                                                        ? (Array.isArray(cert.skills) ? cert.skills.join(', ') : cert.skills)
                                                        : (course?.certificate?.skills || "")
                                                }} 
                                            />
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Portfolio Showcase Section */}
                {certificates.filter((c: any) => c.type === 'project').length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="border-slate-100">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-purple-600" />
                                    Portfolio Credits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {certificates.filter((c: any) => c.type === 'project').map((portfolio: any) => (
                                        <PortfolioCard key={portfolio.id} portfolioItem={portfolio} />
                                    ))}
                                    {certificates.filter((c: any) => c.type === 'project').map((cert: any) => {
                                        const project = projects.find((p: any) => p.id === cert.reference_id);
                                        return (
                                            <CertificateCard 
                                                key={`cert-${cert.id}`} 
                                                certificate={{
                                                    ...cert, 
                                                    title: cert.title + " Certificate",
                                                    userName: user.full_name || user.displayName || user.email,
                                                    instructorName: project?.mentorName || 'Project Lead',
                                                    designation: 'Portfolio Credit',
                                                    skills: cert.skills?.join(', ') || project?.tags?.join(', ') || ""
                                                }} 
                                            />
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">First Name</label>
                                <Input
                                    value={editData.first_name}
                                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Last Name</label>
                                <Input
                                    value={editData.last_name}
                                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Bio</label>
                            <Textarea
                                value={editData.bio}
                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Roles */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Your Roles</label>
                            <div className="flex flex-wrap gap-2">
                                {roleOptions.map(role => (
                                    <Badge
                                        key={role}
                                        variant={editData.roles.includes(role) ? 'default' : 'outline'}
                                        className={`cursor-pointer ${editData.roles.includes(role) ? 'bg-purple-600' : ''}`}
                                        onClick={() => toggleRole(role)}
                                    >
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Skills</label>
                            <div className="flex gap-2 mb-3">
                                <Input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    placeholder="Add a skill"
                                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                />
                                <Button onClick={addSkill} size="icon" variant="outline">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editData.skills.map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="gap-1">
                                        {skill}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-600"
                                            onClick={() => removeSkill(skill)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Profile Links */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Social / Profile Links</label>
                            <div className="flex gap-2 mb-3">
                                <Input
                                    value={newLink}
                                    onChange={(e) => setNewLink(e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                    onKeyPress={(e) => e.key === 'Enter' && addLink()}
                                />
                                <Button onClick={addLink} size="icon" variant="outline">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {editData.profileLinks.map((link, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50">
                                        <span className="text-sm text-slate-600 truncate">{link}</span>
                                        <X
                                            className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-600"
                                            onClick={() => removeLink(link)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending}
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout>
    );
}
