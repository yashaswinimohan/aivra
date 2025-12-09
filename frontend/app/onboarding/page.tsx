"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        ageRange: "",
        occupation: "",
        role: "", // 'student' | 'professor'
    });

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    displayName: `${formData.firstName} ${formData.lastName}`.trim(),
                    role: formData.role.toLowerCase(),
                    bio: `${formData.occupation}, ${formData.ageRange}`,
                    // Backend handles isOnboardingComplete: true
                })
            });

            if (response.ok) {
                router.push("/dashboard");
            } else {
                console.error("Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: "Identity" },
        { id: 2, title: "Demographics" },
        { id: 3, title: "Role" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 pt-24">
            <div className="w-full max-w-2xl">
                {/* Stepper */}
                <div className="mb-8">
                    <div className="relative">
                        {/* Background Line */}
                        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200" />

                        {/* Progress Line */}
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

                <Card className="border-0 shadow-xl shadow-slate-200/50">
                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900">Let's get to know you</h2>
                                        <p className="text-slate-500">Please provide your name to get started.</p>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="Jane"
                                                value={formData.firstName}
                                                onChange={(e) => updateFormData("firstName", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={(e) => updateFormData("lastName", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleNext}
                                            disabled={!formData.firstName || !formData.lastName}
                                            className="bg-slate-900 text-white"
                                        >
                                            Next Step
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900">Tell us about yourself</h2>
                                        <p className="text-slate-500">This helps us personalize your experience.</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="ageRange">Age Range</Label>
                                            <select
                                                id="ageRange"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={formData.ageRange}
                                                onChange={(e) => updateFormData("ageRange", e.target.value)}
                                            >
                                                <option value="">Select age range</option>
                                                <option value="18-24">18-24</option>
                                                <option value="25-34">25-34</option>
                                                <option value="35-44">35-44</option>
                                                <option value="45-54">45-54</option>
                                                <option value="55+">55+</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="occupation">Occupation</Label>
                                            <select
                                                id="occupation"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={formData.occupation}
                                                onChange={(e) => updateFormData("occupation", e.target.value)}
                                            >
                                                <option value="">Select occupation</option>
                                                <option value="Student">Student</option>
                                                <option value="Professional">Professional</option>
                                                <option value="Educator">Educator</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-4">
                                        <Button variant="outline" onClick={handleBack}>
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!formData.ageRange || !formData.occupation}
                                            className="bg-slate-900 text-white"
                                        >
                                            Next Step
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900">Choose your path</h2>
                                        <p className="text-slate-500">Select how you want to use Aivra.</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div
                                            className={`cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-teal-500 ${formData.role === 'Student' ? 'border-teal-500 bg-teal-50/50' : 'border-slate-100'
                                                }`}
                                            onClick={() => updateFormData("role", "Student")}
                                        >
                                            <div className="mb-4 w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">S</div>
                                            <h3 className="font-bold text-slate-900 mb-2">Student</h3>
                                            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                                                <li>Pick courses and projects building real-world projects</li>
                                                <li>Collaborate with others, assume roles and own what you build</li>
                                                <li>Get certified and showcase your projects</li>
                                                <li>Upskill yourself, Strengten your professional network</li>
                                            </ul>
                                        </div>

                                        <div
                                            className={`cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-purple-500 ${formData.role === 'Professor' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-100'
                                                }`}
                                            onClick={() => updateFormData("role", "Professor")}
                                        >
                                            <div className="mb-4 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">P</div>
                                            <h3 className="font-bold text-slate-900 mb-2">Professor</h3>
                                            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                                                <li>Find your cohort and Teach them on a flexible, DIY ciruculum platform</li>
                                                <li>Find students to work on your project</li>
                                                <li>Guide and provide knowledge to students, helping them upskill while they build</li>
                                                <li>Award certificates to students to reinforce their learning</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button variant="outline" onClick={handleBack}>
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!formData.role || loading}
                                            className="bg-slate-900 text-white"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Complete Setup
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
