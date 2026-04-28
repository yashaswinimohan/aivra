"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "firebase/auth";

import {
    LayoutGrid,
    BookOpen,
    Briefcase,
    Sparkles,
    Trophy,
    User as UserIcon,
    LogOut,
    X
} from "lucide-react";

import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarInset
} from "@/components/ui/sidebar";
interface UserWithRole extends User {
    role?: string;
    isOnboardingComplete?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserWithRole | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
                // Fetch user profile to get role and onboarding status
                try {
                    const token = await currentUser.getIdToken();
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const profile = await res.json();

                    if (!profile.isOnboardingComplete) {
                        router.push("/onboarding");
                        return;
                    }

                    setUser((prev) => prev ? ({ ...prev, role: profile.role, isOnboardingComplete: profile.isOnboardingComplete }) : null);
                } catch (error) {
                    console.error("Failed to fetch user profile:", error);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">Loading...</div>;

    return (
        <SidebarProvider>
            <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden w-full">
                {/* Sidebar */}
                <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
                    <SidebarHeader className="h-16 flex justify-center px-4 border-b border-sidebar-border/50 group-data-[collapsible=icon]:px-2">
                        <div className="flex items-center gap-3 w-full mt-2 group-data-[collapsible=icon]:justify-center">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 text-white shadow-sm">
                                <Sparkles className="size-5" />
                            </div>
                            <span className="font-bold text-xl text-[#7a49e6] pb-0.5 flex-1 w-full truncate group-data-[collapsible=icon]:hidden">
                                Aivra
                            </span>
                            <SidebarTrigger className="md:hidden text-slate-500 hover:text-slate-900 group-data-[collapsible=icon]:hidden">
                                <X className="size-4" />
                            </SidebarTrigger>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-6">
                        <SidebarMenu className="gap-3">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard" className="h-12 rounded-xl data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700 text-slate-600 hover:bg-slate-50">
                                    <Link href="/dashboard" className="text-[15px] font-medium">
                                        <LayoutGrid className="size-5 mr-3" />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive('/dashboard/courses')} tooltip="Courses" className="h-12 rounded-xl data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700 text-slate-600 hover:bg-slate-50">
                                    <Link href="/dashboard/courses" className="text-[15px] font-medium">
                                        <BookOpen className="size-5 mr-3" />
                                        <span>Courses</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/dashboard/projects'} tooltip="Projects" className="h-12 rounded-xl data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700 text-slate-600 hover:bg-slate-50">
                                    <Link href="/dashboard/projects" className="text-[15px] font-medium">
                                        <Briefcase className="size-5 mr-3" />
                                        <span>Projects</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/dashboard/profile'} tooltip="Profile" className="h-12 rounded-xl data-[active=true]:bg-teal-50 data-[active=true]:text-teal-700 text-slate-600 hover:bg-slate-50">
                                    <Link href="/dashboard/profile" className="text-[15px] font-medium">
                                        <UserIcon className="size-5 mr-3" />
                                        <span>Profile</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="p-4 pb-6 mt-auto overflow-hidden group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-6 group-data-[collapsible=icon]:justify-center">
                        <div className="flex flex-col gap-4">
                            {user && (
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-[1rem] shadow-sm group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:mx-auto">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7a49e6] text-white font-medium text-lg">
                                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'Y'}
                                    </div>
                                    <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                                        <span className="truncate text-sm font-semibold text-slate-900">
                                            {user.displayName || 'Yashaswini Mohan'}
                                        </span>
                                        <span className="truncate text-xs text-slate-500 flex-1">
                                            {user.email || 'yashaswinimohan@gmail.com'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => signOut(auth).then(() => router.push('/login'))}
                                className="flex items-center justify-center gap-2 w-full text-slate-600 hover:text-slate-900 font-semibold text-sm py-2 transition-colors mt-2"
                            >
                                <LogOut className="size-5 group-data-[collapsible=icon]:mx-auto" />
                                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                            </button>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <SidebarInset className="flex w-full flex-col bg-slate-50">
                    <header className="flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-white">
                        <div className="flex items-center gap-2 px-2">
                            <SidebarTrigger className="-ml-1" />
                        </div>
                    </header>
                    <main className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
