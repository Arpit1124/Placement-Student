import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  FileText,
  Target,
  Calendar,
  Mic,
  Code2,
  Building2,
  User,
  ShieldCheck,
  LogIn,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, userProfile, isAdmin, signInWithGoogle, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass, requireAuth: true },
    { id: 'resume', label: 'Resume ATS', icon: FileText, requireAuth: false },
    { id: 'skill-gap', label: 'Skill Gap', icon: Target, requireAuth: false },
    { id: 'roadmap', label: '30-Day Plan', icon: Calendar, requireAuth: false },
    { id: 'interview', label: 'Mock Interview', icon: Mic, requireAuth: false },
    { id: 'dsa', label: 'DSA Practice', icon: Code2, requireAuth: false },
    { id: 'company-prep', label: 'Company Prep', icon: Building2, requireAuth: false },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  PlacementPilot<span className="text-blue-600 font-extrabold">.AI</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Campus Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Prepare Smarter. Interview Better. Get Hired.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-amber-600 hover:bg-amber-50/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Admin
              </button>
            )}
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    currentTab === 'profile'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="View Profile & Settings"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-medium text-xs max-w-[110px] truncate">
                    {user.displayName || userProfile?.displayName || 'Student'}
                  </span>
                </button>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{authLoading ? 'Signing in...' : 'Student Login'}</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg">
          <button
            onClick={() => {
              setCurrentTab('landing');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentTab === 'landing' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            Home / Overview
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}

          {user && (
            <button
              onClick={() => {
                setCurrentTab('profile');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              <User className="w-4 h-4 text-slate-400" />
              Student Profile & History
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setCurrentTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentTab === 'admin' ? 'bg-amber-50 text-amber-700' : 'text-amber-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Admin Portal
            </button>
          )}
        </div>
      )}
    </header>
  );
};
