import React, { useState } from 'react';
import { Ticket, MunicipalDepartment } from '../../types';
import { MapPin, AlertTriangle, ShieldCheck, Layers, Eye } from 'lucide-react';

interface CivicMapProps {
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  selectedTicketId?: string;
  departmentFilter?: string;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  tickets,
  onSelectTicket,
  selectedTicketId,
  departmentFilter,
}) => {
  const [hoveredTicket, setHoveredTicket] = useState<Ticket | null>(null);

  // Filter tickets by department if specified
  const filteredTickets = tickets.filter((t) => {
    if (departmentFilter && departmentFilter !== 'ALL' && t.department !== departmentFilter) {
      return false;
    }
    return true;
  });

  // Center around 40.713, -74.006 with a bounding box for SVG projection
  // Lat: 40.708 to 40.718 (range: 0.010)
  // Lng: -74.012 to -74.000 (range: 0.012)
  const minLat = 40.708;
  const maxLat = 40.718;
  const minLng = -74.012;
  const maxLng = -74.000;

  const project = (lat: number, lng: number) => {
    // clamp
    const safeLat = Math.max(minLat, Math.min(maxLat, lat));
    const safeLng = Math.max(minLng, Math.min(maxLng, lng));
    const x = ((safeLng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (safeLat - minLat) / (maxLat - minLat)) * 100;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  };

  const getDeptColor = (dept: MunicipalDepartment) => {
    switch (dept) {
      case 'Electricity':
        return '#eab308'; // yellow
      case 'Water':
        return '#0284c7'; // blue
      case 'Roads':
        return '#ea580c'; // orange
      case 'Sanitation':
        return '#16a34a'; // green
      default:
        return '#64748b';
    }
  };

  return (
    <div className="relative w-full h-80 sm:h-96 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex flex-col">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-200">
        <MapPin className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-semibold tracking-wide">MUNICIPAL SPATIAL TELEMETRY</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300 font-mono">{filteredTickets.length} GPS PINS</span>
      </div>

      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Electricity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
          <span>Water</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
          <span>Roads</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Sanitation</span>
        </div>
      </div>

      {/* Synthetic GIS Grid Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="50%" cy="50%" r="45%" fill="url(#radarGlow)" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="4 4" />
        <circle cx="50%" cy="50%" r="25%" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 4" />
        {/* Road vector paths */}
        <path d="M 10% 40% Q 50% 60% 90% 45%" fill="none" stroke="#475569" strokeWidth="2.5" />
        <path d="M 40% 10% Q 45% 50% 55% 90%" fill="none" stroke="#475569" strokeWidth="2" />
        <path d="M 15% 80% L 85% 20%" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 3" />
      </svg>

      {/* Interactive Markers */}
      <div className="relative w-full h-full">
        {filteredTickets.map((t) => {
          const { x, y } = project(t.telemetry.latitude, t.telemetry.longitude);
          const isSelected = t.id === selectedTicketId;
          const isHovered = hoveredTicket?.id === t.id;
          const isResolved = t.status === 'RESOLVED';
          const deptColor = getDeptColor(t.department);

          return (
            <div
              key={t.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-transform duration-150 hover:scale-125"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onSelectTicket && onSelectTicket(t)}
              onMouseEnter={() => setHoveredTicket(t)}
              onMouseLeave={() => setHoveredTicket(null)}
            >
              {/* Emergency pulse animation */}
              {t.isEmergency && !isResolved && (
                <span
                  className="absolute -inset-2 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: '#ef4444' }}
                />
              )}

              {/* Cluster halo if parent */}
              {t.isParent && (
                <span
                  className="absolute -inset-1.5 rounded-full border-2 border-dashed animate-spin-slow opacity-90"
                  style={{ borderColor: deptColor }}
                />
              )}

              {/* Pin Icon / Marker */}
              <div
                className={`relative flex items-center justify-center rounded-full p-1.5 shadow-lg border transition-all ${
                  isSelected
                    ? 'ring-4 ring-white border-white scale-125 z-30'
                    : 'border-slate-900/80 hover:ring-2 hover:ring-blue-400'
                }`}
                style={{
                  backgroundColor: isResolved ? '#64748b' : t.isEmergency ? '#ef4444' : deptColor,
                }}
              >
                {t.isEmergency ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                ) : t.isParent ? (
                  <Layers className="w-3.5 h-3.5 text-white" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Small Ticket ID Pill */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap pointer-events-none transition-opacity ${
                  isSelected || isHovered
                    ? 'bg-slate-900 text-white border border-slate-700 opacity-100'
                    : 'bg-slate-900/70 text-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              >
                {t.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip Card for Hovered or Selected Ticket */}
      {(hoveredTicket || selectedTicketId) && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-30 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-2xl text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {(() => {
            const current = hoveredTicket || tickets.find((t) => t.id === selectedTicketId);
            if (!current) return null;

            return (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-blue-400 font-semibold">{current.id}</span>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{current.title}</h4>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: getDeptColor(current.department) }}
                  >
                    {current.department}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] line-clamp-2">{current.description}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{current.telemetry.latitude.toFixed(5)}, {current.telemetry.longitude.toFixed(5)}</span>
                  </div>
                  {current.isParent && (
                    <span className="bg-purple-900/60 text-purple-300 border border-purple-700/50 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                      Cluster Primary ({current.childDuplicateIds?.length} duplicates)
                    </span>
                  )}
                  {current.parentId && (
                    <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                      Duplicate Child of #{current.parentId}
                    </span>
                  )}
                  {current.isEmergency && (
                    <span className="bg-red-900/60 text-red-300 border border-red-700/50 px-1.5 py-0.2 rounded text-[10px] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> High Hazard
                    </span>
                  )}
                </div>

                {onSelectTicket && (
                  <button
                    onClick={() => onSelectTicket(current)}
                    className="w-full mt-2 py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Ticket Dossier
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
