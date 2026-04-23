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
    domain?: string;
    level?: string;
    duration?: {
        value: number;
        unit: string;
    };
    tags?: string[];
    attachments?: { type: string; name: string; url: string }[];
    instructorName?: string;
    startDate?: string;
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
    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [enrolling, setEnrolling] = useState<boolean>(false);
    
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
                    if (data.notEnrolled) {
                        setIsEnrolled(false);
                    } else {
                        setIsEnrolled(true);
                        setCompletedChapters(data.completedChapters || []);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch enrollment:", error);
            }
        };
        fetchEnrollment();
    }, [id, userId]);

    const handleEnroll = async () => {
        if (!userId) return;
        setEnrolling(true);
        try {
            const { auth } = await import("@/lib/firebase");
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${id}?autoEnroll=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setIsEnrolled(true);
            }
        } catch (error) {
            console.error("Failed to enroll:", error);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">Loading...</div>;
    if (!course) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">Course not found</div>;

    // Protection rule
    const isCourseOwner = (course as any).instructorId === userId;
    if (!isCourseOwner && userRole !== 'admin' && course.status !== 'published') {
        return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">This course is not available yet.</div>;
    }

    const canViewModules = isCourseOwner || isEnrolled || userRole === 'admin';

    if (!canViewModules) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
                <div className="container mx-auto max-w-4xl">
                    <Link href="/dashboard/courses" className="text-blue-600 hover:text-blue-500 mb-8 inline-block">
                        ← Back to Courses
                    </Link>
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
                        <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                        
                        {/* Instructor Link */}
                        {(course.instructorName || course.instructorId) && (
                            <div className="mb-6">
                                <span className="text-slate-500">Instructor: </span>
                                {course.instructorId ? (
                                    <Link href={`/dashboard/profile/${course.instructorId}`} className="text-blue-600 hover:underline font-medium">
                                        {course.instructorName || "Unknown Instructor"}
                                    </Link>
                                ) : (
                                    <span className="font-medium text-slate-800">{course.instructorName || "Unknown Instructor"}</span>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 mb-6">
                            {course.domain && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{course.domain}</span>}
                            {course.duration && course.duration.value > 0 && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{course.duration.value} {course.duration.unit}</span>}
                            {course.startDate && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                                    Starts: {new Date(course.startDate).toLocaleDateString()}
                                </span>
                            )}
                            {course.tags && course.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">#{tag}</span>
                            ))}
                        </div>
                        
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-3">About this course</h3>
                            <p className="text-slate-600 text-lg whitespace-pre-wrap">{course.description}</p>
                        </div>
                        
                        {/* Course Supporting Documents */}
                        {course.attachments && course.attachments.length > 0 && (
                            <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Course Supporting Documents</h3>
                                <ul className="space-y-3">
                                    {course.attachments.map((att, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${att.type === 'file' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {att.type === 'file' ? '📄' : '🔗'}
                                            </div>
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                                {att.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        <button 
                            onClick={handleEnroll}
                            disabled={enrolling}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition disabled:opacity-50"
                        >
                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                    </div>
                </div>
            </div>
        );
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
                                            {isCourseOwner ? (
                                                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                                                    Owner View
                                                </span>
                                            ) : isUnlocked ? (
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
