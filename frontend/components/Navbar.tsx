"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import { LogOut, User, UserCircle } from 'lucide-react';

const UserAvatar = ({ user, size = 36 }: { user: any, size?: number }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [user?.photoURL]);

    if (user?.photoURL && !imgError) {
        return (
            <Image
                src={user.photoURL}
                alt="Profile"
                width={size}
                height={size}
                className={`rounded-full border border-zinc-200 hover:border-zinc-400 transition object-cover`}
                style={{ width: size, height: size }}
                unoptimized
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div
            className={`rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 hover:border-zinc-400 transition`}
            style={{ width: size, height: size }}
        >
            <User className="text-zinc-500" style={{ width: size * 0.55, height: size * 0.55 }} />
        </div>
    );
};

export default function Navbar() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/onboarding")) return null; // Logic removed to keep navbar

    const isDashboard = pathname?.startsWith("/dashboard");

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-purple-600 bg-clip-text text-transparent pb-1">
                            Aivra
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-4">
                            {!loading && pathname !== '/login' && (
                                <>
                                    {user ? (
                                        <div className="flex items-center gap-4">
                                            {!isDashboard && (
                                                <Link href="/dashboard">
                                                    <Button variant="ghost" className="text-sm font-medium">
                                                        Go to Dashboard
                                                    </Button>
                                                </Link>
                                            )}

                                            <div className="relative pl-4 border-l border-zinc-200" ref={menuRef}>
                                                <button
                                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                                    className="flex items-center gap-2 focus:outline-none"
                                                >
                                                    <UserAvatar user={user} size={36} />
                                                </button>

                                                {isMenuOpen && (
                                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                        <Link
                                                            href="/dashboard/profile"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                                                            onClick={() => setIsMenuOpen(false)}
                                                        >
                                                            <UserCircle size={18} className="text-zinc-500" />
                                                            Profile
                                                        </Link>

                                                        <button
                                                            onClick={handleLogout}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
                                                        >
                                                            <LogOut size={18} className="text-zinc-500" />
                                                            Log out
                                                        </button>

                                                        <div className="my-1 border-t border-zinc-100"></div>

                                                        <div className="px-4 py-2">
                                                            <p className="text-xs text-zinc-500 font-medium">Signed in as</p>
                                                            <p className="text-sm text-zinc-900 truncate font-medium mt-0.5">{user.email}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href="/login">
                                            <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800">
                                                Get Started
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
