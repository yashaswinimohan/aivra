import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Link as LinkIcon, Github, ExternalLink, Loader2 } from 'lucide-react';

export default function SubmissionForm({ course, user, onSubmit, onCancel }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        demo_url: '',
        github_url: '',
        file_urls: []
    });
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [];

        for (const file of files) {
            const { file_url } = (await api.post('/upload', { file })).data;
            uploadedUrls.push(file_url);
        }

        setForm(prev => ({
            ...prev,
            file_urls: [...prev.file_urls, ...uploadedUrls]
        }));
        setUploading(false);
    };

    const removeFile = (index) => {
        setForm(prev => ({
            ...prev,
            file_urls: prev.file_urls.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        await api.post('/projectsubmissions', {
            course_id: course.id,
            course_title: course.title,
            user_email: user.email,
            user_name: user.full_name || user.email,
            ...form,
            status: 'pending'
        });

        setSubmitting(false);
        onSubmit();
    };

    return (
        <Card className="border-slate-100">
            <CardHeader>
                <CardTitle className="text-lg">Submit Your Project</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Project Title *</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="My Awesome Project"
                            required
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>Description *</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe what you built, the problem it solves, and what you learned..."
                            required
                            rows={5}
                            className="mt-1"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Demo URL
                            </Label>
                            <Input
                                value={form.demo_url}
                                onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                                placeholder="https://myproject.com"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="flex items-center gap-2">
                                <Github className="w-4 h-4" />
                                GitHub URL
                            </Label>
                            <Input
                                value={form.github_url}
                                onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                                placeholder="https://github.com/username/repo"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Project Files</Label>
                        <div className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-slate-400" />
                                )}
                                <span className="text-sm text-slate-500">
                                    {uploading ? 'Uploading...' : 'Click to upload files (images, PDFs, etc.)'}
                                </span>
                            </label>
                        </div>

                        {form.file_urls.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {form.file_urls.map((url, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm">
                                        <LinkIcon className="w-3 h-3 text-slate-500" />
                                        <span className="truncate max-w-[150px]">File {index + 1}</span>
                                        <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || !form.title || !form.description}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                            {submitting ? 'Submitting...' : 'Submit Project'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
