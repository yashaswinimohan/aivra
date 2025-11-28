"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfessorLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const promoteUser = async (user: any) => {
        try {
            const token = await user.getIdToken();
            // First ensure profile exists (in case it's a new user via this route)
            await fetch("http://localhost:5000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ uid: user.uid, email: user.email }),
            });

            // Then promote
            await fetch("http://localhost:5000/api/users/promote", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        } catch (err) {
            console.error("Promotion failed", err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await promoteUser(userCredential.user);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            await promoteUser(userCredential.user);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 border-l-4 border-l-yellow-500">
                <h2 className="text-3xl font-bold mb-2 text-center text-yellow-500">Professor Login</h2>
                <p className="text-center text-gray-400 mb-6 text-sm">Test Route: Grants Professor Role</p>

                {error && <p className="text-red-500 mb-4 text-center bg-red-500/10 p-2 rounded">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-lg font-semibold transition transform hover:scale-[1.02]">
                        Login as Professor
                    </button>
                </form>
                <div className="mt-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-slate-900 p-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Sign in with Google
                    </button>
                </div>
                <p className="mt-6 text-center text-gray-400">
                    <Link href="/login" className="text-blue-400 hover:text-blue-300">Back to Student Login</Link>
                </p>
            </div>
        </div>
    );
}
