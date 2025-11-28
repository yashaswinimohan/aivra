"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CourseDetail() {
    const { id } = useParams();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchCourse = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/courses/${id}`);
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

    if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
    if (!course) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Course not found</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="container mx-auto max-w-4xl">
                <Link href="/dashboard/courses" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
                    ← Back to Courses
                </Link>

                <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                    <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                    <p className="text-gray-400 text-lg mb-8">{course.description}</p>

                    <div className="border-t border-slate-700 pt-8">
                        <h2 className="text-2xl font-bold mb-6">Course Modules</h2>
                        {course.modules && course.modules.length > 0 ? (
                            <div className="space-y-4">
                                {course.modules.map((module: any, index: number) => (
                                    <div key={index} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center">
                                        <span className="font-medium">Module {index + 1}: {module.title}</span>
                                        <button className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition">
                                            Start
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No modules available yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
