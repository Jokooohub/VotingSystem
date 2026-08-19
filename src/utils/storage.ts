import { VoteRecord, OfficeId, OfficeTally, ElectionSettings } from '../types';
import { EMPLOYEES, OFFICES, ALL_PARTICIPANTS } from '../data/officesData';

const VOTES_STORAGE_KEY = 'dcfsss_voting_records_v3';
const MY_VOTE_KEY = 'dcfsss_my_submitted_vote_v3';
const SETTINGS_STORAGE_KEY = 'dcfsss_election_settings_v3';
const ADMIN_AUTH_KEY = 'dcfsss_admin_authenticated_v3';

export const ADMIN_NAME = 'Joko J. Saco';
export const ADMIN_DESIGNATION = 'Project Technical Officer (ECO) / System Administrator';
export const ADMIN_DEFAULT_PASSCODE = 'teambuildingadmin1';

const DEFAULT_SETTINGS: ElectionSettings = {
  isResultsPublic: false,
  adminName: ADMIN_NAME,
};

export function getElectionSettings(): ElectionSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read settings from localStorage', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveElectionSettings(settings: ElectionSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export async function toggleResultsPublicSetting(isPublic: boolean): Promise<ElectionSettings> {
  const current = getElectionSettings();
  const updated: ElectionSettings = {
    ...current,
    isResultsPublic: isPublic,
  };
  saveElectionSettings(updated);

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isResultsPublic: isPublic }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        saveElectionSettings(data.settings);
        return data.settings;
      }
    }
  } catch {
    // Local fallback
  }

  return updated;
}

export function getIsAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(status: boolean): void {
  if (status) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }
}

export function getStoredVotes(): VoteRecord[] {
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read votes from localStorage', err);
    return [];
  }
}

export function updateStoredVotes(votes: VoteRecord[]): void {
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
}

/**
 * Checks if an employee has already cast their ballot.
 */
export function hasEmployeeVoted(voterNameOrId: string | number): boolean {
  if (!voterNameOrId) return false;
  const allVotes = getStoredVotes();

  if (typeof voterNameOrId === 'number') {
    return allVotes.some((v) => v.voterId === voterNameOrId);
  }

  const cleanName = String(voterNameOrId).trim().toLowerCase();
  return allVotes.some((v) => {
    if (v.voterId && String(v.voterId) === cleanName) return true;
    if (v.voterName && v.voterName.trim().toLowerCase() === cleanName) return true;
    return false;
  });
}

/**
 * Gets the submitted vote record for a specific employee.
 */
export function getVoteByVoter(voterNameOrId: string | number): VoteRecord | undefined {
  if (!voterNameOrId) return undefined;
  const allVotes = getStoredVotes();

  if (typeof voterNameOrId === 'number') {
    return allVotes.find((v) => v.voterId === voterNameOrId);
  }

  const cleanName = String(voterNameOrId).trim().toLowerCase();
  return allVotes.find((v) => {
    if (v.voterId && String(v.voterId) === cleanName) return true;
    if (v.voterName && v.voterName.trim().toLowerCase() === cleanName) return true;
    return false;
  });
}

/**
 * Returns a list of participant IDs who have already cast their vote.
 */
export function getVotedParticipantIds(): Set<number> {
  const allVotes = getStoredVotes();
  const votedIds = new Set<number>();

  allVotes.forEach((vote) => {
    if (typeof vote.voterId === 'number') {
      votedIds.add(vote.voterId);
    } else if (vote.voterName) {
      const match = ALL_PARTICIPANTS.find(
        (p) => p.name.trim().toLowerCase() === vote.voterName.trim().toLowerCase()
      );
      if (match) {
        votedIds.add(match.id);
      }
    }
  });

  return votedIds;
}

/**
 * Saves a new vote record, persists locally and to the server database.
 */
