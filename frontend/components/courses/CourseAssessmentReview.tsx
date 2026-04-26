import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExternalLink, FileText, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function CourseAssessmentReview({ submission, onUpdate, onClose }: any) {
    const [review, setReview] = useState({
        score: submission.score || '',
        feedback: submission.feedback || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (review.score === '') return alert("Please enter a score");
        setSaving(true);
        try {
            await api.put(`/submissions/${submission.id}/grade`, review);
            onUpdate();
        } catch (err) {
            console.error("Error grading submission:", err);
            alert("Failed to save grade.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Submission Details */}
            <Card className="border-slate-100">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl">Course Assessment</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">{submission.course_title}</p>
                        </div>
                        <Badge className={`${submission.graded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-0`}>
                            {submission.graded ? 'Graded' : 'Pending Review'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {submission.user_name} ({submission.user_email})
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {submission.submittedAt && format(new Date(submission.submittedAt._seconds ? submission.submittedAt._seconds * 1000 : submission.submittedAt), 'MMM d, yyyy')}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-slate-700 whitespace-pre-wrap">
                        <span className="font-semibold text-slate-900 block mb-2">Student Response:</span>
                        {submission.textResponse || <span className="italic text-slate-400">No text provided.</span>}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                        {submission.fileUrl && (
                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <FileText className="w-4 h-4" />
                                    View Attached File
                                </Button>
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Review Form */}
            <Card className="border-slate-100">
                <CardHeader>
                    <CardTitle className="text-lg">Review & Grade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div>
                        <Label>Score (numeric)</Label>
                        <Input
                            type="number"
                            value={review.score}
                            onChange={(e) => setReview({ ...review, score: e.target.value })}
                            placeholder="e.g. 85"
                            className="mt-1 max-w-[200px]"
                        />
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

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                            {saving ? 'Saving...' : 'Save Grade'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
