"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
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
    UserPlus
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
        <Suspense fallback={<div className="max-w-6xl mx-auto"><Skeleton className="h-8 w-32 mb-6" /><Skeleton className="h-64 rounded-2xl" /></div>}>
            <ProjectWorkspace />
        </Suspense>
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

    const { data: project, isLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            const projects = await (await api.get('/projects', { params: { id: projectId } })).data;
            return projects[0];
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

    const isMember = memberships.some((m: any) => m.project_id === projectId);

    const joinMutation = useMutation({
        mutationFn: async () => {
            return api.post('/projectmemberships', {
                user_email: user.email,
                project_id: projectId,
                role: selectedRole
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
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
                <Link href={createPageUrl('Projects')}>
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
                    <Link href={createPageUrl('Projects')}>
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

                {isMember ? (
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
                    <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-slate-100 gap-2">
                        <CheckSquare className="w-4 h-4" />
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-slate-100 gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="files" className="rounded-lg data-[state=active]:bg-slate-100 gap-2">
                        <FolderOpen className="w-4 h-4" />
                        Files
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-slate-100 gap-2">
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
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-medium">
                                                    {member.name?.[0] || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{member.name}</p>
                                                    <Badge className={`text-xs ${roleColors[member.role] || 'bg-slate-100 text-slate-600'} border-0`}>
                                                        {member.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No team members yet</p>
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