export async function saveVoteRecord(
  vote: Omit<VoteRecord, 'id' | 'timestamp' | 'verificationCode'>
): Promise<VoteRecord> {
  const allVotes = getStoredVotes();

  // Strict local validation
  if (vote.voterId && hasEmployeeVoted(vote.voterId)) {
    throw new Error(`Ballot already cast: ${vote.voterName || 'This employee'} has already submitted a vote.`);
  }

  if (vote.voterName && hasEmployeeVoted(vote.voterName)) {
    throw new Error(`Ballot already cast: "${vote.voterName}" has already submitted a vote.`);
  }

  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const hexPart = Math.random().toString(36).substring(2, 4).toUpperCase();
  const verificationCode = `DCFSSS-${vote.officeId}-${randomSuffix}-${hexPart}`;

  const newRecord: VoteRecord = {
    ...vote,
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    verificationCode,
  };

  const updatedVotes = [newRecord, ...allVotes];
  updateStoredVotes(updatedVotes);
  localStorage.setItem(MY_VOTE_KEY, JSON.stringify(newRecord));

  // Sync to server immediately
  try {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.allVotes && Array.isArray(data.allVotes)) {
        updateStoredVotes(data.allVotes);
      }
    } else if (res.status === 409) {
      const data = await res.json();
      if (data.allVotes) updateStoredVotes(data.allVotes);
      throw new Error(`Ballot already cast on another device for "${vote.voterName}".`);
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Ballot already cast')) {
      throw err;
    }
    // Fallback keeps local record
  }

  return newRecord;
}

/**
 * Resets/deletes the vote of a specific employee to allow them to revote.
 */
export async function resetSingleEmployeeVote(voterIdOrName: number | string): Promise<VoteRecord[]> {
  const allVotes = getStoredVotes();
  let updatedVotes: VoteRecord[] = [];

  if (typeof voterIdOrName === 'number') {
    updatedVotes = allVotes.filter((v) => v.voterId !== voterIdOrName);
  } else {
    const cleanName = String(voterIdOrName).trim().toLowerCase();
    updatedVotes = allVotes.filter((v) => {
      if (v.voterId && String(v.voterId) === cleanName) return false;
      if (v.voterName && v.voterName.trim().toLowerCase() === cleanName) return false;
      return true;
    });
  }

  updateStoredVotes(updatedVotes);

  const myVote = getMySubmittedVote();
  if (myVote) {
    if (
      (typeof voterIdOrName === 'number' && myVote.voterId === voterIdOrName) ||
      (typeof voterIdOrName === 'string' && myVote.voterName?.trim().toLowerCase() === String(voterIdOrName).trim().toLowerCase())
    ) {
      clearMySubmittedVote();
    }
  }

  try {
    const res = await fetch('/api/reset-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterIdOrName }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.allVotes) {
        updateStoredVotes(data.allVotes);
        return data.allVotes;
      }
    }
  } catch {}

  return updatedVotes;
}

export function getMySubmittedVote(): VoteRecord | null {
  try {
    const raw = localStorage.getItem(MY_VOTE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMySubmittedVote(): void {
  localStorage.removeItem(MY_VOTE_KEY);
}

export async function resetAllVotesToDefault(): Promise<void> {
  updateStoredVotes([]);
  localStorage.removeItem(MY_VOTE_KEY);

  try {
    await fetch('/api/reset-all', { method: 'POST' });
  } catch {}
}

export function getOfficeTallies(votes: VoteRecord[]): OfficeTally[] {
  return OFFICES.map((office) => {
    const officeEmployees = EMPLOYEES.filter((e) => e.officeId === office.id);
    const officeVotes = votes.filter((v) => v.officeId === office.id);
    const totalVotes = officeVotes.length;

    const candidateCounts: Record<number, number> = {};
    officeVotes.forEach((v) => {
      candidateCounts[v.candidateId] = (candidateCounts[v.candidateId] || 0) + 1;
    });

    const candidates = officeEmployees
      .map((emp) => {
        const count = candidateCounts[emp.id] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          employeeId: emp.id,
          name: emp.name,
          designation: emp.designation,
          voteCount: count,
          percentage,
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount || a.name.localeCompare(b.name));

    return {
      officeId: office.id,
      totalVotes,
      totalEmployees: officeEmployees.length,
      candidates,
    };
  });
}

/**
 * Explicit trigger to sync latest votes from server across devices
 */
export async function syncWithServerNow(): Promise<VoteRecord[]> {
  try {
    const local = getStoredVotes();
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localVotes: local }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.allVotes)) {
        updateStoredVotes(data.allVotes);
        if (data.settings) saveElectionSettings(data.settings);
        return data.allVotes;
      }
    }
  } catch {}
  return getStoredVotes();
}

