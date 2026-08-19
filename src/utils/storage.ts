import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { VoteRecord, OfficeId, OfficeTally, ElectionSettings } from '../types';
import { EMPLOYEES, OFFICES, ALL_PARTICIPANTS } from '../data/officesData';

const VOTES_STORAGE_KEY = 'dcfsss_voting_records_v3';
const MY_VOTE_KEY = 'dcfsss_my_submitted_vote_v3';
const SETTINGS_STORAGE_KEY = 'dcfsss_election_settings_v3';
const ADMIN_AUTH_KEY = 'dcfsss_admin_authenticated_v3';

export const ADMIN_NAME = 'Joko J. Saco';
export const ADMIN_DESIGNATION = 'Project Technical Officer (ECO) / System Administrator';
export const ADMIN_DEFAULT_PASSCODE = 'teambuildingadmin1';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
    const settingsDocRef = doc(db, 'settings', 'global');
    await setDoc(settingsDocRef, {
      isResultsPublic: isPublic,
      adminName: updated.adminName || ADMIN_NAME,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/global');
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
 * Saves a new vote record to Google Cloud Firestore and local backup.
 * Firestore instantly broadcasts to all laptops, phones, and devices worldwide!
 */
export async function saveVoteRecord(
  vote: Omit<VoteRecord, 'id' | 'timestamp' | 'verificationCode'>
): Promise<VoteRecord> {
  const allVotes = getStoredVotes();

  // Strict local duplicate prevention
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
  const voteDocId = `vote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const cleanReason = vote.reason?.trim() || '';

  const newRecord: VoteRecord = {
    id: voteDocId,
    officeId: vote.officeId,
    candidateId: vote.candidateId,
    candidateName: vote.candidateName,
    candidateDesignation: vote.candidateDesignation,
    voterName: vote.voterName,
    voterId: typeof vote.voterId === 'number' ? vote.voterId : undefined,
    reason: cleanReason,
    timestamp,
    verificationCode,
  };

  // 1. Optimistic Local Save
  const updatedVotes = [newRecord, ...allVotes];
  updateStoredVotes(updatedVotes);
  localStorage.setItem(MY_VOTE_KEY, JSON.stringify(newRecord));

  // 2. Commit to Cloud Firestore Database (Clean payload with no undefined keys)
  const firestoreData: Record<string, any> = {
    id: voteDocId,
    officeId: vote.officeId,
    candidateId: vote.candidateId,
    candidateName: vote.candidateName,
    candidateDesignation: vote.candidateDesignation,
    voterName: vote.voterName,
    reason: cleanReason,
    timestamp,
    verificationCode,
  };

  if (typeof vote.voterId === 'number') {
    firestoreData.voterId = vote.voterId;
  }

  try {
    const voteRef = doc(db, 'votes', voteDocId);
    await setDoc(voteRef, firestoreData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `votes/${voteDocId}`);
  }

  return newRecord;
}

/**
 * Resets/deletes the vote of a specific employee from Firestore & local.
 */
export async function resetSingleEmployeeVote(voterIdOrName: number | string): Promise<VoteRecord[]> {
  const allVotes = getStoredVotes();
  let updatedVotes: VoteRecord[] = [];
  const targetVotes: VoteRecord[] = [];

  if (typeof voterIdOrName === 'number') {
    updatedVotes = allVotes.filter((v) => {
      if (v.voterId === voterIdOrName) {
        targetVotes.push(v);
        return false;
      }
      return true;
    });
  } else {
    const cleanName = String(voterIdOrName).trim().toLowerCase();
    updatedVotes = allVotes.filter((v) => {
      if (
        (v.voterId && String(v.voterId) === cleanName) ||
        (v.voterName && v.voterName.trim().toLowerCase() === cleanName)
      ) {
        targetVotes.push(v);
        return false;
      }
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

  // Delete from Cloud Firestore
  try {
    for (const target of targetVotes) {
      if (target.id) {
        await deleteDoc(doc(db, 'votes', target.id));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'votes');
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

/**
 * Resets all votes across all devices via Firestore batch delete.
 */
export async function resetAllVotesToDefault(): Promise<void> {
  updateStoredVotes([]);
  localStorage.removeItem(MY_VOTE_KEY);

  try {
    const snapshot = await getDocs(collection(db, 'votes'));
    const batch = writeBatch(db);
    snapshot.docs.forEach((docItem) => {
      batch.delete(docItem.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'votes');
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
 * Explicit trigger to sync latest votes from Cloud Firestore
 */
export async function syncWithServerNow(): Promise<VoteRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'votes'));
    const remoteVotes: VoteRecord[] = [];
    snapshot.forEach((docSnap) => {
      remoteVotes.push(docSnap.data() as VoteRecord);
    });
    updateStoredVotes(remoteVotes);
    return remoteVotes;
  } catch {
    return getStoredVotes();
  }
}

/**
 * Real-time Firebase Cloud Firestore Live Subscription
 * Listeners instantly push all votes to laptops, phones, tablets in <50ms!
 */
export function subscribeToLiveVotes(
  onVotesChange: (votes: VoteRecord[], settings?: ElectionSettings, isLive?: boolean) => void
): () => void {
  let isUnmounted = false;

  // 1. Initial local state push
  onVotesChange(getStoredVotes(), getElectionSettings(), true);

  // 2. Real-time Firestore Listener for Votes
  const unsubscribeVotes = onSnapshot(
    collection(db, 'votes'),
    (snapshot) => {
      if (isUnmounted) return;
      const liveVotes: VoteRecord[] = [];
      snapshot.forEach((docSnap) => {
        liveVotes.push(docSnap.data() as VoteRecord);
      });
      // Sort newest first
      liveVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      updateStoredVotes(liveVotes);
      onVotesChange(liveVotes, undefined, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'votes');
    }
  );

  // 3. Real-time Firestore Listener for Settings (Anonymous vs Public toggle)
  const unsubscribeSettings = onSnapshot(
    doc(db, 'settings', 'global'),
    (docSnap) => {
      if (isUnmounted) return;
      if (docSnap.exists()) {
        const data = docSnap.data() as ElectionSettings;
        saveElectionSettings(data);
        onVotesChange(getStoredVotes(), data, true);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    }
  );

  return () => {
    isUnmounted = true;
    unsubscribeVotes();
    unsubscribeSettings();
  };
}
