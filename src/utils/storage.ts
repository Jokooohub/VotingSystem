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
  isResultsPublic: false, // Default is confidential/anonymous (Admin-only real names)
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

export function toggleResultsPublicSetting(isPublic: boolean): ElectionSettings {
  const current = getElectionSettings();
  const updated: ElectionSettings = {
    ...current,
    isResultsPublic: isPublic,
  };
  saveElectionSettings(updated);
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

/**
 * Checks if an employee has already cast their ballot.
 */
export function hasEmployeeVoted(voterNameOrId: string | number): boolean {
  if (!voterNameOrId) return false;
  const allVotes = getStoredVotes();

  if (typeof voterNameOrId === 'number') {
    return allVotes.some((v) => v.voterId === voterNameOrId);
  }

  const cleanName = voterNameOrId.trim().toLowerCase();
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

  const cleanName = voterNameOrId.trim().toLowerCase();
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
 * Saves a new vote record, strictly validating that the employee has not already voted.
 */
export function saveVoteRecord(vote: Omit<VoteRecord, 'id' | 'timestamp' | 'verificationCode'>): VoteRecord {
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

  return newRecord;
}

/**
 * Resets/deletes the vote of a specific employee to allow them to revote.
 */
export function resetSingleEmployeeVote(voterIdOrName: number | string): VoteRecord[] {
  const allVotes = getStoredVotes();
  let updatedVotes: VoteRecord[] = [];

  if (typeof voterIdOrName === 'number') {
    updatedVotes = allVotes.filter((v) => v.voterId !== voterIdOrName);
  } else {
    const cleanName = voterIdOrName.trim().toLowerCase();
    updatedVotes = allVotes.filter((v) => {
      if (v.voterId && String(v.voterId) === cleanName) return false;
      if (v.voterName && v.voterName.trim().toLowerCase() === cleanName) return false;
      return true;
    });
  }

  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(updatedVotes));

  // If the currently stored session vote was for this person, clear it too
  const myVote = getMySubmittedVote();
  if (myVote) {
    if (
      (typeof voterIdOrName === 'number' && myVote.voterId === voterIdOrName) ||
      (typeof voterIdOrName === 'string' && myVote.voterName?.trim().toLowerCase() === voterIdOrName.trim().toLowerCase())
    ) {
      clearMySubmittedVote();
    }
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

export function resetAllVotesToDefault(): void {
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify([]));
  localStorage.removeItem(MY_VOTE_KEY);
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
