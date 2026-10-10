import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractTextFromPdfFile } from '../utils/pdfExtractor';
import {
  db,
  doc,
  setDoc,
  collection,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import { ResumeAnalysisResult } from '../types';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface ResumeAnalyzerProps {
  setCurrentTab: (tab: string) => void;
  onJobCompareRequest?: (resumeText: string) => void;
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  setCurrentTab,
  onJobCompareRequest,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [targetRole, setTargetRole] = useState('Software Development Engineer');
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const roles = [
    'Software Development Engineer (SDE)',
    'Frontend Developer (React/Web)',
    'Backend Engineer (Java/Node/Go)',
    'Full Stack Engineer',
    'Data Analyst / Business Analyst',
    'Machine Learning Engineer',
    'DevOps & Cloud Engineer',
    'Quality Assurance / SDET',
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setAnalysisError(null);
      setIsProcessingPdf(true);

      try {
        const extracted = await extractTextFromPdfFile(selected);
        setResumeText(extracted.text);
        showSuccess(`Extracted ${extracted.pageCount} page(s) from "${selected.name}"!`);
      } catch (err: any) {
        const msg = err.message || 'Failed to extract text from file.';
        setAnalysisError(msg);
        showError(msg);
        setFile(null);
      } finally {
        setIsProcessingPdf(false);
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText || resumeText.trim().length < 30) {
      const msg = 'Please upload a PDF or enter resume text with at least 30 characters.';
      setAnalysisError(msg);
      showError(msg);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          targetRole,
          fileName: file?.name || 'Manual_Resume_Input.txt',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to analyze resume.');
      }

      const result: ResumeAnalysisResult = {
        ...json.data,
        fileName: file?.name || 'Resume_Input',
        targetRole,
        createdAt: new Date().toISOString(),
      };

      setAnalysisResult(result);
      showSuccess(`Resume analyzed! ATS score: ${result.atsScore}/100.`);

      // Save to authenticated user's Firestore if logged in
      if (user) {
        try {
          const resumeId = `resume_${Date.now()}`;
          const resumeRef = doc(db, 'users', user.uid, 'resumes', resumeId);
          await setDoc(resumeRef, {
            ...result,
            id: resumeId,
            userId: user.uid,
            fileSize: file?.size || resumeText.length,
          });
          setIsSaved(true);
        } catch (dbErr) {
          console.error('Failed to save resume record to Firestore:', dbErr);
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/resumes`);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during resume analysis.';
      setAnalysisError(msg);
      showError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Real Export Feature: Generates clean, ATS-compliant text file and downloads it
  const handleDownloadRevisedResume = () => {
    if (!analysisResult) return;

    let content = `========================================================================\n`;
    content += `${analysisResult.candidateName.toUpperCase()}\n`;
    content += `Target Role: ${targetRole}\n`;
    const contact = analysisResult.contactInfo;
    content += `${contact.email ? `Email: ${contact.email} | ` : ''}${contact.phone ? `Phone: ${contact.phone} | ` : ''}${contact.linkedin ? `LinkedIn: ${contact.linkedin} | ` : ''}${contact.github ? `GitHub: ${contact.github}` : ''}\n`;
    content += `========================================================================\n\n`;

    content += `1. TECHNICAL SKILLS\n`;
    content += `------------------\n`;
    content += `Languages & CS: ${analysisResult.extractedSkills.technical.join(', ')}\n`;
    content += `Frameworks/Libs: ${analysisResult.extractedSkills.frameworks.join(', ')}\n`;
    content += `Tools/Platforms: ${analysisResult.extractedSkills.tools.join(', ')}\n`;
    content += `Soft Skills: ${analysisResult.extractedSkills.softSkills.join(', ')}\n\n`;

    content += `2. EDUCATION\n`;
    content += `------------\n`;
    analysisResult.education.forEach((edu) => {
      content += `• ${edu.degree} in ${edu.branch} - ${edu.institution} (${edu.year}) ${edu.score ? `[Score: ${edu.score}]` : ''}\n`;
    });
    content += `\n`;

    content += `3. PROJECTS & REVISED BULLET POINTS (STAR FORMAT)\n`;
    content += `------------------------------------------------\n`;
    analysisResult.projects.forEach((proj) => {
      content += `• ${proj.title} [Tech: ${proj.technologies.join(', ')}]\n`;
      content += `  Summary: ${proj.summary}\n`;
      content += `  Critique/Refinement: ${proj.critique}\n`;
    });
    content += `\n`;

    content += `4. REWRITTEN HIGH-IMPACT BULLET POINTS\n`;
    content += `--------------------------------------\n`;
    analysisResult.bulletPointCritique.forEach((critique, idx) => {
      content += `[Revision ${idx + 1}]\n`;
      content += `  Original: "${critique.original}"\n`;
      content += `  Issue: ${critique.issue}\n`;
      content += `  Recommended STAR Version: "${critique.improved}"\n\n`;
    });

    content += `5. KEY STRENGTHS & RECOMMENDED ADDITIONS\n`;
    content += `---------------------------------------\n`;
    content += `Identified Strengths:\n`;
    analysisResult.strengths.forEach((s) => (content += `  + ${s}\n`));
    content += `\nRecommended Skills for ${targetRole}:\n`;
    analysisResult.missingSkills.forEach((m) => (content += `  - ${m}\n`));
    content += `\n`;

    content += `========================================================================\n`;
    content += `Generated via PlacementPilot AI - Prepared for Indian Campus Placements\n`;
    content += `========================================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(analysisResult.candidateName || 'Student').replace(/\s+/g, '_')}_Revised_Placement_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Revised resume downloaded as .txt file!');
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showInfo('STAR bullet point rewrite copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Resume Intelligence
          </span>
          <span className="text-xs text-slate-500 font-medium">ATS Heuristic Audit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          AI Resume & ATS Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Evaluate your resume against Indian tech placement expectations. Get actionable feedback on bullet point strength, missing keywords, and section completeness.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Role Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Target Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Analysis evaluates skills required specifically for this role.
            </p>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Upload Resume (PDF or TXT)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-xl p-4 text-center transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessingPdf || isAnalyzing}
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <UploadCloud className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">
                  {file ? file.name : 'Click to select or drag & drop PDF'}
                </span>
                <span className="text-[10px] text-slate-400">PDF, TXT up to 5MB</span>
              </div>
            </div>
            {isProcessingPdf && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Extracting text from PDF...
              </p>
            )}
          </div>
        </div>

        {/* Text Area (View or manual edit) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Resume Text Content
            </label>
            <span className="text-[11px] text-slate-400">
              {resumeText.length > 0 ? `${resumeText.length} characters loaded` : 'Paste text directly if preferred'}
            </span>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={5}
            placeholder="Paste your resume text here directly, or select a PDF above to extract content automatically..."
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
          />
        </div>

        {/* Error Notice */}
        {analysisError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            {user ? '✓ Results will automatically save to your student profile' : 'Sign in to save analysis history'}
          </div>

          <button
            onClick={handleAnalyzeResume}
            disabled={isAnalyzing || isProcessingPdf || resumeText.trim().length < 30}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Resume Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Score Gauge */}
              <div className="text-center md:border-r md:border-slate-200 pr-0 md:pr-6">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-8 border-blue-500 bg-blue-50 text-slate-900 font-extrabold text-3xl shadow-inner mb-2">
                  {analysisResult.atsScore}
                  <span className="text-xs font-medium text-slate-500">/100</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">Readability & ATS Estimate</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Based on keyword density & section depth
                </p>
              </div>

              {/* Assessment Breakdown */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">
                    Candidate: {analysisResult.candidateName}
                  </h4>
                  {isSaved && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved to History
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Readability</span>
                    <span className="font-bold text-slate-800">
                      {analysisResult.atsAssessment.readability}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Keyword Density</span>
                    <span className="font-bold text-slate-800">
                      {analysisResult.atsAssessment.keywordDensity}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[10px]">Target Match</span>
                    <span className="font-bold text-blue-700">{targetRole.split('(')[0]}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <strong className="text-blue-900">Assessment: </strong>
                  {analysisResult.atsAssessment.verdict}
                </p>

                {/* Real Export Button */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleDownloadRevisedResume}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Revised Resume (.txt)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onJobCompareRequest) {
                        onJobCompareRequest(resumeText);
                      }
                      setCurrentTab('skill-gap');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span>Compare with Job Description</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Skills & Critical Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Evidenced Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Detected Skills & Technologies
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Technical & Core CS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.extractedSkills.technical.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Frameworks & Libraries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.extractedSkills.frameworks.map((f, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Tools & Platforms:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.extractedSkills.tools.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Missing Skills for Target Role */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Skills Missing For {targetRole.split('(')[0]}
              </h3>
              <p className="text-xs text-slate-500">
                Placement interviewers commonly screen for these technologies, but they were not clearly evidenced in your resume:
              </p>

              <div className="flex flex-wrap gap-2">
                {analysisResult.missingSkills.map((m, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>+</span>
                    {m}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-1.5">Observed Resume Strengths:</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  {analysisResult.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bullet Point Critiques & Rewrites (STAR Method) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Action-Oriented Bullet Point Rewrites
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rewritten using the STAR method (Situation, Task, Action, Result) with strong technical verbs, without fabricating credentials.
              </p>
            </div>

            <div className="space-y-4">
              {analysisResult.bulletPointCritique.map((critique, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                      Original Point from Resume:
                    </span>
                    <p className="text-slate-700 font-mono text-xs mt-0.5 bg-white p-2 rounded border border-slate-200">
                      "{critique.original}"
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      ⚠️ Issue: {critique.issue}
                    </p>
                  </div>

                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-emerald-700 uppercase tracking-wide text-[10px]">
                        Suggested High-Impact STAR Version:
                      </span>
                      <button
                        onClick={() => copyToClipboard(critique.improved, idx)}
                        className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-emerald-950 bg-emerald-50/60 p-2.5 rounded border border-emerald-200 font-medium leading-relaxed">
                      "{critique.improved}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Action Plan to Elevate Your Resume
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysisResult.actionableRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
