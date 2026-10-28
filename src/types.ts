export type OfficeId = 'DRRMO' | 'OCSS' | 'ECO' | 'GSO';

export interface Employee {
  id: number;
  name: string;
  designation: string;
  officeId: OfficeId;
  avatarColor?: string;
}

export interface Participant {
  id: number;
  name: string;
  designation: string;
  officeId: OfficeId | 'DCFSSS';
}

export interface Office {
  id: OfficeId;
  name: string;
  shortName: string;
  fullName: string;
  description: string;
  headName: string;
  iconName: string;
  themeColor: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    accent: string;
  };
}

export interface CriterionSelection {
  criterionId: string;
  rank1EmployeeId: number;
  rank1EmployeeName: string;
  rank2EmployeeId?: number;
  rank2EmployeeName?: string;
  rank3EmployeeId?: number;
  rank3EmployeeName?: string;
}

export interface VoteRecord {
  id: string;
  voterId?: number | string;
  voterName: string;
  officeId: OfficeId;
  criteriaSelections: CriterionSelection[];
  // Summary/legacy optional fields
  candidateId?: number;
  candidateName?: string;
  candidateDesignation?: string;
  reason?: string;
  timestamp: string;
  verificationCode?: string;
}

export interface CandidateTally {
  employeeId: number;
  name: string;
  designation: string;
  totalPoints: number;
  weightedScore: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
  criteriaPoints: Record<string, number>;
  voteCount: number;
  percentage: number;
}

export interface OfficeTally {
  officeId: OfficeId;
  totalVotes: number;
  totalEmployees: number;
  candidates: CandidateTally[];
}

export type AwardCategory = 'best-employee' | 'popularity';

export interface PopularityVoteRecord {
  id: string;
  voterId?: number;
  voterName: string;
  voterOfficeId?: OfficeId | 'DCFSSS';
  nomineeId: number;
  nomineeName: string;
  nomineeOfficeId: OfficeId | 'DCFSSS';
  nomineeDesignation?: string;
  message?: string;
  timestamp: string;
  verificationCode?: string;
}

export interface PopularityNomineeTally {
  employeeId: number;
  name: string;
  designation: string;
  officeId: OfficeId | 'DCFSSS';
  voteCount: number;
  percentage: number;
  messages: {
    voterName: string;
    message: string;
    timestamp: string;
  }[];
}

export interface ElectionSettings {
  isResultsPublic: boolean;
  adminName: string;
}

export type AppStep = 'guidelines' | 'select-office' | 'criteria-voting' | 'popularity-voting' | 'success';
export type ViewTab = 'vote' | 'results' | 'guidelines' | 'admin';
