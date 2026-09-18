export type UserRole = 'citizen' | 'officer' | 'admin';

export type MunicipalDepartment = 'Electricity' | 'Water' | 'Roads' | 'Sanitation';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TicketStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string; // simulated werkzeug scrypt hash or oauth
  department?: MunicipalDepartment; // for field officers
  badgeNumber?: string; // for field officers
  phone?: string;
  avatarUrl?: string;
  disciplinaryNotices?: DisciplinaryNotice[];
}

export interface DisciplinaryNotice {
  id: string;
  ticketId: string;
  timestamp: string;
  issuedBy: string;
  reason: string;
  actionType: 'WARNING' | 'REPRIMAND' | 'REASSIGNMENT' | 'SUSPENSION_REVIEW';
  officerName: string;
  officerId: string;
}

export interface TelemetryData {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: number;
  addressLabel: string;
  telemetryHash: string;
  isVerified: boolean;
}

export interface ResolutionProof {
  photoUrl: string;
  resolvedAt: string;
  resolvedByOfficerId: string;
  resolvedByOfficerName: string;
  officerBadge: string;
  notes: string;
  actionTaken: string;
}

export interface Ticket {
  id: string; // e.g. TK-2026-1042
  title: string;
  description: string;
  category: string;
  department: MunicipalDepartment;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Anti-fraud & telemetry
  telemetry: TelemetryData;
  evidencePhotoUrl: string;
  evidenceFileName: string;
  fileSizeBytes: number;

  // Keyword scanner
  isEmergency: boolean;
  detectedEmergencyKeywords: string[];

  // Spatial de-duplication
  parentId?: string | null; // if child duplicate of a primary ticket
  isParent: boolean;
  childDuplicateIds?: string[];

  // SLA & Escalation
  registeredAt: string; // ISO string
  slaHours: number; // 24, 48, 72
  deadlineAt: string; // ISO string
  isEscalated: boolean;
  escalatedAt?: string;

  // Citizen data
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;

  // Assignment
  assignedOfficerId?: string;
  assignedOfficerName?: string;

  // Resolution & Citizen Audit
  resolutionProof?: ResolutionProof;
  reopenedCount?: number;
  reopenedReason?: string;
  reopenedAt?: string;

  // Audit history
  auditLog: TicketAuditEntry[];
}

export interface TicketAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  details?: string;
}

export interface SystemStats {
  totalComplaints: number;
  activeComplaints: number;
  resolvedComplaints: number;
  slaBreaches: number;
  clustersConsolidated: number;
  emergencyCount: number;
  departmentBreakdown: Record<MunicipalDepartment, { total: number; resolved: number; breached: number }>;
}
