"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Course {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'published';
}

export default function Courses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`);
                const data = await res.json();
                setCourses(data);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const token = await currentUser.getIdToken();
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const profile = await res.json();
                    setUserRole(profile.role);
                } catch (error) {
                    console.error("Failed to fetch user role:", error);
                }
            }
        });

        fetchCourses();
        return () => unsubscribe();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
                    Course Catalog
                </h1>
                {userRole === 'professor' && (
                    <Link href="/dashboard/create-course" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                        + Create New Course
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="text-center text-slate-500">Loading courses...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500/50 transition group shadow-sm relative">
                            <div className="h-48 bg-slate-100 flex items-center justify-center">
                                <span className="text-4xl">📚</span>
                            </div>
                            <div className="p-6">
                                {course.status === 'published' && (
                                    <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">
                                        PUBLISHED
                                    </span>
                                )}
                                <Link href={`/dashboard/courses/${course.id}`}>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition cursor-pointer">{course.title}</h3>
                                </Link>
                                <p className="text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                                {course.status === 'draft' ? (
                                    <Link href={`/dashboard/create-course?courseId=${course.id}`} className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition border border-slate-300">
                                        Continue Editing
                                    </Link>
                                ) : (
                                    <div className="flex gap-2">
                                        {userRole === 'professor' && (
                                            <Link href={`/dashboard/courses/${course.id}/manage`} className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition border border-slate-300">
                                                Manage
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && courses.length === 0 && (
                <div className="text-center text-slate-500 mt-12">
                    No courses available yet. Check back later!
                </div>
            )}
        </DashboardLayout>
    );
}
