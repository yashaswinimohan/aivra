"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ClipboardCheck,
    User as UserIcon,
    Calendar,
    BookOpen,
    ArrowLeft,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SubmissionReview from '@/components/projects/SubmissionReview';
import CourseAssessmentReview from '@/components/courses/CourseAssessmentReview';

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    needs_revision: 'bg-red-100 text-red-700'
};

export default function SubmissionReviewPage() {
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [user, setUser] = useState<any>(null);
    const queryClient = useQueryClient();

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

    const { data: submissions = [], isLoading } = useQuery({
        queryKey: ['allSubmissions'],
        queryFn: async () => (await api.get('/projectsubmissions')).data,
    });

    const { data: courseAssessments = [], isLoading: loadingAssessments } = useQuery({
        queryKey: ['courseAssessments'],
        queryFn: async () => (await api.get('/submissions/all')).data,
    });

    const filteredSubmissions = statusFilter === 'all'
        ? submissions
        : submissions.filter((s: any) => s.status === statusFilter);

    // For assessments we only have graded / pending (not graded)
    const filteredAssessments = statusFilter === 'all'
        ? courseAssessments
        : courseAssessments.filter((s: any) => 
            statusFilter === 'pending' ? !s.graded : 
            statusFilter === 'reviewed' || statusFilter === 'approved' ? s.graded : false
        );

    const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
        queryClient.invalidateQueries({ queryKey: ['courseAssessments'] });
        setSelectedSubmission(null);
        setSelectedAssessment(null);
    };

    // Only admins should access this
    if (user && user.role !== 'admin') {
        return (
            <div className="text-center py-16">
                <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
                <p className="text-slate-500 mb-4">Only instructors can review submissions.</p>
                <Link href={createPageUrl('Dashboard')}>
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href={createPageUrl('Dashboard')}>
                        <Button variant="ghost" className="-ml-2 mb-2 text-slate-600">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Review Submissions</h1>
                    <p className="text-slate-600 mt-1">
                        Grade and provide feedback on student projects and course assessments.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="needs_revision">Needs Revision</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="projects" className="space-y-6">
                <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="projects" className="data-[state=active]:bg-slate-100">Project Submissions</TabsTrigger>
                    <TabsTrigger value="assessments" className="data-[state=active]:bg-slate-100">Course Assessments</TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {['pending', 'reviewed', 'approved', 'needs_revision'].map(status => {
                            const count = submissions.filter((s: any) => s.status === status).length;
                            return (
                                <Card key={status} className={`border-slate-100 cursor-pointer ${statusFilter === status ? 'ring-2 ring-teal-500' : ''}`}
                                    onClick={() => setStatusFilter(status)}>
                                    <CardContent className="pt-4 pb-4">
                                        <Badge className={`${statusColors[status]} border-0 mb-2`}>{status}</Badge>
                                        <p className="text-2xl font-bold text-slate-900">{count}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Submissions List */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl">
                            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-slate-900">No project submissions to review</h3>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSubmissions.map((submission: any, i: number) => (
                                <motion.div
                                    key={submission.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Card
                                        className="border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer"
                                        onClick={() => setSelectedSubmission(submission)}
                                    >
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                                        {submission.user_name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{submission.title}</h3>
                                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <UserIcon className="w-3.5 h-3.5" />
                                                                {submission.user_name}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <BookOpen className="w-3.5 h-3.5" />
                                                                {submission.course_title}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {format(new Date(submission.created_date), 'MMM d')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={`${statusColors[submission.status]} border-0`}>
                                                        {submission.status}
                                                    </Badge>
                                                    {submission.grade && (
                                                        <Badge variant="outline" className="font-bold">{submission.grade}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="assessments" className="space-y-8">
                    {/* Course Assessment List */}
                    {loadingAssessments ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                    ) : filteredAssessments.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl">
                            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-slate-900">No course assessments to review</h3>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAssessments.map((assessment: any, i: number) => (
                                <motion.div
                                    key={assessment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Card
                                        className="border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer"
                                        onClick={() => setSelectedAssessment(assessment)}
                                    >
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-white font-medium">
                                                        {assessment.user_name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">Course Assessment</h3>
                                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <UserIcon className="w-3.5 h-3.5" />
                                                                {assessment.user_name}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <BookOpen className="w-3.5 h-3.5" />
                                                                {assessment.course_title}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {assessment.submittedAt && format(new Date(assessment.submittedAt._seconds ? assessment.submittedAt._seconds * 1000 : assessment.submittedAt), 'MMM d')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={`${assessment.graded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-0`}>
                                                        {assessment.graded ? 'Graded' : 'Pending Review'}
                                                    </Badge>
                                                    {assessment.score && (
                                                        <Badge variant="outline" className="font-bold">{assessment.score}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Review Dialogs */}
            <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-11/12">
                    {selectedSubmission && user && (
                        <SubmissionReview
                            submission={selectedSubmission}
                            reviewer={user}
                            onUpdate={handleUpdate}
                            onClose={() => setSelectedSubmission(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-11/12">
                    {selectedAssessment && (
                        <CourseAssessmentReview
                            submission={selectedAssessment}
                            onUpdate={handleUpdate}
                            onClose={() => setSelectedAssessment(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
