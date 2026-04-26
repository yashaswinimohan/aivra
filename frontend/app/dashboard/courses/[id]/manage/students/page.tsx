"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { Users, ChevronLeft, Trash2, Calendar, Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ManageStudents() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const courseId = params.id as string;

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!courseId) return;
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/course/${courseId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                } else {
                    console.error("Failed to fetch students");
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchStudents();
    }, [courseId, user]);

    const handleDropStudent = async (enrollmentId: string, studentName: string) => {
        if (!confirm(`Are you sure you want to drop ${studentName || "this student"} from the course? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${enrollmentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== enrollmentId));
            } else {
                alert("Failed to drop student");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to drop student");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href={`/dashboard/courses/${courseId}/manage`} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 transition">
                            <ChevronLeft size={20} />
                            Back to Manage Course
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Users className="text-purple-600" />
                            Manage Students
                        </h1>
                        <p className="text-slate-500 mt-2">View roster, monitor progress, and manage enrollments.</p>
                    </div>
                </div>

                <Card className="border-slate-200">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-12 flex justify-center text-slate-400">Loading roster...</div>
                        ) : students.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">No students are currently enrolled in this course.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-sm">
                                            <th className="font-semibold p-4">Student Name</th>
                                            <th className="font-semibold p-4">Email</th>
                                            <th className="font-semibold p-4">Joined Date</th>
                                            <th className="font-semibold p-4">Completed Chapters</th>
                                            <th className="font-semibold p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => {
                                            const enrolledDate = student.enrolledAt ? new Date((student.enrolledAt._seconds || student.enrolledAt.seconds) * 1000).toLocaleDateString() : 'Unknown';
                                            return (
                                                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-900">
                                                        {student.user?.fullName || "Anonymous Student"}
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-sm flex items-center gap-2">
                                                        <Mail size={14} className="text-slate-400" />
                                                        {student.user?.email || "Unknown"}
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            {enrolledDate}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
                                                            {student.completedChapters?.length || 0} Modules
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDropStudent(student.id, student.user?.fullName)}
                                                        >
                                                            <Trash2 size={16} className="mr-2" />
                                                            Drop
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
