import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  db,
  collection,
  getDocs,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import {
  FileText,
  Calendar,
  Mic,
  Code2,
  Target,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab }) => {
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [resumesCount, setResumesCount] = useState(0);
  const [latestResumeAts, setLatestResumeAts] = useState<number | null>(null);
  const [activeRoadmap, setActiveRoadmap] = useState<any | null>(null);
  const [interviewSessions, setInterviewSessions] = useState<any[]>([]);
  const [dsaSolvedCount, setDsaSolvedCount] = useState(0);
  const [jobAnalysesCount, setJobAnalysesCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Resumes
        const resumePath = `users/${user.uid}/resumes`;
        try {
          const resumeSnap = await getDocs(collection(db, 'users', user.uid, 'resumes'));
          setResumesCount(resumeSnap.size);
          if (!resumeSnap.empty) {
            const docs = resumeSnap.docs.map((d) => d.data());
            const latest = docs[docs.length - 1];
            if (latest && typeof latest.atsScore === 'number') {
              setLatestResumeAts(latest.atsScore);
            }
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, resumePath);
        }

        // 2. Roadmaps
        const roadmapPath = `users/${user.uid}/roadmaps`;
        try {
          const roadmapSnap = await getDocs(collection(db, 'users', user.uid, 'roadmaps'));
          if (!roadmapSnap.empty) {
            setActiveRoadmap(roadmapSnap.docs[0].data());
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, roadmapPath);
        }

        // 3. Mock Interviews
        const interviewPath = `users/${user.uid}/mockInterviews`;
        try {
          const interviewSnap = await getDocs(collection(db, 'users', user.uid, 'mockInterviews'));
          const list = interviewSnap.docs.map((d) => d.data());
          setInterviewSessions(list);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, interviewPath);
        }

        // 4. DSA Progress
        const dsaPath = `users/${user.uid}/dsaProgress`;
        try {
          const dsaSnap = await getDocs(collection(db, 'users', user.uid, 'dsaProgress'));
          let solved = 0;
          dsaSnap.forEach((doc) => {
            if (doc.data().status === 'solved') solved++;
          });
          setDsaSolvedCount(solved);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, dsaPath);
        }

        // 5. Job Analyses
        const jobPath = `users/${user.uid}/jobAnalyses`;
        try {
          const jobSnap = await getDocs(collection(db, 'users', user.uid, 'jobAnalyses'));
          setJobAnalysesCount(jobSnap.size);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, jobPath);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Student Sign In Required</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-md mx-auto">
          Please sign in with Google to view your personalized placement dashboard, progress metrics, and stored preparation roadmap.
        </p>
        <button
          onClick={() => setCurrentTab('landing')}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm shadow-xs hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Calculate real roadmap completion if roadmap exists
  let totalTasks = 0;
  let completedTasks = 0;
  let upcomingTasks: any[] = [];

  if (activeRoadmap && Array.isArray(activeRoadmap.days)) {
    activeRoadmap.days.forEach((day: any) => {
      if (Array.isArray(day.tasks)) {
        day.tasks.forEach((task: any) => {
          totalTasks++;
          if (task.completed) {
            completedTasks++;
          } else if (upcomingTasks.length < 4) {
            upcomingTasks.push({
              day: day.day,
              text: task.text,
              category: day.category,
              type: task.type,
            });
          }
        });
      }
    });
  }

  const roadmapPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart data from real interview sessions
  const interviewChartData = interviewSessions.map((session, index) => ({
    name: `Session ${index + 1}`,
    score: session.overallScore || 0,
    role: session.targetRole || 'Interview',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Student Dashboard
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Target: {userProfile?.targetRole || 'Software Development Engineer'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome back, {user.displayName || userProfile?.displayName || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {userProfile?.college ? `${userProfile.college} • ` : ''}
            {userProfile?.branch || 'Computer Science & Engineering'} • Class of{' '}
            {userProfile?.graduationYear || '2026'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCurrentTab('roadmap')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Continue 30-Day Plan</span>
          </button>
          <button
            onClick={() => setCurrentTab('interview')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-slate-500" />
            <span>Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Resumes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Resumes Analyzed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{resumesCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {latestResumeAts !== null ? `Latest ATS: ${latestResumeAts}/100` : 'No resumes uploaded'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Roadmap Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">30-Day Preparation</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{roadmapPercent}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks done` : 'Plan not generated'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Mock Interviews */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Mock Interviews</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{interviewSessions.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {interviewSessions.length > 0 ? 'Sessions evaluated' : '0 sessions taken'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: DSA Solved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">DSA Problems Solved</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{dsaSolvedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified solutions</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Upcoming Tasks & Real Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Tasks or Empty State */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Next Preparation Tasks</h3>
                <p className="text-xs text-slate-500">Pulled directly from your active 30-Day Placement Plan</p>
              </div>
              <button
                onClick={() => setCurrentTab('roadmap')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Full Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        D{t.day}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-snug">{t.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                            {t.category}
                          </span>
                          <span className="text-[11px] text-slate-500">{t.type}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentTab('roadmap')}
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 shrink-0 self-center"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : totalTasks > 0 ? (
              <div className="text-center py-10 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">All Current Roadmap Tasks Completed!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Outstanding work. You can review your topics, practice more DSA problems, or generate a fresh roadmap.
                </p>
                <button
                  onClick={() => setCurrentTab('roadmap')}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Manage Roadmap
                </button>
              </div>
            ) : (
              // Empty State for Roadmap
              <div className="text-center py-12 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No 30-Day Preparation Plan Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Generate an AI-tailored 30-day curriculum balancing DSA, Core CS, Aptitude, and Mock Interviews for your target role.
                </p>
                <button
                  onClick={() => setCurrentTab('roadmap')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
                >
                  Prepare 30-Day Plan
                </button>
              </div>
            )}
          </div>

          {/* Real Mock Interview Performance Chart (Only rendered when real data exists) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mock Interview Scores</h3>
                <p className="text-xs text-slate-500">Real performance tracked across saved AI interview sessions</p>
              </div>
              <button
                onClick={() => setCurrentTab('interview')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>New Mock Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {interviewChartData.length > 0 ? (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                      formatter={(value: any) => [`${value}/100`, 'Score']}
                    />
                    <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              // Empty State for Interviews
              <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Mic className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No Mock Interviews Taken</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Take your first AI Technical or HR mock interview to see real feedback, model answers, and score trends here.
                </p>
                <button
                  onClick={() => setCurrentTab('interview')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
                >
                  Start Mock Interview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Launch Actions & Profile Summary */}
        <div className="space-y-6">
          {/* Quick Module Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Placement Prep Modules</h3>

            <div
              onClick={() => setCurrentTab('resume')}
              className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Resume ATS Analyzer</h4>
                  <p className="text-[11px] text-slate-500">Readability & STAR bullet audit</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div
              onClick={() => setCurrentTab('skill-gap')}
              className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Job Description Skill Gap</h4>
                  <p className="text-[11px] text-slate-500">Benchmark against real JDs</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div
              onClick={() => setCurrentTab('dsa')}
              className="p-3 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">DSA Practice & Review</h4>
                  <p className="text-[11px] text-slate-500">Static algorithmic verification</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div
              onClick={() => setCurrentTab('company-prep')}
              className="p-3 rounded-xl border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Company & Role Guides</h4>
                  <p className="text-[11px] text-slate-500">Campus hiring round blueprints</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Student Profile Quick View */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Current Skill Inventory
              </h4>
              <button
                onClick={() => setCurrentTab('profile')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {userProfile?.currentSkills && userProfile.currentSkills.length > 0 ? (
                userProfile.currentSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No skills added yet.</span>
              )}
            </div>

            <div className="border-t border-slate-200/80 pt-3 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Study Target:</span>
                <span className="font-semibold text-slate-800">
                  {userProfile?.dailyStudyHours || 3} hours/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Degree & Year:</span>
                <span className="font-semibold text-slate-800">
                  {userProfile?.degree || 'B.Tech'} ({userProfile?.graduationYear || '2026'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
