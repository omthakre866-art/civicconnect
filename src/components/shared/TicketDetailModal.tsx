import React, { useState } from 'react';
import { Ticket } from '../../types';
import { useCivic } from '../../context/CivicContext';
import { getRemainingSlaTime } from '../../utils/engine';
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  UserCheck,
  RotateCcw,
  Camera,
  AlertOctagon,
  Building2,
  Phone,
  HardHat,
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onOpenResolveModal?: (ticket: Ticket) => void;
  onOpenReopenModal?: (ticket: Ticket) => void;
  onOpenDisciplinaryModal?: (ticket: Ticket) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onOpenResolveModal,
  onOpenReopenModal,
  onOpenDisciplinaryModal,
}) => {
  const { currentUser, simulatedTimeMs } = useCivic();
  const slaInfo = getRemainingSlaTime(ticket.deadlineAt, simulatedTimeMs);
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');

  const isCitizenOwner = currentUser?.id === ticket.citizenId;
  const isOfficerInDept =
    currentUser?.role === 'officer' && currentUser.department === ticket.department;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold">
                {ticket.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                  ticket.department === 'Electricity'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : ticket.department === 'Water'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : ticket.department === 'Roads'
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {ticket.department} Department
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  ticket.priority === 'HIGH'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : ticket.priority === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {ticket.priority} Priority ({ticket.slaHours}h SLA)
              </span>

              {ticket.isEmergency && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-600 text-white flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Hazard Alert
                </span>
              )}

              {ticket.isEscalated && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-700 text-white flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" /> SLA Escalated
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {ticket.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Report & Evidence Dossier
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Audit Trail & History ({ticket.auditLog.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' ? (
            <>
              {/* SLA & Time Countdown Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  slaInfo.isBreached
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : ticket.status === 'RESOLVED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      slaInfo.isBreached
                        ? 'bg-red-200 text-red-800'
                        : ticket.status === 'RESOLVED'
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {ticket.status === 'RESOLVED' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {ticket.status === 'RESOLVED'
                        ? 'Status: Officially Resolved'
                        : slaInfo.isBreached
                        ? 'SLA Deadline Expired (Escalated to Commissioner)'
                        : 'Service Level Agreement Countdown'}
                    </span>
                    <span className="font-semibold text-sm">
                      {ticket.status === 'RESOLVED'
                        ? `Resolved at ${new Date(
                            ticket.resolutionProof?.resolvedAt || ticket.deadlineAt
                          ).toLocaleString()}`
                        : slaInfo.text}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-600 sm:text-right">
                  <div>Registered: {new Date(ticket.registeredAt).toLocaleString()}</div>
                  <div>Deadline: {new Date(ticket.deadlineAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Haversine Proximity Clustering Alert Banner */}
              {(ticket.isParent || ticket.parentId) && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start gap-3">
                  <Layers className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-sm block text-purple-950">
                      Spatial De-Duplication Clustering (Haversine Formula ≤ 50m)
                    </span>
                    {ticket.isParent ? (
                      <p>
                        This ticket is the <strong>Primary Cluster Anchor</strong>. It consolidates{' '}
                        <strong>{ticket.childDuplicateIds?.length} duplicate citizen report(s)</strong> within 50 meters,
                        preventing redundant field team dispatches. Closing this ticket will automatically resolve all linked
                        duplicates.
                      </p>
                    ) : (
                      <p>
                        This complaint was automatically linked as a child duplicate of primary ticket{' '}
                        <strong className="font-mono text-purple-700 font-bold">#{ticket.parentId}</strong> (detected within
                        spherical 50m radius). Field officers are dispatched to the primary site, and all verification proof
                        will sync directly to your dashboard.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Description & Category */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Citizen Issue Report
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    Category: <span className="text-slate-900">{ticket.category}</span>
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed">{ticket.description}</p>
                </div>
              </div>

              {/* Anti-Fraud & Telemetry Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>GPS Telemetry Verification</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {ticket.telemetry.latitude.toFixed(6)}, {ticket.telemetry.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GPS Accuracy:</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        ±{ticket.telemetry.accuracyMeters}m Verified
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location Landmark:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[180px]">
                        {ticket.telemetry.addressLabel}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                      <span>Anti-Tamper Hash:</span>
                      <span className="font-mono text-slate-500">{ticket.telemetry.telemetryHash}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <HardHat className="w-4 h-4 text-blue-600" />
                    <span>Field Assignment & Ingestion</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Department:</span>
                      <span className="font-bold text-slate-900">{ticket.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Officer:</span>
                      <span className="font-semibold text-slate-800">
                        {ticket.assignedOfficerName || 'Pending Assignment'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reported By:</span>
                      <span className="font-medium text-slate-800">{ticket.citizenName}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                      <span>Payload Sanitization:</span>
                      <span className="font-mono text-slate-500 truncate max-w-[180px]">
                        {ticket.evidenceFileName} ({(ticket.fileSizeBytes / (1024 * 1024)).toFixed(2)}MB)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Evidence & Dual Verification Comparison */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Visual Evidence & Verification</span>
                  {ticket.resolutionProof && (
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dual Photographic Verification Verified
                    </span>
                  )}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Citizen Submission Photo */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                    <div className="px-3 py-2 bg-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-slate-600" />
                        1. Citizen On-Site Evidence
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ticket.registeredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
                      <img
                        src={ticket.evidencePhotoUrl}
                        alt="Citizen on-site evidence"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-2.5 text-[11px] text-slate-600 bg-white border-t border-slate-200">
                      Captured via device camera telemetry. Mandatory visual proof recorded.
                    </div>
                  </div>

                  {/* Officer Resolution Photo (if resolved) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                    <div className="px-3 py-2 bg-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        2. Officer Physical Resolution Proof
                      </span>
                      {ticket.resolutionProof && (
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          Badge #{ticket.resolutionProof.officerBadge}
                        </span>
                      )}
                    </div>

                    <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
                      {ticket.resolutionProof ? (
                        <img
                          src={ticket.resolutionProof.photoUrl}
                          alt="Officer resolution proof"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-400 space-y-2">
                          <Camera className="w-8 h-8 mx-auto opacity-40" />
                          <div className="text-xs font-medium">Pending Officer Resolution Proof</div>
                          <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                            Officers cannot close tickets without uploading physical photographic evidence.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 text-[11px] text-slate-600 bg-white border-t border-slate-200">
                      {ticket.resolutionProof ? (
                        <div>
                          <strong className="text-slate-800">Action: </strong>
                          {ticket.resolutionProof.actionTaken}
                          <div className="text-slate-500 mt-0.5 italic">"{ticket.resolutionProof.notes}"</div>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Awaiting field officer on-site resolution proof.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Citizen Audit & Re-Open Warning (if reopened) */}
              {ticket.reopenedCount && ticket.reopenedCount > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-300 text-orange-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-orange-950">
                    <RotateCcw className="w-4 h-4 text-orange-600" />
                    <span>Citizen Audit: Resolution Reopened ({ticket.reopenedCount} times)</span>
                  </div>
                  <p className="text-xs text-orange-800">
                    Citizen rejected previous resolution: "{ticket.reopenedReason}". Cluster link was broken, priority elevated
                    to HIGH, and ticket placed on urgent 24-hour turnaround timer.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Audit Log Tab */
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-medium">
                Immutable cryptographic and procedural activity log for compliance audit:
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
                {ticket.auditLog.map((entry) => (
                  <div key={entry.id} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">{entry.action}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>
                          {entry.actorName} ({entry.actorRole})
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            {ticket.telemetry.latitude.toFixed(4)}, {ticket.telemetry.longitude.toFixed(4)} | SLA: {ticket.slaHours}h
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Officer Action: Mark Resolved (Opens Proof Upload Modal) */}
            {(isOfficerInDept || isAdmin) && ticket.status !== 'RESOLVED' && onOpenResolveModal && (
              <button
                onClick={() => onOpenResolveModal(ticket)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Upload Resolution Proof & Resolve
              </button>
            )}

            {/* Citizen Action: Citizen Audit / Re-Open Rights */}
            {ticket.status === 'RESOLVED' && onOpenReopenModal && (
              <button
                onClick={() => onOpenReopenModal(ticket)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reject Resolution & Reopen (Citizen Audit)
              </button>
            )}

            {/* Admin Action: Disciplinary Action / Overrides */}
            {isAdmin && onOpenDisciplinaryModal && (
              <button
                onClick={() => onOpenDisciplinaryModal(ticket)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <AlertOctagon className="w-4 h-4" />
                Commissioner Disciplinary Action
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
