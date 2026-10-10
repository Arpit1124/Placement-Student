import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Target,
  Calendar,
  Mic,
  Code2,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Layers,
  Cpu,
  Database,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentTab }) => {
  const { user, signInWithGoogle } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('resume');
    }
  };

  const features = [
    {
      title: 'AI Resume & ATS Analyzer',
      description:
        'Upload your PDF resume to extract structured skills, identify missing keywords, evaluate bullet points with the STAR method, and get an objective readability assessment.',
      icon: FileText,
      tab: 'resume',
      accent: 'border-blue-200 hover:border-blue-400 bg-blue-50/30',
    },
    {
      title: 'Job Description Skill Gap Mapper',
      description:
        'Paste any campus recruitment notification or JD. Discover matched requirements, crucial missing technologies, and prioritized reasons why interviewers screen for them.',
      icon: Target,
      tab: 'skill-gap',
      accent: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30',
    },
    {
      title: '30-Day Placement Roadmap',
      description:
        'A daily, structured preparation calendar tailored to your target role and study hours. Balances DSA, Core CS (DBMS/OS/CN), Aptitude, Projects, and Revision.',
      icon: Calendar,
      tab: 'roadmap',
      accent: 'border-cyan-200 hover:border-cyan-400 bg-cyan-50/30',
    },
    {
      title: 'Adaptive AI Mock Interviews',
      description:
        'Practice realistic Technical, DSA, and HR behavioral questions. Receive granular scoring on correctness, structure, and communication with interactive follow-up questions.',
      icon: Mic,
      tab: 'interview',
      accent: 'border-violet-200 hover:border-violet-400 bg-violet-50/30',
    },
    {
      title: 'Structured DSA Practice & Static Review',
      description:
        'Curated problem bank covering Arrays, Linked Lists, Trees, Graphs, DP, and Sorting. Submit code for comprehensive algorithmic analysis and edge-case verification.',
      icon: Code2,
      tab: 'dsa',
      accent: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/30',
    },
    {
      title: 'Company & Role Preparation Guides',
      description:
        'Understand recruitment workflows for Indian tech employers (OA round, DSA technical round, project defense, HR). Includes round checklists and actionable strategy.',
      icon: Building2,
      tab: 'company-prep',
      accent: 'border-amber-200 hover:border-amber-400 bg-amber-50/30',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Diagnose & Benchmark',
      description:
        'Upload your resume or paste a target Job Description. The platform extracts your profile and maps skill gaps with real AI analysis.',
    },
    {
      step: '02',
      title: 'Follow the 30-Day Plan',
      description:
        'Work through prioritized daily milestones balancing DSA, Core CS fundamentals (OS/DBMS/CN), Aptitude, and Projects.',
    },
    {
      step: '03',
      title: 'Practice & Review Code',
      description:
        'Solve high-frequency placement problems with static code analysis checking time/space complexity, edge cases, and code style.',
    },
    {
      step: '04',
      title: 'Simulate Mock Interviews',
      description:
        'Experience adaptive technical and HR interview rounds with instant feedback, model answers, and follow-up challenges.',
    },
  ];

  return (
    <div className="space-y-24 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 lg:pb-24 bg-gradient-to-b from-blue-50/70 via-white to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold mb-8 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Powered Placement Preparation for Engineering Students</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Prepare Smarter. <span className="text-blue-600">Interview Better.</span> Get Hired.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            PlacementPilot AI gives college students a structured, truthful roadmap to tackle campus recruitment drives — combining automated resume analysis, skill gap tracking, curated DSA problem sets, and interactive mock interviews.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{user ? 'Go to Dashboard' : 'Start Preparing Now'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setCurrentTab('resume')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              Analyze Resume (Free)
            </button>
          </div>

          {/* Truthful highlights */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Resume Evaluation</p>
              <p className="text-sm font-bold text-slate-900 mt-1">Heuristic ATS Scoring</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Placement Focus</p>
              <p className="text-sm font-bold text-slate-900 mt-1">Tier 1, 2 & 3 Colleges</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Security Architecture</p>
              <p className="text-sm font-bold text-slate-900 mt-1">Private Firestore Isolation</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <p className="text-xs font-medium text-slate-500">AI Engine</p>
              <p className="text-sm font-bold text-slate-900 mt-1">Server-Side Gemini 3.8</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Engineered For Placement Success
          </h2>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
            Everything you need for tech campus drives
          </h3>
          <p className="mt-3 text-slate-600 text-sm">
            Targeting software engineer, web developer, data analyst, and tech roles with specialized preparation tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.tab}
                onClick={() => setCurrentTab(feat.tab)}
                className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col justify-between ${feat.accent} group`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4-Step Workflow Section */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 my-12 shadow-xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">
            Structured Preparation Methodology
          </span>
          <h3 className="text-3xl sm:text-4xl font-bold mt-2">
            From Day 1 to the Offer Letter
          </h3>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Campus placement prep often fails due to aimless problem solving. PlacementPilot AI enforces a sequential, balanced syllabus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {workflowSteps.map((step) => (
            <div key={step.step} className="relative bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
              <span className="text-3xl font-black text-blue-400/40 block mb-3">{step.step}</span>
              <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
              <p className="text-slate-300 text-xs leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Architecture & Privacy Standards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 bg-white rounded-3xl p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">
                Built with Zero Compromise
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                Production-Minded System Architecture
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed">
                Engineered by Arpit Sharma using modern cloud and AI best practices. Built to adhere strictly to enterprise security and educational ethics.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Secure Server-Side AI</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    All Gemini API interactions are encapsulated behind authenticated Express backend endpoints. No API keys or LLM tokens are exposed in browser bundles.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Zero-Trust Firestore Rules</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Student profiles, resumes, and interview responses are strictly isolated under <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/users/&#123;uid&#125;</code>, preventing unauthorized cross-user data access.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 text-purple-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Ethical Heuristic Standards</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Resume ATS scores and mock interview assessments are explicitly declared as instructional benchmarks. We never invent qualifications or claim internal recruiter secrets.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Safe Static Code Evaluation</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Student code submissions are rigorously evaluated via static semantic analysis, complexity verification, and boundary-case testing without executing untrusted binaries on the main host.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 shadow-lg">
          <h3 className="text-2xl sm:text-3xl font-extrabold">Ready to begin your placement preparation?</h3>
          <p className="mt-3 text-blue-100 text-sm max-w-xl mx-auto">
            Sign in with Google to save your resume critiques, custom 30-day prep calendars, and mock interview transcripts.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {user ? (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In with Google
              </button>
            )}
            <button
              onClick={() => setCurrentTab('roadmap')}
              className="px-6 py-3 bg-blue-800/80 hover:bg-blue-900 text-white border border-blue-400/40 font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Explore 30-Day Syllabus
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
