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
import { CompanyPrepData } from '../types';
import {
  Building2,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react';

export const CompanyPrepView: React.FC<{ setCurrentTab: (tab: string) => void }> = () => {
  const { user, userProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [companyName, setCompanyName] = useState('Tata Consultancy Services (TCS)');
  const [roleName, setRoleName] = useState(userProfile?.targetRole || 'Software Development Engineer');
  const [verifiedJD, setVerifiedJD] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prepData, setPrepData] = useState<CompanyPrepData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topCompanies = [
    'Tata Consultancy Services (TCS)',
    'Infosys',
    'Amazon India',
    'Wipro',
    'Accenture',
    'Microsoft India',
    'Cognizant',
    'Flipkart',
  ];

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      setError('Please specify a company name.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/company-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          targetRole: roleName,
          verifiedJobDescription: verifiedJD,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate company guide.');
      }

      const generated: CompanyPrepData = {
        ...json.data,
        createdAt: new Date().toISOString(),
      };

      setPrepData(generated);
      showSuccess(`Campus preparation guide for ${companyName} generated!`);

      if (user) {
        try {
          const prepId = `prep_${Date.now()}`;
          const ref = doc(db, 'users', user.uid, 'companyPrep', prepId);
          await setDoc(ref, {
            ...generated,
            id: prepId,
            userId: user.uid,
          });
        } catch (dbErr) {
          console.error('Failed to save company prep to Firestore:', dbErr);
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/companyPrep`);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred while generating guide.';
      setError(msg);
      showError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleChecklist = (id: string) => {
    if (!prepData) return;
    let nextStatus = false;
    let itemTitle = '';
    const updated = prepData.checklist.map((item) => {
      if (item.id === id) {
        nextStatus = !item.completed;
        itemTitle = item.item;
        return { ...item, completed: nextStatus };
      }
      return item;
    });
    setPrepData({ ...prepData, checklist: updated });

    if (nextStatus) {
      showSuccess(`Checklist item marked complete: "${itemTitle.slice(0, 35)}..."`);
    } else {
      showInfo('Checklist item marked incomplete');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Employer Blueprints
          </span>
          <span className="text-xs text-slate-500 font-medium">Campus Recruitment Workflows</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Company & Role Preparation Guides
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Actionable preparation roadmaps structured around common Indian campus placement rounds (Online Assessments, Technical Deep-Dives, HR/Managerial).
        </p>
      </div>

      {/* Input Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Popular Company Selector */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Select High-Frequency Campus Recruiter:
          </span>
          <div className="flex flex-wrap gap-2">
            {topCompanies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompanyName(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  companyName === c
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Company Name (or enter custom)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Atlassian, Oracle, Zomato..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Role Title
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. SDE-1, Associate Software Engineer..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Optional Verified Job Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Verified Job Description (Optional)
          </label>
          <textarea
            value={verifiedJD}
            onChange={(e) => setVerifiedJD(e.target.value)}
            rows={4}
            placeholder="Paste your college placement cell's exact company notification to customize the guide specifically to your campus drive..."
            className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Synthesized based on standard campus recruitment rounds & public patterns.
          </p>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !companyName.trim()}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Hiring Guide...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Generate Company Guide</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guide Results Display */}
      {prepData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Transparency Disclaimer Notice Banner */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-amber-900 font-bold">
                Transparency & Non-Guaranteed Recruitment Notice:
              </strong>
              <p className="leading-relaxed">{prepData.transparencyNotice}</p>
            </div>
          </div>

          {/* Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {prepData.companyName} — {prepData.roleName}
              </h2>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {prepData.companyCategory}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{prepData.overview}</p>
          </div>

          {/* Round-by-Round Breakdown */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Typical Campus Recruitment Rounds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prepData.rounds.map((round) => (
                <div
                  key={round.roundNumber}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Round {round.roundNumber}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{round.roundName}</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {round.duration}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">Format: {round.format}</p>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Key Topics Tested:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {round.topicsTested.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 leading-relaxed">
                    <strong>Strategy Advice: </strong>
                    {round.strategyTip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Preparation Action Checklist</h3>
            <div className="space-y-2">
              {prepData.checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer select-none ${
                    item.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-400 line-through'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-medium flex-1">{item.item}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.priority === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Common Pitfalls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Common Campus Pitfalls to Avoid</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {prepData.commonPitfalls.map((pitfall, i) => (
                <li key={i} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
                  <span className="text-rose-500 font-bold shrink-0">⚠️</span>
                  <span>{pitfall}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
