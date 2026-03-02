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
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Resource {
    type: 'file' | 'url';
    name: string;
    url: string;
}

const ALL_ROLES = [
    'Product Manager',
    'UX Designer',
    'Developer',
    'Data',
    'AI Engineer'
];

const PROJECT_TAGS = [
    'Web Development',
    'Machine Learning',
    'Mobile App',
    'Cloud Computing',
    'Data Science',
    'Blockchain',
    'Cybersecurity',
    'Game Development',
    'IoT',
    'DevOps'
];

export default function CreateProject() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<{ role: string, count: number }[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const [publicResources, setPublicResources] = useState<Resource[]>([]);
    const [privateResources, setPrivateResources] = useState<Resource[]>([]);
    const [resourceType, setResourceType] = useState<'file' | 'url'>('file');
    const [resourceVisibility, setResourceVisibility] = useState<'public' | 'private'>('public');
    const [resourceLabel, setResourceLabel] = useState("");
    const [resourceUrl, setResourceUrl] = useState("");
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [isUploadingResource, setIsUploadingResource] = useState(false);
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);

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
            await api.post('/projects', {
                ...formData,
                roles_needed,
                public_resources: publicResources,
                private_resources: privateResources,
                tags: selectedTags
            });
            router.push(createPageUrl('/dashboard/projects'));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create project');
            setIsLoading(false);
        }
    };

    const handleAddResource = async () => {
        if (!resourceLabel) return;

        const targetList = resourceVisibility === 'public' ? publicResources : privateResources;
        const setTargetList = resourceVisibility === 'public' ? setPublicResources : setPrivateResources;

        if (resourceType === 'url') {
            if (!resourceUrl) return;
            setTargetList([...targetList, { type: 'url', name: resourceLabel, url: resourceUrl }]);
            setResourceUrl("");
            setResourceLabel("");
            setIsAddResourceOpen(false);
        } else {
            if (!resourceFile) return;
            if (resourceFile.size > 20 * 1024 * 1024) {
                alert("File size exceeds 20MB limit");
                return;
            }

            setIsUploadingResource(true);
            try {
                const storageRef = ref(storage, `project-resources/${Date.now()}-${resourceFile.name}`);
                await uploadBytes(storageRef, resourceFile);
                const url = await getDownloadURL(storageRef);
                setTargetList([...targetList, { type: 'file', name: resourceLabel, url }]);
                setResourceFile(null);
                setResourceLabel("");
                setIsAddResourceOpen(false);
            } catch (error) {
                console.error("Upload failed:", error);
                alert("File upload failed");
            } finally {
                setIsUploadingResource(false);
            }
        }
    };

    const removeResource = (index: number, visibility: 'public' | 'private') => {
        if (visibility === 'public') {
            setPublicResources(publicResources.filter((_, i) => i !== index));
        } else {
            setPrivateResources(privateResources.filter((_, i) => i !== index));
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

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-slate-900 block">
                                    Project Tags <span className="text-slate-500 font-normal">(Max 3)</span>
                                </label>
                                <span className="text-xs text-slate-500">{selectedTags.length}/3 selected</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {PROJECT_TAGS.map(tag => {
                                    const isSelected = selectedTags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedTags(selectedTags.filter(t => t !== tag));
                                                } else if (selectedTags.length < 3) {
                                                    setSelectedTags([...selectedTags, tag]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-1.5 ${isSelected
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50'
                                                } ${!isSelected && selectedTags.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={!isSelected && selectedTags.length >= 3}
                                        >
                                            {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
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

                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 block">
                                        Resources & Materials
                                    </label>
                                    <p className="text-xs text-slate-500">
                                        Add necessary resources for the project. Support for links and files.
                                    </p>
                                </div>
                                <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="shrink-0">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Resource
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Add Project Resource</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-5 pt-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Visibility</label>
                                                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => setResourceVisibility('public')}
                                                        className={`flex-1 text-sm font-medium px-4 py-2 rounded-md transition ${resourceVisibility === 'public' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        🌍 Public
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setResourceVisibility('private')}
                                                        className={`flex-1 text-sm font-medium px-4 py-2 rounded-md transition ${resourceVisibility === 'private' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        🔒 Private
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-2">
                                                    {resourceVisibility === 'public' ? 'Visible to everyone browsing the marketplace.' : 'Visible only to approved project contributors.'}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Resource Type</label>
                                                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => setResourceType('file')}
                                                        className={`flex-1 text-sm font-medium px-4 py-2 rounded-md transition ${resourceType === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        Upload File
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setResourceType('url')}
                                                        className={`flex-1 text-sm font-medium px-4 py-2 rounded-md transition ${resourceType === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        Link URL
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                <div>
                                                    <Input
                                                        type="text"
                                                        value={resourceLabel}
                                                        onChange={(e) => setResourceLabel(e.target.value)}
                                                        placeholder="Label (e.g. Design Spec, Figma Link)"
                                                    />
                                                </div>

                                                <div>
                                                    {resourceType === 'file' ? (
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
                                                            onChange={(e) => setResourceFile(e.target.files ? e.target.files[0] : null)}
                                                            className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition cursor-pointer"
                                                        />
                                                    ) : (
                                                        <Input
                                                            type="url"
                                                            value={resourceUrl}
                                                            onChange={(e) => setResourceUrl(e.target.value)}
                                                            placeholder="https://example.com/resource"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={handleAddResource}
                                                disabled={isUploadingResource || !resourceLabel || (resourceType === 'file' && !resourceFile) || (resourceType === 'url' && !resourceUrl)}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-4"
                                            >
                                                {isUploadingResource ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Confirm Add Resource'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        Public Resources
                                    </h4>
                                    {publicResources.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No public resources added.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {publicResources.map((res, index) => (
                                                <li key={index} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-1.5 rounded-lg ${res.type === 'file' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {res.type === 'file' ? (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium text-slate-900 truncate" title={res.name}>{res.name}</span>
                                                            <span className="text-[10px] text-slate-400 truncate uppercase">{res.type}</span>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeResource(index, 'public')} className="p-1 text-slate-400 hover:text-red-500 transition">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                        Private Resources
                                    </h4>
                                    {privateResources.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No private resources added.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {privateResources.map((res, index) => (
                                                <li key={index} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-1.5 rounded-lg ${res.type === 'file' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {res.type === 'file' ? (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium text-slate-900 truncate" title={res.name}>{res.name}</span>
                                                            <span className="text-[10px] text-slate-400 truncate uppercase">{res.type}</span>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeResource(index, 'private')} className="p-1 text-slate-400 hover:text-red-500 transition">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
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
