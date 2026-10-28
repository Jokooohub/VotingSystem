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
import {
  VoteRecord,
  OfficeId,
  OfficeTally,
  CandidateTally,
  ElectionSettings,
  CriterionSelection,
  Participant,
  Employee,
  PopularityVoteRecord,
  PopularityNomineeTally,
} from '../types';
import { EMPLOYEES, OFFICES, ALL_PARTICIPANTS } from '../data/officesData';
import { CRITERIA } from '../data/criteriaData';

const VOTES_STORAGE_KEY = 'dcfsss_voting_records_v4';
const MY_VOTE_KEY = 'dcfsss_my_submitted_vote_v4';
const POPULARITY_VOTES_STORAGE_KEY = 'dcfsss_popularity_votes_v4';
const MY_POPULARITY_VOTE_KEY = 'dcfsss_my_popularity_vote_v4';
const SETTINGS_STORAGE_KEY = 'dcfsss_election_settings_v4';
const ADMIN_AUTH_KEY = 'dcfsss_admin_authenticated_v4';

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
  console.warn('Firestore Operation notice: ', JSON.stringify(errInfo));
  const msg = errInfo.error.toLowerCase();
  if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('forbidden')) {
    throw new Error(JSON.stringify(errInfo));
  }
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
 * Identifies whether a participant, ID, or name corresponds to the Division Chief.
 */
export function isDivisionChief(
  participantOrIdOrName: Participant | Employee | number | string | null | undefined
): boolean {
  if (!participantOrIdOrName) return false;
  if (typeof participantOrIdOrName === 'object') {
    if ('id' in participantOrIdOrName && participantOrIdOrName.id === 1) return true;
    if ('officeId' in participantOrIdOrName && participantOrIdOrName.officeId === 'DCFSSS') return true;
    if (
      'designation' in participantOrIdOrName &&
      participantOrIdOrName.designation?.toLowerCase().includes('division chief')
    ) {
      return true;
    }
    if (
      'name' in participantOrIdOrName &&
      (participantOrIdOrName.name.toLowerCase().includes('cloribel') ||
        participantOrIdOrName.name.toLowerCase().includes('magichael'))
    ) {
      return true;
    }
    return false;
  }
  if (typeof participantOrIdOrName === 'number') {
    return participantOrIdOrName === 1;
  }
  const clean = String(participantOrIdOrName).trim().toLowerCase();
  return (
    clean === '1' ||
    clean.includes('cloribel') ||
    clean.includes('magichael') ||
    clean.includes('division chief')
  );
}

/**
 * Returns all office IDs for which the Division Chief has already cast a vote.
 */
export function getDivisionChiefVotedOffices(votes?: VoteRecord[]): OfficeId[] {
  const allVotes = votes || getStoredVotes();
  const chiefVotes = allVotes.filter(
    (v) => v.voterId === 1 || (v.voterName && isDivisionChief(v.voterName))
  );
  return Array.from(new Set(chiefVotes.map((v) => v.officeId)));
}

/**
 * Returns the office IDs that the Division Chief has not yet voted in.
 */
export function getDivisionChiefRemainingOffices(votes?: VoteRecord[]): OfficeId[] {
  const voted = getDivisionChiefVotedOffices(votes);
  return OFFICES.map((o) => o.id).filter((id) => !voted.includes(id));
}

/**
 * Checks whether an employee has cast a ballot in a specific office.
 */
export function hasEmployeeVotedInOffice(
  voterNameOrId: string | number,
  officeId: OfficeId,
  votes?: VoteRecord[]
): boolean {
  if (!voterNameOrId) return false;
  const allVotes = votes || getStoredVotes();

  if (typeof voterNameOrId === 'number') {
    return allVotes.some((v) => v.voterId === voterNameOrId && v.officeId === officeId);
  }

  const cleanName = String(voterNameOrId).trim().toLowerCase();
  return allVotes.some((v) => {
    if (v.officeId !== officeId) return false;
    if (v.voterId && String(v.voterId) === cleanName) return true;
    if (v.voterName && v.voterName.trim().toLowerCase() === cleanName) return true;
    return false;
  });
}

