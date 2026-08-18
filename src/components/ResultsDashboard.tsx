import React, { useState } from 'react';
import { VoteRecord, OfficeId, ElectionSettings } from '../types';
import { OFFICES, EMPLOYEES, ALL_PARTICIPANTS, getAnonymousProfile } from '../data/officesData';
import { getOfficeTallies, ADMIN_NAME, hasEmployeeVoted } from '../utils/storage';
import {
  Download,
  Vote,
  Award,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ResultsDashboardProps {
  votes: VoteRecord[];
  isAdmin: boolean;
  settings: ElectionSettings;
  onTogglePublicResults: (isPublic: boolean) => void;
  onAdminLoginClick: () => void;
  onAdminLogoutClick: () => void;
  onCastVoteClick: () => void;
  onResetElection: () => void;
  onResetSingleVote: (voterIdOrName: number | string, voterName: string) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  votes,
  isAdmin,
  settings,
  onTogglePublicResults,
  onAdminLoginClick,
  onAdminLogoutClick,
  onCastVoteClick,
  onResetElection,
  onResetSingleVote,
}) => {
  const [activeOfficeTab, setActiveOfficeTab] = useState<OfficeId>('ECO');
  const [adminViewMode, setAdminViewMode] = useState<'tallies' | 'voter-ledger'>('tallies');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'voted' | 'pending'>('all');
  const [adminPreviewAnonymous, setAdminPreviewAnonymous] = useState(false);

  const tallies = getOfficeTallies(votes);
  const totalVotes = votes.length;
  const totalEmployees = ALL_PARTICIPANTS.length;
  const divisionTurnoutPercent = Math.min(100, Math.round((totalVotes / totalEmployees) * 100));

  const activeTally = tallies.find((t) => t.officeId === activeOfficeTab) || tallies[0];
  const activeOffice = OFFICES.find((o) => o.id === activeOfficeTab);

  // If public view is active, show real names. In anonymous mode, show fruit/animal codenames unless admin is viewing in non-preview mode
  const showRealNames = settings.isResultsPublic || (isAdmin && !adminPreviewAnonymous);

  // Export full CSV report
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'DCFSSS BEST EMPLOYEE AWARD 2026 - OFFICIAL ELECTION REPORT\n\n';

    // Summary Tallies
    csvContent += '--- OFFICE TALLIES & RANKINGS ---\n';
    csvContent += 'Office ID,Office Name,Employee ID,Employee Name,Anonymous Codename,Designation,Vote Count,Percentage\n';
    tallies.forEach((tally) => {
      const office = OFFICES.find((o) => o.id === tally.officeId);
      tally.candidates.forEach((cand) => {
        const anon = getAnonymousProfile(cand.employeeId);
        const nameExport = showRealNames || isAdmin ? cand.name : anon.name;
        csvContent += `"${tally.officeId}","${office?.fullName}","${cand.employeeId}","${nameExport}","${anon.avatar} ${anon.name}","${cand.designation}",${cand.voteCount},${cand.percentage}%\n`;
      });
    });

    // Detailed Audit Ledger (if admin)
    if (isAdmin) {
      csvContent += '\n--- OFFICIAL VOTER AUDIT LEDGER ---\n';
      csvContent += 'Voter Name,Voter Office,Nominated Candidate,Candidate Office,Verification Code,Timestamp,Remark\n';
      votes.forEach((v) => {
        csvContent += `"${v.voterName}","${v.officeId}","${v.candidateName}","${v.officeId}","${v.verificationCode}","${v.timestamp}","${v.reason || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCFSSS_Voting_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto">
      {/* 🛡️ 1. Admin Master Control Bar (Only rendered for Admin) */}
      {isAdmin ? (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    Administrator: {ADMIN_NAME}
                  </span>
                  <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                    SYSTEM ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage election privacy and individual revotes.
                </p>
              </div>
            </div>

            {/* Visibility Toggle & Reset Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => onTogglePublicResults(false)}
                  className={`flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                    !settings.isResultsPublic
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Mask real names with fruit and animal codenames for voters"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Anonymous</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePublicResults(true)}
                  className={`flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                    settings.isResultsPublic
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Reveal real employee names to all participants"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Real Names</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Reset Entire Ledger Button */}
                <button
                  type="button"
                  onClick={onResetElection}
                  title="Reset all cast ballots to 0"
                  className="flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition border border-rose-800 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>

                <button
                  type="button"
                  onClick={onAdminLogoutClick}
                  title="Log out of Administrator mode"
                  className="min-h-[38px] min-w-[38px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition border border-slate-700 cursor-pointer flex items-center justify-center touch-manipulation"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Admin Navigation Sub-Tabs & Preview Mode */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAdminViewMode('tallies')}
                className={`flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation ${
                  adminViewMode === 'tallies'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Tallies</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminViewMode('voter-ledger')}
                className={`flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation ${
                  adminViewMode === 'voter-ledger'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Audit Ledger ({votes.length})</span>
              </button>
            </div>

            {/* Preview Toggle for Admin */}
            {!settings.isResultsPublic && (
              <button
                type="button"
                onClick={() => setAdminPreviewAnonymous(!adminPreviewAnonymous)}
                className={`w-full sm:w-auto min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation ${
                  adminPreviewAnonymous
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{adminPreviewAnonymous ? 'Viewing Codenames' : 'Preview Anonymous'}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 2. Voter Mode Announcement Banner */}
      {!settings.isResultsPublic && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-base">
              🎭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">
                  Live Anonymous Tally Active
                </span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.2 rounded-full">
                  Codenames
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                Employee identities are masked with fruit and animal codenames until released by the Admin.
              </p>
            </div>
          </div>

          {!isAdmin && (
            <button
              type="button"
              onClick={onAdminLoginClick}
              className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Header & Turnout Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {adminViewMode === 'voter-ledger' && isAdmin
                ? 'Official Voter Audit Ledger'
                : 'Division Election Tallies'}
            </h2>
            {settings.isResultsPublic ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Public (Real Names)
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Anonymous Codenames
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Turnout: <strong>{totalVotes}</strong> of {totalEmployees} division personnel ({divisionTurnoutPercent}%)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onCastVoteClick}
            className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
          >
            <Vote className="w-3.5 h-3.5" />
            <span>Cast Vote</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Office Tallies & Rankings */}
      {(adminViewMode === 'tallies' || !isAdmin) && (
        <div className="space-y-4">
          {/* 4 Office Selection Cards (2x2 on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {tallies.map((tally) => {
              const isTabActive = activeOfficeTab === tally.officeId;
              const percent =
                tally.totalEmployees > 0 ? Math.round((tally.totalVotes / tally.totalEmployees) * 100) : 0;

              return (
                <button
                  key={tally.officeId}
                  type="button"
                  onClick={() => setActiveOfficeTab(tally.officeId)}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition cursor-pointer min-h-[64px] touch-manipulation ${
                    isTabActive
                      ? 'bg-indigo-50/70 border-2 border-indigo-600 shadow-xs ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 active:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{tally.officeId}</span>
                    <span className="text-xs font-bold text-indigo-700">{tally.totalVotes} votes</span>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                    <span>Turnout</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Leaderboard Table for Active Office */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate">
                {activeOffice?.fullName} ({activeTally.candidates.length} Nominees)
              </span>
              <span className="text-xs text-slate-500 shrink-0 ml-2">
                Total: <strong>{activeTally.totalVotes}</strong>
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeTally.candidates.map((cand, index) => {
                const isLeading = index === 0 && cand.voteCount > 0;
                const anonProfile = getAnonymousProfile(cand.employeeId);
                const displayName = showRealNames ? cand.name : `${anonProfile.avatar} ${anonProfile.name}`;
                const displayDesignation = showRealNames
                  ? cand.designation
                  : `Anonymous Nominee • ${activeOfficeTab}`;

                return (
                  <div key={cand.employeeId} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 min-h-[58px]">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isLeading
                            ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {displayName}
                          </span>
                          {isLeading && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200 flex items-center gap-0.5 shrink-0">
                              <Award className="w-2.5 h-2.5" /> Lead
                            </span>
                          )}
                          {!showRealNames && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              Codename
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{displayDesignation}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {cand.voteCount} {cand.voteCount === 1 ? 'vote' : 'votes'}
                      </span>
                      <div className="text-[10px] text-slate-400">{cand.percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Detailed Voter Audit & Revote Manager (Admin Only) */}
      {adminViewMode === 'voter-ledger' && isAdmin && (
        <div className="space-y-3 sm:space-y-4">
          {/* Filter Bar (Scrollable on mobile) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setLedgerFilter('all')}
                className={`min-h-[34px] px-3 py-1 rounded-xl font-bold transition cursor-pointer shrink-0 touch-manipulation ${
                  ledgerFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Roster (46)
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('voted')}
                className={`min-h-[34px] px-3 py-1 rounded-xl font-bold transition cursor-pointer shrink-0 touch-manipulation ${
                  ledgerFilter === 'voted'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Voted ({votes.length})
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('pending')}
                className={`min-h-[34px] px-3 py-1 rounded-xl font-bold transition cursor-pointer shrink-0 touch-manipulation ${
                  ledgerFilter === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({ALL_PARTICIPANTS.length - votes.length})
              </button>
            </div>

            <span className="text-slate-400 text-[11px]">
              Tap "Allow Revote" to reset an individual voter's ballot.
            </span>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {ALL_PARTICIPANTS.filter((p) => {
                const voted = hasEmployeeVoted(p.name) || (p.id && hasEmployeeVoted(p.id));
                if (ledgerFilter === 'voted') return voted;
                if (ledgerFilter === 'pending') return !voted;
                return true;
              }).map((participant) => {
                const voteRecord = votes.find(
                  (v) =>
                    (v.voterId && v.voterId === participant.id) ||
                    (v.voterName && v.voterName.trim().toLowerCase() === participant.name.trim().toLowerCase())
                );
                const hasVoted = !!voteRecord;
                const anon = getAnonymousProfile(participant.id);

                return (
                  <div
                    key={participant.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          hasVoted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {hasVoted ? <CheckCircle2 className="w-4 h-4" /> : participant.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 truncate">
                            {participant.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded uppercase">
                            {participant.officeId}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            ({anon.avatar} {anon.name})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{participant.designation}</p>
                      </div>
                    </div>

                    {/* Vote Status and Revote Reset Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {hasVoted && voteRecord ? (
                        <>
                          <div className="text-left sm:text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">Voted:</span>
                              <strong className="text-indigo-900 font-bold text-[11px] sm:text-xs truncate max-w-[120px] sm:max-w-none">
                                {voteRecord.candidateName}
                              </strong>
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                {voteRecord.officeId}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {voteRecord.verificationCode}
                            </div>
                          </div>

                          {/* 🔄 Revote Reset Action */}
                          <button
                            type="button"
                            onClick={() => onResetSingleVote(participant.id, participant.name)}
                            title={`Reset ballot for ${participant.name} so they can revote`}
                            className="min-h-[36px] px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer touch-manipulation shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Allow Revote</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          Pending Ballot
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
