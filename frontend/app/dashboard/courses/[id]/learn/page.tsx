"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, Link as LinkIcon, Menu, X, CheckCircle, PlayCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

interface ChapterResource {
    id: string;
    type: 'pdf' | 'url';
    title: string;
    url: string;
}

interface ChapterContent {
    editorData: any;
    resources: ChapterResource[];
}

interface Chapter {
    id: string;
    title: string;
    content: ChapterContent;
}

interface Module {
    id: string;
    title: string;
    chapters: Chapter[];
}

interface Course {
    id: string;
    title: string;
    modules: Module[];
}

export default function LearnPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const { user } = useAuth(); // Import useAuth
    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseId) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                    // Set initial active chapter if available
                    if (data.modules && data.modules.length > 0) {
                        const firstModule = data.modules[0];
                        setActiveModuleId(firstModule.id);
                        if (firstModule.chapters && firstModule.chapters.length > 0) {
                            setActiveChapterId(firstModule.chapters[0].id);
                        }
                    }
                } else {
                    console.error("Failed to fetch course");
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    // Fetch Enrollment Data
    useEffect(() => {
        const fetchEnrollment = async () => {
            if (!courseId || !user) return;
            try {
                const token = await user.getIdToken();
                console.log("Fetching from:", `${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${courseId}`);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompletedChapters(data.completedChapters || []);
                    // setProgress(data.progress || 0); // Optionally use backend progress
                }
            } catch (error) {
                console.error("Failed to fetch enrollment:", error);
            }
        };
        fetchEnrollment();
    }, [courseId, user]);

    // Calculate Progress
    useEffect(() => {
        if (!course || !course.modules) return;
        const totalChapters = course.modules.reduce((acc, m) => acc + (m.chapters?.length || 0), 0);
        if (totalChapters === 0) setProgress(0);
        else setProgress(Math.round((completedChapters.length / totalChapters) * 100));
    }, [completedChapters, course]);

    const handleToggleComplete = async () => {
        if (!activeChapterId || !user) return;

        const isCompleted = completedChapters.includes(activeChapterId);
        const newCompleted = isCompleted
            ? completedChapters.filter(id => id !== activeChapterId)
            : [...completedChapters, activeChapterId];

        setCompletedChapters(newCompleted); // Optimistic update

        try {
            const token = await user.getIdToken();
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${courseId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    chapterId: activeChapterId,
                    isCompleted: !isCompleted
                })
            });
        } catch (error) {
            console.error("Failed to update progress:", error);
            // Revert on error
            setCompletedChapters(completedChapters);
        }
    };

    const getNextChapter = () => {
        if (!course || !activeModuleId || !activeChapterId) return null;

        const moduleIndex = course.modules.findIndex(m => m.id === activeModuleId);
        if (moduleIndex === -1) return null;

        const currentModule = course.modules[moduleIndex];
        const chapterIndex = currentModule.chapters.findIndex(c => c.id === activeChapterId);
        if (chapterIndex === -1) return null;

        // Check if there is a next chapter in the current module
        if (chapterIndex < currentModule.chapters.length - 1) {
            return {
                moduleId: currentModule.id,
                chapterId: currentModule.chapters[chapterIndex + 1].id,
                title: currentModule.chapters[chapterIndex + 1].title
            };
        }

        // Check if there is a next module
        if (moduleIndex < course.modules.length - 1) {
            const nextModule = course.modules[moduleIndex + 1];
            if (nextModule.chapters.length > 0) {
                return {
                    moduleId: nextModule.id,
                    chapterId: nextModule.chapters[0].id,
                    title: nextModule.chapters[0].title
                };
            }
        }

        return null; // No next chapter
    };

    const nextChapter = getNextChapter();

    const handleNext = () => {
        if (nextChapter) {
            setActiveModuleId(nextChapter.moduleId);
            setActiveChapterId(nextChapter.chapterId);
            window.scrollTo(0, 0);
        }
    };

    const handleFinish = () => {
        router.push('/dashboard/courses');
    };

    // Initialize Editor for Reading
    useEffect(() => {
        const activeModule = course?.modules.find(m => m.id === activeModuleId);
        const activeChapter = activeModule?.chapters.find(c => c.id === activeChapterId);

        if (activeChapter && !editorInstanceRef.current) {
            const initEditor = async () => {
                const EditorJS = (await import("@editorjs/editorjs")).default;
                const Header = (await import("@editorjs/header")).default;
                const List = (await import("@editorjs/list")).default;
                const Paragraph = (await import("@editorjs/paragraph")).default;
                const Checklist = (await import("@editorjs/checklist")).default;
                const Table = (await import("@editorjs/table")).default;
                const Marker = (await import("@editorjs/marker")).default;
                const InlineCode = (await import("@editorjs/inline-code")).default;
                const Underline = (await import("@editorjs/underline")).default;
                const AlignmentTuneTool = (await import("editorjs-text-alignment-blocktune")).default;

                if (!editorInstanceRef.current) {
                    const editor = new EditorJS({
                        holder: 'read-only-editor',
                        data: activeChapter.content?.editorData || {},
                        readOnly: true, // IMPORTANT: Read-only mode
                        tools: {
                            paragraph: {
                                class: Paragraph as any,
                                tunes: ['alignment'],
                            },
                            header: {
                                class: Header as any,
                                config: { levels: [1, 2, 3], defaultLevel: 2 },
                                tunes: ['alignment'],
                            },
                            list: {
                                class: List as any,
                                config: { defaultStyle: 'unordered' },
                                tunes: ['alignment'],
                            },
                            checklist: {
                                class: Checklist,
                                tunes: ['alignment'],
                            },
                            table: {
                                class: Table,
                            },
                            marker: Marker,
                            inlineCode: InlineCode,
                            underline: Underline,
                            alignment: {
                                class: AlignmentTuneTool,
                                config: {
                                    default: "left",
                                    blocks: { header: 'center', list: 'right' }
                                },
                            }
                        },
                    });
                    editorInstanceRef.current = editor;
                }
            };
            initEditor();
        } else if (activeChapter && editorInstanceRef.current) {
            // Update data if editor exists
            editorInstanceRef.current.isReady.then(() => {
                if (editorInstanceRef.current) { // Check again to be safe
                    editorInstanceRef.current.render(activeChapter.content?.editorData || {});
                }
            });
        }

        return () => {
            // Cleanup is tricky with EditorJS in React strict mode or rapid switching.
            // Usually better to destroy on unmount of the page, but here we might switch chapters.
            // optimizing to reuse instance and render new data is better.
        };

    }, [activeChapterId, course]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!course) return <div className="p-8 text-center text-slate-500">Course not found.</div>;

    const activeModule = course.modules?.find(m => m.id === activeModuleId);
    const activeChapter = activeModule?.chapters?.find(c => c.id === activeChapterId);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-white">
            {/* Top Bar */}
            <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 bg-white z-10 shrink-0">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Link href={`/dashboard/courses/${courseId}`} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <h1 className="font-bold text-slate-900 truncate max-w-md">{course.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span>{progress}% Complete</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500"
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className={`
                    w-80 border-r border-slate-200 bg-slate-50 flex-shrink-0 flex flex-col transition-all duration-300 absolute md:relative z-20 h-full
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none md:overflow-hidden'}
                `}>
                    <div className="p-4 border-b border-slate-200 font-medium text-slate-700 flex justify-between items-center bg-slate-50 sticky top-0">
                        Course Content
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                        {course.modules?.map((module, mIndex) => {
                            const totalModuleChapters = module.chapters?.length || 0;
                            const completedModuleChapters = module.chapters?.filter(c => completedChapters.includes(c.id)).length || 0;
                            const isModuleComplete = totalModuleChapters > 0 && totalModuleChapters === completedModuleChapters;

                            return (
                                <div key={module.id}>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                                            Module {mIndex + 1}: {module.title}
                                        </h3>
                                        {isModuleComplete && <CheckCircle size={16} className="text-emerald-500" />}
                                    </div>
                                    <div className="space-y-1">
                                        {module.chapters?.map((chapter, cIndex) => {
                                            const isActive = module.id === activeModuleId && chapter.id === activeChapterId;
                                            const isCompleted = completedChapters.includes(chapter.id);

                                            return (
                                                <button
                                                    key={chapter.id}
                                                    onClick={() => {
                                                        setActiveModuleId(module.id);
                                                        setActiveChapterId(chapter.id);
                                                        if (window.innerWidth < 768) setSidebarOpen(false);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-lg text-sm flex items-start gap-3 transition group
                                                        ${isActive ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}
                                                    `}
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {isCompleted ? (
                                                            <CheckCircle size={18} className="text-emerald-500 fill-emerald-50" />
                                                        ) : isActive ? (
                                                            <PlayCircle size={18} className="text-blue-600" />
                                                        ) : (
                                                            <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 group-hover:border-slate-400" />
                                                        )}
                                                    </div>
                                                    <span className={isCompleted && !isActive ? "text-slate-500" : ""}>{chapter.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-white p-6 md:p-12 relative scroll-smooth">
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="absolute top-4 left-4 p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 hidden md:block z-10"
                            title="Show Sidebar"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="max-w-3xl mx-auto pb-20">
                        {activeChapter ? (
                            <div className="animate-in fade-in duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-3xl font-bold text-slate-900">{activeChapter.title}</h2>
                                    <button
                                        onClick={handleToggleComplete}
                                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all
                                            ${completedChapters.includes(activeChapter.id)
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'}
                                        `}
                                    >
                                        {completedChapters.includes(activeChapter.id) ? (
                                            <>
                                                <CheckCircle size={18} />
                                                Completed
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white/50" />
                                                Mark as Complete
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div id="read-only-editor" className="prose max-w-none prose-slate prose-lg mb-12"></div>

                                {/* Resources Section */}
                                {activeChapter.content?.resources && activeChapter.content.resources.length > 0 && (
                                    <div className="mt-12 pt-8 border-t border-slate-100">
                                        <h3 className="text-lg font-semibold mb-4 text-slate-900">Resources</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {activeChapter.content.resources.map(res => (
                                                <a
                                                    key={res.id}
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition group bg-slate-50 hover:bg-white"
                                                >
                                                    <div className={`p-2 rounded-lg ${res.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {res.type === 'pdf' ? <FileText size={20} /> : <LinkIcon size={20} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900 group-hover:text-blue-700 transition truncate">{res.title}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {res.type === 'pdf' ? 'PDF Document' : 'External Link'}
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Navigation */}
                                <div className="mt-16 flex justify-end pt-8 border-t border-slate-200">
                                    {nextChapter ? (
                                        <button
                                            onClick={handleNext}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                                        >
                                            Next: {nextChapter.title}
                                            <ChevronLeft size={20} className="rotate-180" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFinish}
                                            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
                                        >
                                            Finish Course
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Content Selected</h3>
                                <p className="text-slate-500">Select a chapter from the sidebar to start learning.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
