"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check, Loader2, Plus, X, Minus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { motion } from 'framer-motion';

const ALL_ROLES = [
    'Product Manager',
    'UX Designer',
    'Developer',
    'Data',
    'AI Engineer'
];

export default function CreateProject() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<{ role: string, count: number }[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: '4-6 weeks',
        related_course: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.description) {
            setError('Title and description are required.');
            return;
        }

        if (selectedRoles.length === 0) {
            setError('Please select at least one role needed.');
            return;
        }

        try {
            setIsLoading(true);
            const roles_needed = selectedRoles.map(r => `${r.count} x ${r.role}`);
            await api.post('/projects', { ...formData, roles_needed });
            router.push(createPageUrl('/dashboard/projects'));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create project');
            setIsLoading(false);
        }
    };

    const addRole = (role: string) => {
        const trimmed = role.trim();
        if (trimmed && !selectedRoles.find(r => r.role === trimmed)) {
            setSelectedRoles([...selectedRoles, { role: trimmed, count: 1 }]);
        }
    };

    const updateRoleCount = (role: string, delta: number) => {
        setSelectedRoles(selectedRoles.map(r => {
            if (r.role === role) {
                return { ...r, count: Math.max(1, r.count + delta) };
            }
            return r;
        }));
    };

    const removeRole = (role: string) => {
        setSelectedRoles(selectedRoles.filter(r => r.role !== role));
    };

    const handleCustomRoleAdd = () => {
        if (customRole.trim()) {
            addRole(customRole.trim());
            setCustomRole('');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-8">
                <Link
                    href={createPageUrl('/dashboard/projects')}
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Marketplace
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Project</h1>
                    <p className="text-slate-600 mb-8">
                        Start a new cross-functional team project and find collaborators.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                Project Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g. AI-Powered Study Assistant"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                placeholder="Describe what you want to build and the problem it solves..."
                                className="min-h-[120px]"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">
                                    Expected Duration
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                                >
                                    <option value="2 weeks">2 weeks</option>
                                    <option value="4-6 weeks">4-6 weeks</option>
                                    <option value="8-10 weeks">8-10 weeks</option>
                                    <option value="12+ weeks">12+ weeks</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">
                                    Related Course (Optional)
                                </label>
                                <Input
                                    placeholder="e.g. Machine Learning 101"
                                    value={formData.related_course}
                                    onChange={(e) => setFormData(prev => ({ ...prev, related_course: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-900 block">
                                Roles Needed <span className="text-red-500">*</span>
                            </label>

                            {/* Selected Roles list */}
                            {selectedRoles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {selectedRoles.map(r => (
                                        <div key={r.role} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200 shadow-sm transition-all">
                                            <button
                                                type="button"
                                                onClick={() => updateRoleCount(r.role, -1)}
                                                className="hover:bg-white/50 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="min-w-[12px] text-center">{r.count}</span>
                                            <span className="text-slate-400 text-xs font-normal">x</span>
                                            <span>{r.role}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateRoleCount(r.role, 1)}
                                                className="hover:bg-white/50 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                            <div className="w-px h-3 bg-purple-200 mx-1"></div>
                                            <button
                                                type="button"
                                                onClick={() => removeRole(r.role)}
                                                className="hover:bg-purple-200 hover:text-red-600 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-slate-500 mb-2">
                                    Add roles to your team:
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {ALL_ROLES.map(role => {
                                        if (selectedRoles.some(r => r.role === role)) return null;
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => addRole(role)}
                                                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border bg-white text-slate-600 border-slate-200 hover:border-purple-200 hover:bg-purple-50 flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3 h-3" />
                                                {role}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Type a custom role..."
                                        value={customRole}
                                        onChange={(e) => setCustomRole(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCustomRoleAdd();
                                            }
                                        }}
                                        className="max-w-[250px]"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCustomRoleAdd}
                                        disabled={!customRole.trim()}
                                    >
                                        Add Custom
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                            <Link href={createPageUrl('/dashboard/projects')}>
                                <Button variant="ghost" type="button">Cancel</Button>
                            </Link>
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Project'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
