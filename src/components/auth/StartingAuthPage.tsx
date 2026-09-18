import React, { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { UserRole, MunicipalDepartment } from '../../types';
import { ADMIN_SECRET_PASSKEY } from '../../data/seedData';
import {
  Building2,
  Users,
  HardHat,
  ShieldAlert,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Clock,
  Sparkles,
  LogIn,
  UserPlus,
  Zap,
  Droplets,
  Milestone,
  Trash2,
} from 'lucide-react';

export const StartingAuthPage: React.FC = () => {
  const { login, loginWithGoogle, register, users, quickSwitchUser, firebaseConnected } = useCivic();

  // Selected entry portal door
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  // Mode: signin or register
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState<string>('citizen@civic.gov');
  const [password, setPassword] = useState<string>('citizen123');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('Roads');
  const [badgeNumber, setBadgeNumber] = useState<string>('RD-204');
  const [adminPasskey, setAdminPasskey] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Switch role and update sensible defaults
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (role === 'citizen') {
      setEmail('citizen@civic.gov');
      setPassword('citizen123');
      setAdminPasskey('');
    } else if (role === 'officer') {
      setEmail('officer.roads@civic.gov');
      setPassword('officer123');
      setDepartment('Roads');
      setBadgeNumber('RD-204');
      setAdminPasskey('');
    } else if (role === 'admin') {
      setEmail('commissioner@civic.gov');
      setPassword('admin123');
      setAdminPasskey(ADMIN_SECRET_PASSKEY);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isRegister) {
      if (selectedRole === 'officer' && (!department || department.trim() === '')) {
        setErrorMessage('Department Selection Required: Please select an official municipal department from the dropdown menu.');
        return;
      }

      if (selectedRole === 'admin' && adminPasskey.trim() !== ADMIN_SECRET_PASSKEY) {
        setErrorMessage('Security Verification Failed: A valid cryptographic administrator passkey (admin2026) is required.');
        return;
      }

      const res = register({
        name,
        email,
        role: selectedRole,
        password,
        phone,
        department: selectedRole === 'officer' ? (department as MunicipalDepartment) : undefined,
        badgeNumber: selectedRole === 'officer' ? badgeNumber : undefined,
        adminPasskey: selectedRole === 'admin' ? adminPasskey : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage(`Account created successfully! Entering ${selectedRole.toUpperCase()} portal...`);
      }
    } else {
      const res = login(
        email,
        password,
        selectedRole,
        selectedRole === 'admin' ? adminPasskey : undefined
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Login failed. Verify credentials and role matching.');
      } else {
        setSuccessMessage(`Authentication confirmed. Entering ${selectedRole.toUpperCase()} portal...`);
      }
    }
  };

  // Instant 1-click Quick Launch for any test persona
  const handleQuickLaunch = (role: UserRole, specificDept?: MunicipalDepartment) => {
    let target = users.find((u) => u.role === role);
    if (role === 'officer' && specificDept) {
      const deptMatch = users.find((u) => u.role === 'officer' && u.department === specificDept);
      if (deptMatch) target = deptMatch;
    }
    if (target) {
      quickSwitchUser(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none">
                CivicConnect
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Municipal Grievance Redressal & Service Delivery System
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase Firestore Active
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Role-Gated Entry
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-mono text-[11px]">
              Passkey: admin2026
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">
        {/* Intro Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Select Your Municipal Entry Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Access is role-segregated. Choose whether you are entering as a <strong>Citizen</strong>, a <strong>Field Officer</strong>, or an <strong>Executive Commissioner</strong> to sign in or register.
          </p>
        </div>

        {/* 3 Distinct Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Citizen Portal Card */}
          <div
            onClick={() => handleSelectRole('citizen')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between relative bg-white ${
              selectedRole === 'citizen'
                ? 'border-blue-600 ring-4 ring-blue-100 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  selectedRole === 'citizen' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Public Gateway
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Citizen Redressal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  File municipal complaints with automatic GPS telemetry, track SLA countdowns, and audit verified resolution proofs.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive Map & GPS Telemetry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>24h/48h/72h SLA Countdown Timers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>1-Click Reopen & Audit Powers</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className={selectedRole === 'citizen' ? 'text-blue-600' : 'text-slate-500'}>
                {selectedRole === 'citizen' ? 'Selected Door' : 'Select Citizen Entry'}
              </span>
              <ArrowRight className={`w-4 h-4 ${selectedRole === 'citizen' ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* 2. Field Officer Terminal Card */}
          <div
            onClick={() => handleSelectRole('officer')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between relative bg-white ${
              selectedRole === 'officer'
                ? 'border-orange-500 ring-4 ring-orange-100 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  selectedRole === 'officer' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'
                }`}>
                  <HardHat className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                  Municipal Staff
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Field Officer Terminal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect assigned departmental work orders, track urgent hazard flags, and upload mandatory on-site photo proofs.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Electricity, Water, Roads, Sanitation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mandatory Photo Resolution Proof</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>SLA Escalation Alert Triggers</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className={selectedRole === 'officer' ? 'text-orange-600' : 'text-slate-500'}>
                {selectedRole === 'officer' ? 'Selected Door' : 'Select Officer Entry'}
              </span>
              <ArrowRight className={`w-4 h-4 ${selectedRole === 'officer' ? 'text-orange-600' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* 3. Executive Commissioner Card */}
          <div
            onClick={() => handleSelectRole('admin')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between relative bg-white ${
              selectedRole === 'admin'
                ? 'border-purple-600 ring-4 ring-purple-100 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  selectedRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  Authority Passkey
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Executive Commissioner</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Central municipal oversight, cross-departmental SLAs, breach escalation queues, and officer disciplinary sanction notices.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Cross-Departmental SLA Analytics</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>SLA Breach Escalation Queue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Disciplinary Sanctions & Reassignment</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className={selectedRole === 'admin' ? 'text-purple-600' : 'text-slate-500'}>
                {selectedRole === 'admin' ? 'Selected Door' : 'Select Executive Entry'}
              </span>
              <ArrowRight className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-purple-600' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>

        {/* Dedicated Entry Form Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto overflow-hidden">
          {/* Header of the Form */}
          <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
            selectedRole === 'citizen'
              ? 'bg-blue-50/60 border-blue-100'
              : selectedRole === 'officer'
              ? 'bg-orange-50/60 border-orange-100'
              : 'bg-purple-50/60 border-purple-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white ${
                selectedRole === 'citizen'
                  ? 'bg-blue-600'
                  : selectedRole === 'officer'
                  ? 'bg-orange-500'
                  : 'bg-purple-600'
              }`}>
                {selectedRole === 'citizen' && <Users className="w-5 h-5" />}
                {selectedRole === 'officer' && <HardHat className="w-5 h-5" />}
                {selectedRole === 'admin' && <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedRole === 'citizen' && 'Citizen Entry Portal'}
                  {selectedRole === 'officer' && 'Field Officer Terminal Entry'}
                  {selectedRole === 'admin' && 'Executive Commissioner Entry'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isRegister ? 'Register new verified account' : 'Sign in with authenticated credentials'}
                </p>
              </div>
            </div>

            {/* Mode Tabs: Sign In vs Register */}
            <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMessage(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  !isRegister ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMessage(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  isRegister ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          </div>

          {/* Form Alert States */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedRole === 'admin' ? 'Dr. Evelyn Vance' : 'e.g. Marcus Vance'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@civic.gov"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Officer Specific Fields: MANDATORY Department Selector Dropdown */}
            {selectedRole === 'officer' && (
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-3">
                <div className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-orange-600" />
                  <span>Department Assignment (Required)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Municipal Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        setDepartment(newDept);
                        if (newDept === 'Electricity') setBadgeNumber('EL-108');
                        else if (newDept === 'Water') setBadgeNumber('WT-305');
                        else if (newDept === 'Sanitation') setBadgeNumber('SN-772');
                        else setBadgeNumber('RD-204');
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="Roads">🛣️ Roads & Infrastructure</option>
                      <option value="Water">💧 Water & Sewage</option>
                      <option value="Electricity">⚡ Electricity & Grid</option>
                      <option value="Sanitation">🧹 Sanitation & Waste</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Badge ID</label>
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="RD-204"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Executive Passkey Field: REQUIRED FOR ADMIN */}
            {selectedRole === 'admin' && (
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2">
                <label className="block text-xs font-bold text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                    Cryptographic Authority Passkey <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-600 font-bold">Key: admin2026</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPasskey}
                    onChange={(e) => setAdminPasskey(e.target.value)}
                    placeholder="Enter passkey (admin2026)"
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-purple-600">
                  Commissioner terminal requires passkey validation to enforce executive authority separation.
                </p>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'citizen'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-200'
                    : selectedRole === 'officer'
                    ? 'bg-orange-500 hover:bg-orange-400 shadow-orange-200'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-200'
                }`}
              >
                <span>
                  {isRegister
                    ? `Register & Enter ${selectedRole === 'citizen' ? 'Citizen Portal' : selectedRole === 'officer' ? 'Officer Terminal' : 'Executive Center'}`
                    : `Sign In to ${selectedRole === 'citizen' ? 'Citizen Portal' : selectedRole === 'officer' ? 'Officer Terminal' : 'Executive Center'}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Google Authentication via Firebase */}
            <div className="pt-1">
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold text-[10px]">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setErrorMessage(null);
                  setSuccessMessage('Connecting with Google via Firebase Auth...');
                  const res = await loginWithGoogle(selectedRole);
                  if (!res.success) {
                    setErrorMessage(res.error || 'Google Sign-In failed.');
                    setSuccessMessage(null);
                  }
                }}
                className="w-full py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (Firebase)</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Pre-fill helpers inside form */}
          {!isRegister && (
            <div className="px-6 pb-5 pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400 font-medium">Quick Credentials:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedRole === 'citizen' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('citizen@civic.gov');
                      setPassword('citizen123');
                    }}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                  >
                    Priya Sharma (citizen123)
                  </button>
                )}

                {selectedRole === 'officer' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('officer.roads@civic.gov');
                        setPassword('officer123');
                        setDepartment('Roads');
                      }}
                      className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-bold hover:bg-orange-100"
                    >
                      Roads (Marcus)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('officer.water@civic.gov');
                        setPassword('officer123');
                        setDepartment('Water');
                      }}
                      className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-bold hover:bg-orange-100"
                    >
                      Water (Elena)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('officer.elec@civic.gov');
                        setPassword('officer123');
                        setDepartment('Electricity');
                      }}
                      className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-bold hover:bg-orange-100"
                    >
                      Electricity (Rajesh)
                    </button>
                  </>
                )}

                {selectedRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('commissioner@civic.gov');
                      setPassword('admin123');
                      setAdminPasskey(ADMIN_SECRET_PASSKEY);
                    }}
                    className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold hover:bg-purple-100"
                  >
                    Dr. Evelyn Vance (admin2026)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Instant Evaluator Access Bar */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 max-w-4xl mx-auto space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Instant 1-Click Demo Evaluation Shortcuts
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Bypasses manual typing</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <button
              onClick={() => handleQuickLaunch('citizen')}
              className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-700 font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Demo Citizen</span>
              <span className="text-[10px] text-slate-400 font-normal">Priya Sharma</span>
            </button>

            <button
              onClick={() => handleQuickLaunch('officer', 'Roads')}
              className="p-2.5 rounded-xl bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-800 hover:text-orange-700 font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <Milestone className="w-4 h-4 text-orange-600" />
              <span>Roads Officer</span>
              <span className="text-[10px] text-slate-400 font-normal">Marcus Vance</span>
            </button>

            <button
              onClick={() => handleQuickLaunch('officer', 'Water')}
              className="p-2.5 rounded-xl bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-800 hover:text-cyan-700 font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span>Water Officer</span>
              <span className="text-[10px] text-slate-400 font-normal">Elena Rostova</span>
            </button>

            <button
              onClick={() => handleQuickLaunch('officer', 'Electricity')}
              className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-700 font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Electricity Officer</span>
              <span className="text-[10px] text-slate-400 font-normal">Rajesh Kumar</span>
            </button>

            <button
              onClick={() => handleQuickLaunch('admin')}
              className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-800 hover:text-purple-700 font-bold transition-all text-center flex flex-col items-center gap-1 col-span-2 sm:col-span-1"
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Commissioner</span>
              <span className="text-[10px] text-purple-600 font-mono">admin2026</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-center text-xs text-slate-400">
        CivicConnect Municipal Redressal System • Role-Based Access Control • All Rights Reserved
      </footer>
    </div>
  );
};
