import React, { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { Ticket, MunicipalDepartment, DisciplinaryNotice, TicketPriority } from '../../types';
import { getRemainingSlaTime } from '../../utils/engine';
import { TicketDetailModal } from '../shared/TicketDetailModal';
import { CivicMap } from '../shared/CivicMap';
import {
  ShieldAlert,
  AlertOctagon,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Flame,
  AlertTriangle,
  Gavel,
  RefreshCw,
  Eye,
  FastForward,
  UserX,
  Sliders,
  X,
} from 'lucide-react';

export const ExecutivePortal: React.FC = () => {
  const {
    currentUser,
    tickets,
    users,
    simulatedTimeMs,
    simulateTimeWarpHours,
    issueDisciplinaryNotice,
    reassignTicket,
    executiveOverridePriority,
  } = useCivic();

  const [activeTab, setActiveTab] = useState<'breach_queue' | 'all_tickets' | 'map' | 'officers'>('breach_queue');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Disciplinary Modal State
  const [disciplinaryTicket, setDisciplinaryTicket] = useState<Ticket | null>(null);
  const [actionType, setActionType] = useState<DisciplinaryNotice['actionType']>('WARNING');
  const [disciplinaryReason, setDisciplinaryReason] = useState<string>('');
  const [disciplinarySuccess, setDisciplinarySuccess] = useState<string | null>(null);

  // Reassignment State
  const [reassignModalTicket, setReassignModalTicket] = useState<Ticket | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');

  // Priority Override State
  const [overrideModalTicket, setOverrideModalTicket] = useState<Ticket | null>(null);
  const [overridePriority, setOverridePriority] = useState<TicketPriority>('HIGH');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Cross-Departmental Metrics
  const totalComplaints = tickets.length;
  const activeComplaints = tickets.filter((t) => t.status !== 'RESOLVED').length;
  const resolvedComplaints = tickets.filter((t) => t.status === 'RESOLVED').length;
  const slaBreachedTickets = tickets.filter(
    (t) => t.status !== 'RESOLVED' && (t.isEscalated || new Date(t.deadlineAt).getTime() < simulatedTimeMs)
  );
  const emergencyHazards = tickets.filter((t) => t.isEmergency && t.status !== 'RESOLVED').length;
  const clusterCount = tickets.filter((t) => t.isParent).length;

  const departments: MunicipalDepartment[] = ['Electricity', 'Water', 'Roads', 'Sanitation'];
  const officers = users.filter((u) => u.role === 'officer');

  const filteredTickets = tickets.filter((t) => {
    if (deptFilter !== 'ALL' && t.department !== deptFilter) return false;
    return true;
  });

  const handleDisciplinarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaryTicket || !disciplinaryTicket.assignedOfficerId) return;

    issueDisciplinaryNotice(
      disciplinaryTicket.assignedOfficerId,
      disciplinaryTicket.id,
      disciplinaryReason,
      actionType
    );

    setDisciplinarySuccess(
      `Disciplinary Notice (${actionType}) issued to ${disciplinaryTicket.assignedOfficerName}.`
    );
    setTimeout(() => {
      setDisciplinaryTicket(null);
      setDisciplinaryReason('');
      setDisciplinarySuccess(null);
    }, 1200);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalTicket || !selectedOfficerId) return;
    const targetOfficer = users.find((u) => u.id === selectedOfficerId);
    if (!targetOfficer) return;

    reassignTicket(reassignModalTicket.id, targetOfficer.id, targetOfficer.name);
    setReassignModalTicket(null);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalTicket) return;
    executiveOverridePriority(overrideModalTicket.id, overridePriority, overrideReason);
    setOverrideModalTicket(null);
    setOverrideReason('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Clean Top Command Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Commissioner Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central authority oversight across all 4 departments, SLA enforcement, and disciplinary compliance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => simulateTimeWarpHours(24)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>+24h Fast-Forward (Test Breach)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Files</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{totalComplaints}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
          <div className="text-[10px] font-bold text-blue-600 uppercase">In Progress</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{activeComplaints}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-red-200 bg-red-50/50">
          <div className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> SLA Breached
          </div>
          <div className="text-xl font-bold text-red-600 mt-0.5">{slaBreachedTickets.length}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
          <div className="text-[10px] font-bold text-emerald-700 uppercase">Resolved Proofs</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{resolvedComplaints}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50">
          <div className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3" /> Clusters (≤50m)
          </div>
          <div className="text-xl font-bold text-purple-700 mt-0.5">{clusterCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50">
          <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
            <Flame className="w-3 h-3" /> Active Hazards
          </div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{emergencyHazards}</div>
        </div>
      </div>

      {/* 4 Municipal Departments Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {departments.map((dept) => {
          const deptTotal = tickets.filter((t) => t.department === dept).length;
          const deptResolved = tickets.filter((t) => t.department === dept && t.status === 'RESOLVED').length;
          const deptBreached = tickets.filter(
            (t) =>
              t.department === dept &&
              t.status !== 'RESOLVED' &&
              (t.isEscalated || new Date(t.deadlineAt).getTime() < simulatedTimeMs)
          ).length;
          const resolveRate = deptTotal > 0 ? Math.round((deptResolved / deptTotal) * 100) : 0;

          return (
            <div
              key={dept}
              onClick={() => setDeptFilter(deptFilter === dept ? 'ALL' : dept)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-white ${
                deptFilter === dept ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800">{dept}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    deptBreached > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {deptBreached > 0 ? `${deptBreached} Breaches` : 'On Target'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden my-1.5">
                <div
                  className={`h-full ${resolveRate > 60 ? 'bg-emerald-500' : resolveRate > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${resolveRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{deptResolved} Fixed</span>
                <span>{resolveRate}% SLA</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('breach_queue')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'breach_queue' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>SLA Breach Queue ({slaBreachedTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_tickets')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'all_tickets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Citywide Docket ({filteredTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GIS Map</span>
          </button>

          <button
            onClick={() => setActiveTab('officers')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'officers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Officer Roster</span>
          </button>
        </div>

        {/* Dept Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Dept:</span>
          {['ALL', 'Electricity', 'Water', 'Roads', 'Sanitation'].map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                deptFilter === d ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: SLA Breach Queue */}
      {activeTab === 'breach_queue' && (
        <div className="space-y-3">
          {slaBreachedTickets.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Zero SLA Breaches</h3>
              <p className="text-xs text-slate-500">
                All departments are operating within their guaranteed time targets.
              </p>
            </div>
          ) : (
            slaBreachedTickets.map((ticket) => {
              const sla = getRemainingSlaTime(ticket.deadlineAt, simulatedTimeMs);

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border-2 border-red-300 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded">
                        {ticket.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                        SLA Breach
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {ticket.department}
                      </span>
                      {ticket.isEmergency && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Hazard
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{ticket.title}</h4>
                    <p className="text-slate-600 text-xs line-clamp-1">{ticket.description}</p>

                    <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                      <span>Officer: <strong>{ticket.assignedOfficerName || 'Unassigned'}</strong></span>
                      <span>•</span>
                      <span className="text-red-600 font-bold font-mono">{sla.text}</span>
                    </div>
                  </div>

                  {/* Executive Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setDisciplinaryTicket(ticket);
                        setDisciplinaryReason(`SLA deadline breached without resolution on ${ticket.department} task.`);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Gavel className="w-3.5 h-3.5" /> Disciplinary Notice
                    </button>

                    <button
                      onClick={() => {
                        setReassignModalTicket(ticket);
                        setSelectedOfficerId('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reassign
                    </button>

                    <button
                      onClick={() => {
                        setOverrideModalTicket(ticket);
                        setOverridePriority(ticket.priority);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Override
                    </button>

                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Citywide Docket */}
      {activeTab === 'all_tickets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'RESOLVED';
            const sla = getRemainingSlaTime(ticket.deadlineAt, simulatedTimeMs);

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {ticket.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ticket.department}
                    </span>
                    {ticket.isEmergency && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white">
                        Hazard
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold ${
                      isResolved ? 'text-emerald-700' : sla.isBreached ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {isResolved ? 'Resolved' : sla.text}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm truncate">{ticket.title}</h4>
                <p className="text-slate-600 text-xs line-clamp-1">{ticket.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Officer: <strong>{ticket.assignedOfficerName || 'Assigned'}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* Tab 4: Officers Roster */}
      {activeTab === 'officers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {officers.map((officer) => {
            const assigned = tickets.filter(
              (t) => t.assignedOfficerId === officer.id && t.status !== 'RESOLVED'
            ).length;
            const completed = tickets.filter(
              (t) => t.assignedOfficerId === officer.id && t.status === 'RESOLVED'
            ).length;
            const noticeCount = officer.disciplinaryNotices?.length || 0;

            return (
              <div key={officer.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={officer.avatarUrl}
                    alt={officer.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{officer.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Badge: {officer.badgeNumber} • {officer.department}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Active</span>
                    <span className="font-bold text-slate-900">{assigned}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Resolved</span>
                    <span className="font-bold text-emerald-600">{completed}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-[10px] text-red-600 block font-bold">Notices</span>
                    <span className="font-bold text-red-700">{noticeCount}</span>
                  </div>
                </div>

                {noticeCount > 0 && (
                  <div className="p-2 bg-red-50 rounded-xl text-[11px] text-red-800 space-y-1">
                    <div className="font-bold">Active Disciplinary Notices:</div>
                    {officer.disciplinaryNotices?.map((n) => (
                      <div key={n.id} className="truncate">
                        • {n.actionType}: "{n.reason}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Disciplinary Modal */}
      {disciplinaryTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Issue Disciplinary Notice</h3>
                <p className="text-xs text-slate-500">Officer: {disciplinaryTicket.assignedOfficerName}</p>
              </div>
              <button onClick={() => setDisciplinaryTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {disciplinarySuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                {disciplinarySuccess}
              </div>
            ) : (
              <form onSubmit={handleDisciplinarySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sanction Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="WARNING">Formal Written Warning (1st Offense)</option>
                    <option value="OFFICIAL_REPRIMAND">Official Reprimand (Placed in Personnel File)</option>
                    <option value="SALARY_DEDUCTION">Administrative Fine / Salary Penalty</option>
                    <option value="SUSPENSION_REVIEW">Suspension Review by Civil Service Board</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Executive Justification</label>
                  <textarea
                    required
                    rows={3}
                    value={disciplinaryReason}
                    onChange={(e) => setDisciplinaryReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisciplinaryTicket(null)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                  >
                    Issue Sanction
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reassign Ticket #{reassignModalTicket.id}</h3>
                <p className="text-xs text-slate-500">Current: {reassignModalTicket.assignedOfficerName || 'Unassigned'}</p>
              </div>
              <button onClick={() => setReassignModalTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Officer</label>
                <select
                  required
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- Choose Field Officer --</option>
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.department || 'General'}) • #{o.badgeNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalTicket(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOfficerId}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Priority Modal */}
      {overrideModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Priority Override</h3>
                <p className="text-xs text-slate-500">Ticket #{overrideModalTicket.id}</p>
              </div>
              <button onClick={() => setOverrideModalTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Priority Level</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="HIGH">HIGH (24h SLA Target)</option>
                  <option value="MEDIUM">MEDIUM (48h SLA Target)</option>
                  <option value="LOW">LOW (72h SLA Target)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Override Reason</label>
                <textarea
                  required
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Elevated due to secondary public safety complaint"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalTicket(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