/**
 * Real-time Multi-Device Sync Subscription
 * Synchronizes phone votes with laptop and all connected voter screens!
 */
export function subscribeToLiveVotes(
  onVotesChange: (votes: VoteRecord[], settings?: ElectionSettings, isLive?: boolean) => void
): () => void {
  let isUnmounted = false;

  const pullAndReconcile = async () => {
    if (isUnmounted) return;
    try {
      const local = getStoredVotes();
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localVotes: local }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.allVotes)) {
          updateStoredVotes(data.allVotes);
          if (data.settings) saveElectionSettings(data.settings);
          onVotesChange(data.allVotes, data.settings, true);
        }
      }
    } catch {
      onVotesChange(getStoredVotes(), getElectionSettings(), false);
    }
  };

  // 1. Initial 2-way sync
  pullAndReconcile();

  // 2. High-speed fallback poll every 1.5 seconds for instant multi-device reflection
  const pollInterval = setInterval(() => {
    pullAndReconcile();
  }, 1500);

  // 3. Instant sync on window focus and tab visibility change (e.g. switching between phone apps/laptop tabs)
  const handleFocusOrVisible = () => {
    if (document.visibilityState === 'visible') {
      pullAndReconcile();
    }
  };

  window.addEventListener('focus', handleFocusOrVisible);
  document.addEventListener('visibilitychange', handleFocusOrVisible);

  // 4. Server-Sent Events (SSE) for sub-millisecond push updates
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource('/api/live-stream');

    eventSource.onmessage = (event) => {
      if (isUnmounted) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'VOTE_ADDED' && payload.data?.allVotes) {
          updateStoredVotes(payload.data.allVotes);
          onVotesChange(payload.data.allVotes, undefined, true);
        } else if (payload.type === 'VOTES_RESET_SINGLE' && payload.data?.allVotes) {
          updateStoredVotes(payload.data.allVotes);
          onVotesChange(payload.data.allVotes, undefined, true);
        } else if (payload.type === 'VOTES_CLEARED') {
          updateStoredVotes([]);
          onVotesChange([], undefined, true);
        } else if (payload.type === 'SETTINGS_UPDATED') {
          saveElectionSettings(payload.data);
          onVotesChange(getStoredVotes(), payload.data, true);
        } else if (payload.type === 'INIT' && payload.data?.votes) {
          if (payload.data.votes.length > 0) {
            updateStoredVotes(payload.data.votes);
            onVotesChange(payload.data.votes, payload.data.settings, true);
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
  } catch (err) {
    console.warn('SSE not available', err);
  }

  // 5. Cross-tab storage synchronization
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === VOTES_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onVotesChange(parsed, getElectionSettings(), true);
      } catch {}
    } else if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onVotesChange(getStoredVotes(), parsed, true);
      } catch {}
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    isUnmounted = true;
    if (eventSource) {
      eventSource.close();
    }
    clearInterval(pollInterval);
    window.removeEventListener('focus', handleFocusOrVisible);
    document.removeEventListener('visibilitychange', handleFocusOrVisible);
    window.removeEventListener('storage', handleStorageChange);
  };
}
