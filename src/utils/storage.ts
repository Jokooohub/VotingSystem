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
  isResultsPublic: false, // Default is confidential/anonymous (Fruit/Animal Codenames)
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
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isResultsPublic: isPublic }),
    });
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
 * Saves a new vote record, broadcast to server for live sync, and saves to localStorage.
 */
export async function saveVoteRecord(
  vote: Omit<VoteRecord, 'id' | 'timestamp' | 'verificationCode'>
): Promise<VoteRecord> {
  const allVotes = getStoredVotes();

  // Strict validation: Check if voter already cast a ballot
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
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(updatedVotes));
  localStorage.setItem(MY_VOTE_KEY, JSON.stringify(newRecord));

  // Sync with live server backend for multi-device live streaming
  try {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.allVotes) {
        updateStoredVotes(data.allVotes);
      }
    }
  } catch {
    // Offline / fallback mode
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

  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(updatedVotes));

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
    await fetch('/api/reset-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterIdOrName }),
    });
  } catch {
    // Offline fallback
  }

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
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify([]));
  localStorage.removeItem(MY_VOTE_KEY);

  try {
    await fetch('/api/reset-all', { method: 'POST' });
  } catch {
    // Offline fallback
  }
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
 * Real-time SSE and Polling Subscription
 * Allows all employees' screens to update live as votes are submitted!
 */
export function subscribeToLiveVotes(
  onVotesChange: (votes: VoteRecord[], settings?: ElectionSettings, isLive?: boolean) => void
): () => void {
  let isUnmounted = false;

  // 1. Initial fetch from server
  fetch('/api/votes')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && !isUnmounted) {
        if (Array.isArray(data.votes) && data.votes.length > 0) {
          updateStoredVotes(data.votes);
          onVotesChange(data.votes, data.settings, true);
        } else {
          // If server is empty but local has votes, sync up
          const local = getStoredVotes();
          if (local.length > 0) {
            onVotesChange(local, getElectionSettings(), true);
          }
        }
      }
    })
    .catch(() => {
      // Fallback to local
      onVotesChange(getStoredVotes(), getElectionSettings(), false);
    });

  // 2. EventSource (SSE) for zero-latency live updates
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

    eventSource.onerror = () => {
      // Reconnection handled automatically by browser EventSource
    };
  } catch (err) {
    console.warn('SSE not available, falling back to polling', err);
  }

  // 3. Fallback Poller (every 2.5s) to guarantee updates even across reconnects
  const pollInterval = setInterval(() => {
    if (isUnmounted) return;
    fetch('/api/votes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.votes)) {
          const currentLocal = getStoredVotes();
          if (data.votes.length !== currentLocal.length || JSON.stringify(data.votes) !== JSON.stringify(currentLocal)) {
            updateStoredVotes(data.votes);
            if (data.settings) saveElectionSettings(data.settings);
            onVotesChange(data.votes, data.settings, true);
          }
        }
      })
      .catch(() => {});
  }, 2500);

  // 4. Storage event listener for multi-tab support on same device
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
    window.removeEventListener('storage', handleStorageChange);
  };
}
