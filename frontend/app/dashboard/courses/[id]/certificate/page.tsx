"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trophy, Lock, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { CertificateCard } from "@/components/gamification/CertificateCard";

export default function CertificatePage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const { user, loading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [missingRequirements, setMissingRequirements] = useState<{type: string, message: string}[]>([]);
    
    const [certificate, setCertificate] = useState<any>(null);
    const [isIssuing, setIsIssuing] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            if (!courseId || !user) return;
            try {
                const token = await auth.currentUser?.getIdToken();
                
                // 1. Fetch Course
                const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`);
                if (!courseRes.ok) throw new Error("Failed to fetch course");
                const courseData = await courseRes.json();
                setCourse(courseData);
                
                // 2. Fetch Enrollment
                const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/${courseId}?autoEnroll=true`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!enrollRes.ok) throw new Error("Failed to fetch enrollment");
                const enrollData = await enrollRes.json();
                setEnrollment(enrollData);
                
                const completedChapters = enrollData.completedChapters || [];
                const allChapters = courseData.modules.flatMap((m: any) => m.chapters) || [];
                const totalChapters = allChapters.length;
                
                let requirements: {type: string, message: string}[] = [];
                
                // Check if all chapters are completed
                if (completedChapters.length < totalChapters) {
                    const missingCount = totalChapters - completedChapters.length;
                    requirements.push({
                        type: 'chapter',
                        message: `You have ${missingCount} chapter(s) left to complete.`
                    });
                }
                
                // Check assignments explicitly
                const assessmentChapters = allChapters.filter((c: any) => c.content?.assessmentSection);
                for (const chapter of assessmentChapters) {
                    const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/chapter/${chapter.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (subRes.ok) {
                        const submission = await subRes.json();
                        const passingScore = chapter.content.assessmentSection.passingScore || 70;
                        if (!submission) {
                            requirements.push({ type: 'assessment', message: `Assessment missing for: ${chapter.title}` });
                        } else if (!submission.graded) {
                            requirements.push({ type: 'assessment', message: `Pending instructor grading for: ${chapter.title}` });
                        } else if (submission.score < passingScore) {
                            requirements.push({ type: 'assessment', message: `Did not pass assessment for: ${chapter.title} (Score: ${submission.score}/${chapter.content.assessmentSection.totalScore || 100})` });
                        }
                    } else {
                        requirements.push({ type: 'assessment', message: `Assessment missing for: ${chapter.title}` });
                    }
                }
                
                setMissingRequirements(requirements);
                
                // If everything is done, fetch or issue certificate
                if (requirements.length === 0) {
                    const certRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates?user_email=${user.email}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    let foundCert = null;
                    if (certRes.ok) {
                        const certs = await certRes.json();
                        foundCert = certs.find((c: any) => c.reference_id === courseId && c.type === 'course');
                    }
                    
                    // Fetch student name
                    const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const profile = userRes.ok ? await userRes.json() : null;
                    console.log("[Certificate] Student profile:", profile);
                    const userName = profile?.full_name || profile?.displayName || profile?.fullName || 
                                     `${profile?.firstName || profile?.first_name || ''} ${profile?.lastName || profile?.last_name || ''}`.trim() || 
                                     user.displayName || "Graduate";

                    if (foundCert) {
                        const certData = {
                            ...foundCert,
                            userName,
                            instructorName: courseData.certificate?.instructorName || courseData.instructorName,
                            designation: courseData.certificate?.designation || "Lead Instructor",
                            skills: courseData.certificate?.skills || ""
                        };
                        console.log("[Certificate] Final cert object:", certData);
                        setCertificate(certData);
                    } else {
                        setIsIssuing(true);
                        const issueRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                user_email: user.email,
                                userName,
                                type: 'course',
                                reference_id: courseId,
                                title: `Course Completion: ${courseData.title}`,
                                instructorName: courseData.certificate?.instructorName || courseData.instructorName || 'Lead Instructor',
                                designation: courseData.certificate?.designation || "Aivra Academy",
                                skills: courseData.certificate?.skills || ""
                            })
                        });
                        if (issueRes.ok) {
                            const newCert = await issueRes.json();
                            setCertificate({
                                ...newCert,
                                userName,
                                instructorName: newCert.instructorName || courseData.certificate?.instructorName || courseData.instructorName,
                                designation: newCert.designation || courseData.certificate?.designation || "Lead Instructor",
                                skills: newCert.skills || courseData.certificate?.skills || ""
                            });
                        }
                        setIsIssuing(false);
                    }
                }
                
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (!authLoading) {
            checkStatus();
        }
    }, [courseId, user, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!course) {
        return <div className="p-8 text-center text-slate-500">Course not found.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 sticky top-0 z-10 shrink-0">
                <Link href={`/dashboard/courses/${courseId}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium">
                    <ChevronLeft size={20} />
                    Back to Course
                </Link>
                <div className="ml-4 pl-4 border-l border-slate-200 truncate">
                    <h1 className="font-semibold text-slate-900 truncate">{course.title}</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {missingRequirements.length > 0 ? (
                        <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Certificate Locked</h2>
                            <p className="text-center text-slate-500 mb-8 max-w-md mx-auto">
                                You must complete all chapters and assignments to unlock your course certificate.
                            </p>

                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 space-y-4">
                                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-amber-600" />
                                    Missing Requirements
                                </h3>
                                <ul className="space-y-3">
                                    {missingRequirements.map((req, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-amber-800 text-sm bg-white/50 p-3 rounded-lg border border-amber-100">
                                            {req.type === 'chapter' ? (
                                                <FileText size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            ) : (
                                                <CheckCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            )}
                                            <span>{req.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <Link
                                    href={`/dashboard/courses/${courseId}/learn`}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium shadow-sm hover:shadow-md"
                                >
                                    Continue Learning
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 md:p-12 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-emerald-900 mb-4">Congratulations!</h2>
                            <p className="text-emerald-700 mb-8 max-w-md mx-auto">
                                You have successfully completed all requirements for this course. Your certificate is ready!
                            </p>

                            <div className="mb-8 flex justify-center">
                                {isIssuing ? (
                                    <div className="flex flex-col items-center justify-center gap-4 py-12 text-emerald-600">
                                        <Loader2 className="animate-spin" size={32} />
                                        <span className="font-medium">Generating your certificate...</span>
                                    </div>
                                ) : certificate ? (
                                    <div className="max-w-md w-full">
                                        <CertificateCard certificate={certificate} />
                                    </div>
                                ) : (
                                    <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
                                        Could not generate certificate. Please try again later.
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/dashboard/courses"
                                className="px-8 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition font-medium inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                Back to Dashboard
                                <CheckCircle size={20} />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
