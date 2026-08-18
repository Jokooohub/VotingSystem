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

export interface VoteRecord {
  id: string;
  voterId?: number | string;
  voterName: string;
  officeId: OfficeId;
  candidateId: number;
  candidateName: string;
  candidateDesignation: string;
  reason?: string;
  timestamp: string;
  verificationCode: string;
}

export interface OfficeTally {
  officeId: OfficeId;
  totalVotes: number;
  totalEmployees: number;
  candidates: {
    employeeId: number;
    name: string;
    designation: string;
    voteCount: number;
    percentage: number;
  }[];
}

export interface ElectionSettings {
  isResultsPublic: boolean;
  adminName: string;
}

export type AppStep = 'select-office' | 'select-employee' | 'review' | 'success';
export type ViewTab = 'vote' | 'results' | 'guidelines' | 'admin';
