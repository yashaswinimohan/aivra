"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { BookOpen, ChevronLeft, Plus, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Gradebook() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const courseId = params.id as string;

    const [students, setStudents] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingGrade, setEditingGrade] = useState<{ userId: string; assignmentId: string; score: string } | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            if (!courseId || !user) return;
            try {
                const token = await user.getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                const [resStudents, resAssignments, resGrades] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/course/${courseId}/students`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/course/${courseId}`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/grades/course/${courseId}`, { headers })
                ]);

                if (resStudents.ok) setStudents(await resStudents.json());
                if (resAssignments.ok) setAssignments(await resAssignments.json());
                if (resGrades.ok) setGrades(await resGrades.json());

            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [courseId, user]);

    const handleCreateAssignment = async () => {
        const title = prompt("Enter Assignment Name:");
        if (!title) return;
        const maxPointsStr = prompt("Points Possible (default 100):", "100");
        const maxPoints = maxPointsStr ? parseInt(maxPointsStr) : 100;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ courseId, title, pointsPossible: maxPoints })
            });
            if (res.ok) {
                const newA = await res.json();
                setAssignments([...assignments, newA]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveGrade = async (userId: string, assignmentId: string, score: string) => {
        try {
            const numScore = parseFloat(score);
            if (isNaN(numScore)) return;

            const token = await user?.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/grades`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId, assignmentId, score: numScore })
            });

            if (res.ok) {
                const savedGrade = await res.json();
                setGrades(prev => {
                    const idx = prev.findIndex(g => g.userId === userId && g.assignmentId === assignmentId);
                    if (idx > -1) {
                        const next = [...prev];
                        next[idx] = savedGrade;
                        return next;
                    }
                    return [...prev, savedGrade];
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setEditingGrade(null);
        }
    };

    const getGradeFor = (userId: string, assignmentId: string) => {
        return grades.find(g => g.userId === userId && g.assignmentId === assignmentId);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-6 overflow-hidden flex flex-col h-[85vh]">
                <div className="mb-6 flex items-center justify-between shrink-0">
                    <div>
                        <Link href={`/dashboard/courses/${courseId}/manage`} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 transition">
                            <ChevronLeft size={20} />
                            Back to Manage Course
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <BookOpen className="text-blue-600" />
                            Gradebook
                        </h1>
                        <p className="text-slate-500 mt-2">Manage assignments and track student performance.</p>
                    </div>
                    <Button onClick={handleCreateAssignment} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2" size={16} />
                        New Assignment
                    </Button>
                </div>

                <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                    {loading ? (
                        <div className="p-12 flex justify-center text-slate-400">Loading gradebook...</div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="font-semibold p-4 border-r border-slate-200 text-slate-700 bg-slate-50 sticky left-0 z-20 min-w-[200px]">
                                        Student Name
                                    </th>
                                    {assignments.map(a => (
                                        <th key={a.id} className="font-semibold p-4 border-r border-slate-200 text-slate-600 text-sm text-center min-w-[150px]">
                                            <div className="font-medium text-slate-900 truncate">{a.title}</div>
                                            <div className="text-xs text-slate-400 font-normal">Out of {a.pointsPossible}</div>
                                        </th>
                                    ))}
                                    {assignments.length === 0 && (
                                        <th className="font-normal p-4 text-slate-400 italic">No assignments created.</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={assignments.length + 1} className="p-8 text-center text-slate-500">
                                            No students enrolled.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map(student => (
                                        <tr key={student.userId} className="border-b border-slate-100 hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-900 border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                                                {student.user?.fullName || "Anonymous"}
                                            </td>
                                            {assignments.map(a => {
                                                const grade = getGradeFor(student.userId, a.id);
                                                const isEditing = editingGrade?.userId === student.userId && editingGrade?.assignmentId === a.id;
                                                
                                                return (
                                                    <td key={a.id} className="border-r border-slate-200 text-center relative group p-0 align-top">
                                                        {isEditing ? (
                                                            <div className="flex h-full items-center p-2">
                                                                <input 
                                                                    autoFocus
                                                                    type="number"
                                                                    value={editingGrade.score}
                                                                    onChange={e => setEditingGrade({...editingGrade, score: e.target.value})}
                                                                    onKeyDown={e => e.key === 'Enter' && handleSaveGrade(student.userId, a.id, editingGrade.score)}
                                                                    className="w-full text-center border border-blue-400 rounded px-2 py-1 text-sm outline-none focus:ring-2 ring-blue-100"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div 
                                                                onClick={() => setEditingGrade({ userId: student.userId, assignmentId: a.id, score: grade?.score?.toString() || "" })}
                                                                className="cursor-pointer h-full min-h-[48px] w-full flex items-center justify-center text-sm p-4 hover:bg-slate-100 transition-colors"
                                                            >
                                                                {grade ? (
                                                                    <span className="font-semibold text-slate-700">{grade.score}</span>
                                                                ) : (
                                                                    <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">--</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
