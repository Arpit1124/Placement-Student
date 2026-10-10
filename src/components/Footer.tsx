import React from 'react';
import { GraduationCap, Shield, Code2, Heart } from 'lucide-react';

export const Footer: React.FC<{ setCurrentTab: (tab: string) => void }> = ({ setCurrentTab }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">
                PlacementPilot<span className="text-blue-400">.AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Prepare Smarter. Interview Better. Get Hired. A comprehensive, student-first platform designed to bridge the gap between college curricula and competitive engineering recruitment in India.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <span>Project Architect & Lead Developer:</span>
              <span className="text-white font-semibold underline decoration-blue-500 underline-offset-4">
                Arpit Sharma
              </span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Preparation Modules</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => setCurrentTab('resume')}
                  className="hover:text-blue-400 transition-colors"
                >
                  AI Resume & ATS Analyzer
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('skill-gap')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Job Description Gap Analysis
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('roadmap')}
                  className="hover:text-blue-400 transition-colors"
                >
                  30-Day Preparation Roadmap
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('interview')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Adaptive AI Mock Interview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('dsa')}
                  className="hover:text-blue-400 transition-colors"
                >
                  DSA Problem Bank & Code Review
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('company-prep')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Company & Role Guides
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Ethics */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Architecture & Ethics</h4>
            <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Privacy:</strong> Student resumes and progress are isolated under authenticated Firestore security rules.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Code2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Server-Side AI:</strong> Powered by Google Gemini API via secure server endpoints with no client secrets exposed.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Transparency Statement */}
        <div className="border-t border-slate-800 pt-8 pb-4 text-xs text-slate-400 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-slate-300">Transparency Notice:</strong> PlacementPilot AI provides heuristic algorithmic assessments and instructional feedback for study purposes. It does not claim to represent proprietary internal algorithms of specific corporate recruitment software or guarantee selection in any company placement drive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 text-[11px]">
            <p>© {new Date().getFullYear()} PlacementPilot AI. Engineered by Arpit Sharma.</p>
            <p className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for aspiring software engineers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
