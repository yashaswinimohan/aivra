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
    level?: string;
    domain?: string;
    duration?: {
        value: number;
        unit: string;
    };
    modules?: {
        chapters: any[];
    }[];
}

interface Enrollment {
    courseId: string;
    completedChapters: string[];
}

export default function Courses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    const [userRole, setUserRole] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedLevel, setSelectedLevel] = useState("All Levels");
    const [selectedDuration, setSelectedDuration] = useState("Any Duration");

    const categories = ["All Categories", "Development", "Design", "Business", "Marketing", "Data Science"];
    const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
    const durations = ["Any Duration", "Short (< 4 weeks)", "Medium (4-12 weeks)", "Long (> 12 weeks)"];

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`);
                const data = await res.json();
                setCourses(data);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const token = await currentUser.getIdToken();
                    const [profileRes, enrollmentsRes] = await Promise.all([
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    ]);

                    const profile = await profileRes.json();
                    setUserRole(profile.role);

                    if (enrollmentsRes.ok) {
                        const enrollmentsData = await enrollmentsRes.json();
                        setEnrollments(enrollmentsData);
                    }
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                }
            } else {
                setUserRole(null);
                setEnrollments([]);
            }
            setLoading(false);
        });

        fetchCourses();
        return () => unsubscribe();
    }, []);

    const filteredCourses = courses.filter(course => {
        // 1. Role-based filtering: Students only see published courses
        if (userRole !== 'professor' && userRole !== 'admin' && course.status !== 'published') {
            return false;
        }

        // 2. Search Query
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase());

        // 3. Category Filter
        const matchesCategory = selectedCategory === "All Categories" || (course.domain && course.domain === selectedCategory);

        // 4. Level Filter
        const matchesLevel = selectedLevel === "All Levels" || (course.level && course.level === selectedLevel);

        // 5. Duration Filter
        let matchesDuration = true;
        if (selectedDuration !== "Any Duration" && course.duration) {
            const totalWeeks = course.duration.unit === 'months' ? course.duration.value * 4 :
                course.duration.unit === 'days' ? course.duration.value / 7 :
                    course.duration.value;

            if (selectedDuration === "Short (< 4 weeks)") matchesDuration = totalWeeks < 4;
            else if (selectedDuration === "Medium (4-12 weeks)") matchesDuration = totalWeeks >= 4 && totalWeeks <= 12;
            else if (selectedDuration === "Long (> 12 weeks)") matchesDuration = totalWeeks > 12;
        }

        return matchesSearch && matchesCategory && matchesLevel && matchesDuration;
    });

    const getProgress = (courseId: string, courseModules: Course['modules']) => {
        const enrollment = enrollments.find(e => e.courseId === courseId);
        if (!enrollment || !courseModules) return 0;

        const totalChapters = courseModules.reduce((acc, module) => acc + (module.chapters?.length || 0), 0);
        if (totalChapters === 0) return 0;

        const completedCount = enrollment.completedChapters.length;
        return Math.round((completedCount / totalChapters) * 100);
    };

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


            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                </div>

                {/* Dropdown Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                        {levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>

                    <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                        {durations.map(dur => <option key={dur} value={dur}>{dur}</option>)}
                    </select>
                </div>
            </div>

            {
                loading ? (
                    <div className="text-center text-slate-500">Loading courses...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course) => {
                            const progress = getProgress(course.id, course.modules);
                            const isEnrolled = enrollments.some(e => e.courseId === course.id);

                            return (
                                <div key={course.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500/50 transition group shadow-sm relative flex flex-col h-full">
                                    <div className="h-48 bg-slate-100 flex items-center justify-center relative">
                                        <span className="text-4xl">📚</span>
                                        {isEnrolled && (
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        {(userRole === 'professor' || userRole === 'admin') && course.status === 'published' && (
                                            <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">
                                                PUBLISHED
                                            </span>
                                        )}

                                        <Link href={`/dashboard/courses/${course.id}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold group-hover:text-blue-600 transition cursor-pointer">{course.title}</h3>
                                            </div>
                                        </Link>

                                        {isEnrolled && (
                                            <div className="mb-3">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                    <div
                                                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-slate-500 mb-4 line-clamp-2 flex-grow">{course.description}</p>

                                        <div className="mt-auto pt-4 border-t border-slate-50">
                                            {course.status === 'draft' ? (
                                                <Link href={`/dashboard/create-course?courseId=${course.id}`} className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition border border-slate-300">
                                                    Continue Editing
                                                </Link>
                                            ) : (
                                                <div className="flex gap-2">
                                                    {userRole === 'professor' ? (
                                                        <Link href={`/dashboard/courses/${course.id}/manage`} className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition border border-slate-300">
                                                            Manage
                                                        </Link>
                                                    ) : (
                                                        <Link href={`/dashboard/courses/${course.id}`} className={`block w-full text-center font-medium py-2 rounded-lg transition ${isEnrolled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                                            {isEnrolled ? (progress === 100 ? 'Review Course' : 'Continue Learning') : 'View Course'}
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {
                !loading && filteredCourses.length === 0 && (
                    <div className="text-center text-slate-500 mt-12">
                        No courses available yet. Check back later!
                    </div>
                )
            }
        </DashboardLayout >
    );
}
