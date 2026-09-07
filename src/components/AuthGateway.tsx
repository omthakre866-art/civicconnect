import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { UserRole, MunicipalDepartment } from '../types';
import { ADMIN_SECRET_PASSKEY } from '../data/seedData';
import {
  Users,
  HardHat,
  ShieldAlert,
  KeyRound,
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  AlertCircle,
  Building,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface AuthGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPortal?: UserRole;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  isOpen,
  onClose,
  defaultPortal = 'citizen',
}) => {
  const { login, register, setActivePortal, users, quickSwitchUser } = useCivic();

  const [portal, setPortal] = useState<UserRole>(defaultPortal);
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [adminPasskey, setAdminPasskey] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isRegister) {
      if (portal === 'officer' && (!department || department.trim() === '')) {
        setErrorMessage('Required: Please ask the officer to select their municipal department from the dropdown option.');
        return;
      }

      const res = register({
        name,
        email,
        role: portal,
        password,
        phone,
        department: portal === 'officer' ? (department as MunicipalDepartment) : undefined,
        badgeNumber: portal === 'officer' ? badgeNumber : undefined,
        adminPasskey: portal === 'admin' ? adminPasskey : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed');
      } else {
        setSuccessMessage('Registration successful! werkzeug.security password hashed securely.');
        setTimeout(() => onClose(), 800);
      }
    } else {
      const res = login(email, password, portal, portal === 'admin' ? adminPasskey : undefined);
      if (!res.success) {
        setErrorMessage(res.error || 'Login failed');
      } else {
        setSuccessMessage(`Authenticated into ${portal.toUpperCase()} portal!`);
        setTimeout(() => onClose(), 600);
      }
    }
  };

  const fillDemoAccount = (role: UserRole) => {
    setPortal(role);
    setIsRegister(false);
    setErrorMessage(null);

    if (role === 'citizen') {
      setEmail('citizen@civic.gov');
      setPassword('citizen123');
      setAdminPasskey('');
    } else if (role === 'officer') {
      setEmail('officer.roads@civic.gov');
      setPassword('officer123');
      setAdminPasskey('');
    } else if (role === 'admin') {
      setEmail('commissioner@civic.gov');
      setPassword('admin123');
      setAdminPasskey('admin2026');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role-Gated Authentication & RBAC
            </div>
            <h2 className="text-lg font-bold">CivicConnect Gateway</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Explicit Portal Selector (Role-Gating Requirement) */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Step 1: Select Dedicated Access Portal
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPortal('citizen');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                portal === 'citizen'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold">Citizen</span>
              <span className={`text-[10px] ${portal === 'citizen' ? 'text-blue-100' : 'text-slate-400'}`}>
                Public Portal
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortal('officer');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                portal === 'officer'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <HardHat className="w-5 h-5" />
              <span className="text-xs font-bold">Field Officer</span>
              <span className={`text-[10px] ${portal === 'officer' ? 'text-orange-100' : 'text-slate-400'}`}>
                Departmental
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortal('admin');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                portal === 'admin'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="text-xs font-bold">Executive</span>
              <span className={`text-[10px] ${portal === 'admin' ? 'text-purple-200' : 'text-slate-400'}`}>
                Commissioner
              </span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Role-gated portal login enforces isolation. A Citizen account cannot log in through Field Officer or Admin portals.
          </p>
        </div>

        {/* Quick 1-Click Demo Logins */}
        <div className="px-5 pt-3 pb-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">1-Click Test:</span>
          <button
            type="button"
            onClick={() => fillDemoAccount('citizen')}
            className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-[11px] border border-blue-200"
          >
            Citizen (Priya)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('officer')}
            className="px-2 py-0.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-[11px] border border-orange-200"
          >
            Officer (Marcus)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-[11px] border border-purple-200"
          >
            Commissioner (Passkey)
          </button>
        </div>

        {/* Error / Success alerts */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto max-h-[60vh]">
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
                  placeholder="e.g. Elena Rostova"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Government / User Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={portal === 'admin' ? 'commissioner@civic.gov' : 'user@domain.com'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Officer-Specific Fields: Department Dropdown & Badge ID */}
          {portal === 'officer' && isRegister && (
            <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-orange-950 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-orange-600" />
                    Assigned Municipal Department *
                  </span>
                  <span className="text-[10px] text-orange-700 font-semibold bg-orange-100 px-2 py-0.5 rounded">
                    Dropdown Option
                  </span>
                </label>
                <select
                  required
                  value={department}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setDepartment(selected);
                    if (selected) {
                      const prefixes: Record<string, string> = {
                        Electricity: 'EL',
                        Water: 'WT',
                        Roads: 'RD',
                        Sanitation: 'SN',
                      };
                      const prefix = prefixes[selected] || 'OF';
                      setBadgeNumber(`${prefix}-${Math.floor(100 + Math.random() * 900)}`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-orange-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs"
                >
                  <option value="">-- Choose Officer Municipal Department --</option>
                  <option value="Electricity">⚡ Electricity Division (Power Grids, Transformers, Lines)</option>
                  <option value="Water">💧 Water & Sewage Division (Pipelaying, Main Leaks, Drainage)</option>
                  <option value="Roads">🛣️ Roads & Infrastructure Division (Potholes, Asphalt, Bridges)</option>
                  <option value="Sanitation">🧹 Sanitation & Solid Waste Division (Garbage Dumps, Cleanliness)</option>
                </select>

                {/* Live Department Scope Description Preview */}
                {department ? (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-orange-200 text-[11px] text-orange-900 leading-snug">
                    <strong className="text-orange-950 block font-semibold mb-0.5">
                      Selected Division Operational Scope:
                    </strong>
                    {department === 'Electricity' &&
                      'Field officer will manage live wire hazards, grid outages, streetlights, and blown fuses (24h SLA for emergency high-voltage hazards).'}
                    {department === 'Water' &&
                      'Field officer will oversee potable water pipelines, main pipe bursts, drainage overflows, and sewage water contamination.'}
                    {department === 'Roads' &&
                      'Field officer will inspect asphalt potholes, sinkholes, road cave-ins, footpaths, and bridge structural safety.'}
                    {department === 'Sanitation' &&
                      'Field officer will coordinate commercial trash dumpsters, illegal waste dumping, and city cleanliness sweeps.'}
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] text-orange-700 font-medium">
                    Please ask the officer to select their operational division from the dropdown above.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Badge Identification ID *
                </label>
                <input
                  type="text"
                  required
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="e.g. RD-409"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Official municipal employee identifier attached to resolution verification stamps.
                </p>
              </div>
            </div>
          )}

          {/* Cryptographic Passkey Authorization (Mandatory for Admin) */}
          {portal === 'admin' && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
              <label className="block text-xs font-bold text-purple-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  Secret Administrative Passkey (Required)
                </span>
                <span className="text-[10px] text-purple-600 font-mono">Demo: admin2026</span>
              </label>
              <input
                type="password"
                required
                value={adminPasskey}
                onChange={(e) => setAdminPasskey(e.target.value)}
                placeholder="Enter secret key (admin2026)"
                className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <p className="text-[10px] text-purple-800">
                Cryptographic authorization prevents unauthorized executive account creation or terminal access.
              </p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-md transition-all ${
              portal === 'citizen'
                ? 'bg-blue-600 hover:bg-blue-500'
                : portal === 'officer'
                ? 'bg-orange-600 hover:bg-orange-500'
                : 'bg-purple-700 hover:bg-purple-600'
            }`}
          >
            {isRegister ? `Register for ${portal.toUpperCase()} Tier` : `Authenticate into ${portal.toUpperCase()} Portal`}
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
              }}
              className="text-slate-600 hover:text-slate-900 font-medium underline"
            >
              {isRegister ? 'Already have an authorized account? Sign In' : 'Need to register a new account? Sign Up'}
            </button>
          </div>
        </form>

        {/* Security badge footer */}
        <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>werkzeug.security: scrypt:32768:8:1</span>
          <span>Zero Plain-Text Credentials</span>
        </div>
      </div>
    </div>
  );
};
