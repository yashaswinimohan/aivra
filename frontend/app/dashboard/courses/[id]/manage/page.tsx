"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Settings, Users, FileText, ChevronLeft, Eye, EyeOff, Archive } from "lucide-react";

interface Course {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'published' | 'archived';
}

export default function ManageCourse() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const courseId = params.id as string; // Fixed: using params.id

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseId) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                } else {
                    console.error("Failed to fetch course");
                    router.push("/dashboard/courses");
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, router]);

    const updateStatus = async (newStatus: 'draft' | 'archived') => {
        if (!confirm(`Are you sure you want to ${newStatus === 'draft' ? 'unpublish' : 'archive'} this course?`)) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...course, status: newStatus })
            });

            if (res.ok) {
                const updated = await res.json();
                setCourse(updated);
                alert(`Course ${newStatus === 'draft' ? 'unpublished' : 'archived'} successfully.`);
                if (newStatus === 'archived') {
                    router.push("/dashboard/courses");
                }
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update status");
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!course) return null;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-8">
                    <Link href="/dashboard/courses" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 transition">
                        <ChevronLeft size={20} />
                        Back to Courses
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                            course.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                            {course.status.toUpperCase()}
                        </span>
                        <span className="text-slate-400 text-sm">•</span>
                        <Link href={`/dashboard/courses/${courseId}`} className="text-blue-600 hover:underline text-sm font-medium">
                            View as Student
                        </Link>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Content Section */}
                    <div className="col-span-1 lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText className="text-blue-600" size={20} />
                                Course Content
                            </h2>
                            <p className="text-slate-500 mb-6 text-sm">
                                Edit your course curriculum, chapters, and details. Changes will be saved as drafts until republished.
                            </p>
                            <Link
                                href={`/dashboard/create-course?courseId=${courseId}`}
                                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                                Edit Course Content
                            </Link>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm opacity-75">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users className="text-purple-600" size={20} />
                                Student Management
                            </h2>
                            <p className="text-slate-500 mb-6 text-sm">
                                Manage enrolled students, view progress, and handle grading.
                            </p>
                            <div className="flex gap-3">
                                <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium">
                                    Manage Students (Coming Soon)
                                </button>
                                <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium">
                                    Gradebook (Coming Soon)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Settings className="text-slate-600" size={20} />
                                Course Settings
                            </h2>

                            <div className="space-y-4">
                                {course.status === 'published' && (
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                                        <h3 className="font-semibold text-amber-900 text-sm mb-1">Unpublish Course</h3>
                                        <p className="text-amber-700 text-xs mb-3">
                                            Make this course unavailable to new students. Existing students may still have access.
                                        </p>
                                        <button
                                            onClick={() => updateStatus('draft')}
                                            className="w-full py-2 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 text-sm font-medium flex items-center justify-center gap-2 transition"
                                        >
                                            <EyeOff size={16} />
                                            Unpublish
                                        </button>
                                    </div>
                                )}

                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                    <h3 className="font-semibold text-red-900 text-sm mb-1">Archive Course</h3>
                                    <p className="text-red-700 text-xs mb-3">
                                        Archive this course. It will be moved to the archives and hidden from the catalog.
                                    </p>
                                    <button
                                        onClick={() => updateStatus('archived')}
                                        className="w-full py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-2 transition"
                                    >
                                        <Archive size={16} />
                                        Archive Course
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
