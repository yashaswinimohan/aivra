"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
                // Fetch user profile to get role
                try {
                    const token = await currentUser.getIdToken();
                    const res = await fetch("http://localhost:5000/api/users/profile", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const profile = await res.json();
                    setUser((prev: any) => ({ ...prev, role: profile.role }));
                } catch (error) {
                    console.error("Failed to fetch user profile:", error);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6 flex flex-col">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-10">
                    Aivra
                </div>
                <nav className="flex-1 space-y-4">
                    <Link href="/dashboard" className={`block p-3 rounded-lg transition ${pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>Dashboard</Link>
                    <Link href="/dashboard/courses" className={`block p-3 rounded-lg transition ${isActive('/dashboard/courses') ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>Courses</Link>
                    {user?.role === 'professor' && (
                        <Link href="/dashboard/create-course" className={`block p-3 rounded-lg transition ${pathname === '/dashboard/create-course' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-blue-400'}`}>Create Course</Link>
                    )}
                    <Link href="/dashboard/projects" className={`block p-3 rounded-lg transition ${pathname === '/dashboard/projects' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>Project Labs</Link>
                    <Link href="/dashboard/profile" className={`block p-3 rounded-lg transition ${pathname === '/dashboard/profile' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>Profile</Link>
                </nav>
                <div className="pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        {user?.photoURL && <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />}
                        <span className="text-sm truncate">{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left p-2 text-red-400 hover:bg-red-500/10 rounded transition">
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
