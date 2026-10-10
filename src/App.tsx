import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ResumeAnalyzer } from './components/ResumeAnalyzer';
import { JobGapAnalyzer } from './components/JobGapAnalyzer';
import { RoadmapView } from './components/RoadmapView';
import { MockInterview } from './components/MockInterview';
import { DsaPractice } from './components/DsaPractice';
import { CompanyPrepView } from './components/CompanyPrepView';
import { ProfileView } from './components/ProfileView';
import { AdminAnalytics } from './components/AdminAnalytics';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [resumeTextForCompare, setResumeTextForCompare] = useState<string>('');

  const handleJobCompare = (resumeText: string) => {
    setResumeTextForCompare(resumeText);
    setCurrentTab('skill-gap');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Bar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main View Container */}
      <main className="flex-1">
        {currentTab === 'landing' && <LandingPage setCurrentTab={setCurrentTab} />}
        {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
        {currentTab === 'resume' && (
          <ResumeAnalyzer
            setCurrentTab={setCurrentTab}
            onJobCompareRequest={handleJobCompare}
          />
        )}
        {currentTab === 'skill-gap' && (
          <JobGapAnalyzer
            initialResumeText={resumeTextForCompare}
            setCurrentTab={setCurrentTab}
          />
        )}
        {currentTab === 'roadmap' && <RoadmapView setCurrentTab={setCurrentTab} />}
        {currentTab === 'interview' && <MockInterview setCurrentTab={setCurrentTab} />}
        {currentTab === 'dsa' && <DsaPractice setCurrentTab={setCurrentTab} />}
        {currentTab === 'company-prep' && <CompanyPrepView setCurrentTab={setCurrentTab} />}
        {currentTab === 'profile' && <ProfileView setCurrentTab={setCurrentTab} />}
        {currentTab === 'admin' && <AdminAnalytics setCurrentTab={setCurrentTab} />}
      </main>

      {/* Footer with Ethical Disclaimers and Credits */}
      <Footer setCurrentTab={setCurrentTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
