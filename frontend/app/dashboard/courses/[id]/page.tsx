"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

interface Chapter {
    id: string;
}

interface Module {
    title: string;
    chapters?: Chapter[];
}

interface Course {
    id: string;
    title: string;
    description: string;
    modules?: Module[];
    status?: string;
    instructorId?: string;
}

export default function CourseDetail() {
    const { id } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        import("@/lib/firebase").then(({ auth }) => {
            import("firebase/auth").then(({ onAuthStateChanged }) => {
                onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        setUserId(currentUser.uid);
                        try {
                            const token = await currentUser.getIdToken();
                            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (profileRes.ok) {
                                const profile = await profileRes.json();
                                setUserRole(profile.role);
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        setUserId(null);
                        setUserRole(null);
                    }
                });
            });
        });
    }, []);

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

    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchEnrollment = async () => {
            if (!id || !userId) return;
            try {
                const { auth } = await import("@/lib/firebase");
                const token = await auth.currentUser?.getIdToken();
                if (!token) return;
                
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompletedChapters(data.completedChapters || []);
                }
            } catch (error) {
                console.error("Failed to fetch enrollment:", error);
            }
        };
        fetchEnrollment();
    }, [id, userId]);

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">Loading...</div>;
    if (!course) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">Course not found</div>;

    // Protection rule
    const isCourseOwner = (course as any).instructorId === userId;
    if (!isCourseOwner && userRole !== 'admin' && course.status !== 'published') {
        return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">This course is not available yet.</div>;
    }

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
                                {course.modules.map((module: Module, index: number) => {
                                    const totalChapters = module.chapters?.length || 0;
                                    const completed = module.chapters?.filter(c => completedChapters.includes(c.id)).length || 0;
                                    const isComplete = totalChapters > 0 && totalChapters === completed;

                                    let isUnlocked = true;
                                    for (let i = 0; i < index; i++) {
                                        const prevModule = course.modules![i];
                                        const prevTotal = prevModule.chapters?.length || 0;
                                        const prevCompleted = prevModule.chapters?.filter(c => completedChapters.includes(c.id)).length || 0;
                                        if (prevTotal === 0 || prevTotal !== prevCompleted) {
                                            isUnlocked = false;
                                            break;
                                        }
                                    }

                                    return (
                                        <div key={index} className={`p-4 rounded-lg flex justify-between items-center border ${isUnlocked ? 'bg-slate-50 border-slate-100' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                                            <span className="font-medium flex items-center gap-2">
                                                {!isUnlocked && <Lock size={16} className="text-slate-400" />}
                                                Module {index + 1}: {module.title}
                                            </span>
                                            {isUnlocked ? (
                                                <Link href={`/dashboard/courses/${id}/learn`} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                                                    {isComplete ? 'Review' : 'Start'}
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-slate-400 px-3 py-1 flex items-center gap-1 cursor-not-allowed border border-slate-200 rounded bg-white">
                                                    <Lock size={14} /> Locked
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
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
