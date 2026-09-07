import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  User,
  UserRole,
  MunicipalDepartment,
  ResolutionProof,
  DisciplinaryNotice,
  TicketPriority,
} from '../types';
import {
  SEED_USERS,
  SEED_TICKETS,
  ADMIN_SECRET_PASSKEY,
} from '../data/seedData';
import {
  haversineDistance,
  PROXIMITY_THRESHOLD_METERS,
  CATEGORY_MAP,
  scanEmergencyKeywords,
  SLA_HOURS_CONFIG,
  calculateDeadline,
  checkAndEscalateTickets,
  simulateWerkzeugHash,
  simulateWerkzeugVerify,
  secureFilename,
} from '../utils/engine';

interface SubmitComplaintInput {
  title: string;
  description: string;
  category: string;
  evidencePhotoUrl: string;
  originalFileName: string;
  fileSizeBytes: number;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  addressLabel: string;
  telemetryHash: string;
}

interface CivicContextType {
  currentUser: User | null;
  activePortal: UserRole;
  setActivePortal: (portal: UserRole) => void;
  users: User[];
  tickets: Ticket[];
  simulatedTimeMs: number;
  
  // Auth
  login: (email: string, pass: string, portal: UserRole, adminKey?: string) => { success: boolean; error?: string };
  register: (userData: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    phone?: string;
    department?: MunicipalDepartment;
    badgeNumber?: string;
    adminPasskey?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  quickSwitchUser: (user: User) => void;
  updateOfficerDepartment: (dept: MunicipalDepartment) => void;

  // Ingestion & Workflow
  submitComplaint: (input: SubmitComplaintInput) => {
    success: boolean;
    ticket?: Ticket;
    isClustered?: boolean;
    clusteredParentId?: string;
    clusteredDistanceMeters?: number;
    error?: string;
  };
  resolveTicket: (ticketId: string, proof: ResolutionProof) => { success: boolean; error?: string };
  reopenTicket: (ticketId: string, reason: string) => { success: boolean; error?: string };
  
  // Executive Authority
  issueDisciplinaryNotice: (
    officerId: string,
    ticketId: string,
    reason: string,
    actionType: DisciplinaryNotice['actionType']
  ) => void;
  reassignTicket: (ticketId: string, officerId: string, officerName: string) => void;
  executiveOverridePriority: (ticketId: string, priority: TicketPriority) => void;
  
  // Simulation & Debug Controls
  simulateTimeWarpHours: (hours: number) => void;
  resetAllData: () => void;
}

const CivicContext = createContext<CivicContextType | undefined>(undefined);

const STORAGE_KEY_TICKETS = 'civicconnect_tickets_v1';
const STORAGE_KEY_USERS = 'civicconnect_users_v1';
const STORAGE_KEY_CURRENT_USER = 'civicconnect_cur_user_v2';
const STORAGE_KEY_PORTAL = 'civicconnect_portal_v1';

export const CivicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  });

  const [activePortal, setActivePortal] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PORTAL) as UserRole;
      return saved || 'citizen';
    } catch {
      return 'citizen';
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
      // Start in initial unauthenticated state to present Starting Login & Registration page
      return null;
    } catch {
      return null;
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TICKETS);
      return saved ? JSON.parse(saved) : SEED_TICKETS;
    } catch {
      return SEED_TICKETS;
    }
  });

  const [simulatedTimeMs, setSimulatedTimeMs] = useState<number>(() => Date.now());

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets', e);
    }
  }, [tickets]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PORTAL, activePortal);
    } catch (e) {
      console.error('Failed to save portal', e);
    }
  }, [activePortal]);

  // Dynamic SLA Escalation Engine: runs on load and every 10 seconds
  const runSlaEscalationCheck = useCallback(() => {
    setTickets((prev) => {
      const { updatedTickets, newEscalationsCount } = checkAndEscalateTickets(prev, simulatedTimeMs);
      if (newEscalationsCount > 0) {
        console.warn(`[SLA Escalation Engine] ${newEscalationsCount} ticket(s) breached SLA deadlines and were auto-escalated.`);
      }
      return updatedTickets;
    });
  }, [simulatedTimeMs]);

  useEffect(() => {
    runSlaEscalationCheck();
    const interval = setInterval(runSlaEscalationCheck, 10000);
    return () => clearInterval(interval);
  }, [runSlaEscalationCheck]);

  // 1. Role-Gated Authentication
  const login = (
    email: string,
    pass: string,
    portal: UserRole,
    adminKey?: string
  ): { success: boolean; error?: string } => {
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      return { success: false, error: 'Invalid credentials: No account associated with this email.' };
    }

    // Role-gated check
    if (found.role !== portal) {
      return {
        success: false,
        error: `Role-Gated Access Violation: Account role is "${found.role.toUpperCase()}", which cannot access the ${portal.toUpperCase()} portal.`,
      };
    }

    // Cryptographic passkey validation for administrator
    if (portal === 'admin') {
      if (!adminKey || adminKey.trim() !== ADMIN_SECRET_PASSKEY) {
        return {
          success: false,
          error: 'Passkey Authorization Failed: Valid secret administrator key (admin2026) is required for executive access.',
        };
      }
    }

    // Werkzeug password hash check
    const isValid = simulateWerkzeugVerify(pass, found.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Authentication Failed: Incorrect password.' };
    }

    setCurrentUser(found);
    setActivePortal(portal);
    return { success: true };
  };

  const register = (data: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    phone?: string;
    department?: MunicipalDepartment;
    badgeNumber?: string;
    adminPasskey?: string;
  }): { success: boolean; error?: string } => {
    if (users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { success: false, error: 'Email already registered.' };
    }

    if (data.role === 'admin') {
      if (data.adminPasskey?.trim() !== ADMIN_SECRET_PASSKEY) {
        return {
          success: false,
          error: 'Unauthorized Executive Registration: Invalid secret administrative passkey.',
        };
      }
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      passwordHash: simulateWerkzeugHash(data.password),
      phone: data.phone?.trim(),
      department: data.department,
      badgeNumber: data.badgeNumber,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setActivePortal(data.role);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const quickSwitchUser = (user: User) => {
    setCurrentUser(user);
    setActivePortal(user.role);
  };

  const updateOfficerDepartment = (dept: MunicipalDepartment) => {
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, department: dept };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  // 2. Complaint Submission & Spatial De-Duplication Engine
  const submitComplaint = (input: SubmitComplaintInput) => {
    if (!currentUser) {
      return { success: false, error: 'Authentication required to file complaints.' };
    }

    // Telemetry enforcement
    if (input.latitude === 0 && input.longitude === 0) {
      return { success: false, error: 'Device GPS Telemetry required. Location coordinates could not be captured.' };
    }

    // Mandatory visual evidence
    if (!input.evidencePhotoUrl) {
      return { success: false, error: 'Mandatory On-Site Visual Evidence missing. Photographic proof is required.' };
    }

    // Payload DoS Protection
    if (input.fileSizeBytes > 16 * 1024 * 1024) {
      return { success: false, error: 'File rejected: Payload exceeds maximum 16MB ceiling.' };
    }

    const sanitizedFileName = secureFilename(input.originalFileName || 'evidence.jpg');

    // 1. Department Dispatch Matrix
    const categoryConfig = CATEGORY_MAP[input.category] || {
      department: 'Roads' as MunicipalDepartment,
      defaultPriority: 'MEDIUM' as TicketPriority,
    };

    // 2. Emergency Keyword Scanner
    const emergencyScan = scanEmergencyKeywords(input.title, input.description);
    const finalPriority: TicketPriority = emergencyScan.isEmergency
      ? 'HIGH'
      : categoryConfig.defaultPriority;

    const slaHours = SLA_HOURS_CONFIG[finalPriority];
    const registeredAt = new Date(simulatedTimeMs).toISOString();
    const deadlineAt = calculateDeadline(registeredAt, slaHours);

    // Auto-assign department field officer
    const deptOfficer = users.find(
      (u) => u.role === 'officer' && u.department === categoryConfig.department
    );

    // 3. Spatial De-Duplication Engine (Haversine Algorithm)
    // Find active tickets in the same department
    let clusterParentId: string | undefined = undefined;
    let minDistance = Infinity;

    for (const t of tickets) {
      if (t.status === 'RESOLVED') continue;
      if (t.department !== categoryConfig.department) continue;

      const dist = haversineDistance(
        input.latitude,
        input.longitude,
        t.telemetry.latitude,
        t.telemetry.longitude
      );

      // If distance <= 50 meters, candidate for clustering
      if (dist <= PROXIMITY_THRESHOLD_METERS && dist < minDistance) {
        minDistance = dist;
        // If the candidate is already a child, point to its parent, otherwise to it
        clusterParentId = t.parentId || t.id;
      }
    }

    const newTicketId = `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const auditHistory = [
      {
        id: `aud-${Date.now()}-1`,
        timestamp: registeredAt,
        action: 'TICKET_INGESTED',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        details: `Ticket registered with anti-fraud GPS telemetry and visual evidence (${sanitizedFileName}).`,
      },
      {
        id: `aud-${Date.now()}-2`,
        timestamp: registeredAt,
        action: 'AUTOMATED_DISPATCH',
        actorName: 'Category Dispatch Matrix',
        actorRole: 'SYSTEM' as const,
        details: `Dispatched to [${categoryConfig.department}] department based on category "${input.category}".`,
      },
    ];

    if (emergencyScan.isEmergency) {
      auditHistory.push({
        id: `aud-${Date.now()}-3`,
        timestamp: registeredAt,
        action: 'HAZARD_ELEVATION',
        actorName: 'Emergency Keyword Scanner',
        actorRole: 'SYSTEM' as const,
        details: `Emergency keywords detected: [${emergencyScan.matchedKeywords.join(', ')}]. Priority elevated to HIGH (${slaHours}h SLA).`,
      });
    }

    if (clusterParentId) {
      auditHistory.push({
        id: `aud-${Date.now()}-4`,
        timestamp: registeredAt,
        action: 'HAVERSINE_SPATIAL_CLUSTER',
        actorName: 'Spatial De-Duplication Engine',
        actorRole: 'SYSTEM' as const,
        details: `Proximity match detected: ${minDistance.toFixed(1)}m from primary ticket #${clusterParentId} (threshold ≤ 50m). Clustered to prevent duplicate field dispatch.`,
      });
    }

    const newTicket: Ticket = {
      id: newTicketId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      department: categoryConfig.department,
      priority: finalPriority,
      status: 'SUBMITTED',
      telemetry: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        timestamp: simulatedTimeMs,
        addressLabel: input.addressLabel,
        telemetryHash: input.telemetryHash,
        isVerified: true,
      },
      evidencePhotoUrl: input.evidencePhotoUrl,
      evidenceFileName: sanitizedFileName,
      fileSizeBytes: input.fileSizeBytes,
      isEmergency: emergencyScan.isEmergency,
      detectedEmergencyKeywords: emergencyScan.matchedKeywords,
      parentId: clusterParentId || null,
      isParent: false,
      registeredAt,
      slaHours,
      deadlineAt,
      isEscalated: false,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      citizenPhone: currentUser.phone,
      assignedOfficerId: deptOfficer?.id,
      assignedOfficerName: deptOfficer?.name,
      auditLog: auditHistory,
    };

    setTickets((prev) => {
      let updated = [newTicket, ...prev];
      // If we clustered under a parent, update parent's childDuplicateIds and mark isParent: true
      if (clusterParentId) {
        updated = updated.map((t) => {
          if (t.id === clusterParentId) {
            const existingKids = t.childDuplicateIds || [];
            return {
              ...t,
              isParent: true,
              childDuplicateIds: Array.from(new Set([...existingKids, newTicketId])),
            };
          }
          return t;
        });
      }
      return updated;
    });

    return {
      success: true,
      ticket: newTicket,
      isClustered: Boolean(clusterParentId),
      clusteredParentId: clusterParentId,
      clusteredDistanceMeters: clusterParentId ? minDistance : undefined,
    };
  };

  // 3. Dual-Verification Resolution & Cascading Cluster Resolution
  const resolveTicket = (
    ticketId: string,
    proof: ResolutionProof
  ): { success: boolean; error?: string } => {
    if (!proof.photoUrl) {
      return {
        success: false,
        error: 'Mandatory Photographic Resolution Proof required: Field officers cannot close tickets without on-site resolution evidence.',
      };
    }

    setTickets((prev) => {
      const target = prev.find((t) => t.id === ticketId);
      if (!target) return prev;

      const childIds = target.childDuplicateIds || [];
      const timestamp = new Date(simulatedTimeMs).toISOString();

      return prev.map((t) => {
        // Resolve target ticket
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'RESOLVED',
            resolutionProof: proof,
            auditLog: [
              {
                id: `aud-${Date.now()}-res`,
                timestamp,
                action: 'DUAL_VERIFICATION_RESOLVED',
                actorName: proof.resolvedByOfficerName,
                actorRole: 'officer',
                details: `Physical on-site resolution verified with photographic proof. Notes: ${proof.notes}`,
              },
              ...t.auditLog,
            ],
          };
        }

        // Cascading Cluster Resolution: If child duplicate, resolve and link parent's resolution proof!
        if (childIds.includes(t.id) || t.parentId === ticketId) {
          return {
            ...t,
            status: 'RESOLVED',
            resolutionProof: proof,
            auditLog: [
              {
                id: `aud-${Date.now()}-casc`,
                timestamp,
                action: 'CASCADING_CLUSTER_RESOLUTION',
                actorName: 'Cascading Resolution Engine',
                actorRole: 'SYSTEM',
                details: `Parent Ticket #${ticketId} was physically verified and resolved. Clustered ticket automatically marked RESOLVED with shared proof.`,
              },
              ...t.auditLog,
            ],
          };
        }

        return t;
      });
    });

    return { success: true };
  };

  // 4. Citizen Audit / Re-Open Rights Workflow
  const reopenTicket = (ticketId: string, reason: string): { success: boolean; error?: string } => {
    if (!reason.trim()) {
      return { success: false, error: 'Please specify the audit reason for rejecting the resolution.' };
    }

    const timestamp = new Date(simulatedTimeMs).toISOString();
    const freshDeadline = calculateDeadline(timestamp, 24); // Fresh 24h turnaround

    setTickets((prev) => {
      return prev.map((t) => {
        if (t.id === ticketId) {
          const newReopenCount = (t.reopenedCount || 0) + 1;
          return {
            ...t,
            status: 'REOPENED',
            parentId: null, // Breaks duplicate link
            isEscalated: true,
            priority: 'HIGH',
            slaHours: 24,
            deadlineAt: freshDeadline,
            reopenedCount: newReopenCount,
            reopenedReason: reason.trim(),
            reopenedAt: timestamp,
            auditLog: [
              {
                id: `aud-${Date.now()}-reopen`,
                timestamp,
                action: 'CITIZEN_AUDIT_REOPENED',
                actorName: currentUser?.name || 'Citizen Auditor',
                actorRole: 'citizen',
                details: `Resolution rejected by citizen: "${reason.trim()}". Duplicate link broken, priority elevated to HIGH, fresh 24h SLA initialized, alert dispatched to Municipal Commissioner.`,
              },
              ...t.auditLog,
            ],
          };
        }
        return t;
      });
    });

    return { success: true };
  };

  // 5. Central Executive Authority & Disciplinary Action
  const issueDisciplinaryNotice = (
    officerId: string,
    ticketId: string,
    reason: string,
    actionType: DisciplinaryNotice['actionType']
  ) => {
    const notice: DisciplinaryNotice = {
      id: `disp-${Date.now()}`,
      ticketId,
      timestamp: new Date(simulatedTimeMs).toISOString(),
      issuedBy: currentUser?.name || 'Municipal Commissioner',
      reason,
      actionType,
      officerName: users.find((u) => u.id === officerId)?.name || 'Field Officer',
      officerId,
    };

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === officerId) {
          const existing = u.disciplinaryNotices || [];
          return { ...u, disciplinaryNotices: [notice, ...existing] };
        }
        return u;
      })
    );

    // Also append to ticket audit log
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            auditLog: [
              {
                id: `aud-${Date.now()}-disp`,
                timestamp: new Date(simulatedTimeMs).toISOString(),
                action: `EXECUTIVE_DISCIPLINARY_${actionType}`,
                actorName: currentUser?.name || 'Municipal Commissioner',
                actorRole: 'admin',
                details: `Official executive disciplinary action issued to ${notice.officerName}: "${reason}"`,
              },
              ...t.auditLog,
            ],
          };
        }
        return t;
      })
    );
  };

  const reassignTicket = (ticketId: string, officerId: string, officerName: string) => {
    const timestamp = new Date(simulatedTimeMs).toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            assignedOfficerId: officerId,
            assignedOfficerName: officerName,
            auditLog: [
              {
                id: `aud-${Date.now()}-reassign`,
                timestamp,
                action: 'EXECUTIVE_REASSIGNMENT',
                actorName: currentUser?.name || 'Municipal Commissioner',
                actorRole: 'admin',
                details: `Commissioner reassigned ticket lead to ${officerName}.`,
              },
              ...t.auditLog,
            ],
          };
        }
        return t;
      })
    );
  };

  const executiveOverridePriority = (ticketId: string, priority: TicketPriority) => {
    const timestamp = new Date(simulatedTimeMs).toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const newHours = SLA_HOURS_CONFIG[priority];
          return {
            ...t,
            priority,
            slaHours: newHours,
            auditLog: [
              {
                id: `aud-${Date.now()}-override`,
                timestamp,
                action: 'PRIORITY_OVERRIDE',
                actorName: currentUser?.name || 'Municipal Commissioner',
                actorRole: 'admin',
                details: `Commissioner issued executive priority override to ${priority} (${newHours}h SLA).`,
              },
              ...t.auditLog,
            ],
          };
        }
        return t;
      })
    );
  };

  // Time Warp Simulation for testing SLA escalation
  const simulateTimeWarpHours = (hours: number) => {
    const newTime = simulatedTimeMs + hours * 3600 * 1000;
    setSimulatedTimeMs(newTime);
    setTickets((prev) => {
      const { updatedTickets } = checkAndEscalateTickets(prev, newTime);
      return updatedTickets;
    });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_TICKETS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    setUsers(SEED_USERS);
    setTickets(SEED_TICKETS);
    setCurrentUser(SEED_USERS[0]);
    setActivePortal('citizen');
    setSimulatedTimeMs(Date.now());
  };

  return (
    <CivicContext.Provider
      value={{
        currentUser,
        activePortal,
        setActivePortal,
        users,
        tickets,
        simulatedTimeMs,
        login,
        register,
        logout,
        quickSwitchUser,
        updateOfficerDepartment,
        submitComplaint,
        resolveTicket,
        reopenTicket,
        issueDisciplinaryNotice,
        reassignTicket,
        executiveOverridePriority,
        simulateTimeWarpHours,
        resetAllData,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};
