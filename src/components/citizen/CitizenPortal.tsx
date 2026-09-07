import React, { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { Ticket } from '../../types';
import { ComplaintSubmissionForm } from './ComplaintSubmissionForm';
import { CivicMap } from '../shared/CivicMap';
import { TicketDetailModal } from '../shared/TicketDetailModal';
import { getRemainingSlaTime } from '../../utils/engine';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  RotateCcw,
  FileText,
  AlertOctagon,
  Eye,
  Camera,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const { currentUser, tickets, simulatedTimeMs, reopenTicket } = useCivic();

  const [activeTab, setActiveTab] = useState<'my_tickets' | 'file_complaint' | 'map'>('my_tickets');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Reopen Modal state
  const [reopenModalTicket, setReopenModalTicket] = useState<Ticket | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Filter complaints filed by current user (or show all citizen tickets if demo user)
  const myTickets = tickets.filter(
    (t) => t.citizenId === currentUser?.id || currentUser?.role === 'citizen'
  );

  const activeCount = myTickets.filter((t) => t.status !== 'RESOLVED').length;
  const resolvedCount = myTickets.filter((t) => t.status === 'RESOLVED').length;

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenModalTicket) return;
    setReopenError(null);

    const res = reopenTicket(reopenModalTicket.id, reopenReason);
    if (!res.success) {
      setReopenError(res.error || 'Failed to reopen ticket.');
    } else {
      setReopenModalTicket(null);
      setReopenReason('');
      const updated = tickets.find((t) => t.id === reopenModalTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Clean, Simple Top Bar with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Citizen Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit municipal complaints with GPS telemetry, camera verification, and track guaranteed SLA deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active</span>
            <span className="text-base font-bold text-blue-600">{activeCount}</span>
          </div>
          <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Resolved</span>
            <span className="text-base font-bold text-emerald-600">{resolvedCount}</span>
          </div>
          <button
            onClick={() => setActiveTab('file_complaint')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Complaint</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('my_tickets')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'my_tickets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Complaints ({myTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('file_complaint')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'file_complaint'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Submission Form</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'map'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>City Map</span>
        </button>
      </div>

      {/* Tab 1: My Complaints */}
      {activeTab === 'my_tickets' && (
        <div className="space-y-4">
          {myTickets.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Complaints Lodged Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                File your first municipal complaint with GPS telemetry and photo verification.
              </p>
              <button
                onClick={() => setActiveTab('file_complaint')}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs"
              >
                File Complaint Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTickets.map((ticket) => {
                const sla = getRemainingSlaTime(ticket.deadlineAt, simulatedTimeMs);
                const isResolved = ticket.status === 'RESOLVED';
                const isReopened = ticket.status === 'REOPENED';

                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {ticket.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ticket.department === 'Electricity'
                                ? 'bg-amber-100 text-amber-800'
                                : ticket.department === 'Water'
                                ? 'bg-sky-100 text-sky-800'
                                : ticket.department === 'Roads'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ticket.department}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isReopened
                              ? 'bg-orange-100 text-orange-800'
                              : ticket.isEscalated
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isReopened ? (
                            <RotateCcw className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{ticket.status}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{ticket.title}</h3>
                      <p className="text-slate-600 text-xs line-clamp-2">{ticket.description}</p>
                    </div>

                    {/* Spatial Cluster Indicator */}
                    {(ticket.isParent || ticket.parentId) && (
                      <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="text-[11px]">
                          {ticket.isParent
                            ? `Cluster Anchor: ${ticket.childDuplicateIds?.length} duplicate(s) linked (≤ 50m)`
                            : `Clustered with Parent #${ticket.parentId}`}
                        </span>
                      </div>
                    )}

                    {/* SLA Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">SLA ({ticket.slaHours}h Target):</span>
                        <span
                          className={`font-mono font-bold ${
                            isResolved ? 'text-emerald-700' : sla.isBreached ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {isResolved ? 'Fulfilled' : sla.text}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${
                            isResolved
                              ? 'bg-emerald-500'
                              : sla.isBreached
                              ? 'bg-red-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: isResolved ? '100%' : `${sla.percentRemaining}%` }}
                        />
                      </div>
                    </div>

                    {/* Photographic Proof Card if Resolved */}
                    {isResolved && ticket.resolutionProof && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs text-emerald-950 font-bold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Officer Site Verification Proof
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700">
                            Badge #{ticket.resolutionProof.officerBadge}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={ticket.resolutionProof.photoUrl}
                            alt="Resolution"
                            className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-[11px] text-emerald-900 leading-tight truncate">
                            <div className="font-semibold">{ticket.resolutionProof.actionTaken}</div>
                            <div className="text-emerald-700 italic truncate mt-0.5">
                              "{ticket.resolutionProof.notes}"
                            </div>
                          </div>
                        </div>

                        {/* Citizen Audit / Re-Open Rights */}
                        <div className="pt-2 border-t border-emerald-200 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setReopenModalTicket(ticket)}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Reject & Re-Open (24h SLA)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(ticket.registeredAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details & Audit Log
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Submission Form */}
      {activeTab === 'file_complaint' && (
        <div className="max-w-xl mx-auto">
          <ComplaintSubmissionForm onSuccess={() => setActiveTab('my_tickets')} />
        </div>
      )}

      {/* Tab 3: GIS Map */}
      {activeTab === 'map' && (
        <CivicMap
          tickets={tickets}
          onSelectTicket={(t) => setSelectedTicket(t)}
          selectedTicketId={selectedTicket?.id}
        />
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onOpenReopenModal={(t) => {
            setSelectedTicket(null);
            setReopenModalTicket(t);
          }}
        />
      )}

      {/* Re-Open Modal */}
      {reopenModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Resolution & Re-Open</h3>
                <p className="text-xs text-slate-500">Ticket #{reopenModalTicket.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Reopening will sever any cluster duplicate link, elevate priority to <strong>HIGH</strong>, start a fresh <strong>24-hour SLA</strong>, and notify the Municipal Commissioner.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-3">
              {reopenError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200">
                  {reopenError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rejecting Site Repair
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Issue was not physically resolved: loose gravel placed in pothole washed away..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenModalTicket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl"
                >
                  Re-Open Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
