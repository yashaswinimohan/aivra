"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Courses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/courses");
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
                    const res = await fetch("http://localhost:5000/api/users/profile", {
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
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Course Catalog
                </h1>
                {userRole === 'professor' && (
                    <Link href="/dashboard/create-course" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                        + Create New Course
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="text-center text-gray-400">Loading courses...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course) => (
                        <div key={course.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition group">
                            <div className="h-48 bg-slate-700 flex items-center justify-center">
                                <span className="text-4xl">📚</span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition">{course.title}</h3>
                                <p className="text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                                <Link href={`/dashboard/courses/${course.id}`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition">
                                    View Course
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && courses.length === 0 && (
                <div className="text-center text-gray-400 mt-12">
                    No courses available yet. Check back later!
                </div>
            )}
        </DashboardLayout>
    );
}
