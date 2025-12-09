"use client";

import React from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Sparkles,
  Code,
  Palette,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const steps = [
    {
      icon: BookOpen,
      title: 'Learn',
      description: 'Take career-relevant courses in AI, Product, Design, and Development.',
      color: 'from-teal-400 to-teal-600'
    },
    {
      icon: Users,
      title: 'Build',
      description: 'Join cross-functional teams with PMs, designers, and developers.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Trophy,
      title: 'Showcase',
      description: 'Export your outcomes into a portfolio employers love.',
      color: 'from-[#FF7F50] to-rose-500'
    }
  ];

  const features = [
    { icon: Code, label: 'Development', count: '24 courses' },
    { icon: Palette, label: 'Design', count: '18 courses' },
    { icon: TrendingUp, label: 'Product', count: '15 courses' },
    { icon: Sparkles, label: 'AI', count: '21 courses' },
  ];

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-200/40 to-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/40 to-rose-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-teal-100/50 to-cyan-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-200/50 mb-6">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">The future of learning is here</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                Turn Learning into{' '}
                <span className="bg-gradient-to-r from-teal-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">
                  Real Experience
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                Join cross-functional teams to build real projects while you learn.
                Gain skills that matter and a portfolio that proves it.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href={createPageUrl('Courses')}>
                  <Button size="lg" className="bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white rounded-full px-8 h-14 text-base shadow-lg shadow-teal-500/20">
                    Browse Courses
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href={createPageUrl('Projects')}>
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border-slate-200 hover:bg-slate-50">
                    Join a Project
                  </Button>
                </Link>
              </div>


            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">AI Product Team</h3>
                      <p className="text-sm text-slate-500">4 members • Active project</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {['Sarah - Product Manager', 'Mike - UX Designer', 'Alex - Developer', 'You - AI Engineer'].map((member, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${i === 3 ? 'bg-gradient-to-br from-teal-400 to-purple-500' : 'bg-slate-300'
                          }`}>
                          {member[0]}
                        </div>
                        <span className="text-sm text-slate-600">{member}</span>
                        {i === 3 && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">You</span>}
                      </div>
                    ))}
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-teal-400 to-purple-500 rounded-full" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Project 75% complete</p>
                </div>

                {/* Floating card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Course Completed!</p>
                      <p className="text-xs text-slate-500">AI Fundamentals</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A simple three-step journey from learning to landing your dream role.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="bg-slate-50 rounded-3xl p-8 h-full border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-lg">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-6xl font-bold text-slate-100 absolute top-6 right-8">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Learn What Matters</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Industry-relevant courses designed to get you job-ready.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 group-hover:from-teal-100 group-hover:to-purple-100 transition-colors">
                  <feature.icon className="w-6 h-6 text-slate-600 group-hover:text-teal-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{feature.label}</h3>
                <p className="text-sm text-slate-500">{feature.count}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href={createPageUrl('Courses')}>
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8">
                Explore All Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-purple-500 to-rose-500 p-12 lg:p-20"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2di0ySDI2djJoNHptMC02SDI2di0yaDR2MnptLTYgMHYtMmgtNHYyaDR6bTAtNmgtNHYtMmg0djJ6bS02IDZoLTJ2NGgydi00em0wLTZoLTJ2NGgydi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

            <div className="relative text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to start your journey?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of learners who are building real projects and landing their dream roles.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href={createPageUrl('Courses')}>
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 h-14 text-base shadow-lg">
                    Start Learning Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Aivra</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 Aivra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
