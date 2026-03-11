"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Users,
    CheckSquare,
    MessageSquare,
    FolderOpen,
    TrendingUp,
    Clock,
    Sparkles,
    Plus,
    Send,
    ExternalLink,
    CheckCircle2,
    Circle,
    LogOut,
    UserPlus,
    Settings,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const roleColors: Record<string, string> = {
    'Product Manager': 'bg-teal-100 text-teal-700',
    'UX Designer': 'bg-rose-100 text-rose-700',
    'Developer': 'bg-blue-100 text-blue-700',
    'Data': 'bg-amber-100 text-amber-700',
    'AI Engineer': 'bg-purple-100 text-purple-700',
};

const fileTypeIcons: Record<string, string> = {
    Figma: '🎨',
    GitHub: '💻',
    Doc: '📄',
    Notion: '📝',
    Other: '🔗'
};

export default function ProjectWorkspacePage() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="max-w-6xl mx-auto"><Skeleton className="h-8 w-32 mb-6" /><Skeleton className="h-64 rounded-2xl" /></div>}>
                <ProjectWorkspace />
            </Suspense>
        </DashboardLayout>
    );
}

function ProjectWorkspace() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('id');
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('overview');
    const [newMessage, setNewMessage] = useState('');
    const [showAddFile, setShowAddFile] = useState(false);
    const [newFile, setNewFile] = useState({ name: '', type: 'Doc', url: '' });
    const [showJoinDialog, setShowJoinDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');
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
            }
        });
        return () => unsubscribe();
    }, []);

    const { data: project, isLoading, refetch: refetchProject } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            return (await api.get(`/projects/${projectId}`)).data;
        },
        enabled: !!projectId,
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => (await api.get('/tasks', { params: { project_id: projectId } })).data,
        enabled: !!projectId,
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages', projectId],
        queryFn: async () => (await api.get('/projectmessages', { params: { project_id: projectId, _sort: '-created_date' } })).data,
        enabled: !!projectId,
    });

    const { data: files = [] } = useQuery({
        queryKey: ['files', projectId],
        queryFn: async () => (await api.get('/projectfiles', { params: { project_id: projectId } })).data,
        enabled: !!projectId,
    });

    const { data: memberships = [] } = useQuery({
        queryKey: ['memberships', user?.email],
        queryFn: async () => (await api.get('/projectmemberships', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const isMember = memberships.some((m: any) => m.project_id === projectId && m.status !== 'pending' && m.status !== 'invited');
    const pendingMembership = memberships.find((m: any) => m.project_id === projectId && m.status === 'pending');
    const isOwner = user?.id === project?.ownerId || user?.uid === project?.ownerId;

    const { data: projectMemberships = [] } = useQuery({
        queryKey: ['project_pending_memberships', projectId],
        queryFn: async () => (await api.get('/projectmemberships')).data.filter((m: any) => m.project_id === projectId),
        enabled: !!projectId && !!isOwner,
    });
    const pendingRequests = projectMemberships.filter((m: any) => m.status === 'pending');

    // Parse project roles for invites
    const parsedRoles = (project?.roles_needed || []).map((r: string) => {
        const match = r.match(/^(\d+)\s*x\s*(.+)$/);
        return match ? { count: parseInt(match[1]), role: match[2].trim() } : { count: 1, role: r.trim() };
    });

    useEffect(() => {
        if (parsedRoles.length > 0 && !inviteRole) {
            setInviteRole(parsedRoles[0].role);
        }
    }, [project, parsedRoles, inviteRole]);
    const updateMemberStatusMutation = useMutation({
        mutationFn: async ({ membershipId, status }: { membershipId: string, status: string }) => {
            return api.put(`/projectmemberships/${membershipId}`, { status });
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
            queryClient.invalidateQueries({ queryKey: ['project_pending_memberships'] });
            alert('User invited successfully');
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to invite user');
        }
    });

    const joinMutation = useMutation({
        mutationFn: async () => {
            return api.post('/projectmemberships', {
                project_id: projectId,
                role: selectedRole
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
            refetchProject();
            setShowJoinDialog(false);
        },
    });

    const leaveMutation = useMutation({
        mutationFn: async () => {
            const membership = memberships.find((m: any) => m.project_id === projectId);
            if (membership) {
                return (await api.delete(`/projectmemberships/${membership.id}`)).data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
            refetchProject();
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => (await api.put(`/tasks/${taskId}`, { status })).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
    });

    const sendMessageMutation = useMutation({
        mutationFn: () => api.post('/projectmessages', {
            project_id: projectId,
            sender_name: user?.full_name || 'User',
            sender_email: user?.email,
            content: newMessage
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
            setNewMessage('');
        },
    });

    const addFileMutation = useMutation({
        mutationFn: () => api.post('/projectfiles', {
            project_id: projectId,
            ...newFile
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files', projectId] });
            setShowAddFile(false);
            setNewFile({ name: '', type: 'Doc', url: '' });
        },
    });

    const groupedTasks: Record<string, any[]> = {
        todo: tasks.filter((t: any) => t.status === 'todo'),
        in_progress: tasks.filter((t: any) => t.status === 'in_progress'),
        done: tasks.filter((t: any) => t.status === 'done'),
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto">
                <Skeleton className="h-8 w-32 mb-6" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-6xl mx-auto text-center py-16">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Project not found</h2>
                <Link href={createPageUrl('/dashboard/projects')}>
                    <Button>Back to Projects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={createPageUrl('/dashboard/projects')}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                            <Badge className={`${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                project.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                                    'bg-teal-100 text-teal-700'
                                } border-0`}>
                                {project.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {isOwner ? (
                    <Link href={createPageUrl(`/dashboard/project-settings?id=${projectId}`)}>
                        <Button variant="default" className="bg-slate-900 hover:bg-slate-800">
                            <Settings className="w-4 h-4 mr-2" />
                            Project Settings
                        </Button>
                    </Link>
                ) : isMember ? (
                    <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => leaveMutation.mutate()}
                        disabled={leaveMutation.isPending}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Leave Project
                    </Button>
                ) : (
                    <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Join Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Join Project</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Select your role</label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {project.roles_needed?.map((role: string) => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    onClick={() => joinMutation.mutate()}
                                    disabled={!selectedRole || joinMutation.isPending}
                                >
                                    {joinMutation.isPending ? 'Joining...' : 'Confirm & Join'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border border-slate-100 p-1 rounded-xl mb-6 flex-wrap h-auto gap-1">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-slate-100 gap-2">
                        <Sparkles className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="tasks" disabled={!isMember && !isOwner} className="rounded-lg data-[state=active]:bg-slate-100 gap-2 disabled:opacity-50">
                        <CheckSquare className="w-4 h-4" />
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger value="chat" disabled={!isMember && !isOwner} className="rounded-lg data-[state=active]:bg-slate-100 gap-2 disabled:opacity-50">
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="files" disabled={!isMember && !isOwner} className="rounded-lg data-[state=active]:bg-slate-100 gap-2 disabled:opacity-50">
                        <FolderOpen className="w-4 h-4" />
                        Files
                    </TabsTrigger>
                    <TabsTrigger value="progress" disabled={!isMember && !isOwner} className="rounded-lg data-[state=active]:bg-slate-100 gap-2 disabled:opacity-50">
                        <TrendingUp className="w-4 h-4" />
                        Progress
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-slate-100">
                                <CardHeader>
                                    <CardTitle className="text-lg">Project Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 mb-2">Goal</h4>
                                        <p className="text-slate-700">{project.goal || project.description}</p>
                                    </div>

                                    {project.tags && project.tags.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-500 mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {project.tags.map((tag: string, i: number) => (
                                                    <Badge key={i} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {project.related_course && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-500 mb-2">Related Course</h4>
                                            <Badge className="bg-purple-100 text-purple-700 border-0">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                {project.related_course}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock className="w-4 h-4" />
                                            {project.duration}
                                        </div>
                                        {project.timeline && (
                                            <div className="text-sm text-slate-600">
                                                Due: {project.timeline}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Next Milestone */}
                            {project.milestones?.length > 0 && (
                                <Card className="border-slate-100 bg-gradient-to-br from-purple-50 to-teal-50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Next Milestone</p>
                                                <p className="font-semibold text-slate-900">
                                                    {project.milestones.find((m: any) => !m.completed)?.title || 'All milestones complete!'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Project Resources */}
                            <Card className="border-slate-100">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FolderOpen className="w-5 h-5" />
                                        Project Resources
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Public Resources */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                            Public Resources
                                        </h4>
                                        {!project.public_resources || project.public_resources.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic px-2">No public resources available.</p>
                                        ) : (
                                            <ul className="grid sm:grid-cols-2 gap-3">
                                                {project.public_resources.map((res: any, index: number) => (
                                                    <li key={index}>
                                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
                                                            <div className={`p-2 rounded-lg ${res.type === 'file' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'} transition-colors`}>
                                                                {res.type === 'file' ? (
                                                                    <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={res.name}>{res.name}</span>
                                                                <span className="text-xs text-slate-400 truncate uppercase">{res.type}</span>
                                                            </div>
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Private Resources */}
                                    {isMember && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                                Private Resources <span className="text-xs font-normal text-slate-400">(Contributors only)</span>
                                            </h4>
                                            {!project.private_resources || project.private_resources.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic px-2">No private resources available.</p>
                                            ) : (
                                                <ul className="grid sm:grid-cols-2 gap-3">
                                                    {project.private_resources.map((res: any, index: number) => (
                                                        <li key={index}>
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-purple-200 hover:shadow-sm transition-all group">
                                                                <div className={`p-2 rounded-lg ${res.type === 'file' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'} transition-colors`}>
                                                                    {res.type === 'file' ? (
                                                                        <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4 min-w-4 max-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm font-medium text-slate-900 truncate group-hover:text-purple-600 transition-colors" title={res.name}>{res.name}</span>
                                                                    <span className="text-xs text-slate-400 truncate uppercase">{res.type}</span>
                                                                </div>
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Team Members */}
                        <Card className="border-slate-100">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Team Members
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {project.team_members?.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.team_members.map((member: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between gap-3 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-medium shrink-0">
                                                        {member.name?.[0] || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">{member.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={`text-[10px] uppercase tracking-wider ${roleColors[member.role] || 'bg-slate-100 text-slate-600'} border-0`}>
                                                                {member.role}
                                                            </Badge>
                                                            {member.id === project.ownerId && (
                                                                <span className="text-xs text-slate-400 font-medium">Owner</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>


                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No team members yet</p>
                                )}

                                {/* Pending Requests */}
                                {isOwner && pendingRequests.length > 0 && (
                                    <div className="space-y-3 pt-4 mt-4 border-t border-slate-100">
                                        <h4 className="font-medium text-sm text-slate-700 leading-none">Pending Join Requests</h4>
                                        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1 pb-1 mt-2">
                                            {pendingRequests.map((req: any) => (
                                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{req.user_name}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Role: <Badge variant="secondary" className="ml-1 text-[10px]">{req.role}</Badge></p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 text-xs"
                                                            onClick={() => updateMemberStatusMutation.mutate({ membershipId: req.id, status: 'rejected' })}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                                                            onClick={() => updateMemberStatusMutation.mutate({ membershipId: req.id, status: 'accepted' })}
                                                        >
                                                            Accept
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Invite Users Dialog */}
                                {isOwner && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full mt-4 bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors">
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Invite Users
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md md:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Invite Users</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6 pt-4">
                                                {/* Invite User */}
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-sm text-slate-700 leading-none">Invite User by Email</h4>
                                                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                                        <Input
                                                            placeholder="User Email address"
                                                            value={inviteEmail}
                                                            onChange={(e) => setInviteEmail(e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue placeholder="Select role" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {parsedRoles.map((r: any) => (
                                                                    <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
                                                                ))}
                                                                <SelectItem value="Member">Member</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            className="sm:w-32 bg-slate-900 hover:bg-slate-800 shrink-0"
                                                            onClick={() => inviteMemberMutation.mutate()}
                                                            disabled={!inviteEmail || inviteMemberMutation.isPending}
                                                        >
                                                            Send Invite
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tasks Tab - Kanban */}
                <TabsContent value="tasks" className="mt-0">
                    <div className="grid md:grid-cols-3 gap-4">
                        {['todo', 'in_progress', 'done'].map((status) => (
                            <div key={status} className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-700 capitalize">
                                        {status.replace('_', ' ')}
                                    </h3>
                                    <Badge variant="secondary" className="bg-white">
                                        {groupedTasks[status].length}
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {groupedTasks[status].map((task) => (
                                            <motion.div
                                                key={task.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <Card className="border-slate-100 shadow-sm">
                                                    <CardContent className="p-4">
                                                        <p className="font-medium text-slate-900 mb-2">{task.title}</p>
                                                        <div className="flex items-center justify-between">
                                                            {task.tag && (
                                                                <Badge className={`text-xs ${task.tag === 'Design' ? 'bg-rose-100 text-rose-700' :
                                                                    task.tag === 'Dev' ? 'bg-blue-100 text-blue-700' :
                                                                        task.tag === 'PM' ? 'bg-teal-100 text-teal-700' :
                                                                            'bg-amber-100 text-amber-700'
                                                                    } border-0`}>
                                                                    {task.tag}
                                                                </Badge>
                                                            )}
                                                            <Select
                                                                value={task.status}
                                                                onValueChange={(value) => updateTaskMutation.mutate({ taskId: task.id, status: value })}
                                                            >
                                                                <SelectTrigger className="w-auto h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="todo">To Do</SelectItem>
                                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                                    <SelectItem value="done">Done</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="mt-0">
                    <Card className="border-slate-100">
                        <CardContent className="p-0">
                            <div className="h-96 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500">
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.sender_email === user?.email ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium shrink-0">
                                                {msg.sender_name?.[0] || '?'}
                                            </div>
                                            <div className={`max-w-[70%] ${msg.sender_email === user?.email ? 'text-right' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-slate-900">{msg.sender_name}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {msg.created_date && format(new Date(msg.created_date), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                                <div className={`p-3 rounded-2xl ${msg.sender_email === user?.email
                                                    ? 'bg-purple-600 text-white rounded-br-sm'
                                                    : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-slate-100 p-4">
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && newMessage && sendMessageMutation.mutate()}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => sendMessageMutation.mutate()}
                                        disabled={!newMessage || sendMessageMutation.isPending}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="mt-0">
                    <Card className="border-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Resources</CardTitle>
                            <Dialog open={showAddFile} onOpenChange={setShowAddFile}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Resource
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Resource</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Name</label>
                                            <Input
                                                value={newFile.name}
                                                onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                                                placeholder="Design System"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Type</label>
                                            <Select value={newFile.type} onValueChange={(value) => setNewFile({ ...newFile, type: value })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Figma">Figma</SelectItem>
                                                    <SelectItem value="GitHub">GitHub</SelectItem>
                                                    <SelectItem value="Doc">Doc</SelectItem>
                                                    <SelectItem value="Notion">Notion</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">URL</label>
                                            <Input
                                                value={newFile.url}
                                                onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                            onClick={() => addFileMutation.mutate()}
                                            disabled={!newFile.name || !newFile.url || addFileMutation.isPending}
                                        >
                                            Add Resource
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {files.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    No resources added yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {files.map((file: any) => (
                                        <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className="text-2xl">{fileTypeIcons[file.type] || '🔗'}</div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{file.name}</p>
                                                <p className="text-sm text-slate-500">{file.type}</p>
                                            </div>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Progress Tab */}
                <TabsContent value="progress" className="mt-0">
                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <Card className="border-slate-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Project Completion</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-bold text-slate-900">{project.progress || 0}%</span>
                                        <Badge className={`${(project.progress || 0) >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                            (project.progress || 0) >= 50 ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-700'
                                            } border-0`}>
                                            {(project.progress || 0) >= 75 ? 'Almost done!' :
                                                (project.progress || 0) >= 50 ? 'Good progress' :
                                                    'Getting started'}
                                        </Badge>
                                    </div>
                                    <Progress value={project.progress || 0} className="h-3" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Milestones */}
                        <Card className="border-slate-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Milestones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {project.milestones?.length > 0 ? (
                                    <div className="space-y-4">
                                        {project.milestones.map((milestone: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${milestone.completed
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {milestone.completed ? (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    ) : (
                                                        <Circle className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <span className={`${milestone.completed ? 'text-slate-500 line-through' : 'text-slate-900 font-medium'}`}>
                                                    {milestone.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No milestones set</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
