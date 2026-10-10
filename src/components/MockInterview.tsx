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
import { InterviewQuestion, MockInterviewSession } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Award,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Eye,
  EyeOff,
  History,
} from 'lucide-react';

interface MockInterviewProps {
  setCurrentTab: (tab: string) => void;
}

export const MockInterview: React.FC<MockInterviewProps> = ({ setCurrentTab }) => {
  const { user, userProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [targetRole, setTargetRole] = useState(
    userProfile?.targetRole || 'Software Development Engineer'
  );
  const [category, setCategory] = useState<'Technical' | 'DSA' | 'HR' | 'System Design' | 'Comprehensive'>('Technical');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [companyFocus, setCompanyFocus] = useState('Campus Placement Recruiters');

  // Session State
  const [isStarting, setIsStarting] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Follow-up interaction
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpSubmitted, setFollowUpSubmitted] = useState(false);

  // Speech recognition and synthesis state
  const [isListening, setIsListening] = useState(false);
  const [isListeningFollowUp, setIsListeningFollowUp] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const startListening = (target: 'main' | 'followup') => {
    if (!speechSupported) {
      showError('Speech recognition is not supported in this browser. Please type your answer or use Chrome/Edge.');
      return;
    }

    // Stop speaking question if audio is playing
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }

    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Indian English / en-US

      rec.onstart = () => {
        if (target === 'main') setIsListening(true);
        else setIsListeningFollowUp(true);
        setInterimTranscript('');
        showInfo('Microphone active. Speak your answer clearly — voice transcribing live...');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalChunk = event.results[i][0].transcript.trim();
            if (finalChunk) {
              if (target === 'main') {
                setStudentAnswer((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk));
              } else {
                setFollowUpAnswer((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk));
              }
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          showError('Microphone permission was denied. Please allow microphone permissions in your browser bar.');
        } else if (event.error === 'no-speech') {
          // No speech detected, keep listening or prompt
        } else {
          showError(`Microphone notice: ${event.error}. You can also type directly.`);
        }
        setIsListening(false);
        setIsListeningFollowUp(false);
        setInterimTranscript('');
      };

      rec.onend = () => {
        setIsListening(false);
        setIsListeningFollowUp(false);
        setInterimTranscript('');
      };

      rec.start();
      setRecognitionInstance(rec);
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      showError('Could not initialize microphone. Please type your answer.');
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
      setRecognitionInstance(null);
    }
    setIsListening(false);
    setIsListeningFollowUp(false);
    setInterimTranscript('');
    showSuccess('Voice response recorded successfully.');
  };

  const handleSpeakQuestion = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);
    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech synthesis on unmount or question change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {}
      }
    };
  }, [recognitionInstance, currentIndex]);

  // Past interview history
  const [pastSessions, setPastSessions] = useState<MockInterviewSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    if (!user) return;
    const loadPastSessions = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'mockInterviews'));
        const list: MockInterviewSession[] = snap.docs.map((d) => d.data() as MockInterviewSession);
        setPastSessions(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error('Failed to load past sessions:', err);
      }
    };
    loadPastSessions();
  }, [user, sessionFinished]);

  const handleStartInterview = async () => {
    setIsStarting(true);
    setError(null);
    setShowModelAnswer(false);

    try {
      const res = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          category,
          difficulty,
          companyFocus,
          count: 4,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to start interview.');
      }

      setQuestions(json.data.questions || []);
      setCurrentIndex(0);
      setStudentAnswer('');
      setFollowUpAnswer('');
      setFollowUpSubmitted(false);
      setSessionActive(true);
      setSessionFinished(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating interview questions.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!studentAnswer.trim()) {
      setError('Please type your answer before submitting.');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    const currentQ = questions[currentIndex];

    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          question: currentQ.question,
          studentAnswer,
          category,
          difficulty,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to evaluate answer.');
      }

      const updated = [...questions];
      updated[currentIndex] = {
        ...currentQ,
        studentAnswer,
        evaluation: json.data,
      };

      setQuestions(updated);
      showSuccess(`Answer evaluated! Score: ${json.data.score}/100 (${json.data.rating})`);
    } catch (err: any) {
      const msg = err.message || 'Evaluation failed. Please try again.';
      setError(msg);
      showError(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStudentAnswer('');
      setFollowUpAnswer('');
      setFollowUpSubmitted(false);
      setShowModelAnswer(false);
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    setSessionFinished(true);
    setSessionActive(false);

    // Calculate overall average score
    let totalScore = 0;
    let evaluatedCount = 0;
    questions.forEach((q) => {
      if (q.evaluation?.score) {
        totalScore += q.evaluation.score;
        evaluatedCount++;
      }
    });

    const avgScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 75;
    showSuccess(`Mock interview completed! Overall score: ${avgScore}% saved to history.`);

    const sessionData: MockInterviewSession = {
      targetRole,
      category,
      difficulty,
      questions,
      overallScore: avgScore,
      completed: true,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const sessionId = `session_${Date.now()}`;
        const ref = doc(db, 'users', user.uid, 'mockInterviews', sessionId);
        await setDoc(ref, {
          ...sessionData,
          id: sessionId,
          userId: user.uid,
        });
      } catch (dbErr) {
        console.error('Failed to save session to Firestore:', dbErr);
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}/mockInterviews`);
      }
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              Interview Simulator
            </span>
            <span className="text-xs text-slate-500 font-medium">Adaptive Questioning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            AI Mock Interview
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Simulate realistic technical, HR, and DSA interview rounds with structured evaluation, follow-up challenges, and benchmark model answers.
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>{showHistory ? 'Configure Interview' : 'Past Sessions'}</span>
        </button>
      </div>

      {/* History Modal / Drawer View */}
      {showHistory && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Interview History & Progress</h3>
            <span className="text-xs text-slate-500">{pastSessions.length} total sessions</span>
          </div>

          {pastSessions.length > 0 ? (
            <div className="space-y-3">
              {pastSessions.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {s.targetRole} • {s.category}
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {new Date(s.createdAt).toLocaleDateString()} • {s.difficulty} Level • {s.questions?.length || 0} Questions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-violet-700">{s.overallScore || 0}%</span>
                    <span className="block text-[10px] text-slate-400">Score</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No interview sessions completed yet. Start your first session below!
            </p>
          )}
        </div>
      )}

      {/* State 1: Configuration Form (Before session starts) */}
      {!sessionActive && !sessionFinished && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Configure Interview Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE-1, Frontend Developer, Backend Engineer..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Employer Focus
              </label>
              <input
                type="text"
                value={companyFocus}
                onChange={(e) => setCompanyFocus(e.target.value)}
                placeholder="e.g. Tier-1 Product (Amazon/Google) or IT Service (TCS/Infosys)"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Interview Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
              >
                <option value="Technical">Technical Round (Core CS & Web/Backend)</option>
                <option value="DSA">DSA & Algorithmic Problem Solving</option>
                <option value="HR">HR & Behavioral (STAR Method)</option>
                <option value="System Design">System Design & Architecture Basics</option>
                <option value="Comprehensive">Comprehensive Multi-Disciplinary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
              >
                <option value="Beginner">Beginner (Campus Mass Recruitment / Fundamentals)</option>
                <option value="Intermediate">Intermediate (Tier-1 Product / Product Startups)</option>
                <option value="Advanced">Advanced (High-Bar SDE-1 / Competitive)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Voice & Microphone Readiness Callout */}
          <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-violet-900 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                <strong>Speech & Microphone:</strong> {speechSupported ? 'Enabled & Ready. You can speak answers aloud during the interview.' : 'Web Speech API unavailable — typed answer mode active.'}
              </span>
            </div>
            <span className="text-[11px] text-violet-700 bg-white px-2.5 py-1 rounded-md border border-violet-200 self-start sm:self-auto font-semibold">
              Voice + Text Input
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Each session contains 4 questions with AI answer evaluation and follow-up probing.
            </p>

            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing Panel Questions...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Begin Mock Interview</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* State 2: Active Interview Question Dialogue */}
      {sessionActive && currentQ && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stepper Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-bold text-slate-800">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                {currentQ.category}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-violet-50 text-violet-700 rounded border border-violet-200">
                {currentQ.difficulty}
              </span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Interviewer Question
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeakQuestion(currentQ.question)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSpeakingQuestion
                      ? 'bg-violet-600 text-white animate-pulse'
                      : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
                  }`}
                  title="Listen to question read aloud"
                >
                  {isSpeakingQuestion ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSpeakingQuestion ? 'Stop Audio' : 'Listen to Question'}</span>
                </button>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                "{currentQ.question}"
              </h2>
              {currentQ.context && (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Scenario: {currentQ.context}
                </p>
              )}
            </div>

            {/* Answer Text Area & Voice Input */}
            {!currentQ.evaluation && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Answer (Type or Speak):
                  </label>

                  {/* Microphone Toggle Button */}
                  <button
                    type="button"
                    onClick={() => (isListening ? stopListening() : startListening('main'))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-400/30'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Radio className="w-4 h-4 text-white animate-spin" />
                        <span>Stop Mic (Listening...)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-violet-600" />
                        <span>Enable Mic (Speak Answer)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mic Active Live Status Bar with Sound Wave Equalizer */}
                {isListening && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-red-800">
                      <div className="flex items-center gap-2.5 font-medium">
                        {/* Animated Sound Wave Bars */}
                        <div className="flex items-center gap-1 h-4">
                          <span className="w-1 bg-red-600 rounded-full animate-bounce h-3" />
                          <span className="w-1 bg-red-600 rounded-full animate-bounce [animation-delay:0.15s] h-4" />
                          <span className="w-1 bg-red-600 rounded-full animate-bounce [animation-delay:0.3s] h-2.5" />
                          <span className="w-1 bg-red-600 rounded-full animate-bounce [animation-delay:0.45s] h-4" />
                        </div>
                        <span className="font-semibold">
                          Microphone active — speak clearly, your voice is transcribing live.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={stopListening}
                        className="text-xs font-bold text-red-700 underline hover:text-red-900 ml-2 shrink-0 cursor-pointer"
                      >
                        Done Speaking
                      </button>
                    </div>

                    {interimTranscript && (
                      <div className="px-2.5 py-1.5 bg-white/80 rounded-lg border border-red-100 text-xs text-slate-700 italic flex items-center gap-2">
                        <span className="font-semibold text-red-600 not-italic text-[11px] uppercase tracking-wide">
                          Live:
                        </span>
                        <span>"{interimTranscript}"</span>
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  rows={6}
                  placeholder="Type or click 'Enable Mic' above to speak your answer aloud. Structure your response clearly (STAR method for behavioral, complexity trade-offs for technical)..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
                />

                {error && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {studentAnswer.length > 0 ? `${studentAnswer.split(/\s+/).filter(Boolean).length} words spoken/typed` : 'Voice & text input supported'}
                  </span>

                  <button
                    onClick={handleEvaluateAnswer}
                    disabled={isEvaluating || !studentAnswer.trim()}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Answer for Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Evaluation Results Card */}
            {currentQ.evaluation && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                {/* Score & Verdict */}
                <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-violet-700">
                      Answer Rating: {currentQ.evaluation.rating}
                    </span>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {currentQ.evaluation.correctness}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-violet-700">
                      {currentQ.evaluation.score}/100
                    </span>
                    <span className="block text-[10px] text-slate-400">Score</span>
                  </div>
                </div>

                {/* Granular Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Strengths in Your Answer
                    </h4>
                    <ul className="space-y-1 text-slate-700 list-disc list-inside">
                      {currentQ.evaluation.strengths.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-1 text-slate-700 list-disc list-inside">
                      {currentQ.evaluation.areasToImprove.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Adaptive Follow-Up Question */}
                {currentQ.evaluation.followUpQuestion && (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-900 font-bold">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span>Interviewer Follow-Up Question:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSpeakQuestion(currentQ.evaluation?.followUpQuestion || '')}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Listen to follow-up question"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      "{currentQ.evaluation.followUpQuestion}"
                    </p>

                    {!followUpSubmitted ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Type or speak your follow-up reply:
                          </span>
                          <button
                            type="button"
                            onClick={() => (isListeningFollowUp ? stopListening() : startListening('followup'))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isListeningFollowUp
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5 text-violet-600" />
                            <span>{isListeningFollowUp ? 'Stop Mic' : 'Speak Follow-Up'}</span>
                          </button>
                        </div>

                        {isListeningFollowUp && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800 flex items-center justify-between gap-2 animate-fadeIn">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5 h-3">
                                <span className="w-0.5 bg-red-600 rounded-full animate-bounce h-2.5" />
                                <span className="w-0.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.15s] h-3" />
                                <span className="w-0.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.3s] h-2" />
                              </div>
                              <span>Listening to your follow-up reply live...</span>
                            </div>
                            <button
                              type="button"
                              onClick={stopListening}
                              className="font-bold underline text-red-700 hover:text-red-900 cursor-pointer text-[10px]"
                            >
                              Stop
                            </button>
                          </div>
                        )}

                        <textarea
                          value={followUpAnswer}
                          onChange={(e) => setFollowUpAnswer(e.target.value)}
                          rows={3}
                          placeholder="Type or click 'Speak Follow-Up' above..."
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                        />
                        <button
                          onClick={() => setFollowUpSubmitted(true)}
                          disabled={!followUpAnswer.trim()}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Record Follow-up Response
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white rounded border border-blue-100 text-slate-700">
                        <strong className="text-slate-900">Your response: </strong>
                        {followUpAnswer}
                      </div>
                    )}
                  </div>
                )}

                {/* Model Answer (Learning Reference Disclaimer) */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="text-xs font-semibold text-slate-600 hover:text-violet-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showModelAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showModelAnswer ? 'Hide Reference Answer' : 'View Ideal Reference Answer'}</span>
                  </button>

                  {showModelAnswer && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Educational Model Answer (Not a strict memorization script):
                      </span>
                      <p className="text-slate-800 whitespace-pre-line font-serif text-xs sm:text-sm">
                        {currentQ.evaluation.modelAnswer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Continue to Next Question */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentIndex < questions.length - 1
                        ? 'Next Question'
                        : 'Finish & View Summary'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* State 3: Session Completed Summary */}
      {sessionFinished && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mock Interview Completed!</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Your responses and granular feedback have been recorded to your student history.
            </p>
          </div>

          <div className="max-w-xs mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Overall Performance Score
            </span>
            <div className="text-4xl font-extrabold text-violet-700 mt-1">
              {Math.round(
                questions.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / questions.length
              )}
              %
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Based on {questions.length} evaluated questions
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setSessionFinished(false);
                setSessionActive(false);
              }}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Start New Mock Session
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              View Dashboard Metrics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
