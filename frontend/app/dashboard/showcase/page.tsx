"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Star,
    ExternalLink,
    Github,
    User,
    BookOpen,
    Trophy,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const gradeColors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-teal-100 text-teal-700',
    C: 'bg-amber-100 text-amber-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700'
};

export default function ProjectShowcase() {
    const [courseFilter, setCourseFilter] = useState('all');
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

    const { data: submissions = [], isLoading } = useQuery({
        queryKey: ['approvedSubmissions'],
        queryFn: async () => (await api.get('/projectsubmissions', { params: { status: 'approved' } })).data,
    });

    const { data: courses = [] } = useQuery({
        queryKey: ['courses'],
        queryFn: async () => (await api.get('/courses')).data,
    });

    const { data: mySubmissions = [] } = useQuery({
        queryKey: ['mySubmissions', user?.email],
        queryFn: async () => (await api.get('/projectsubmissions', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const featuredProjects = submissions.filter((s: any) => s.is_featured);
    const filteredSubmissions = courseFilter === 'all'
        ? submissions
        : submissions.filter((s: any) => s.course_id === courseFilter);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Showcase</h1>
                <p className="text-slate-600">
                    Discover amazing projects built by our community.
                </p>
            </motion.div>

            <Tabs defaultValue="showcase">
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="showcase" className="rounded-lg data-[state=active]:bg-white px-6">
                        All Projects
                    </TabsTrigger>
                    <TabsTrigger value="featured" className="rounded-lg data-[state=active]:bg-white px-6">
                        <Star className="w-4 h-4 mr-2" />
                        Featured
                    </TabsTrigger>
                    <TabsTrigger value="my" className="rounded-lg data-[state=active]:bg-white px-6">
                        My Submissions
                        {mySubmissions.length > 0 && (
                            <Badge className="ml-2 bg-purple-100 text-purple-700 border-0">
                                {mySubmissions.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="showcase">
                    {/* Filter */}
                    <div className="flex items-center gap-3 mb-6">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <Select value={courseFilter} onValueChange={setCourseFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map((course: any) => (
                                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <EmptyState message="No approved projects yet" />
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSubmissions.map((submission: any, i: number) => (
                                <ProjectCard key={submission.id} submission={submission} index={i} featured={false} showStatus={false} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="featured">
                    {featuredProjects.length === 0 ? (
                        <EmptyState message="No featured projects yet" icon={Star} />
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredProjects.map((submission: any, i: number) => (
                                <ProjectCard key={submission.id} submission={submission} index={i} featured={true} showStatus={false} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="my">
                    {mySubmissions.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl">
                            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-slate-900 mb-2">No submissions yet</h3>
                            <p className="text-slate-500 mb-4">Complete a course and submit your project!</p>
                            <Link href={createPageUrl('Courses')}>
                                <Button className="bg-teal-600 hover:bg-teal-700">Browse Courses</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mySubmissions.map((submission: any, i: number) => (
                                <ProjectCard key={submission.id} submission={submission} index={i} showStatus={true} featured={false} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ProjectCard({ submission, index, featured, showStatus }: { submission: any, index: number, featured?: boolean, showStatus?: boolean }) {
    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        reviewed: 'bg-blue-100 text-blue-700',
        approved: 'bg-emerald-100 text-emerald-700',
        needs_revision: 'bg-red-100 text-red-700'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="border-slate-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col group overflow-hidden">
                {featured && (
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium px-3 py-1 flex items-center gap-1 justify-center">
                        <Star className="w-3 h-3" />
                        Featured Project
                    </div>
                )}
                <CardContent className="pt-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                                {submission.title}
                            </h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                {submission.course_title}
                            </p>
                        </div>
                        {submission.grade && (
                            <Badge className={`${gradeColors[submission.grade]} border-0 ml-2`}>
                                {submission.grade}
                            </Badge>
                        )}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                        {submission.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <User className="w-4 h-4" />
                        <span>{submission.user_name}</span>
                        {showStatus && (
                            <Badge className={`${statusColors[submission.status]} border-0 ml-auto text-xs`}>
                                {submission.status}
                            </Badge>
                        )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                        {submission.demo_url && (
                            <a href={submission.demo_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full gap-1.5">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Demo
                                </Button>
                            </a>
                        )}
                        {submission.github_url && (
                            <a href={submission.github_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full gap-1.5">
                                    <Github className="w-3.5 h-3.5" />
                                    Code
                                </Button>
                            </a>
                        )}
                    </div>

                    {submission.feedback && showStatus && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm">
                            <p className="font-medium text-slate-700 mb-1">Instructor Feedback:</p>
                            <p className="text-slate-600">{submission.feedback}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

function EmptyState({ message, icon: Icon = Trophy }: { message: string, icon?: React.ElementType }) {
    return (
        <div className="text-center py-16 bg-slate-50 rounded-2xl">
            <Icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900">{message}</h3>
        </div>
    );
}
