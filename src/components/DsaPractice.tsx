import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  db,
  doc,
  setDoc,
  getDocs,
  collection,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import { DSA_PROBLEMS, DSA_TOPICS } from '../data/dsaCurriculum';
import { CodeReviewResult, DsaProblem } from '../types';
import {
  Code2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  BookOpen,
  Filter,
  Check,
  Award,
} from 'lucide-react';

export const DsaPractice: React.FC<{ setCurrentTab: (tab: string) => void }> = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [activeProblem, setActiveProblem] = useState<DsaProblem>(DSA_PROBLEMS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<'cpp' | 'java' | 'python' | 'javascript'>('cpp');
  const [code, setCode] = useState<string>(DSA_PROBLEMS[0].starterCode.cpp);
  const [approach, setApproach] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Solved state map loaded from Firestore
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [personalNotes, setPersonalNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadProgress = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'dsaProgress'));
        const map: Record<string, string> = {};
        snap.forEach((doc) => {
          map[doc.id] = doc.data().status;
        });
        setStatusMap(map);
      } catch (err) {
        console.error('Failed to load DSA progress:', err);
      }
    };
    loadProgress();
  }, [user]);

  const handleSelectProblem = (problem: DsaProblem) => {
    setActiveProblem(problem);
    setCode(problem.starterCode[selectedLanguage]);
    setApproach('');
    setReviewResult(null);
    setRevealedHints([]);
    setError(null);
  };

  const handleLanguageChange = (lang: 'cpp' | 'java' | 'python' | 'javascript') => {
    setSelectedLanguage(lang);
    setCode(activeProblem.starterCode[lang]);
  };

  const handleReviewCode = async () => {
    if (!code.trim()) {
      const msg = 'Please write some code before requesting review.';
      setError(msg);
      showError(msg);
      return;
    }

    setIsReviewing(true);
    setError(null);

    try {
      const res = await fetch('/api/dsa/review-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: activeProblem.title,
          problemDescription: activeProblem.description,
          userCode: code,
          language: selectedLanguage,
          userApproach: approach,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to review code.');
      }

      setReviewResult(json.data);
      showSuccess(`Code reviewed: ${json.data.verdict} (Time: ${json.data.timeComplexity})`);

      // Auto-update status if verdict is accepted
      if (json.data.verdict.toLowerCase().includes('accept') && user) {
        await handleUpdateStatus('solved');
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during code analysis.';
      setError(msg);
      showError(msg);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleUpdateStatus = async (status: 'solved' | 'attempted' | 'todo') => {
    setStatusMap((prev) => ({ ...prev, [activeProblem.id]: status }));
    showSuccess(`Marked "${activeProblem.title}" as ${status.toUpperCase()}!`);
    if (!user) return;

    try {
      const ref = doc(db, 'users', user.uid, 'dsaProgress', activeProblem.id);
      await setDoc(ref, {
        id: activeProblem.id,
        userId: user.uid,
        problemId: activeProblem.id,
        status,
        userNotes: personalNotes,
        updatedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error('Failed to update problem status:', dbErr);
      handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/dsaProgress`);
    }
  };

  // Filter problems
  const filteredProblems = DSA_PROBLEMS.filter((p) => {
    const matchesTopic = selectedTopic === 'All Topics' || p.topic === selectedTopic;
    const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    return matchesTopic && matchesDiff;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            DSA Problem Solving
          </span>
          <span className="text-xs text-slate-500 font-medium">Static Code Analysis & Complexity Audit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Coding & Data Structures Practice
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Curated campus placement questions across core topics. Write and review code through intelligent static analysis for time/space complexity, edge cases, and algorithmic correctness.
        </p>
      </div>

      {/* Main Layout: Problem List Sidebar + Problem Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Topic Filter & Problem List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Filter by Topic:
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                {DSA_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Difficulty:
              </label>
              <div className="flex gap-1.5">
                {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                      selectedDifficulty === diff
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Problems List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs max-h-[600px] overflow-y-auto space-y-1">
            {filteredProblems.map((p) => {
              const status = statusMap[p.id];
              const isSelected = activeProblem.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProblem(p)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                      : 'hover:bg-slate-50 border border-transparent text-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs truncate font-medium">{p.title}</span>
                      {status === 'solved' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {p.topic} • {p.difficulty}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      p.difficulty === 'Easy'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.difficulty === 'Medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Problem Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Problem Header & Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {activeProblem.topic}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeProblem.title}</h2>
              </div>

              {/* Status Picker */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus('solved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    statusMap[activeProblem.id] === 'solved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Solved</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('attempted')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusMap[activeProblem.id] === 'attempted'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Attempted
                </button>
              </div>
            </div>

            {/* Popular Companies */}
            {activeProblem.popularCompanies && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-medium">Frequently Asked In:</span>
                {activeProblem.popularCompanies.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Statement */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {activeProblem.description}
            </p>

            {/* Examples */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Example Cases:
              </h4>
              {activeProblem.examples.map((ex, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 space-y-1">
                  <div>
                    <span className="text-slate-500 font-semibold">Input: </span>
                    {ex.input}
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Output: </span>
                    {ex.output}
                  </div>
                  {ex.explanation && (
                    <div className="text-[11px] text-slate-500 font-sans italic">
                      Explanation: {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-700">Constraints: </span>
              {activeProblem.constraints.join(' • ')}
            </div>

            {/* Hints Toggle */}
            {activeProblem.hints && activeProblem.hints.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-600">Interview Hints:</span>
                <div className="space-y-1.5">
                  {activeProblem.hints.map((hint, i) => (
                    <div key={i} className="text-xs">
                      {revealedHints.includes(i) ? (
                        <p className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                          💡 Hint {i + 1}: {hint}
                        </p>
                      ) : (
                        <button
                          onClick={() => setRevealedHints((prev) => [...prev, i])}
                          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Reveal Hint {i + 1}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Workspace */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Implementation
                </span>
              </div>

              {/* Language Selector */}
              <div className="flex gap-1">
                {(['cpp', 'java', 'python', 'javascript'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                      selectedLanguage === lang
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor Area */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed shadow-inner"
            />

            {/* Approach Explanation */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Interview Approach Explanation (Optional):
              </label>
              <input
                type="text"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                placeholder="e.g. Using two pointers starting from left & right; O(N) time and O(1) auxiliary space..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Safe static semantic evaluation • No arbitrary remote execution
              </span>

              <button
                onClick={handleReviewCode}
                disabled={isReviewing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isReviewing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Code & Complexity...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Review Code with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Code Review Feedback */}
          {reviewResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      reviewResult.verdict.toLowerCase().includes('accept')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Verdict: {reviewResult.verdict}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-semibold">
                  <span className="text-blue-700">Time: {reviewResult.timeComplexity}</span>
                  <span className="text-indigo-700">Space: {reviewResult.spaceComplexity}</span>
                </div>
              </div>

              {/* Analysis Text */}
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1">Correctness Assessment:</strong>
                {reviewResult.correctnessAnalysis}
              </div>

              {/* Edge Cases Tested */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Edge Case Verification:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {reviewResult.edgeCasesChecked.map((ec, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                        ec.passed
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                          : 'bg-rose-50/50 border-rose-100 text-rose-900'
                      }`}
                    >
                      {ec.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold">{ec.case}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">{ec.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refactored Clean Solution */}
              {reviewResult.refactoredCleanCode && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Optimized Clean Reference Code:
                  </span>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                    {reviewResult.refactoredCleanCode}
                  </pre>
                </div>
              )}

              {/* Interview Defense Advice */}
              {reviewResult.interviewAdvice && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <strong className="block mb-0.5">How to explain this in an interview:</strong>
                  {reviewResult.interviewAdvice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
