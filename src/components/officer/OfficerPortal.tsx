import React, { useState, useRef } from 'react';
import { useCivic } from '../../context/CivicContext';
import { Ticket, MunicipalDepartment, ResolutionProof } from '../../types';
import { getRemainingSlaTime } from '../../utils/engine';
import { TicketDetailModal } from '../shared/TicketDetailModal';
import {
  HardHat,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Camera,
  Upload,
  Eye,
  AlertOctagon,
  Building2,
  X,
} from 'lucide-react';

export const OfficerPortal: React.FC = () => {
  const { currentUser, tickets, simulatedTimeMs, resolveTicket, updateOfficerDepartment } = useCivic();

  const officerDept = currentUser?.department || 'Roads';
  const [selectedDept, setSelectedDept] = useState<MunicipalDepartment>(officerDept);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Resolution Modal state
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Camera capture inside resolution modal
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Filter department tickets
  const deptTickets = tickets.filter((t) => {
    if (t.department !== selectedDept) return false;
    if (statusFilter === 'OPEN') return t.status !== 'RESOLVED';
    if (statusFilter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  const activeCount = tickets.filter(
    (t) => t.department === selectedDept && t.status !== 'RESOLVED'
  ).length;

  const urgentCount = tickets.filter(
    (t) =>
      t.department === selectedDept &&
      t.status !== 'RESOLVED' &&
      (t.priority === 'HIGH' || t.isEscalated)
  ).length;

  const resolvedCount = tickets.filter(
    (t) => t.department === selectedDept && t.status === 'RESOLVED'
  ).length;

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn('Camera error:', err);
      setIsCameraActive(false);
      setProofPhotoUrl(
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80'
      );
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setProofPhotoUrl(canvas.toDataURL('image/jpeg', 0.85));
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProofPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    setResolveError(null);

    if (!proofPhotoUrl) {
      setResolveError(
        'Mandatory Photographic Proof: Field officers must upload on-site physical resolution evidence before closing.'
      );
      return;
    }

    const proof: ResolutionProof = {
      photoUrl: proofPhotoUrl,
      resolvedAt: new Date(simulatedTimeMs).toISOString(),
      resolvedByOfficerId: currentUser?.id || 'officer-current',
      resolvedByOfficerName: currentUser?.name || 'Department Field Officer',
      officerBadge: currentUser?.badgeNumber || 'FD-101',
      actionTaken: actionTaken.trim() || 'Physical maintenance and site repair completed.',
      notes: notes.trim() || 'Work inspected and physically verified on site.',
    };

    const res = resolveTicket(resolvingTicket.id, proof);
    if (!res.success) {
      setResolveError(res.error || 'Failed to resolve ticket');
    } else {
      setResolvingTicket(null);
      setProofPhotoUrl('');
      setActionTaken('');
      setNotes('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Clean Officer Header with Department Dropdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <HardHat className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Field Officer Terminal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Officer: <strong>{currentUser?.name}</strong> • Badge #{currentUser?.badgeNumber || 'RD-409'}
          </p>
        </div>

        {/* Department Dropdown Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-slate-700">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => {
                const newDept = e.target.value as MunicipalDepartment;
                setSelectedDept(newDept);
                updateOfficerDepartment(newDept);
              }}
              className="bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="Electricity">⚡ Electricity</option>
              <option value="Water">💧 Water</option>
              <option value="Roads">🛣️ Roads</option>
              <option value="Sanitation">🧹 Sanitation</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Active</span>
              <span className="text-sm font-bold text-slate-900">{activeCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-red-50 rounded-xl border border-red-200 text-center">
              <span className="text-[10px] text-red-600 font-bold uppercase block">Urgent</span>
              <span className="text-sm font-bold text-red-600">{urgentCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Resolved</span>
              <span className="text-sm font-bold text-emerald-600">{resolvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disciplinary Warning Banner (if any) */}
      {currentUser?.disciplinaryNotices && currentUser.disciplinaryNotices.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-red-950">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            <span>Executive Disciplinary Notice Issued by Commissioner</span>
          </div>
          {currentUser.disciplinaryNotices.map((n) => (
            <div key={n.id} className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-red-200">
              <strong className="text-red-700">{n.actionType}</strong> on Ticket #{n.ticketId}: "{n.reason}"
            </div>
          ))}
        </div>
      )}

      {/* Queue Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'OPEN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Active Queue ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'RESOLVED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Resolved Proofs ({resolvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All Division ({deptTickets.length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Showing {selectedDept} Tasks
        </span>
      </div>

      {/* Ticket Cards Grid */}
      <div className="space-y-4">
        {deptTickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Queue Clear for {selectedDept}</h3>
            <p className="text-xs text-slate-500">No complaints matching the selected filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptTickets.map((ticket) => {
              const sla = getRemainingSlaTime(ticket.deadlineAt, simulatedTimeMs);
              const isResolved = ticket.status === 'RESOLVED';

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {ticket.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ticket.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : ticket.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ticket.priority} ({ticket.slaHours}h SLA)
                        </span>
                        {ticket.isEmergency && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Hazard
                          </span>
                        )}
                        {ticket.isEscalated && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> Escalated
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-xs font-mono font-bold ${
                          isResolved ? 'text-emerald-700' : sla.isBreached ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {isResolved ? 'Resolved' : sla.text}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{ticket.title}</h3>
                    <p className="text-slate-600 text-xs line-clamp-2">{ticket.description}</p>
                  </div>

                  {/* Clustering info */}
                  {ticket.isParent && (
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                      <span className="font-semibold text-[11px] flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        Primary Anchor ({ticket.childDuplicateIds?.length} duplicate links)
                      </span>
                      <span className="text-[10px] text-purple-700">Cascades Resolution</span>
                    </div>
                  )}

                  {ticket.parentId && (
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px]">Sub-ticket of #{ticket.parentId}</span>
                    </div>
                  )}

                  {/* Citizen photo & telemetry preview */}
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={ticket.evidencePhotoUrl}
                      alt="Citizen evidence"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[11px] text-slate-600 truncate space-y-0.5">
                      <div className="font-semibold text-slate-800 truncate">{ticket.telemetry.addressLabel}</div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        GPS: {ticket.telemetry.latitude.toFixed(4)}, {ticket.telemetry.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Dossier
                    </button>

                    {!isResolved ? (
                      <button
                        onClick={() => {
                          setResolvingTicket(ticket);
                          setProofPhotoUrl('');
                          setActionTaken('');
                          setNotes('');
                          setResolveError(null);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Resolve with Photo Proof
                      </button>
                    ) : (
                      <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verification Logged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onOpenResolveModal={(t) => {
            setSelectedTicket(null);
            setResolvingTicket(t);
            setProofPhotoUrl('');
            setActionTaken('');
            setNotes('');
          }}
        />
      )}

      {/* Mandatory Photographic Resolution Proof Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Resolve Ticket #{resolvingTicket.id}</h2>
                <p className="text-xs text-slate-500">Mandatory photographic proof required</p>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolutionSubmit} className="space-y-3">
              {resolveError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200">
                  {resolveError}
                </div>
              )}

              {/* Camera / Photo Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Site Verification Photo *
                </label>

                {isCameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-4 py-1.5 bg-red-600 text-white font-bold text-xs rounded-full shadow"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {proofPhotoUrl && !isCameraActive && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 aspect-video max-h-40">
                    <img
                      src={proofPhotoUrl}
                      alt="Proof"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setProofPhotoUrl('')}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 text-white text-[10px] rounded-md font-semibold"
                    >
                      Change Photo
                    </button>
                  </div>
                )}

                {!proofPhotoUrl && !isCameraActive && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center gap-1 text-xs font-bold"
                    >
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Live Camera</span>
                    </button>
                    <label className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {!proofPhotoUrl && !isCameraActive && (
                  <div className="flex items-center gap-2 text-[10px] pt-1">
                    <span className="text-slate-400">Sample:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setProofPhotoUrl(
                          'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-600"
                    >
                      Completed Asphalt Fix
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Undertaken</label>
                <input
                  type="text"
                  required
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Secured transformer wiring and replaced insulator."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Notes</label>
                <textarea
                  required
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Inspected with multimeter; confirmed site safety."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!proofPhotoUrl}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  Confirm & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
