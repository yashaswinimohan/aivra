"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Module {
    title: string;
}

interface Course {
    id: string;
    title: string;
    description: string;
    modules?: Module[];
}

export default function CourseDetail() {
    const { id } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchCourse = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}`);
                if (!res.ok) throw new Error("Course not found");
                const data = await res.json();
                setCourse(data);
            } catch (error) {
                console.error("Failed to fetch course:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">Loading...</div>;
    if (!course) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">Course not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
            <div className="container mx-auto max-w-4xl">
                <Link href="/dashboard/courses" className="text-blue-600 hover:text-blue-500 mb-8 inline-block">
                    ← Back to Courses
                </Link>

                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
                    <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                    <p className="text-slate-500 text-lg mb-8">{course.description}</p>

                    <div className="border-t border-slate-200 pt-8">
                        <h2 className="text-2xl font-bold mb-6">Course Modules</h2>
                        {course.modules && course.modules.length > 0 ? (
                            <div className="space-y-4">
                                {course.modules.map((module: Module, index: number) => (
                                    <div key={index} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                                        <span className="font-medium">Module {index + 1}: {module.title}</span>
                                        <Link href={`/dashboard/courses/${id}/learn`} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                                            Start
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">No modules available yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
