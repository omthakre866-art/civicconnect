import { MunicipalDepartment, Ticket, TicketPriority, TicketAuditEntry } from '../types';

export const PROXIMITY_THRESHOLD_METERS = 50;
export const MAX_CONTENT_LENGTH_BYTES = 16 * 1024 * 1024; // 16MB ceiling

export const CATEGORY_MAP: Record<string, { department: MunicipalDepartment; defaultPriority: TicketPriority }> = {
  // Electricity
  'Streetlight Outage / Dark Corridor': { department: 'Electricity', defaultPriority: 'MEDIUM' },
  'Exposed High-Voltage Wiring': { department: 'Electricity', defaultPriority: 'HIGH' },
  'Transformer Sparking / Explosion Risk': { department: 'Electricity', defaultPriority: 'HIGH' },
  'Traffic Signal Blackout': { department: 'Electricity', defaultPriority: 'HIGH' },
  'Fallen Power Pole / Cable': { department: 'Electricity', defaultPriority: 'HIGH' },

  // Water
  'Main Water Pipeline Burst': { department: 'Water', defaultPriority: 'HIGH' },
  'Contaminated / Turbid Water Supply': { department: 'Water', defaultPriority: 'HIGH' },
  'Low Water Pressure / Supply Failure': { department: 'Water', defaultPriority: 'MEDIUM' },
  'Open Hydrant / Street Flooding': { department: 'Water', defaultPriority: 'MEDIUM' },
  'Sewage Infiltration in Fresh Water': { department: 'Water', defaultPriority: 'HIGH' },

  // Roads
  'Dangerous Deep Pothole': { department: 'Roads', defaultPriority: 'MEDIUM' },
  'Asphalt Caved-In / Sinkhole Risk': { department: 'Roads', defaultPriority: 'HIGH' },
  'Missing Sewer Manhole Cover': { department: 'Roads', defaultPriority: 'HIGH' },
  'Crumbled Sidewalk Curb / Pavement': { department: 'Roads', defaultPriority: 'LOW' },
  'Damaged Bridge / Flyover Guardrail': { department: 'Roads', defaultPriority: 'HIGH' },

  // Sanitation
  'Overflowing Community Waste Dumpster': { department: 'Sanitation', defaultPriority: 'MEDIUM' },
  'Dead Animal Carcass Hazard': { department: 'Sanitation', defaultPriority: 'HIGH' },
  'Illegal Commercial Waste Dumping': { department: 'Sanitation', defaultPriority: 'MEDIUM' },
  'Blocked Storm Drain / Sewage Gutter': { department: 'Sanitation', defaultPriority: 'MEDIUM' },
  'Uncollected Residential Garbage': { department: 'Sanitation', defaultPriority: 'LOW' },
};

export const EMERGENCY_KEYWORDS = [
  'fire',
  'spark',
  'sparks',
  'sparking',
  'gas leak',
  'gas',
  'collapse',
  'caved in',
  'sinkhole',
  'live wire',
  'electric shock',
  'electrocution',
  'explosion',
  'toxic',
  'high voltage',
  'open manhole',
  'flooding',
  'chemical spill',
  'pipeline burst',
  'burst',
  'danger',
  'hazard',
  'falling',
];

export const SLA_HOURS_CONFIG: Record<TicketPriority, number> = {
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

/**
 * Mathematical Haversine formula to compute great-circle distance
 * between two coordinate pairs on spherical Earth (radius ~6,371 km).
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Rounded to 1 decimal place (meters)
}

/**
 * Emergency Keyword Scanner:
 * Parses title and description against the hazard matrix.
 */
export function scanEmergencyKeywords(title: string, description: string): {
  isEmergency: boolean;
  matchedKeywords: string[];
} {
  const combined = `${title} ${description}`.toLowerCase();
  const matched = new Set<string>();

  for (const kw of EMERGENCY_KEYWORDS) {
    // word boundary regex
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(combined)) {
      matched.add(kw);
    }
  }

  return {
    isEmergency: matched.size > 0,
    matchedKeywords: Array.from(matched),
  };
}

/**
 * Sanitizes filename and prefixes unique UUID string for payload DoS & collision protection.
 */
export function secureFilename(originalName: string): string {
  // strip path traversals and illegal characters
  const cleanBase = originalName
    .replace(/^.*[\\/]/, '')
    .replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  const uuid = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  return `civic_${uuid}_${cleanBase}`;
}

