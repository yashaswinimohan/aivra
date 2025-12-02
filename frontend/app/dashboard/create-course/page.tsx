"use client";
import { useState, useEffect } from "react";
import { auth, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Attachment {
    type: 'file' | 'url';
    name: string;
    url: string;
}

export default function CreateCourse() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [durationValue, setDurationValue] = useState(0);
    const [durationUnit, setDurationUnit] = useState("weeks");
    const [seats, setSeats] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [domain, setDomain] = useState("");
    const [tags, setTags] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newAttachmentType, setNewAttachmentType] = useState<'file' | 'url'>('file');
    const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
    const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
        if (newAttachmentType === 'url') {
            if (!newAttachmentUrl) return;
            setAttachments([...attachments, { type: 'url', name: newAttachmentUrl, url: newAttachmentUrl }]);
            setNewAttachmentUrl("");
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
                setAttachments([...attachments, { type: 'file', name: newAttachmentFile.name, url }]);
                setNewAttachmentFile(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    duration: { value: durationValue, unit: durationUnit },
                    seats,
                    startDate,
                    domain,
                    tags: tags.split(',').map(t => t.trim()).filter(t => t),
                    attachments
                }),
            });

            if (!res.ok) throw new Error("Failed to create course");

            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to create course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-8">Create New Course</h1>

            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Course Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white h-32"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Duration</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={durationValue}
                                    onChange={(e) => setDurationValue(Number(e.target.value))}
                                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                    min="0"
                                />
                                <select
                                    value={durationUnit}
                                    onChange={(e) => setDurationUnit(e.target.value)}
                                    className="p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Seats Available</label>
                            <input
                                type="number"
                                value={seats}
                                onChange={(e) => setSeats(Number(e.target.value))}
                                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Domain</label>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                placeholder="e.g. Web Development"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                placeholder="React, Node.js, API"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Attachments</label>
                        <div className="flex gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setNewAttachmentType('file')}
                                className={`px-4 py-2 rounded-lg transition ${newAttachmentType === 'file' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                            >
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewAttachmentType('url')}
                                className={`px-4 py-2 rounded-lg transition ${newAttachmentType === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                            >
                                Paste URL
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            {newAttachmentType === 'file' ? (
                                <input
                                    key="file-input"
                                    type="file"
                                    onChange={(e) => setNewAttachmentFile(e.target.files ? e.target.files[0] : null)}
                                    className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
                                />
                            ) : (
                                <input
                                    key="url-input"
                                    type="url"
                                    value={newAttachmentUrl}
                                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                    placeholder="https://example.com/resource"
                                    className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none text-white"
                                />
                            )}
                            <button
                                type="button"
                                onClick={handleAddAttachment}
                                disabled={uploading || (newAttachmentType === 'file' && !newAttachmentFile) || (newAttachmentType === 'url' && !newAttachmentUrl)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Add'}
                            </button>
                        </div>

                        {attachments.length > 0 && (
                            <ul className="space-y-2">
                                {attachments.map((att, index) => (
                                    <li key={index} className="flex justify-between items-center bg-slate-700 p-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{att.type === 'file' ? '📄' : '🔗'}</span>
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-xs">{att.name}</a>
                                        </div>
                                        <button type="button" onClick={() => removeAttachment(index)} className="text-red-400 hover:text-red-300">✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Course"}
                    </button>
                </form>
            </div>
        </DashboardLayout>
    );
}
