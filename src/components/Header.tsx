import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { UserRole } from '../types';
import {
  Building2,
  Users,
  HardHat,
  ShieldAlert,
  FastForward,
  RotateCcw,
  LogOut,
  ChevronDown,
  Clock,
  KeyRound,
  LogIn,
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    activePortal,
    setActivePortal,
    users,
    quickSwitchUser,
    logout,
    simulatedTimeMs,
    simulateTimeWarpHours,
    resetAllData,
  } = useCivic();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);

  const formattedSimTime = new Date(simulatedTimeMs).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePortalSwitch = (portal: UserRole) => {
    setActivePortal(portal);
    if (currentUser?.role !== portal) {
      const match = users.find((u) => u.role === portal);
      if (match) quickSwitchUser(match);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight block leading-tight">
                CivicConnect
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Municipal Grievance System
              </span>
            </div>
          </div>

          {/* Active Authenticated Role Badge (Role tabs removed per user requirement) */}
          <div className="flex items-center">
            {currentUser?.role === 'citizen' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-2xs">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Citizen Redressal Portal</span>
              </div>
            )}
            {currentUser?.role === 'officer' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold shadow-2xs">
                <HardHat className="w-3.5 h-3.5 text-orange-600" />
                <span>Field Officer Terminal • {currentUser.department || 'Roads'}</span>
              </div>
            )}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold shadow-2xs">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>Executive Commissioner Center</span>
              </div>
            )}
          </div>

          {/* Right Action Items: Time Warp + User */}
          <div className="flex items-center gap-2">
            {/* Time Warp Tool */}
            <div className="relative">
              <button
                onClick={() => setShowSimMenu(!showSimMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                title="SLA Time Travel Engine"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono text-[11px] hidden md:inline">{formattedSimTime}</span>
                <span className="text-blue-600 font-bold text-[11px] flex items-center gap-0.5">
                  <FastForward className="w-3 h-3" /> Warp
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showSimMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>SLA Simulator Clock</span>
                    <span className="text-[10px] text-slate-400 font-mono">Test Escalations</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Fast-forward time to test automatic 24h/48h/72h SLA breach escalation to the Commissioner queue.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        simulateTimeWarpHours(12);
                        setShowSimMenu(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-center"
                    >
                      +12 Hours
                    </button>
                    <button
                      onClick={() => {
                        simulateTimeWarpHours(24);
                        setShowSimMenu(false);
                      }}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-center"
                    >
                      +24h Breach
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        resetAllData();
                        setShowSimMenu(false);
                      }}
                      className="w-full px-2 py-1 text-slate-500 hover:text-slate-800 text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Initial State
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Switch Portal / Sign Out Button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 shadow-2xs"
              title="Return to starting portal selection and sign in as another role"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Switch Portal</span>
            </button>

            {/* User Account / Role Switcher */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                      <span>{currentUser.role}</span>
                      {currentUser.department && (
                        <span className="text-blue-600 font-semibold">({currentUser.department})</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 text-xs space-y-2">
                    <div className="p-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase text-[9px]">
                          {currentUser.role}
                        </span>
                        {currentUser.department && (
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-bold uppercase text-[9px]">
                            {currentUser.department}
                          </span>
                        )}
                        {currentUser.badgeNumber && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold">
                            #{currentUser.badgeNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
                        Switch Demo Role
                      </div>
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            quickSwitchUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            currentUser.id === u.id ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-xs">{u.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {u.role.toUpperCase()} {u.department ? `• ${u.department}` : ''}
                            </div>
                          </div>
                          {u.role === 'admin' && <KeyRound className="w-3 h-3 text-purple-600" />}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
                      <button
                        onClick={() => {
                          onOpenAuth();
                          setShowUserMenu(false);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                      >
                        Sign In / Register
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