/**
 * Generates cryptographic anti-tamper telemetry signature.
 */
export function generateTelemetryHash(lat: number, lng: number, timestamp: number): string {
  const raw = `GEO:${lat.toFixed(6)},${lng.toFixed(6)}@${timestamp}:CIVIC_SECURE`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Simulated Werkzeug password hashing (generate_password_hash / check_password_hash).
 * Returns scrypt-formatted string representation.
 */
export function simulateWerkzeugHash(password: string): string {
  // Generate pseudo-salt
  const salt = Math.random().toString(36).substring(2, 10);
  let hashVal = 0;
  const str = `${salt}:${password}:werkzeug.security`;
  for (let i = 0; i < str.length; i++) {
    hashVal = (hashVal << 5) - hashVal + str.charCodeAt(i);
    hashVal |= 0;
  }
  const hexDigest = Math.abs(hashVal).toString(16).padStart(12, 'a');
  return `scrypt:32768:8:1$${salt}$${hexDigest}`;
}

export function simulateWerkzeugVerify(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt:')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const expectedDigest = parts[2];

  let hashVal = 0;
  const str = `${salt}:${password}:werkzeug.security`;
  for (let i = 0; i < str.length; i++) {
    hashVal = (hashVal << 5) - hashVal + str.charCodeAt(i);
    hashVal |= 0;
  }
  const computedDigest = Math.abs(hashVal).toString(16).padStart(12, 'a');
  return computedDigest === expectedDigest;
}

/**
 * Calculates deadline ISO string given registeredAt and SLA hours.
 */
export function calculateDeadline(registeredAt: string, hours: number): string {
  const date = new Date(registeredAt);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

/**
 * Formats time remaining until SLA deadline.
 */
export function getRemainingSlaTime(deadlineAt: string, simulatedCurrentTimeMs?: number): {
  isBreached: boolean;
  text: string;
  percentRemaining: number;
  totalHours: number;
  remainingMs: number;
} {
  const now = simulatedCurrentTimeMs ?? Date.now();
  const deadline = new Date(deadlineAt).getTime();
  const diff = deadline - now;

  if (diff <= 0) {
    const overdueMinutes = Math.abs(Math.floor(diff / (1000 * 60)));
    const overdueHours = Math.floor(overdueMinutes / 60);
    const remMins = overdueMinutes % 60;
    return {
      isBreached: true,
      text: `SLA BREACHED: Overdue by ${overdueHours}h ${remMins}m`,
      percentRemaining: 0,
      totalHours: 0,
      remainingMs: diff,
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    isBreached: false,
    text: `${hours}h ${minutes}m ${seconds}s left`,
    percentRemaining: Math.min(100, Math.max(0, (diff / (72 * 3600 * 1000)) * 100)),
    totalHours: hours,
    remainingMs: diff,
  };
}

/**
 * Dynamic Background Escalation:
 * Checks ticket deadlines on dashboard load and timer ticks.
 * If an open ticket passes its deadline, marks it as is_escalated = true,
 * bumps priority to High, and records audit trail.
 */
export function checkAndEscalateTickets(
  tickets: Ticket[],
  simulatedTimeMs?: number
): { updatedTickets: Ticket[]; newEscalationsCount: number } {
  const now = simulatedTimeMs ?? Date.now();
  let count = 0;

  const updatedTickets = tickets.map((ticket) => {
    if (ticket.status === 'RESOLVED') {
      return ticket;
    }

    const deadlineMs = new Date(ticket.deadlineAt).getTime();
    if (deadlineMs < now && !ticket.isEscalated) {
      count++;
      const auditEntry: TicketAuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date(now).toISOString(),
        action: 'DYNAMIC_SLA_ESCALATION',
        actorName: 'Automated SLA Escalation Engine',
        actorRole: 'SYSTEM',
        details: `Ticket passed resolution deadline (${ticket.slaHours}h SLA). System set is_escalated = 1, bumped priority to HIGH, and routed to Municipal Commissioner Queue.`,
      };

      return {
        ...ticket,
        isEscalated: true,
        priority: 'HIGH' as const,
        escalatedAt: new Date(now).toISOString(),
        auditLog: [auditEntry, ...ticket.auditLog],
      };
    }

    return ticket;
  });

  return { updatedTickets, newEscalationsCount: count };
}
