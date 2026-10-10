import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  db,
  doc,
  deleteDoc,
  getDocs,
  collection,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import {
  User,
  GraduationCap,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Lock,
} from 'lucide-react';

export const ProfileView: React.FC<{ setCurrentTab: (tab: string) => void }> = ({
  setCurrentTab,
}) => {
  const { user, userProfile, updateUserProfile, deleteUserAccountData } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const [college, setCollege] = useState(userProfile?.college || '');
  const [degree, setDegree] = useState(userProfile?.degree || 'B.Tech');
  const [branch, setBranch] = useState(userProfile?.branch || 'Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(userProfile?.graduationYear || '2026');
  const [targetRole, setTargetRole] = useState(
    userProfile?.targetRole || 'Software Development Engineer'
  );
  const [dailyHours, setDailyHours] = useState(userProfile?.dailyStudyHours || 3);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(userProfile?.currentSkills || ['C++', 'Data Structures', 'SQL']);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Resume History
  const [resumes, setResumes] = useState<any[]>([]);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setCollege(userProfile.college || '');
      setDegree(userProfile.degree || 'B.Tech');
      setBranch(userProfile.branch || 'Computer Science & Engineering');
      setGraduationYear(userProfile.graduationYear || '2026');
      setTargetRole(userProfile.targetRole || 'Software Development Engineer');
      setDailyHours(userProfile.dailyStudyHours || 3);
      if (userProfile.currentSkills) setSkills(userProfile.currentSkills);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'resumes'));
        setResumes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Failed to load resume history:', e);
      }
    };
    loadHistory();
  }, [user]);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const added = skillInput.trim();
      setSkills([...skills, added]);
      setSkillInput('');
      showInfo(`Added "${added}" to skills inventory`);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    showInfo(`Removed "${skillToRemove}"`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateUserProfile({
        college,
        degree,
        branch,
        graduationYear,
        targetRole,
        dailyStudyHours: Number(dailyHours),
        currentSkills: skills,
      });
      setSaveSuccess(true);
      showSuccess('Profile details saved successfully to database!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      showError('Failed to save profile details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'resumes', resumeId));
      setResumes(resumes.filter((r) => r.id !== resumeId));
      showSuccess('Resume evaluation permanently deleted from your records.');
    } catch (err) {
      showError('Failed to delete resume record.');
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/resumes/${resumeId}`);
    }
  };

  const handleWipeAllData = async () => {
    setIsDeletingData(true);
    try {
      await deleteUserAccountData();
      showWarning('All personal account data and records have been purged.');
      setCurrentTab('landing');
    } catch (err) {
      console.error('Failed to wipe data:', err);
      showError('Failed to wipe account data.');
    } finally {
      setIsDeletingData(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Student Profile</h2>
        <p className="text-xs text-slate-500 mt-1">Please sign in to access your profile settings.</p>
        <button
          onClick={() => setCurrentTab('landing')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Account & Records
          </span>
          <span className="text-xs text-slate-500 font-medium">Privacy Guaranteed</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Student Profile & Data Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your placement credentials, current skill inventory, uploaded resumes, and privacy preferences.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Academic & Placement Profile</h3>
            <p className="text-xs text-slate-500">
              Account email: <strong>{user.email}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                College / University Name
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Delhi, NIT Trichy, Vellore Institute of Tech..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Degree Program
              </label>
              <select
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              >
                <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                <option value="B.E.">B.E. (Bachelor of Engineering)</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc CS">B.Sc Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science, Information Tech, ECE..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Graduation Passing Year
              </label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Primary Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Development Engineer (SDE-1)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Daily Preparation Hours
              </label>
              <select
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              >
                <option value={2}>2 Hours / Day</option>
                <option value={3}>3 Hours / Day</option>
                <option value={4}>4 Hours / Day</option>
                <option value={6}>6 Hours / Day</option>
              </select>
            </div>
          </div>

          {/* Current Skills Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Current Skill Inventory
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill (e.g. Java, Docker, React) and press Add..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {saveSuccess ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                All changes sync automatically to Firestore.
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Stored Resumes Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Stored Resume Critiques</h3>
            <p className="text-xs text-slate-500">
              You can permanently delete any uploaded resume evaluation record here.
            </p>
          </div>
          <span className="text-xs text-slate-400">{resumes.length} saved</span>
        </div>

        {resumes.length > 0 ? (
          <div className="space-y-2">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-semibold text-slate-800">{r.fileName || 'Resume'}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Target: {r.targetRole} • ATS: {r.atsScore}/100 •{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteResume(r.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Resume Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3">No stored resumes found.</p>
        )}
      </div>

      {/* Account Deletion & Privacy Policy Workflow */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Privacy & Data Purge Workflow</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              We respect your right to data privacy. Student profiles, resume text, and interview evaluations are never sold or used to train public models. You can permanently wipe your account records from Cloud Firestore at any time.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Delete Account Data
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Wipe All Account Data?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This action is irreversible. All your stored profile data, resume evaluations, 30-day preparation calendars, and mock interview scores will be permanently deleted from Firestore.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeAllData}
                disabled={isDeletingData}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isDeletingData ? 'Purging Data...' : 'Yes, Delete My Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
