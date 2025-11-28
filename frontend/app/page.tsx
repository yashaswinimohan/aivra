import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Aivra
        </div>
        <div className="space-x-4">
          <Link href="/courses" className="hover:text-blue-400 transition">Courses</Link>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-8">
          Where Learning Becomes <br />
          <span className="text-blue-400">Real Work Experience</span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Bridge the gap between academic learning and industry experience.
          Learn AI concepts while collaborating on real-world products.
        </p>
        <div className="flex justify-center gap-6">
          <Link href="/signup" className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition transform hover:scale-105">
            Get Started
          </Link>
          <Link href="/courses" className="border border-gray-500 hover:border-white px-8 py-4 rounded-full text-lg font-semibold transition">
            Browse Courses
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/50 transition">
            <div className="text-blue-400 text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold mb-2">Interactive Courses</h3>
            <p className="text-gray-400">Master AI concepts through hands-on modules designed by industry experts.</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition">
            <div className="text-emerald-400 text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">Real Project Labs</h3>
            <p className="text-gray-400">Join cross-functional teams to build and ship real AI products.</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-purple-500/50 transition">
            <div className="text-purple-400 text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-2">Collaborative Learning</h3>
            <p className="text-gray-400">Work with PMs, Developers, and Designers in an Agile environment.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-10 mt-20 border-t border-slate-800 text-center text-gray-500">
        <p>© 2024 Aivra. All rights reserved.</p>
      </footer>
    </div>
  );
}
