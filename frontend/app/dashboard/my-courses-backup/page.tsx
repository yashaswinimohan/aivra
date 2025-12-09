"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface Course {
    id: string;
    title: string;
    description: string;
    instructorId: string;
}

export default function MyCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

            if (currentUser) {
                fetchUserCourses(currentUser);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchUserCourses = async (currentUser: User) => {
        try {
            // Ideally, we should have an endpoint to filter by instructorId or enrollment
            // For now, fetching all and filtering client-side as a temporary measure
            // Real implementation should use a query parameter like ?instructorId=...
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`);
            const data = await res.json();

            // Filter courses where the current user is the instructor
            const userCourses = data.filter((course: Course) => course.instructorId === currentUser.uid);
            setCourses(userCourses);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Courses</h1>
                <Link href="/dashboard/create-course" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                    + Create New Course
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-slate-500">Loading your courses...</div>
            ) : (
                <>
                    {courses.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div key={course.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500/50 transition group shadow-sm">
                                    <div className="h-40 bg-slate-100 flex items-center justify-center">
                                        <span className="text-4xl">🎓</span>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition">{course.title}</h3>
                                        <p className="text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                                        <Link href={`/courses/${course.id}`} className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-900 py-2 rounded-lg transition">
                                            View Course
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-white rounded-xl p-12 border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold mb-2">No Courses Found</h3>
                            <p className="text-slate-500 mb-6">You haven&apos;t created any courses yet.</p>
                            <Link href="/dashboard/create-course" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
                                Create Your First Course
                            </Link>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
