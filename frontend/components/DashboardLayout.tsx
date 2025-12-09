"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "firebase/auth";

import { LayoutDashboard, BookOpen, PlusCircle, FlaskConical, User as UserIcon, Menu, ChevronLeft, ChevronRight } from "lucide-react";

interface UserWithRole extends User {
    role?: string;
    isOnboardingComplete?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserWithRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
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
        <div className="h-screen bg-slate-50 text-slate-900 flex pt-16 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 p-4 flex flex-col transition-all duration-300 ease-in-out`}>
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className={`flex items-center gap-3 p-3 rounded-lg transition ${pathname === '/dashboard' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'} ${isCollapsed ? 'justify-center' : ''}`} title="Dashboard">
                        <LayoutDashboard size={20} />
                        {!isCollapsed && <span>Dashboard</span>}
                    </Link>
                    <Link href="/dashboard/courses" className={`flex items-center gap-3 p-3 rounded-lg transition ${isActive('/dashboard/courses') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'} ${isCollapsed ? 'justify-center' : ''}`} title="Courses">
                        <BookOpen size={20} />
                        {!isCollapsed && <span>Courses</span>}
                    </Link>

                    <Link href="/dashboard/projects" className={`flex items-center gap-3 p-3 rounded-lg transition ${pathname === '/dashboard/projects' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'} ${isCollapsed ? 'justify-center' : ''}`} title="Project Labs">
                        <FlaskConical size={20} />
                        {!isCollapsed && <span>Project Labs</span>}
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
