"use client";
import { useState } from "react";
import { Plus, Trash2, Edit2, GripVertical, FileText, ChevronDown, ChevronUp } from "lucide-react";
import ChapterModal, { ChapterContent } from "./ChapterModal";


interface Chapter {
    id: string;
    title: string;
    content: ChapterContent;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    chapters: Chapter[];
}

interface CurriculumBuilderProps {
    modules: Module[];
    onChange: (modules: Module[]) => void;
    onAutoSave?: (updatedModules: Module[]) => void;
}

export default function CurriculumBuilder({ modules, onChange, onAutoSave }: CurriculumBuilderProps) {
    // const [modules, setModules] = useState<Module[]>([
    //     { id: '1', title: 'Introduction', description: 'Getting started with the course', chapters: [] }
    // ]);
    const [expandedModules, setExpandedModules] = useState<string[]>(['1']);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

    const toggleModule = (id: string) => {
        setExpandedModules(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    const addModule = () => {
        const newModule: Module = {
            id: Date.now().toString(),
            title: `Module ${modules.length + 1}`,
            description: '',
            chapters: []
        };
        const updatedModules = [...modules, newModule];
        onChange(updatedModules);
        setExpandedModules([...expandedModules, newModule.id]);
    };

    const deleteModule = (id: string) => {
        const updatedModules = modules.filter(m => m.id !== id);
        onChange(updatedModules);
    };

    const updateModule = (id: string, field: 'title' | 'description', value: string) => {
        const updatedModules = modules.map(m => m.id === id ? { ...m, [field]: value } : m);
        onChange(updatedModules);
    };

    const openAddChapter = (moduleId: string) => {
        setCurrentModuleId(moduleId);
        setEditingChapterId(null);
        setIsModalOpen(true);
    };

    const handleSaveChapter = (chapterData: Omit<Chapter, 'id'>) => {
        if (!currentModuleId) return;

        const updatedModules = modules.map(m => {
            if (m.id !== currentModuleId) return m;

            if (editingChapterId) {
                // Edit existing chapter
                return {
                    ...m,
                    chapters: m.chapters.map(c => c.id === editingChapterId ? { ...c, ...chapterData } : c)
                };
            } else {
                // Add new chapter
                const newChapter: Chapter = {
                    id: Date.now().toString(),
                    ...chapterData
                };
                return {
                    ...m,
                    chapters: [...m.chapters, newChapter]
                };
            }
        });

        onChange(updatedModules);
        if (onAutoSave) {
            onAutoSave(updatedModules);
        }
        setIsModalOpen(false);
    };

    const deleteChapter = (moduleId: string, chapterId: string) => {
        onChange(modules.map(m =>
            m.id === moduleId
                ? { ...m, chapters: m.chapters.filter(c => c.id !== chapterId) }
                : m
        ));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Course Curriculum</h2>
                    <p className="text-sm text-slate-500">Organize your course into modules and chapters.</p>
                </div>
                <button
                    onClick={addModule}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                    <Plus size={18} />
                    Add Module
                </button>
            </div>

            <div className="space-y-4">
                {modules.map((module) => (
                    <div key={module.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                        {/* Module Header */}
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-3 flex-1">
                                <button onClick={() => toggleModule(module.id)} className="text-slate-400 hover:text-slate-600">
                                    {expandedModules.includes(module.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                <div className="flex-1 space-y-1">
                                    <input
                                        type="text"
                                        value={module.title}
                                        onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                                        className="bg-transparent font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1 w-full"
                                        placeholder="Module Title"
                                    />
                                    <input
                                        type="text"
                                        value={module.description}
                                        onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                                        className="bg-transparent text-sm text-slate-500 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1 w-full"
                                        placeholder="Add a brief description..."
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => deleteModule(module.id)}
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
                                title="Delete Module"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Chapters List */}
                        {expandedModules.includes(module.id) && (
                            <div className="p-4 bg-white">
                                <div className="space-y-2 mb-4">
                                    {module.chapters.length === 0 && (
                                        <p className="text-center text-sm text-slate-400 py-4 italic">No chapters yet. Add one to get started.</p>
                                    )}
                                    {module.chapters.map((chapter) => (
                                        <div key={chapter.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition group">
                                            <div className="flex items-center gap-3">
                                                <GripVertical size={16} className="text-slate-300 cursor-move" />
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{chapter.title}</span>
                                                <div className="flex gap-1">
                                                    {chapter.content.resources.some(r => r.type === 'pdf') && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium border border-red-100">PDF</span>
                                                    )}
                                                    {chapter.content.resources.some(r => r.type === 'url') && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium border border-blue-100">LINK</span>
                                                    )}
                                                    {chapter.content.editorData?.blocks?.length > 0 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">TEXT</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => {
                                                        setCurrentModuleId(module.id);
                                                        setEditingChapterId(chapter.id);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 transition"
                                                    title="Edit Chapter"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteChapter(module.id, chapter.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 transition"
                                                    title="Delete Chapter"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => openAddChapter(module.id)}
                                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Add Chapter
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ChapterModal
                key={editingChapterId || 'new-chapter'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveChapter}
                initialData={
                    currentModuleId && editingChapterId
                        ? modules.find(m => m.id === currentModuleId)?.chapters.find(c => c.id === editingChapterId)
                        : undefined
                }
            />
        </div>
    );
}
