"use client";
import { useState, useEffect, Suspense } from "react";
import { auth, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ChevronRight, Save } from "lucide-react";
import CurriculumBuilder, { Module } from "@/components/create-course/CurriculumBuilder";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Assuming useAuth is from this path

interface Attachment {
    type: 'file' | 'url';
    name: string;
    url: string;
}

function CreateCourseContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseIdParam = searchParams.get("courseId");

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [courseId, setCourseId] = useState<string | null>(null);
    const [limitSeats, setLimitSeats] = useState(false);
    const [timeSensitive, setTimeSensitive] = useState(true);

    // Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [durationValue, setDurationValue] = useState(0);
    const [durationUnit, setDurationUnit] = useState("weeks");
    const [seats, setSeats] = useState("");
    const [startDate, setStartDate] = useState("");
    const [level, setLevel] = useState("Beginner");
    const [domain, setDomain] = useState("");
    const [tags, setTags] = useState("");
    const [currentTag, setCurrentTag] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Step 2: Curriculum
    const [modules, setModules] = useState<Module[]>([
        { id: '1', title: 'Introduction', description: 'Getting started with the course', chapters: [] }
    ]);

    // Load Draft Data
    useEffect(() => {
        if (courseIdParam) {
            setCourseId(courseIdParam);
            const fetchCourse = async () => {
                try {
                    setLoading(true);
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseIdParam}`);
                    if (res.ok) {
                        const data = await res.json();
                        setTitle(data.title || "");
                        setDescription(data.description || "");

                        if (data.duration) {
                            setDurationValue(data.duration.value);
                            setDurationUnit(data.duration.unit);
                            setTimeSensitive(data.duration.value > 0);
                        }

                        if (data.seats > 0) {
                            setSeats(data.seats.toString());
                            setLimitSeats(true);
                        }

                        setStartDate(data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "");
                        setLevel(data.level || "Beginner");
                        setDomain(data.domain || "");
                        setTags(data.tags ? data.tags.join(", ") : ""); // Convert array to comma-sep string
                        setAttachments(data.attachments || []);

                        // Load modules if they exist in the draft (assuming backend stores them)
                        if (data.modules && data.modules.length > 0) {
                            setModules(data.modules);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load course", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchCourse();
        }
    }, [courseIdParam]);

    // Attachment UI State
    const [newAttachmentType, setNewAttachmentType] = useState<'file' | 'url'>('file');
    const [newAttachmentLabel, setNewAttachmentLabel] = useState("");
    const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
    const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const steps = [
        { id: 1, title: "Project Details" },
        { id: 2, title: "Curriculum" },
        { id: 3, title: "Review" },
    ];

    useEffect(() => {
        const checkRole = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const profile = await res.json();
                if (profile.role !== 'professor' && profile.role !== 'admin') {
                    router.push("/dashboard");
                }
            } catch (error) {
                console.error("Failed to check role:", error);
                router.push("/dashboard");
            }
        };
        checkRole();
    }, [router]);

    const handleAddAttachment = async () => {
        if (!newAttachmentLabel) return;

        if (newAttachmentType === 'url') {
            if (!newAttachmentUrl) return;
            setAttachments([...attachments, { type: 'url', name: newAttachmentLabel, url: newAttachmentUrl }]);
            setNewAttachmentUrl("");
            setNewAttachmentLabel("");
        } else {
            if (!newAttachmentFile) return;
            if (newAttachmentFile.size > 4 * 1024 * 1024) {
                alert("File size exceeds 4MB limit");
                return;
            }

            setUploading(true);
            try {
                const storageRef = ref(storage, `course-attachments/${Date.now()}-${newAttachmentFile.name}`);
                await uploadBytes(storageRef, newAttachmentFile);
                const url = await getDownloadURL(storageRef);
                setAttachments([...attachments, { type: 'file', name: newAttachmentLabel, url }]);
                setNewAttachmentFile(null);
                setNewAttachmentLabel("");
            } catch (error) {
                console.error("Upload failed:", error);
                alert("File upload failed");
            } finally {
                setUploading(false);
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSave = async (status: 'draft' | 'published', shouldRedirect: boolean, shouldAdvanceStep: boolean, modulesOverride?: Module[]) => {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            // ... (rest of logic same until success block)
            const method = courseId ? "PUT" : "POST";
            const url = courseId
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/courses`;

            const courseData = {
                title,
                description,
                duration: timeSensitive ? { value: durationValue, unit: durationUnit } : { value: 0, unit: 'weeks' },
                seats: limitSeats ? parseInt(seats) : 0,
                startDate: startDate || null,
                level,
                domain,
                tags: tags.split(',').map(tag => tag.trim()).filter(t => t), // Convert string back to array
                attachments,
                modules: modulesOverride || modules, // Use override if provided, else state
                status
            };

            let res;
            if (courseId) {
                // Update existing
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(courseData)
                });
            } else {
                // Create new
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(courseData)
                });
            }

            if (res.ok) {
                const data = await res.json();
                if (!courseId) setCourseId(data.id); // Set ID for subsequent saves

                if (shouldRedirect) {
                    router.push("/dashboard/courses");
                } else if (shouldAdvanceStep) {
                    setStep(step + 1);
                }
            } else {
                console.error("Failed to save course");
            }
        } catch (error) {
            console.error("Error saving course:", error);
            alert("Failed to save course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-6">Create New Course</h1>

                {/* Stepper */}
                <div className="relative mb-12">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200" />
                    <div
                        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-900 transition-all duration-300 ease-in-out"
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    />
                    <div className="relative flex justify-between">
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-50 px-2 z-10">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2 ${step >= s.id
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-slate-500 border-slate-200"
                                        }`}
                                >
                                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                                </div>
                                <span className={`text-xs font-medium ${step >= s.id ? "text-slate-900" : "text-slate-500"}`}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-8"
                        >
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700">Course Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900"
                                        placeholder="e.g. Advanced AI Patterns"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900 h-32"
                                        placeholder="What will students learn?"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Duration</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isTimeSensitive"
                                                    checked={timeSensitive}
                                                    onChange={(e) => setTimeSensitive(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor="isTimeSensitive" className="text-xs text-slate-500 select-none cursor-pointer">Time Sensitive</label>
                                            </div>
                                        </div>
                                        <div className={`flex gap-2 transition-opacity ${!timeSensitive ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input
                                                type="number"
                                                value={durationValue}
                                                onChange={(e) => setDurationValue(Number(e.target.value))}
                                                className="w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900 bg-slate-50"
                                                min="0"
                                                disabled={!timeSensitive}
                                            />
                                            <select
                                                value={durationUnit}
                                                onChange={(e) => setDurationUnit(e.target.value)}
                                                className="p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900 bg-slate-50"
                                                disabled={!timeSensitive}
                                            >
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Seats</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="limitSeats"
                                                    checked={limitSeats}
                                                    onChange={(e) => setLimitSeats(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor="limitSeats" className="text-xs text-slate-500 select-none cursor-pointer">Limit seats</label>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            value={seats}
                                            onChange={(e) => setSeats(e.target.value)}
                                            className={`w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900 transition-opacity ${!limitSeats ? 'opacity-50 pointer-events-none bg-slate-50' : ''}`}
                                            min="1"
                                            disabled={!limitSeats}
                                            placeholder={!limitSeats ? "Unlimited" : "Number of seats"}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Start Date <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                                        </div>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700">Domain</label>
                                        <input
                                            type="text"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            className="w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900"
                                            placeholder="e.g. Web Development"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full p-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900"
                                            placeholder="React, Node.js, API"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">Course Supporting Documents</label>
                                    <p className="text-xs text-slate-500 mb-3">Upload documents such as course overview, timeline, learning outcomes, and rubric. You can add multiple files or links.</p>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                                        <div className="flex gap-4 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setNewAttachmentType('file')}
                                                className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${newAttachmentType === 'file' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Upload File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewAttachmentType('url')}
                                                className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${newAttachmentType === 'url' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Add Link
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                            <div className="md:col-span-4">
                                                <input
                                                    type="text"
                                                    value={newAttachmentLabel}
                                                    onChange={(e) => setNewAttachmentLabel(e.target.value)}
                                                    placeholder="Label (e.g. Syllabus)"
                                                    className="w-full p-2.5 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900 text-sm"
                                                />
                                            </div>

                                            <div className="md:col-span-6">
                                                {newAttachmentType === 'file' ? (
                                                    <input
                                                        key="file-input"
                                                        type="file"
                                                        onChange={(e) => setNewAttachmentFile(e.target.files ? e.target.files[0] : null)}
                                                        className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                ) : (
                                                    <input
                                                        key="url-input"
                                                        type="url"
                                                        value={newAttachmentUrl}
                                                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                                        placeholder="https://example.com/resource"
                                                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 focus:border-blue-600 outline-none text-slate-900 text-sm"
                                                    />
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddAttachment}
                                                    disabled={uploading || !newAttachmentLabel || (newAttachmentType === 'file' && !newAttachmentFile) || (newAttachmentType === 'url' && !newAttachmentUrl)}
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg transition disabled:opacity-50 text-sm font-medium"
                                                >
                                                    {uploading ? 'Adding...' : 'Add'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {attachments.length > 0 && (
                                        <ul className="space-y-2">
                                            {attachments.map((att, index) => (
                                                <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-2 rounded-lg ${att.type === 'file' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {att.type === 'file' ? (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium text-slate-900 truncate">{att.name}</span>
                                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-blue-600 hover:underline truncate">
                                                                {att.type === 'file' ? 'View Document' : att.url}
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeAttachment(index)} className="p-1 text-slate-400 hover:text-red-500 transition">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => handleSave('draft', true, false)}
                                        disabled={loading}
                                        className="px-6 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        Save as Draft
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSave('draft', false, true)} // Save as draft but continue to next step
                                        disabled={loading}
                                        className="px-6 py-3 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                                        Save & Continue
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-8"
                        >
                            <CurriculumBuilder
                                modules={modules}
                                onChange={setModules}
                                onAutoSave={(updatedModules) => {
                                    setModules(updatedModules);
                                    // Use setTimeout to allow state update to propagate if needed, 
                                    // but we can pass updatedModules directly to handleSave if we modified it to accept overrides.
                                    // ideally handleSave should rely on state, but state updates are async.
                                    // A safer way is to modify handleSave to accept data Override.

                                    // For now, let's modify handleSave signature or just trigger it.
                                    // Accessing state inside handleSave might be stale if triggered immediately after setModules?
                                    // Actually, we can reuse handleSave but we need to ensure it uses the *updated* modules.
                                    // Let's modify handleSave to accept optional modules override.
                                    handleSave('draft', false, false, updatedModules);
                                }}
                            />

                            <div className="mt-8 flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="px-8 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold transition flex items-center gap-2"
                                >
                                    Continue to Review
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-12 text-center"
                        >
                            <div className="max-w-md mx-auto">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                                    ✨
                                </div>
                                <h2 className="text-2xl font-bold mb-4">Ready to Publish?</h2>
                                <p className="text-slate-500 mb-8">Review your course details before making it live.</p>

                                <div className="flex justify-between">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => handleSave('published', true, false)}
                                        className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        Publish Course
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}

export default function CreateCourse() {
    return (
        <DashboardLayout>
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            }>
                <CreateCourseContent />
            </Suspense>
        </DashboardLayout>
    );
}
