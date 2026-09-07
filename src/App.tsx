import React, { useState } from 'react';
import { CivicProvider, useCivic } from './context/CivicContext';
import { Header } from './components/Header';
import { StartingAuthPage } from './components/auth/StartingAuthPage';
import { AuthGateway } from './components/AuthGateway';
import { CitizenPortal } from './components/citizen/CitizenPortal';
import { OfficerPortal } from './components/officer/OfficerPortal';
import { ExecutivePortal } from './components/admin/ExecutivePortal';
import {
  ShieldCheck,
  Building2,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, activePortal } = useCivic();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // When starting or when logged out: present the dedicated Starting Login and Registration page
  if (!currentUser) {
    return <StartingAuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Primary Clean Navigation Header (Citizen/Officer/Executive tabs removed) */}
      <Header onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Role-Gated Portal View */}
      <main className="flex-1 pb-12">
        {activePortal === 'citizen' && <CitizenPortal />}
        {activePortal === 'officer' && <OfficerPortal />}
        {activePortal === 'admin' && <ExecutivePortal />}
      </main>

      {/* Auth Gateway Modal (if triggered internally) */}
      <AuthGateway
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultPortal={activePortal}
      />

      {/* Clean, Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>CivicConnect Portal</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-slate-500 font-normal">Municipal Complaint Redressal System</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Role-Segregated Portals</span>
            <span>•</span>
            <span>Automated CATEGORY_MAP Dispatch</span>
            <span>•</span>
            <span>Haversine 50m Clustering</span>
            <span>•</span>
            <span>SLA Breach Escalation (24h/48h/72h)</span>
            <span>•</span>
            <span>Dual-Verification Proof</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Passkey: admin2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <CivicProvider>
      <MainAppContent />
    </CivicProvider>
  );
}
