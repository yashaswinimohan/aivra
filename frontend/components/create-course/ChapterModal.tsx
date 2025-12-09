"use client";
import { useState, useEffect, useRef } from "react";
import { X, Upload, Link as LinkIcon, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface ChapterResource {
    id: string;
    type: 'pdf' | 'url';
    title: string;
    url: string;
}

export interface ChapterContent {
    editorData: any; // Editor.js JSON data
    resources: ChapterResource[];
}

interface ChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; content: ChapterContent }) => void;
    initialData?: { title: string; content: ChapterContent };
}

export default function ChapterModal({ isOpen, onClose, onSave, initialData }: ChapterModalProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [resources, setResources] = useState<ChapterResource[]>(initialData?.content?.resources || []);

    // Editor State
    const editorRef = useRef<any>(null);
    const editorInstanceRef = useRef<any>(null);

    // Resource Input State
    const [isResourceInputOpen, setIsResourceInputOpen] = useState(false);
    const [resourceType, setResourceType] = useState<'pdf' | 'url'>('url');
    const [resourceTitle, setResourceTitle] = useState("");
    const [resourceUrl, setResourceUrl] = useState("");
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && !editorInstanceRef.current) {
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
                        holder: 'editorjs',
                        placeholder: 'Start writing your chapter content...',
                        data: initialData?.content?.editorData || {},
                        tools: {
                            paragraph: {
                                class: Paragraph as any,
                                inlineToolbar: true,
                                tunes: ['alignment'],
                            },
                            header: {
                                class: Header as any,
                                inlineToolbar: true,
                                config: {
                                    levels: [1, 2, 3],
                                    defaultLevel: 2,
                                },
                                tunes: ['alignment'],
                            },
                            list: {
                                class: List as any,
                                inlineToolbar: true,
                                config: {
                                    defaultStyle: 'unordered'
                                },
                                tunes: ['alignment'],
                            },
                            checklist: {
                                class: Checklist,
                                inlineToolbar: true,
                                tunes: ['alignment'],
                            },
                            table: {
                                class: Table,
                                inlineToolbar: true,
                                config: {
                                    rows: 2,
                                    cols: 3,
                                },
                            },
                            marker: Marker,
                            inlineCode: InlineCode,
                            underline: Underline,
                            alignment: {
                                class: AlignmentTuneTool,
                                config: {
                                    default: "left",
                                    blocks: {
                                        header: 'center',
                                        list: 'right'
                                    }
                                },
                            }
                        },
                        autofocus: true,
                    });
                    editorInstanceRef.current = editor;
                }
            };
            initEditor();
        }

        return () => {
            if (editorInstanceRef.current && typeof editorInstanceRef.current.destroy === 'function') {
                // We don't destroy immediately to prevent flicker on re-renders, 
                // but checking isOpen logic might be needed if modal completely unmounts.
                // For now, let's keep it persistent or verify unmount behavior.
                editorInstanceRef.current.destroy();
                editorInstanceRef.current = null;
            }
        };
    }, [isOpen, initialData]);

    const handleAddResource = async () => {
        if (!resourceTitle) return;

        let finalUrl = resourceUrl;

        if (resourceType === 'pdf') {
            if (!resourceFile) return;
            setUploading(true);
            try {
                const storageRef = ref(storage, `course-material/${Date.now()}-${resourceFile.name}`);
                await uploadBytes(storageRef, resourceFile);
                finalUrl = await getDownloadURL(storageRef);
            } catch (error) {
                console.error("Upload failed", error);
                alert("Failed to upload PDF");
                setUploading(false);
                return;
            }
            setUploading(false);
        } else {
            if (!resourceUrl) return;
        }

        const newResource: ChapterResource = {
            id: Date.now().toString(),
            type: resourceType,
            title: resourceTitle,
            url: finalUrl
        };

        setResources([...resources, newResource]);
        // Reset inputs
        setResourceTitle("");
        setResourceUrl("");
        setResourceFile(null);
        setIsResourceInputOpen(false);
    };

    const removeResource = (id: string) => {
        setResources(resources.filter(r => r.id !== id));
    };

    const handleSave = async () => {
        if (!title || !editorInstanceRef.current) return;

        try {
            const savedData = await editorInstanceRef.current.save();
            onSave({
                title,
                content: {
                    editorData: savedData,
                    resources
                }
            });
            onClose();
        } catch (error) {
            console.error("Saving failed: ", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Header */}
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={24} />
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none w-[500px]"
                        placeholder="Chapter Title"
                        autoFocus
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={!title}
                        className="px-6 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-medium disabled:opacity-50 flex items-center gap-2 transition"
                    >
                        Save Chapter
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="max-w-4xl mx-auto py-12 px-8">

                    {/* Resource Toolbar */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => { setResourceType('url'); setIsResourceInputOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition shadow-sm text-sm font-medium"
                            >
                                <LinkIcon size={16} />
                                Add External Link
                            </button>
                            <button
                                onClick={() => { setResourceType('pdf'); setIsResourceInputOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition shadow-sm text-sm font-medium"
                            >
                                <FileText size={16} />
                                Upload PDF
                            </button>
                        </div>

                        {/* Resource Input Area */}
                        {isResourceInputOpen && (
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm mb-6 animate-in slide-in-from-top-2">
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Add {resourceType === 'pdf' ? 'PDF Document' : 'External Link'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input
                                        type="text"
                                        value={resourceTitle}
                                        onChange={(e) => setResourceTitle(e.target.value)}
                                        placeholder="Resource Title (e.g. Slides)"
                                        className="p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                                    />
                                    {resourceType === 'url' ? (
                                        <input
                                            type="url"
                                            value={resourceUrl}
                                            onChange={(e) => setResourceUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                                        />
                                    ) : (
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setResourceFile(e.target.files ? e.target.files[0] : null)}
                                            className="p-2 border border-slate-200 rounded-lg text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsResourceInputOpen(false)}
                                        className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddResource}
                                        disabled={uploading}
                                        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        {uploading && <Loader2 size={14} className="animate-spin" />}
                                        Add Resource
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Resource List */}
                        {resources.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {resources.map((res) => (
                                    <div key={res.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-lg ${res.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {res.type === 'pdf' ? <FileText size={18} /> : <LinkIcon size={18} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-slate-900 truncate">{res.title}</span>
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-blue-600 hover:underline truncate">
                                                    {res.type === 'pdf' ? 'View Document' : res.url}
                                                </a>
                                            </div>
                                        </div>
                                        <button onClick={() => removeResource(res.id)} className="text-slate-400 hover:text-red-500 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Editor Container */}
                    <div className="bg-white rounded-xl shadow-sm min-h-[60vh] p-8 border border-slate-200 cursor-text" onClick={() => {
                        // Focus editor?
                    }}>
                        <div id="editorjs" className="prose max-w-none"></div>
                    </div>

                </div>
            </div>
        </div>
    );
}
