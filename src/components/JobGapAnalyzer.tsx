import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  db,
  doc,
  setDoc,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import { JobGapAnalysisResult } from '../types';
import {
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface JobGapAnalyzerProps {
  initialResumeText?: string;
  setCurrentTab: (tab: string) => void;
}

export const JobGapAnalyzer: React.FC<JobGapAnalyzerProps> = ({
  initialResumeText = '',
  setCurrentTab,
}) => {
  const { user, userProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [company, setCompany] = useState('');
  const [targetRole, setTargetRole] = useState('Software Development Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobGapAnalysisResult | null>(null);

  const sampleJDs = [
    {
      title: 'Amazon SDE-1 (Campus Placement)',
      role: 'Software Development Engineer',
      company: 'Amazon',
      text: `Qualifications:
- Bachelor's degree in Computer Science or related technical discipline.
- Strong knowledge of CS fundamentals, Data Structures & Algorithms, Problem Solving.
- Proficiency in at least one modern language such as Java, C++, Python, or C#.
- Understanding of Object-Oriented Design (OOP), Multi-threading, and Concurrency.
- Familiarity with Relational Databases (SQL), NoSQL, and RESTful APIs.
- Good communication and collaboration skills.`,
    },
    {
      title: 'TCS Digital / Ninja (Prime / Digital Stream)',
      role: 'System Engineer / Digital Cadre',
      company: 'Tata Consultancy Services',
      text: `Role Requirements:
- B.E / B.Tech / M.Tech in CS/IT/ECE or related branches.
- Solid understanding of Data Structures, Algorithms, Sorting, Searching, and Complexity.
- Practical knowledge of Core Computer Science: DBMS (SQL & normalization), Operating Systems, and Computer Networks.
- Programming proficiency in Python, Java, or C++.
- Hands-on experience with modern Web frameworks or Cloud technologies is advantageous.
- Good aptitude and verbal reasoning ability.`,
    },
  ];

  const handleAnalyze = async () => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      const msg = 'Please provide a job description containing at least 20 characters.';
      setError(msg);
      showError(msg);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/job-gap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          resumeText,
          studentSkills: userProfile?.currentSkills || [],
          targetRole,
          company,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to analyze job gap.');
      }

      const analyzed: JobGapAnalysisResult = {
        ...json.data,
        targetRole,
        company,
        jobDescription,
        createdAt: new Date().toISOString(),
      };

      setResult(analyzed);
      showSuccess(`Skill gap audit completed! Match Score: ${analyzed.matchPercentage}%.`);

      // Save to Firestore
      if (user) {
        try {
          const analysisId = `job_gap_${Date.now()}`;
          const analysisRef = doc(db, 'users', user.uid, 'jobAnalyses', analysisId);
          await setDoc(analysisRef, {
            ...analyzed,
            id: analysisId,
            userId: user.uid,
          });
        } catch (dbErr) {
          console.error('Failed to save job gap analysis to Firestore:', dbErr);
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/jobAnalyses`);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during skill gap analysis.';
      setError(msg);
      showError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Recruiter Alignment
          </span>
          <span className="text-xs text-slate-500 font-medium">JD vs Resume Gap Audit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Job Description & Skill Gap Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Paste any placement drive job notification or target job description to discover what skills you match, what critical technologies are missing, and why recruiters prioritize them.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Amazon, TCS, Infosys, Microsoft, Startup..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Role Title
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Software Development Engineer (SDE-1)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Quick Load Sample Campus Job Descriptions:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleJDs.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCompany(sample.company);
                  setTargetRole(sample.role);
                  setJobDescription(sample.text);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Job Description Textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Job Description (JD) Text
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the campus placement drive notice, role requirements, or company Job Description here..."
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>

        {/* Resume Text Context */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Resume Content / Stored Profile
            </label>
            <span className="text-[11px] text-slate-400">
              {resumeText.length > 0
                ? `${resumeText.length} characters linked`
                : 'Leave blank to use profile skills'}
            </span>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={4}
            placeholder="Paste your current resume content here to benchmark exact qualifications against this JD..."
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            {user ? '✓ Gap analysis will be saved to your dashboard' : 'Sign in to record your skill progress'}
          </p>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || jobDescription.trim().length < 20}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Benchmarking Skill Gap...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Run Skill Gap Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {result && (
        <div className="space-y-8 animate-fadeIn">
          {/* Match Score & Verdict */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:border-r md:border-slate-200 pr-0 md:pr-6">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-8 border-indigo-500 bg-indigo-50 text-slate-900 font-extrabold text-3xl shadow-inner mb-2">
                  {result.matchPercentage}%
                </div>
                <h3 className="text-sm font-bold text-slate-800">Role Match Score</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct alignment with JD requirements
                </p>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-900 text-sm">
                    {result.companyContext || company || 'Target Company'} •{' '}
                    {result.detectedRoleTitle || targetRole}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <strong className="text-indigo-900">Screening Verdict: </strong>
                  {result.screeningVerdict}
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.matchedSkills.length} Matched Skills
                  </span>
                  <span className="text-rose-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {result.missingSkills.length} Missing Requirements
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Matched Skills (Evidenced)
              </h3>
              <p className="text-xs text-slate-500">
                You possess these competencies required by the job specification:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.matchedSkills.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Identified Missing Competencies
              </h3>
              <p className="text-xs text-slate-500">
                These core or preferred technologies appear in the JD but not on your resume:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.missingSkills.map((m, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold"
                  >
                    ✗ {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Explanation: WHY Each Missing Skill Matters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Why Missing Skills Matter & Fast-Track Learning Advice
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Understand the interviewer's perspective and how to bridge these gaps in 1 to 2 weeks of dedicated study.
              </p>
            </div>

            <div className="space-y-3">
              {result.skillGapsWithReason.map((gap, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{gap.skill}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        gap.importance.includes('Crucial')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {gap.importance} Priority
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Recruiter Rationale: </strong>
                    {gap.whyItMatters}
                  </p>

                  <p className="text-indigo-900 bg-indigo-50/60 p-2 rounded border border-indigo-100 leading-relaxed">
                    <strong className="text-indigo-950">Learning Roadmap: </strong>
                    {gap.learningRecommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Prioritized 3-Step Action Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Fast-Track Preparation Timeline for this Job
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.priorityRoadmap.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 bg-indigo-50/20 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700">Priority #{p.priority}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{p.timeframe}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{p.topic}</h4>
                  <p className="text-slate-600 leading-relaxed">{p.action}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setCurrentTab('roadmap')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Incorporate Into 30-Day Calendar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
