"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Briefcase,
    Clock,
    Users,
    ArrowRight,
    Sparkles,
    Filter,
    Plus,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';

const roleColors = {
    'Product Manager': 'bg-teal-100 text-teal-700',
    'UX Designer': 'bg-rose-100 text-rose-700',
    'Developer': 'bg-blue-100 text-blue-700',
    'Data': 'bg-amber-100 text-amber-700',
    'AI Engineer': 'bg-purple-100 text-purple-700',
};

const statusColors = {
    'Open': 'bg-emerald-100 text-emerald-700',
    'Active': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-slate-100 text-slate-600',
};

export default function Projects() {
    const [activeTab, setActiveTab] = useState('browse');
    const [roleFilter, setRoleFilter] = useState('all');
    const [durationFilter, setDurationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => (await api.get('/projects')).data,
    });

    const { data: memberships = [] } = useQuery({
        queryKey: ['memberships', user?.email],
        queryFn: async () => (await api.get('/projectmemberships', { params: { user_email: user?.email } })).data,
        enabled: !!user?.email,
    });

    const myProjectIds = memberships.map((m: any) => m.project_id);
    const myProjects = projects.filter((p: any) => myProjectIds.includes(p.id)).map((p: any) => ({
        ...p,
        role: memberships.find((m: any) => m.project_id === p.id)?.role
    }));

    const browseProjects = projects.filter((p: any) => !myProjectIds.includes(p.id));

    const filteredProjects = browseProjects.filter((project: any) => {
        const matchesRole = roleFilter === 'all' ||
            project.roles_needed?.some((r: string) => r.toLowerCase().includes(roleFilter.toLowerCase()));
        const matchesDuration = durationFilter === 'all' ||
            (durationFilter === 'short' && project.duration?.includes('2')) ||
            (durationFilter === 'medium' && (project.duration?.includes('4') || project.duration?.includes('6'))) ||
            (durationFilter === 'long' && (project.duration?.includes('8') || project.duration?.includes('10')));
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

        return matchesRole && matchesDuration && matchesStatus;
    });

    const clearFilters = () => {
        setRoleFilter('all');
        setDurationFilter('all');
        setStatusFilter('all');
    };

    const hasActiveFilters = roleFilter !== 'all' || durationFilter !== 'all' || statusFilter !== 'all';

    const allRoles = ['Product Manager', 'UX Designer', 'Developer', 'Data', 'AI Engineer'];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Marketplace</h1>
                        <p className="text-slate-600">
                            Join cross-functional teams and build real-world projects.
                        </p>
                    </div>
                    <Link href={createPageUrl('/dashboard/projects/create')}>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                            <Plus className="w-5 h-5 mr-2" />
                            Create Project
                        </Button>
                    </Link>
                </motion.div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
                        <TabsTrigger
                            value="browse"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                        >
                            Browse Projects
                        </TabsTrigger>
                        <TabsTrigger
                            value="my"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                        >
                            My Projects
                            {myProjects.length > 0 && (
                                <Badge className="ml-2 bg-purple-100 text-purple-700 border-0">
                                    {myProjects.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="browse" className="mt-0">
                        {/* Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-wrap gap-3 mb-6"
                        >
                            {/* Role Filter Chips */}
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant={roleFilter === 'all' ? 'default' : 'outline'}
                                    className={`cursor-pointer px-3 py-1.5 ${roleFilter === 'all' ? 'bg-slate-900' : 'hover:bg-slate-50'}`}
                                    onClick={() => setRoleFilter('all')}
                                >
                                    All Roles
                                </Badge>
                                {allRoles.map(role => (
                                    <Badge
                                        key={role}
                                        variant={roleFilter === role ? 'default' : 'outline'}
                                        className={`cursor-pointer px-3 py-1.5 ${roleFilter === role ? 'bg-slate-900' : 'hover:bg-slate-50'}`}
                                        onClick={() => setRoleFilter(role)}
                                    >
                                        {role}
                                    </Badge>
                                ))}
                            </div>

                            {/* Duration Filter */}
                            <div className="flex gap-2 ml-auto">
                                <Badge
                                    variant={durationFilter === 'all' ? 'default' : 'outline'}
                                    className={`cursor-pointer px-3 py-1.5 ${durationFilter === 'all' ? 'bg-slate-900' : 'hover:bg-slate-50'}`}
                                    onClick={() => setDurationFilter('all')}
                                >
                                    Any Duration
                                </Badge>
                                <Badge
                                    variant={durationFilter === 'short' ? 'default' : 'outline'}
                                    className={`cursor-pointer px-3 py-1.5 ${durationFilter === 'short' ? 'bg-slate-900' : 'hover:bg-slate-50'}`}
                                    onClick={() => setDurationFilter('short')}
                                >
                                    2 weeks
                                </Badge>
                                <Badge
                                    variant={durationFilter === 'medium' ? 'default' : 'outline'}
                                    className={`cursor-pointer px-3 py-1.5 ${durationFilter === 'medium' ? 'bg-slate-900' : 'hover:bg-slate-50'}`}
                                    onClick={() => setDurationFilter('medium')}
                                >
                                    4-6 weeks
                                </Badge>
                                <Badge
                                    variant={durationFilter === 'long' ? 'default' : 'outline'}
                                    className={`cursor-pointer px-3 py-1.5 ${durationFilter === 'long' ? 'bg-slate-900' : 'hover:bg-slate-50'}`}
                                    onClick={() => setDurationFilter('long')}
                                >
                                    8-10 weeks
                                </Badge>

                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                                        <X className="w-4 h-4 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </motion.div>

                        {/* Project Grid */}
                        {isLoading ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <Skeleton key={i} className="h-64 rounded-2xl" />
                                ))}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Filter className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects found</h3>
                                <p className="text-slate-500 mb-4">Try adjusting your filters</p>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.map((project: any, index: number) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ProjectCard project={project} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="my" className="mt-0">
                        {myProjects.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
                                <p className="text-slate-500 mb-4">Join a project to start building</p>
                                <Button onClick={() => setActiveTab('browse')} className="bg-purple-600 hover:bg-purple-700">
                                    Browse Projects
                                </Button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myProjects.map((project: any, index: number) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ProjectCard project={project} isMember />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

function ProjectCard({ project, isMember = false }: { project: any, isMember?: boolean }) {
    return (
        <Link href={createPageUrl(`ProjectWorkspace?id=${project.id}`)}>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:border-slate-200 transition-all duration-300 h-full flex flex-col group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-rose-500 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <Badge className={`${(statusColors as any)[project.status] || 'bg-slate-100 text-slate-600'} border-0`}>
                        {project.status}
                    </Badge>
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {project.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                    {project.description}
                </p>

                {/* Project Tags */}
                {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Related Course */}
                {project.related_course && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{project.related_course}</span>
                    </div>
                )}

                {/* Roles Needed */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.roles_needed?.slice(0, 4).map((role: string, i: number) => (
                        <Badge key={i} variant="secondary" className={`text-xs ${(roleColors as any)[role] || 'bg-slate-100 text-slate-600'} border-0`}>
                            {role}
                        </Badge>
                    ))}
                    {project.roles_needed?.length > 4 && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">
                            +{project.roles_needed.length - 4}
                        </Badge>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center text-sm text-slate-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {project.duration}
                    </div>
                    <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 -mr-2">
                        {isMember ? 'Open workspace' : 'View project'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        </Link>
    );
}
