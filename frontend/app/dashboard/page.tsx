"use client";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-slate-500 mb-2">Enrolled Courses</h3>
                    <p className="text-4xl font-bold text-blue-600">0</p>
                </div>

                {/* Stats Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-slate-500 mb-2">Active Projects</h3>
                    <p className="text-4xl font-bold text-emerald-600">0</p>
                </div>

                {/* Stats Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-slate-500 mb-2">Certificates</h3>
                    <p className="text-4xl font-bold text-purple-600">0</p>
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
                    No recent activity found. Start a course to see progress here!
                </div>
            </div>
        </DashboardLayout>
    );
}
