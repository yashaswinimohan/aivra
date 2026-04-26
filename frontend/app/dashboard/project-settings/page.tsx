"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { auth, storage } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Plus, X, Minus, Check, Trash2, Settings, Users, FolderOpen, LogOut, Globe, Eye, ExternalLink, Link as LinkIcon, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

export default function ProjectSettingsPage() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="max-w-4xl mx-auto py-8"><Skeleton className="h-8 w-64 mb-6" /><Skeleton className="h-96 rounded-2xl" /></div>}>
                <ProjectSettingsContent />
            </Suspense>
        </DashboardLayout>
    );
}

function ProjectSettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('id');
    const queryClient = useQueryClient();

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
            } else {
                setUser(null);
                router.push(createPageUrl('/'));
            }
        });
        return () => unsubscribe();
    }, [router]);

    const { data: project, isLoading: isLoadingProject, refetch: refetchProject } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            return (await api.get(`/projects/${projectId}`)).data;
        },
        enabled: !!projectId,
    });

    const isOwner = user && (user.id === project?.ownerId || user.uid === project?.ownerId);
    
    // Check if the user is at least a member (including pending or accepted)
    // We fetch memberships lower down, but need an initial member check for basic access
    // `project.team_members` has accepted members
    const isMember = user && project?.team_members?.some((m: any) => m.id === user.id || m.id === user.uid);

    // Settings State
    const [settingsTab, setSettingsTab] = useState('general');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');

    // Editable project state
    const [editProject, setEditProject] = useState({
        title: '',
        description: '',
        status: '',
        duration: '',
        related_course: '',
    });

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<{ role: string, count: number }[]>([]);
    const [customRole, setCustomRole] = useState('');

    // Resource State
    const [publicResources, setPublicResources] = useState<any[]>([]);
    const [privateResources, setPrivateResources] = useState<any[]>([]);
    const [resourceType, setResourceType] = useState<'file' | 'url'>('file');
    const [resourceVisibility, setResourceVisibility] = useState<'public' | 'private'>('public');
    const [resourceLabel, setResourceLabel] = useState("");
    const [resourceUrl, setResourceUrl] = useState("");
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [isUploadingResource, setIsUploadingResource] = useState(false);
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [publicLinks, setPublicLinks] = useState<{ label: string, url: string }[]>([]);
    const [newPublicLink, setNewPublicLink] = useState({ label: '', url: '' });

    // Initialize state from project data
    useEffect(() => {
        if (project) {
            setEditProject({
                title: project.title || '',
                description: project.description || '',
                status: project.status || 'Active',
                duration: project.duration || '4-6 weeks',
                related_course: project.related_course || '',
            });
            setSelectedTags(project.tags || []);

            // Parse roles needed (format: "2 x Developer")
            const parsedRoles = (project.roles_needed || []).map((r: string) => {
                const match = r.match(/^(\d+)\s*x\s*(.+)$/);
                if (match) {
                    return { count: parseInt(match[1]), role: match[2].trim() };
                }
                return { count: 1, role: r.trim() };
            });
            setSelectedRoles(parsedRoles);

            setPublicResources(project.public_resources || []);
            setPrivateResources(project.private_resources || []);

            if (parsedRoles.length > 0 && !inviteRole) {
                setInviteRole(parsedRoles[0].role);
            }
            
            setPublicLinks(project.public_links || []);
            
            // Default tab for non-owners should be the danger zone
            if (user && !(user.id === project.ownerId || user.uid === project.ownerId)) {
                setSettingsTab('danger');
            }
        }
    }, [project, user]);

    // Pending Memberships
    const { data: projectMemberships = [], refetch: refetchProjectMemberships } = useQuery({
        queryKey: ['project_pending_memberships', projectId],
        queryFn: async () => (await api.get('/projectmemberships', { params: { project_id: projectId } })).data,
        enabled: !!projectId && !!isOwner,
    });
    const pendingRequests = projectMemberships.filter((m: any) => m.status === 'pending');

    // Mutations
    const updateProjectMutation = useMutation({
        mutationFn: async () => {
            const roles_needed = selectedRoles.map(r => `${r.count} x ${r.role}`);
            return api.put(`/projects/${projectId}`, {
                ...editProject,
                roles_needed,
                tags: selectedTags,
                public_resources: publicResources,
                private_resources: privateResources,
                public_links: publicLinks
            });
        },
        onSuccess: () => {
            refetchProject();
            alert("Project updated successfully");
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to update project');
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async () => {
            return api.delete(`/projects/${projectId}`);
        },
        onSuccess: () => {
            router.push(createPageUrl('/dashboard/projects'));
        }
    });

    const leaveMutation = useMutation({
        mutationFn: async () => {
            return api.delete(`/projectmemberships/${projectId}/leave`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.push(createPageUrl('/dashboard/projects'));
        },
        onError: (error) => {
            console.error("Failed to leave project:", error);
            alert("Error leaving project. Please try again.");
        }
    });

    const updateMemberStatusMutation = useMutation({
        mutationFn: async ({ membershipId, status }: { membershipId: string, status: string }) => {
            return api.put(`/projectmemberships/${projectId}/${membershipId}`, { status });
        },
        onSuccess: () => {
            refetchProject();
            queryClient.invalidateQueries({ queryKey: ['project_pending_memberships'] });
        }
    });

    const inviteMemberMutation = useMutation({
        mutationFn: async () => {
            return api.post('/projectmemberships/invite', {
                project_id: projectId,
                email: inviteEmail,
                role: inviteRole
            });
        },
        onSuccess: () => {
            setInviteEmail('');
            alert('User invited successfully');
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to invite user');
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (memberId: string) => {
            const membership = projectMemberships.find((m: any) => m.user_id === memberId);
            if (membership) {
                return (await api.delete(`/projectmemberships/${projectId}/${membership.id}`)).data;
            } else {
                throw new Error("Membership not found");
            }
        },
        onSuccess: () => {
            refetchProject();
            refetchProjectMemberships();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to remove member');
        }
    });

    // Helper functions
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

    if (isLoadingProject || !user) {
        return (
            <div className="max-w-4xl mx-auto py-8">
                <Skeleton className="h-8 w-64 mb-6" />
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Project not found</h2>
                <Link href={createPageUrl('/dashboard/projects')}>
                    <Button>Back to Projects</Button>
                </Link>
            </div>
        );
    }

    if (!isOwner && !isMember) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Unauthorized Access</h2>
                <p className="text-slate-600 mb-6">You must be a project member to view settings.</p>
                <Link href={createPageUrl(`/dashboard/project-workspace?id=${projectId}`)}>
                    <Button>Back to Project Workspace</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href={createPageUrl(`/dashboard/project-workspace?id=${projectId}`)}>
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Project Settings</h1>
                    <p className="text-slate-500 text-sm">Manage details, resources, and team members for {project.title}.</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm"
            >
                <Tabs value={settingsTab} onValueChange={setSettingsTab} orientation="vertical" className="flex flex-col md:flex-row min-h-[600px]">
                    <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-100 p-4 shrink-0">
                        <TabsList className="flex md:flex-col w-full bg-transparent h-auto gap-1">
                            {isOwner && (
                                <>
                                    <TabsTrigger value="general" className="w-full justify-start data-[state=active]:bg-slate-100 rounded-lg px-3 py-2.5">
                                        <Settings className="w-4 h-4 mr-2" />
                                        General Information
                                    </TabsTrigger>
                                    <TabsTrigger value="tags_roles" className="w-full justify-start data-[state=active]:bg-slate-100 rounded-lg px-3 py-2.5">
                                        <Users className="w-4 h-4 mr-2" />
                                        Tags & Roles
                                    </TabsTrigger>
                                    <TabsTrigger value="resources" className="w-full justify-start data-[state=active]:bg-slate-100 rounded-lg px-3 py-2.5">
                                        <FolderOpen className="w-4 h-4 mr-2" />
                                        Resources
                                    </TabsTrigger>
                                    <TabsTrigger value="team" className="w-full justify-start data-[state=active]:bg-slate-100 rounded-lg px-3 py-2.5">
                                        <Users className="w-4 h-4 mr-2" />
                                        User Control
                                    </TabsTrigger>
                                    <TabsTrigger value="public_profile" className="w-full justify-start data-[state=active]:bg-slate-100 rounded-lg px-3 py-2.5">
                                        <Globe className="w-4 h-4 mr-2" />
                                        Public Profile
                                    </TabsTrigger>
                                </>
                            )}
                            <TabsTrigger value="danger" className="w-full justify-start data-[state=active]:bg-red-50 text-red-600 hover:text-red-700 rounded-lg px-3 py-2.5">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Danger Zone
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                        <TabsContent value="general" className="m-0 space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-4 mb-4">General Information</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Project Title</label>
                                    <Input
                                        value={editProject.title}
                                        onChange={(e) => setEditProject({ ...editProject, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        value={editProject.description}
                                        onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                                        className="min-h-[120px]"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={editProject.status} onValueChange={(v) => setEditProject({ ...editProject, status: v })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Expected Duration</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={editProject.duration}
                                            onChange={(e) => setEditProject({ ...editProject, duration: e.target.value })}
                                        >
                                            <option value="2 weeks">2 weeks</option>
                                            <option value="4-6 weeks">4-6 weeks</option>
                                            <option value="8-10 weeks">8-10 weeks</option>
                                            <option value="12+ weeks">12+ weeks</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-sm font-medium">Related Course (Optional)</label>
                                        <Input
                                            placeholder="e.g. Machine Learning 101"
                                            value={editProject.related_course}
                                            onChange={(e) => setEditProject({ ...editProject, related_course: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                                <Button
                                    onClick={() => updateProjectMutation.mutate()}
                                    disabled={updateProjectMutation.isPending}
                                    className="bg-slate-900 hover:bg-slate-800"
                                >
                                    {updateProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save General Settings
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="tags_roles" className="m-0 space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 border-b pb-4 mb-4">Tags & Categories</h3>
                                <div className="space-y-4">
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
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 border-b pb-4 mb-4 mt-8">Roles Needed</h3>
                                <div className="space-y-4">
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
                            </div>
                            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                                <Button
                                    onClick={() => updateProjectMutation.mutate()}
                                    disabled={updateProjectMutation.isPending}
                                    className="bg-slate-900 hover:bg-slate-800"
                                >
                                    {updateProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Tags & Roles
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="resources" className="m-0 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Project Resources</h3>
                                    <p className="text-sm text-slate-500">Manage links and files for this project.</p>
                                </div>
                                <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="shrink-0 bg-white">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <li key={index} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-1.5 rounded-lg ${res.type === 'file' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {res.type === 'file' ? (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-900 truncate hover:text-blue-600" title={res.name}>{res.name}</a>
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
                                                <li key={index} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-1.5 rounded-lg ${res.type === 'file' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {res.type === 'file' ? (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-900 truncate hover:text-blue-600" title={res.name}>{res.name}</a>
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
                            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                                <Button
                                    onClick={() => updateProjectMutation.mutate()}
                                    disabled={updateProjectMutation.isPending}
                                    className="bg-slate-900 hover:bg-slate-800"
                                >
                                    {updateProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Resources
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="public_profile" className="m-0 space-y-8">
                            <div className="flex items-center justify-between border-b pb-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Project Public Profile</h3>
                                    <p className="text-sm text-slate-500">Configure how this project looks when shared with others.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={createPageUrl(`/project/${projectId}`)} target="_blank">
                                        <Button variant="outline" className="bg-white">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View Live Profile
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => updateProjectMutation.mutate()}
                                        disabled={updateProjectMutation.isPending}
                                        className="bg-slate-900 hover:bg-slate-800"
                                    >
                                        {updateProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Profile"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Editor Side */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Project Links (Links to Work)</label>
                                            <p className="text-xs text-slate-500 mb-3">Add links to live demos, GitHub repositories, or case studies.</p>
                                            
                                            <div className="space-y-3">
                                                {publicLinks.map((link, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                        <LinkIcon className="w-4 h-4 text-slate-400" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 truncate">{link.label}</p>
                                                            <p className="text-xs text-slate-500 truncate">{link.url}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setPublicLinks(publicLinks.filter((_, i) => i !== idx))}
                                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="p-4 border border-dashed border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <Input 
                                                            placeholder="Link Label (e.g. Live Demo, Case Study)" 
                                                            value={newPublicLink.label}
                                                            onChange={(e) => setNewPublicLink({...newPublicLink, label: e.target.value})}
                                                            className="bg-white"
                                                        />
                                                        <Input 
                                                            placeholder="URL (https://...)" 
                                                            value={newPublicLink.url}
                                                            onChange={(e) => setNewPublicLink({...newPublicLink, url: e.target.value})}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full bg-white"
                                                        onClick={() => {
                                                            if (newPublicLink.label && newPublicLink.url) {
                                                                setPublicLinks([...publicLinks, newPublicLink]);
                                                                setNewPublicLink({ label: '', url: '' });
                                                            }
                                                        }}
                                                        disabled={!newPublicLink.label || !newPublicLink.url}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Add Work Link
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Side */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </label>
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Public View</Badge>
                                    </div>
                                    
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xl bg-slate-50 p-1">
                                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                                            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                            <div className="p-6 -mt-10">
                                                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center border-4 border-white mb-4">
                                                    <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
                                                        {editProject.title?.[0] || "P"}
                                                    </div>
                                                </div>
                                                
                                                <h4 className="text-xl font-bold text-slate-900 mb-1">{editProject.title || "Project Title"}</h4>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                                                    <Clock className="w-3 h-3" />
                                                    {editProject.duration}
                                                </p>

                                                <div className="flex flex-wrap gap-1.5 mb-6">
                                                    {selectedTags.length > 0 ? selectedTags.map(tag => (
                                                        <Badge key={tag} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 text-[10px]">
                                                            {tag}
                                                        </Badge>
                                                    )) : (
                                                        <span className="text-xs text-slate-400 italic">No tags selected</span>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Project Summary</h5>
                                                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                                            {editProject.description || "No description provided yet."}
                                                        </p>
                                                    </div>

                                                    {publicLinks.length > 0 && (
                                                        <div>
                                                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Links to Work</h5>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {publicLinks.map((link, i) => (
                                                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                                                        <span className="font-medium text-slate-700">{link.label}</span>
                                                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Team Members</h5>
                                                        <div className="flex -space-x-2">
                                                            {(project?.team_members || []).slice(0, 5).map((m: any, i: number) => (
                                                                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                    {m.name?.[0] || "?"}
                                                                </div>
                                                            ))}
                                                            {(project?.team_members?.length || 0) > 5 && (
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                    +{(project?.team_members?.length || 0) - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="team" className="m-0 space-y-8">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-4 mb-4">User Control</h3>

                            {/* Active Members */}
                            <div className="space-y-4 mb-8">
                                <h4 className="font-medium text-sm text-slate-700">Active Team Members</h4>
                                {project.team_members?.length > 0 ? (
                                    <div className="grid gap-3">
                                        {project.team_members.map((member: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-medium shrink-0">
                                                        {member.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                            {member.name}
                                                            {member.id === project.ownerId && (
                                                                <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] h-5">Owner</Badge>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">Role: <Badge variant="secondary" className="ml-1 text-[10px] font-normal">{member.role}</Badge></p>
                                                    </div>
                                                </div>
                                                {member.id !== project.ownerId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to remove ${member.name} from the project?`)) {
                                                                removeMemberMutation.mutate(member.id);
                                                            }
                                                        }}
                                                        disabled={removeMemberMutation.isPending}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 py-2">No team members yet.</p>
                                )}
                            </div>

                            {/* Pending Requests */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-700">Pending Join Requests</h4>
                                {pendingRequests.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-2">No pending requests.</p>
                                ) : (
                                    <div className="grid gap-3">
                                        {pendingRequests.map((req: any) => (
                                            <div key={req.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{req.user_name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Requested Role: <Badge variant="secondary" className="ml-1 text-[10px]">{req.role}</Badge></p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => updateMemberStatusMutation.mutate({ membershipId: req.id, status: 'rejected' })}
                                                    >
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-purple-600 hover:bg-purple-700"
                                                        onClick={() => updateMemberStatusMutation.mutate({ membershipId: req.id, status: 'accepted' })}
                                                    >
                                                        Accept
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Invite User */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="font-medium text-sm text-slate-700">Invite User by Email</h4>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        placeholder="User Email address"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedRoles.map((r) => (
                                                <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
                                            ))}
                                            <SelectItem value="Member">Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        className="sm:w-32 bg-slate-900 hover:bg-slate-800"
                                        onClick={() => inviteMemberMutation.mutate()}
                                        disabled={!inviteEmail || inviteMemberMutation.isPending}
                                    >
                                        Send Invite
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="danger" className="m-0 space-y-4">
                            <h3 className="text-lg font-semibold text-red-600 border-b border-red-100 pb-4 mb-4">Danger Zone</h3>
                            <div className="p-6 border border-red-200 bg-red-50 rounded-xl">
                                {isOwner ? (
                                    <>
                                        <h4 className="font-semibold text-red-900 mb-2">Delete this project</h4>
                                        <p className="text-sm text-red-700 mb-6">
                                            Once you delete a project, there is no going back. All data, tasks, and files will be permanently removed. Please be certain.
                                        </p>
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                if (confirm("Are you absolutely sure you want to delete this project? This action cannot be undone.")) {
                                                    deleteProjectMutation.mutate();
                                                }
                                            }}
                                            disabled={deleteProjectMutation.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Project Permanently
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="font-semibold text-red-900 mb-2">Leave this project</h4>
                                        <p className="text-sm text-red-700 mb-6">
                                            If you leave this project, you will lose access to its workspace, tasks, and internal resources.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="text-red-700 border-red-200 hover:bg-red-100 bg-white"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to leave this project?")) {
                                                    leaveMutation.mutate();
                                                }
                                            }}
                                            disabled={leaveMutation.isPending}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Leave Project
                                        </Button>
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </motion.div>
        </div>
    );
}
