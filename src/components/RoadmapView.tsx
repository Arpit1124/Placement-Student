import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  db,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  collection,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import { RoadmapData, RoadmapDay, RoadmapTask } from '../types';
import { SDE_30_DAY_ROADMAP } from '../data/roadmapTemplates';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  RefreshCw,
  Clock,
  BookOpen,
  Code2,
  FileCheck,
  Award,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface RoadmapViewProps {
  setCurrentTab: (tab: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ setCurrentTab }) => {
  const { user, userProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [targetRole, setTargetRole] = useState(
    userProfile?.targetRole || 'Software Development Engineer'
  );
  const [dailyHours, setDailyHours] = useState(userProfile?.dailyStudyHours || 3);
  const [activeWeek, setActiveWeek] = useState<number | 'all'>('all');
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing roadmap from Firestore on mount
  useEffect(() => {
    if (!user) return;

    const loadRoadmap = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'roadmaps'));
        if (!snap.empty) {
          const loaded = snap.docs[0].data() as RoadmapData;
          setRoadmap({ ...loaded, id: snap.docs[0].id });
          setTargetRole(loaded.targetRole);
          setDailyHours(loaded.dailyHours);
        }
      } catch (err) {
        console.error('Failed to load roadmap:', err);
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/roadmaps`);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, [user]);

  const handleLoadMasterRoadmap = async (roleOverride?: string) => {
    const role = roleOverride || targetRole || 'Software Development Engineer (SDE-1)';
    const masterData: RoadmapData = {
      ...SDE_30_DAY_ROADMAP,
      targetRole: role,
      dailyHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoadmap(masterData);
    setTargetRole(role);
    showSuccess(`Master 30-Day Placement Plan for ${role} prepared and ready!`);

    if (user) {
      try {
        const roadmapId = roadmap?.id || `roadmap_${Date.now()}`;
        const roadmapRef = doc(db, 'users', user.uid, 'roadmaps', roadmapId);
        await setDoc(roadmapRef, {
          ...masterData,
          id: roadmapId,
          userId: user.uid,
        });
        setRoadmap((prev) => (prev ? { ...prev, id: roadmapId } : masterData));
      } catch (dbErr) {
        console.error('Error saving master roadmap to Firestore:', dbErr);
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/roadmaps`);
      }
    }
  };

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          dailyHours,
          currentSkills: userProfile?.currentSkills || ['C++', 'Data Structures', 'SQL'],
          missingSkills: [],
          collegeSemester: `${userProfile?.degree || 'B.Tech'} - Final / Pre-final Year`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate roadmap.');
      }

      const generated: RoadmapData = {
        ...json.data,
        targetRole,
        dailyHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRoadmap(generated);
      showSuccess(`New 30-Day Placement Roadmap created for ${targetRole}!`);

      // Persist to Firestore
      if (user) {
        try {
          const roadmapId = roadmap?.id || `roadmap_${Date.now()}`;
          const roadmapRef = doc(db, 'users', user.uid, 'roadmaps', roadmapId);
          await setDoc(roadmapRef, {
            ...generated,
            id: roadmapId,
            userId: user.uid,
          });
          setRoadmap((prev) => (prev ? { ...prev, id: roadmapId } : generated));
        } catch (dbErr) {
          console.error('Error saving roadmap to Firestore:', dbErr);
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/roadmaps`);
        }
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during roadmap generation.';
      setError(msg);
      showError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (dayNumber: number, taskId: string) => {
    if (!roadmap) return;

    let total = 0;
    let completed = 0;
    let toggledState = false;
    let toggledText = '';

    const updatedDays = roadmap.days.map((day) => {
      if (day.day === dayNumber) {
        const updatedTasks = day.tasks.map((task) => {
          if (task.id === taskId) {
            const nextCompleted = !task.completed;
            toggledState = nextCompleted;
            toggledText = task.text;
            return { ...task, completed: nextCompleted };
          }
          return task;
        });
        return { ...day, tasks: updatedTasks };
      }
      return day;
    });

    updatedDays.forEach((d) => {
      d.tasks.forEach((t) => {
        total++;
        if (t.completed) completed++;
      });
    });

    const updatedRoadmap: RoadmapData = {
      ...roadmap,
      days: updatedDays,
      completedTasksCount: completed,
      totalTasksCount: total,
      updatedAt: new Date().toISOString(),
    };

    setRoadmap(updatedRoadmap);

    if (toggledState) {
      showSuccess(`Completed Day ${dayNumber}: "${toggledText.slice(0, 40)}${toggledText.length > 40 ? '...' : ''}"`);
    } else {
      showInfo(`Marked Day ${dayNumber} task as pending`);
    }

    // Save to Firestore if user is authenticated and roadmap has an ID
    if (user && roadmap.id) {
      try {
        const roadmapRef = doc(db, 'users', user.uid, 'roadmaps', roadmap.id);
        await updateDoc(roadmapRef, {
          days: updatedDays,
          completedTasksCount: completed,
          totalTasksCount: total,
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Failed to update task status in Firestore:', dbErr);
        handleFirestoreError(dbErr, OperationType.UPDATE, `users/${user.uid}/roadmaps/${roadmap.id}`);
      }
    }
  };

  // Progress calculations
  let totalTasksCount = 0;
  let completedTasksCount = 0;

  if (roadmap && Array.isArray(roadmap.days)) {
    roadmap.days.forEach((day) => {
      day.tasks.forEach((task) => {
        totalTasksCount++;
        if (task.completed) completedTasksCount++;
      });
    });
  }

  const completionPercentage =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filter days by week
  const filteredDays = roadmap
    ? roadmap.days.filter((day) => (activeWeek === 'all' ? true : day.week === activeWeek))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            Structured Preparation
          </span>
          <span className="text-xs text-slate-500 font-medium">30-Day Campus Syllabus</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Personalized 30-Day Learning Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          An intensive, day-by-day plan covering DSA, Core Computer Science (DBMS, OS, CN), Aptitude, and HR mock interviews tailored to your daily study capacity.
        </p>
      </div>

      {/* Configuration / Generation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Development Engineer, Frontend Developer, Data Analyst..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Daily Study Capacity
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
            >
              <option value={2}>2 Hours / Day (Focused)</option>
              <option value={3}>3 Hours / Day (Recommended)</option>
              <option value={4}>4 Hours / Day (Intensive)</option>
              <option value={6}>6 Hours / Day (Sprint)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            {roadmap ? 'You can reload standard curriculum or generate a new custom AI plan' : 'Prepare an instant 30-day curriculum or generate with AI'}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleLoadMasterRoadmap()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Prepare 30-Day Plan</span>
            </button>

            <button
              onClick={handleGenerateRoadmap}
              disabled={generating}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-200"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Synthesizing AI Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Generate AI Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Roadmap View */}
      {roadmap ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Progress Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-auto">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Overall Progress
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">{completionPercentage}%</span>
                <span className="text-xs text-slate-500">
                  ({completedTasksCount} of {totalTasksCount} tasks checked)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 text-right font-medium">
                {totalTasksCount - completedTasksCount} tasks remaining
              </p>
            </div>
          </div>

          {/* Week Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveWeek('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeWeek === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All 30 Days
            </button>
            {[1, 2, 3, 4].map((wk) => (
              <button
                key={wk}
                onClick={() => setActiveWeek(wk)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeWeek === wk
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Week {wk}
              </button>
            ))}
          </div>

          {/* Days Grid / List */}
          <div className="space-y-4">
            {filteredDays.map((day) => {
              const dayTasksTotal = day.tasks.length;
              const dayTasksDone = day.tasks.filter((t) => t.completed).length;
              const isDayComplete = dayTasksTotal > 0 && dayTasksDone === dayTasksTotal;

              return (
                <div
                  key={day.day}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                    isDayComplete ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isDayComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        D{day.day}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{day.title}</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {day.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Week {day.week} • Est. {day.estimatedMinutes || 180} minutes
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-600">
                      {dayTasksDone}/{dayTasksTotal} Done
                    </div>
                  </div>

                  {/* Tasks Checklist */}
                  <div className="mt-3.5 space-y-2">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(day.day, task.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer select-none ${
                          task.completed
                            ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/80 text-slate-800'
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-medium leading-snug flex-1">{task.text}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          {task.type}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Daily Tip & Key Concepts */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {day.keyConcepts && day.keyConcepts.length > 0 && (
                      <div className="text-[11px] text-slate-600">
                        <strong className="text-slate-700">Concepts: </strong>
                        {day.keyConcepts.join(' • ')}
                      </div>
                    )}
                    {day.interviewTip && (
                      <div className="text-[11px] text-blue-800 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                        <strong>Placement Tip: </strong>
                        {day.interviewTip}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs space-y-4">
          <Calendar className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Active 30-Day Preparation Plan</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Get started immediately with the comprehensive 30-day placement syllabus covering DSA, Core CS, Aptitude, and Interview rounds, or customize with AI.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleLoadMasterRoadmap()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Prepare 30-Day Plan (Instant Load)</span>
            </button>
            <button
              onClick={handleGenerateRoadmap}
              disabled={generating}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-200"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Generate AI Plan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
