import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, Github, FileText, User, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    needs_revision: 'bg-red-100 text-red-700'
};

const gradeColors = {
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-teal-100 text-teal-700',
    C: 'bg-amber-100 text-amber-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700'
};

export default function SubmissionReview({ submission, reviewer, onUpdate, onClose }) {
    const [review, setReview] = useState({
        status: submission.status || 'pending',
        grade: submission.grade || '',
        feedback: submission.feedback || '',
        is_featured: submission.is_featured || false
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await api.put(`/projectsubmissions/${submission.id}`, {
            ...review,
            reviewed_by: reviewer.email,
            reviewed_date: new Date().toISOString()
        });
        setSaving(false);
        onUpdate();
    };

    return (
        <div className="space-y-6">
            {/* Submission Details */}
            <Card className="border-slate-100">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl">{submission.title}</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">{submission.course_title}</p>
                        </div>
                        <Badge className={`${statusColors[submission.status]} border-0`}>
                            {submission.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {submission.user_name}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(submission.created_date), 'MMM d, yyyy')}
                        </div>
                    </div>

                    <p className="text-slate-600">{submission.description}</p>

                    <div className="flex flex-wrap gap-3">
                        {submission.demo_url && (
                            <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Live Demo
                                </Button>
                            </a>
                        )}
                        {submission.github_url && (
                            <a href={submission.github_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Github className="w-4 h-4" />
                                    GitHub
                                </Button>
                            </a>
                        )}
                        {submission.file_urls?.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    File {i + 1}
                                </Button>
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Review Form */}
            <Card className="border-slate-100">
                <CardHeader>
                    <CardTitle className="text-lg">Review & Grade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Status</Label>
                            <Select value={review.status} onValueChange={(v) => setReview({ ...review, status: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="needs_revision">Needs Revision</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Grade</Label>
                            <Select value={review.grade} onValueChange={(v) => setReview({ ...review, grade: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">A - Excellent</SelectItem>
                                    <SelectItem value="B">B - Good</SelectItem>
                                    <SelectItem value="C">C - Satisfactory</SelectItem>
                                    <SelectItem value="D">D - Needs Improvement</SelectItem>
                                    <SelectItem value="F">F - Incomplete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>Feedback</Label>
                        <Textarea
                            value={review.feedback}
                            onChange={(e) => setReview({ ...review, feedback: e.target.value })}
                            placeholder="Provide constructive feedback for the student..."
                            rows={4}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Star className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="font-medium text-slate-900">Feature on Showcase</p>
                                <p className="text-sm text-slate-500">Highlight this project publicly</p>
                            </div>
                        </div>
                        <Switch
                            checked={review.is_featured}
                            onCheckedChange={(v) => setReview({ ...review, is_featured: v })}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                            {saving ? 'Saving...' : 'Save Review'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