/**
 * Checks if an employee has already cast their ballot.
 * If officeId is specified and the voter is the Division Chief, checks that specific office.
 * For regular employees, checks if any ballot has been cast.
 */
export function hasEmployeeVoted(voterNameOrId: string | number, officeId?: OfficeId): boolean {
  if (!voterNameOrId) return false;
  const allVotes = getStoredVotes();

  // Division Chief can vote in ALL offices (ECO, GSO, OCSS, DRRMO)
  if (isDivisionChief(voterNameOrId)) {
    if (officeId) {
      return hasEmployeeVotedInOffice(voterNameOrId, officeId, allVotes);
    }
    // If no officeId passed, returns true only if all 4 offices are already voted
    const votedOffices = getDivisionChiefVotedOffices(allVotes);
    return OFFICES.every((o) => votedOffices.includes(o.id));
  }

  // Regular employees: 1 vote allowed across the entire election
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
 * Gets the submitted vote record for a specific employee (optionally filtered by office).
 */
export function getVoteByVoter(voterNameOrId: string | number, officeId?: OfficeId): VoteRecord | undefined {
  if (!voterNameOrId) return undefined;
  const allVotes = getStoredVotes();

  if (typeof voterNameOrId === 'number') {
    return allVotes.find((v) => {
      if (v.voterId !== voterNameOrId) return false;
      if (officeId && v.officeId !== officeId) return false;
      return true;
    });
  }

  const cleanName = String(voterNameOrId).trim().toLowerCase();
  return allVotes.find((v) => {
    const isNameMatch =
      (v.voterId && String(v.voterId) === cleanName) ||
      (v.voterName && v.voterName.trim().toLowerCase() === cleanName);
    if (!isNameMatch) return false;
    if (officeId && v.officeId !== officeId) return false;
    return true;
  });
}

/**
 * Returns a list of participant IDs who have already cast their vote.
 * For the Division Chief (id: 1), only added if all 4 offices are completed.
 */
export function getVotedParticipantIds(): Set<number> {
  const allVotes = getStoredVotes();
  const votedIds = new Set<number>();

  allVotes.forEach((vote) => {
    if (typeof vote.voterId === 'number') {
      if (vote.voterId === 1) {
        const chiefOffices = getDivisionChiefVotedOffices(allVotes);
        if (OFFICES.every((o) => chiefOffices.includes(o.id))) {
          votedIds.add(1);
        }
      } else {
        votedIds.add(vote.voterId);
      }
    } else if (vote.voterName) {
      const match = ALL_PARTICIPANTS.find(
        (p) => p.name.trim().toLowerCase() === vote.voterName.trim().toLowerCase()
      );
      if (match) {
        if (match.id === 1) {
          const chiefOffices = getDivisionChiefVotedOffices(allVotes);
          if (OFFICES.every((o) => chiefOffices.includes(o.id))) {
            votedIds.add(match.id);
          }
        } else {
          votedIds.add(match.id);
        }
      }
    }
  });

  return votedIds;
}

/**
 * Counts unique participants who have cast at least one ballot.
 */
export function getDistinctVotersCount(votes: VoteRecord[]): number {
  const voterKeys = new Set<string>();
  votes.forEach((v) => {
    if (v.voterId) {
      voterKeys.add(String(v.voterId));
    } else if (v.voterName) {
      voterKeys.add(v.voterName.trim().toLowerCase());
    }
  });
  return voterKeys.size;
}

/**
 * Saves a new multi-criteria vote record to Google Cloud Firestore and local backup.
 * Division Chief is permitted to submit one ballot per office (all 4 offices).
 */
export async function saveVoteRecord(
  vote: {
    officeId: OfficeId;
    voterId?: number;
    voterName: string;
    criteriaSelections: CriterionSelection[];
    reason?: string;
  }
): Promise<VoteRecord> {
  const allVotes = getStoredVotes();
  const isChief = isDivisionChief(vote.voterId || vote.voterName);

  if (isChief) {
    if (hasEmployeeVotedInOffice(vote.voterId || vote.voterName, vote.officeId, allVotes)) {
      throw new Error(`Ballot already cast: The Division Chief has already submitted an official ballot for ${vote.officeId}.`);
    }
  } else {
    if (vote.voterId && hasEmployeeVoted(vote.voterId)) {
      throw new Error(`Ballot already cast: ${vote.voterName || 'This employee'} has already submitted a vote.`);
    }

    if (vote.voterName && hasEmployeeVoted(vote.voterName)) {
      throw new Error(`Ballot already cast: "${vote.voterName}" has already submitted a vote.`);
    }
  }

  const timestamp = new Date().toISOString();
  const voteDocId = `vote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const cleanReason = vote.reason?.trim() || '';

  // Clean criteria selections
  const cleanedSelections: CriterionSelection[] = vote.criteriaSelections.map((sel) => {
    const item: CriterionSelection = {
      criterionId: sel.criterionId,
      rank1EmployeeId: sel.rank1EmployeeId,
      rank1EmployeeName: sel.rank1EmployeeName,
    };
    if (sel.rank2EmployeeId && sel.rank2EmployeeName) {
      item.rank2EmployeeId = sel.rank2EmployeeId;
      item.rank2EmployeeName = sel.rank2EmployeeName;
    }
    if (sel.rank3EmployeeId && sel.rank3EmployeeName) {
      item.rank3EmployeeId = sel.rank3EmployeeId;
      item.rank3EmployeeName = sel.rank3EmployeeName;
    }
    return item;
  });

  const newRecord: VoteRecord = {
    id: voteDocId,
    officeId: vote.officeId,
    voterName: vote.voterName,
    voterId: typeof vote.voterId === 'number' ? vote.voterId : undefined,
    criteriaSelections: cleanedSelections,
    reason: cleanReason,
    timestamp,
  };

  // 1. Local optimistic cache
  const updatedVotes = [newRecord, ...allVotes];
  updateStoredVotes(updatedVotes);
  localStorage.setItem(MY_VOTE_KEY, JSON.stringify(newRecord));

  // 2. Clean Firestore payload (no undefined fields)
  const firestoreData: Record<string, any> = {
    id: voteDocId,
    officeId: vote.officeId,
    voterName: vote.voterName,
    criteriaSelections: cleanedSelections.map((s) => {
      const entry: Record<string, any> = {
        criterionId: s.criterionId,
        rank1EmployeeId: s.rank1EmployeeId,
        rank1EmployeeName: s.rank1EmployeeName,
      };
      if (typeof s.rank2EmployeeId === 'number' && s.rank2EmployeeName) {
        entry.rank2EmployeeId = s.rank2EmployeeId;
        entry.rank2EmployeeName = s.rank2EmployeeName;
      }
      if (typeof s.rank3EmployeeId === 'number' && s.rank3EmployeeName) {
        entry.rank3EmployeeId = s.rank3EmployeeId;
        entry.rank3EmployeeName = s.rank3EmployeeName;
      }
      return entry;
    }),
    reason: cleanReason,
    timestamp,
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
 * If officeId is specified, only that office's ballot is removed.
 */
export async function resetSingleEmployeeVote(
  voterIdOrName: number | string,
  officeId?: OfficeId
): Promise<VoteRecord[]> {
  const allVotes = getStoredVotes();
  let updatedVotes: VoteRecord[] = [];
  const targetVotes: VoteRecord[] = [];

  const matchesTarget = (v: VoteRecord): boolean => {
    let voterMatches = false;
    if (typeof voterIdOrName === 'number') {
      voterMatches = v.voterId === voterIdOrName;
    } else {
      const cleanName = String(voterIdOrName).trim().toLowerCase();
      voterMatches =
        (v.voterId && String(v.voterId) === cleanName) ||
        (v.voterName && v.voterName.trim().toLowerCase() === cleanName);
    }
    if (!voterMatches) return false;
    if (officeId && v.officeId !== officeId) return false;
    return true;
  };

  updatedVotes = allVotes.filter((v) => {
    if (matchesTarget(v)) {
      targetVotes.push(v);
      return false;
    }
    return true;
  });

  updateStoredVotes(updatedVotes);

  const myVote = getMySubmittedVote();
  if (myVote && matchesTarget(myVote)) {
    clearMySubmittedVote();
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

/**
 * Computes official Office Tallies with criteria-weighted scoring.
 * Rank 1 = 3 points
 * Rank 2 = 2 points
 * Rank 3 = 1 point
 * Weighted Score = Sum(Points in Criterion * (Criterion Weight / 100))
 */
export function getOfficeTallies(votes: VoteRecord[]): OfficeTally[] {
  const criteriaMap = new Map(CRITERIA.map((c) => [c.id, c.weight]));

  return OFFICES.map((office) => {
    const officeEmployees = EMPLOYEES.filter((e) => e.officeId === office.id);
    const officeVotes = votes.filter((v) => v.officeId === office.id);
    const totalVotes = officeVotes.length;

    // Initialize stats map for each employee in the office
    const employeeStats = new Map<
      number,
      {
        totalPoints: number;
        weightedScore: number;
        firstPlaceCount: number;
        secondPlaceCount: number;
        thirdPlaceCount: number;
        criteriaPoints: Record<string, number>;
        voteCount: number;
      }
    >();

    officeEmployees.forEach((emp) => {
      employeeStats.set(emp.id, {
        totalPoints: 0,
        weightedScore: 0,
        firstPlaceCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        criteriaPoints: {},
        voteCount: 0,
      });
    });

    // Accumulate points from all submitted ballots
    officeVotes.forEach((vote) => {
      if (vote.criteriaSelections && vote.criteriaSelections.length > 0) {
        vote.criteriaSelections.forEach((sel) => {
          const weight = criteriaMap.get(sel.criterionId) || 20;
          const weightMultiplier = weight / 100;

          // Rank 1 (3 points)
          if (sel.rank1EmployeeId && employeeStats.has(sel.rank1EmployeeId)) {
            const stats = employeeStats.get(sel.rank1EmployeeId)!;
            stats.totalPoints += 3;
            stats.weightedScore += 3 * weightMultiplier;
            stats.firstPlaceCount += 1;
            stats.voteCount += 1;
            stats.criteriaPoints[sel.criterionId] = (stats.criteriaPoints[sel.criterionId] || 0) + 3;
          }

          // Rank 2 (2 points)
          if (sel.rank2EmployeeId && employeeStats.has(sel.rank2EmployeeId)) {
            const stats = employeeStats.get(sel.rank2EmployeeId)!;
            stats.totalPoints += 2;
            stats.weightedScore += 2 * weightMultiplier;
            stats.secondPlaceCount += 1;
            stats.criteriaPoints[sel.criterionId] = (stats.criteriaPoints[sel.criterionId] || 0) + 2;
          }

          // Rank 3 (1 point)
          if (sel.rank3EmployeeId && employeeStats.has(sel.rank3EmployeeId)) {
            const stats = employeeStats.get(sel.rank3EmployeeId)!;
            stats.totalPoints += 1;
            stats.weightedScore += 1 * weightMultiplier;
            stats.thirdPlaceCount += 1;
            stats.criteriaPoints[sel.criterionId] = (stats.criteriaPoints[sel.criterionId] || 0) + 1;
          }
        });
      } else if (vote.candidateId && employeeStats.has(vote.candidateId)) {
        // Legacy vote support
        const stats = employeeStats.get(vote.candidateId)!;
        stats.totalPoints += 3;
        stats.weightedScore += 3;
        stats.firstPlaceCount += 1;
        stats.voteCount += 1;
      }
    });

    // Calculate maximum possible points to derive accurate percentage
    const maxPossiblePoints = totalVotes > 0 ? totalVotes * 3 : 1;

    const candidates: CandidateTally[] = officeEmployees
      .map((emp) => {
        const stats = employeeStats.get(emp.id)!;
        const percentage =
          totalVotes > 0
            ? Math.min(100, Math.round((stats.totalPoints / (totalVotes * 3 * CRITERIA.length)) * 100))
            : 0;

        return {
          employeeId: emp.id,
          name: emp.name,
          designation: emp.designation,
          totalPoints: stats.totalPoints,
          weightedScore: Math.round(stats.weightedScore * 10) / 10,
          firstPlaceCount: stats.firstPlaceCount,
          secondPlaceCount: stats.secondPlaceCount,
          thirdPlaceCount: stats.thirdPlaceCount,
          criteriaPoints: stats.criteriaPoints,
          voteCount: stats.firstPlaceCount,
          percentage,
        };
      })
      .sort((a, b) => {
        if (b.weightedScore !== a.weightedScore) {
          return b.weightedScore - a.weightedScore;
        }
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        if (b.firstPlaceCount !== a.firstPlaceCount) {
          return b.firstPlaceCount - a.firstPlaceCount;
        }
        return a.name.localeCompare(b.name);
      });

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
 */
export function subscribeToLiveVotes(
  onVotesChange: (votes: VoteRecord[], settings?: ElectionSettings, isLive?: boolean) => void
): () => void {
  let isUnmounted = false;

  onVotesChange(getStoredVotes(), getElectionSettings(), true);

  const unsubscribeVotes = onSnapshot(
    collection(db, 'votes'),
    (snapshot) => {
      if (isUnmounted) return;
      const liveVotes: VoteRecord[] = [];
      snapshot.forEach((docSnap) => {
        liveVotes.push(docSnap.data() as VoteRecord);
      });
      liveVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      updateStoredVotes(liveVotes);
      onVotesChange(liveVotes, undefined, true);
    },
    (error) => {
      console.warn('Firestore votes subscription notice:', error?.message || error);
      onVotesChange(getStoredVotes(), getElectionSettings(), false);
    }
  );

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
      console.warn('Firestore settings subscription notice:', error?.message || error);
    }
  );

  return () => {
    isUnmounted = true;
    unsubscribeVotes();
    unsubscribeSettings();
  };
}

// ==========================================
// POPULARITY AWARD (PEOPLE'S CHOICE) STORAGE
// ==========================================

export function getStoredPopularityVotes(): PopularityVoteRecord[] {
  try {
    const raw = localStorage.getItem(POPULARITY_VOTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(POPULARITY_VOTES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read popularity votes from localStorage', err);
    return [];
  }
}

export function updateStoredPopularityVotes(votes: PopularityVoteRecord[]): void {
  localStorage.setItem(POPULARITY_VOTES_STORAGE_KEY, JSON.stringify(votes));
}

export function getMySubmittedPopularityVote(): PopularityVoteRecord | null {
  try {
    const raw = localStorage.getItem(MY_POPULARITY_VOTE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMySubmittedPopularityVote(): void {
  localStorage.removeItem(MY_POPULARITY_VOTE_KEY);
}

/**
 * Checks if a participant has already cast their Popularity Award ballot.
 */
export function hasEmployeeVotedPopularity(voterNameOrId: string | number): boolean {
  if (!voterNameOrId) return false;
  const allVotes = getStoredPopularityVotes();

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
 * Gets a participant's Popularity Award ballot if cast.
 */
export function getPopularityVoteByVoter(voterNameOrId: string | number): PopularityVoteRecord | undefined {
  if (!voterNameOrId) return undefined;
  const allVotes = getStoredPopularityVotes();

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
 * Saves a new Popularity Award ballot to Firestore & local storage.
 */
export async function savePopularityVoteRecord(vote: {
  voterId?: number;
  voterName: string;
  voterOfficeId?: OfficeId | 'DCFSSS';
  nomineeId: number;
  nomineeName: string;
  nomineeOfficeId: OfficeId | 'DCFSSS';
  nomineeDesignation?: string;
  message?: string;
}): Promise<PopularityVoteRecord> {
  const allVotes = getStoredPopularityVotes();

  if (vote.voterId && hasEmployeeVotedPopularity(vote.voterId)) {
    throw new Error(`Ballot already cast: ${vote.voterName || 'This participant'} has already submitted a Popularity Award vote.`);
  }

  if (vote.voterName && hasEmployeeVotedPopularity(vote.voterName)) {
    throw new Error(`Ballot already cast: "${vote.voterName}" has already submitted a Popularity Award vote.`);
  }

  if (vote.voterId && vote.voterId === vote.nomineeId) {
    throw new Error('Self-voting is not allowed for the Popularity Award.');
  }

  const timestamp = new Date().toISOString();
  const voteDocId = `pop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const cleanMessage = vote.message?.trim() || '';
  const verificationCode = `POP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newRecord: PopularityVoteRecord = {
    id: voteDocId,
    voterId: typeof vote.voterId === 'number' ? vote.voterId : undefined,
    voterName: vote.voterName,
    voterOfficeId: vote.voterOfficeId,
    nomineeId: vote.nomineeId,
    nomineeName: vote.nomineeName,
    nomineeOfficeId: vote.nomineeOfficeId,
    nomineeDesignation: vote.nomineeDesignation,
    message: cleanMessage,
    timestamp,
    verificationCode,
  };

  // 1. Optimistic local update
  const updated = [newRecord, ...allVotes];
  updateStoredPopularityVotes(updated);
  localStorage.setItem(MY_POPULARITY_VOTE_KEY, JSON.stringify(newRecord));

  // 2. Write to Firestore
  const firestoreData: Record<string, any> = {
    id: voteDocId,
    voterName: vote.voterName,
    nomineeId: vote.nomineeId,
    nomineeName: vote.nomineeName,
    nomineeOfficeId: vote.nomineeOfficeId,
    timestamp,
    verificationCode,
  };

  if (typeof vote.voterId === 'number') firestoreData.voterId = vote.voterId;
  if (vote.voterOfficeId) firestoreData.voterOfficeId = vote.voterOfficeId;
  if (vote.nomineeDesignation) firestoreData.nomineeDesignation = vote.nomineeDesignation;
  if (cleanMessage) firestoreData.message = cleanMessage;

  try {
    const voteRef = doc(db, 'popularity_votes', voteDocId);
    await setDoc(voteRef, firestoreData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `popularity_votes/${voteDocId}`);
  }

  return newRecord;
}

/**
 * Resets a single participant's Popularity Award ballot.
 */
export async function resetSinglePopularityVote(
  voterIdOrName: number | string
): Promise<PopularityVoteRecord[]> {
  const allVotes = getStoredPopularityVotes();
  let updatedVotes: PopularityVoteRecord[] = [];
  const targetVotes: PopularityVoteRecord[] = [];

  const matchesTarget = (v: PopularityVoteRecord): boolean => {
    if (typeof voterIdOrName === 'number') {
      return v.voterId === voterIdOrName;
    }
    const cleanName = String(voterIdOrName).trim().toLowerCase();
    return (
      (v.voterId && String(v.voterId) === cleanName) ||
      (v.voterName && v.voterName.trim().toLowerCase() === cleanName)
    );
  };

  updatedVotes = allVotes.filter((v) => {
    if (matchesTarget(v)) {
      targetVotes.push(v);
      return false;
    }
    return true;
  });

  updateStoredPopularityVotes(updatedVotes);

  const myVote = getMySubmittedPopularityVote();
  if (myVote && matchesTarget(myVote)) {
    clearMySubmittedPopularityVote();
  }

  try {
    for (const target of targetVotes) {
      if (target.id) {
        await deleteDoc(doc(db, 'popularity_votes', target.id));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'popularity_votes');
  }

  return updatedVotes;
}

/**
 * Resets all Popularity Award votes.
 */
export async function resetAllPopularityVotes(): Promise<void> {
  updateStoredPopularityVotes([]);
  clearMySubmittedPopularityVote();

  try {
    const snapshot = await getDocs(collection(db, 'popularity_votes'));
    const batch = writeBatch(db);
    snapshot.docs.forEach((docItem) => {
      batch.delete(docItem.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'popularity_votes');
  }
}

/**
 * Computes Popularity Award standings for all division personnel.
 */
export function getPopularityTallies(popularityVotes: PopularityVoteRecord[]): PopularityNomineeTally[] {
  const totalVotes = popularityVotes.length;

  // Track votes and testimonials for each person in ALL_PARTICIPANTS
  const talliesMap = new Map<
    number,
    {
      employeeId: number;
      name: string;
      designation: string;
      officeId: OfficeId | 'DCFSSS';
      voteCount: number;
      messages: { voterName: string; message: string; timestamp: string }[];
    }
  >();

  ALL_PARTICIPANTS.forEach((p) => {
    talliesMap.set(p.id, {
      employeeId: p.id,
      name: p.name,
      designation: p.designation,
      officeId: p.officeId,
      voteCount: 0,
      messages: [],
    });
  });

  popularityVotes.forEach((vote) => {
    if (talliesMap.has(vote.nomineeId)) {
      const tally = talliesMap.get(vote.nomineeId)!;
      tally.voteCount += 1;
      if (vote.message && vote.message.trim().length > 0) {
        tally.messages.push({
          voterName: vote.voterName,
          message: vote.message.trim(),
          timestamp: vote.timestamp,
        });
      }
    } else {
      // Dynamic fallback for any unlisted nominee
      talliesMap.set(vote.nomineeId, {
        employeeId: vote.nomineeId,
        name: vote.nomineeName,
        designation: vote.nomineeDesignation || 'Division Personnel',
        officeId: vote.nomineeOfficeId,
        voteCount: 1,
        messages: vote.message ? [{
          voterName: vote.voterName,
          message: vote.message.trim(),
          timestamp: vote.timestamp,
        }] : [],
      });
    }
  });

  return Array.from(talliesMap.values())
    .map((item) => ({
      ...item,
      percentage: totalVotes > 0 ? Math.round((item.voteCount / totalVotes) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return a.name.localeCompare(b.name);
    });
}

/**
 * Real-time Firebase Cloud Firestore Live Subscription for Popularity Votes
 */
export function subscribeToLivePopularityVotes(
  onVotesChange: (votes: PopularityVoteRecord[], isLive?: boolean) => void
): () => void {
  onVotesChange(getStoredPopularityVotes(), true);

  const unsubscribe = onSnapshot(
    collection(db, 'popularity_votes'),
    (snapshot) => {
      const liveVotes: PopularityVoteRecord[] = [];
      snapshot.forEach((docSnap) => {
        liveVotes.push(docSnap.data() as PopularityVoteRecord);
      });
      liveVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      updateStoredPopularityVotes(liveVotes);
      onVotesChange(liveVotes, true);
    },
    (error) => {
      console.warn('Firestore popularity votes subscription notice:', error?.message || error);
      onVotesChange(getStoredPopularityVotes(), false);
    }
  );

  return unsubscribe;
}
