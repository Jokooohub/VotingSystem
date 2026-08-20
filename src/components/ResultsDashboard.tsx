import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoteRecord, OfficeId, ElectionSettings } from '../types';
import { OFFICES, EMPLOYEES, ALL_PARTICIPANTS, getAnonymousProfile } from '../data/officesData';
import { ADMIN_NAME, hasEmployeeVoted, syncWithServerNow } from '../utils/storage';
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
  Trophy,
  Crown,
  Medal,
  Search,
  Radio,
  Building2,
  ChevronRight,
  Flame,
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

interface RankedCandidate {
  employeeId: number;
  name: string;
  designation: string;
  officeId: OfficeId;
  voteCount: number;
  percentage: number;
  rank: number;
  codename: { name: string; avatar: string };
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
  // Ranking Scope: 'global' (Division-wide all 45 candidates) vs 'local' (Department filtered)
  const [rankingScope, setRankingScope] = useState<'global' | 'local'>('global');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<OfficeId>('ECO');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminViewMode, setAdminViewMode] = useState<'leaderboard' | 'voter-ledger'>('leaderboard');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'voted' | 'pending'>('all');
  const [adminPreviewAnonymous, setAdminPreviewAnonymous] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithServerNow();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const totalVotes = votes.length;
  const totalEmployees = ALL_PARTICIPANTS.length;
  const divisionTurnoutPercent = Math.min(100, Math.round((totalVotes / totalEmployees) * 100));

  const showRealNames = settings.isResultsPublic || (isAdmin && !adminPreviewAnonymous);

  // Compute live vote tallies for all 45 employees
  const rankedAllEmployees = useMemo(() => {
    const candidateCounts: Record<number, number> = {};
    votes.forEach((v) => {
      candidateCounts[v.candidateId] = (candidateCounts[v.candidateId] || 0) + 1;
    });

    const list: RankedCandidate[] = EMPLOYEES.map((emp) => {
      const count = candidateCounts[emp.id] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        employeeId: emp.id,
        name: emp.name,
        designation: emp.designation,
        officeId: emp.officeId,
        voteCount: count,
        percentage,
        rank: 0,
        codename: getAnonymousProfile(emp.id),
      };
    });

    // Sort descending by vote count, then by name
    list.sort((a, b) => b.voteCount - a.voteCount || a.name.localeCompare(b.name));

    // Assign ranking numbers (handling ties properly)
    let currentRank = 1;
    for (let i = 0; i < list.length; i++) {
      if (i > 0 && list[i].voteCount < list[i - 1].voteCount) {
        currentRank = i + 1;
      }
      list[i].rank = currentRank;
    }

    return list;
  }, [votes, totalVotes]);

  // Filter based on Global vs Local department
  const filteredRankings = useMemo(() => {
    let source = rankedAllEmployees;
    if (rankingScope === 'local') {
      source = source.filter((c) => c.officeId === selectedOfficeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.designation.toLowerCase().includes(q) ||
          c.codename.name.toLowerCase().includes(q) ||
          c.officeId.toLowerCase().includes(q)
      );
    }
    return source;
  }, [rankedAllEmployees, rankingScope, selectedOfficeFilter, searchQuery]);

  // Top 3 Podium Candidates
  const top1 = filteredRankings[0];
  const top2 = filteredRankings[1];
  const top3 = filteredRankings[2];

  // Remaining candidates (Rank 4+)
  const runnerUps = filteredRankings.slice(3);

  // Export full CSV report
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'DCFSSS BEST EMPLOYEE AWARD 2026 - OFFICIAL ELECTION REPORT\n\n';

    csvContent += '--- DIVISION-WIDE LIVE LEADERBOARD RANKINGS ---\n';
    csvContent += 'Rank,Employee ID,Employee Name,Anonymous Codename,Office,Designation,Vote Count,Share (%)\n';
    rankedAllEmployees.forEach((cand) => {
      const nameExport = showRealNames || isAdmin ? cand.name : cand.codename.name;
      csvContent += `${cand.rank},"${cand.employeeId}","${nameExport}","${cand.codename.avatar} ${cand.codename.name}","${cand.officeId}","${cand.designation}",${cand.voteCount},${cand.percentage}%\n`;
    });

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
    link.setAttribute('download', `DCFSSS_Leaderboard_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-16">
      {/* 🛡️ 1. Admin Master Control Bar (Only rendered for Admin) */}
      {isAdmin && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Administrator: {ADMIN_NAME}
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    SYSTEM ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live leaderboard management and voter privacy control.
                </p>
              </div>
            </div>

            {/* Visibility Toggle & Reset Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onTogglePublicResults(false)}
                  className={`flex-1 sm:flex-none min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                    !settings.isResultsPublic
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Mask real names with fruit and animal codenames"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Anonymous</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePublicResults(true)}
                  className={`flex-1 sm:flex-none min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
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
                <button
                  type="button"
                  onClick={onResetElection}
                  className="flex-1 sm:flex-none min-h-[36px] px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition border border-rose-800 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>

                <button
                  type="button"
                  onClick={onAdminLogoutClick}
                  className="min-h-[36px] min-w-[36px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition border border-slate-700 cursor-pointer flex items-center justify-center touch-manipulation"
                  title="Log out of Administrator mode"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub tabs: Leaderboard vs Audit Ledger */}
          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminViewMode('leaderboard')}
                className={`min-h-[34px] px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                  adminViewMode === 'leaderboard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminViewMode('voter-ledger')}
                className={`min-h-[34px] px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                  adminViewMode === 'voter-ledger'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audit Ledger ({votes.length})</span>
              </button>
            </div>

            {!settings.isResultsPublic && (
              <button
                type="button"
                onClick={() => setAdminPreviewAnonymous(!adminPreviewAnonymous)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                  adminPreviewAnonymous
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{adminPreviewAnonymous ? 'Viewing Codenames' : 'Preview Codenames'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Top Game-Style Rankings Switcher (Global vs Local) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Live Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  LIVE ELECTION LEADERBOARD
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" /> Live Real-time
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Turnout: <strong>{totalVotes}</strong> / {totalEmployees} votes cast ({divisionTurnoutPercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              title="Force sync latest votes from all voter devices"
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onCastVoteClick}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Vote</span>
            </button>
          </div>
        </div>

        {/* Global vs Local Tabs (Pill Switcher exactly like the game screenshot) */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            id="tab-global-rankings"
            onClick={() => {
              setRankingScope('global');
              setSearchQuery('');
            }}
            className={`flex-1 min-h-[44px] rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
              rankingScope === 'global'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Global Rankings</span>
          </button>

          <button
            type="button"
            id="tab-local-rankings"
            onClick={() => {
              setRankingScope('local');
              setSearchQuery('');
            }}
            className={`flex-1 min-h-[44px] rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
              rankingScope === 'local'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Local Rankings</span>
          </button>
        </div>

        {/* Department Sub-Pills when Local Rankings is active */}
        {rankingScope === 'local' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
          >
            {OFFICES.map((off) => {
              const count = votes.filter((v) => v.officeId === off.id).length;
              const isSelected = selectedOfficeFilter === off.id;

              return (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => setSelectedOfficeFilter(off.id)}
                  className={`min-h-[36px] px-3.5 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-600 shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{off.shortName}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count} votes
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* 3. GAME PODIUM & LEADERBOARD VIEW */}
      {adminViewMode === 'leaderboard' && (
        <div className="space-y-4">
          {/* 🌟 3.1 THE TOP 3 PODIUM (Game-style 1st, 2nd, 3rd) */}
          <div className="relative rounded-3xl p-5 sm:p-7 overflow-hidden border border-indigo-200/80 shadow-md bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white">
            {/* Background Decorative Glow */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300 via-indigo-500 to-transparent"></div>

            <div className="relative z-10 flex flex-col items-center">
              {/* Podium Header Label */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-white/15 mb-6">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {rankingScope === 'global'
                    ? 'Top Division Contenders'
                    : `${selectedOfficeFilter} Department Top Contenders`}
                </span>
              </div>

              {/* 3-Pillar Podium Container */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end w-full max-w-lg mx-auto">
                {/* 🥈 #2 Silver (Left) */}
                <div className="flex flex-col items-center text-center">
                  {top2 ? (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="flex flex-col items-center w-full"
                    >
                      {/* Avatar with Silver Frame */}
                      <div className="relative mb-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-0.5 shadow-lg flex items-center justify-center">
                          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
                            {showRealNames ? '👤' : top2.codename.avatar}
                          </div>
                        </div>
                        {/* Silver Medal Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                          2
                        </div>
                      </div>

                      {/* Name & Dept */}
                      <div className="w-full mt-2 px-1">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {showRealNames ? top2.name : top2.codename.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                          {top2.officeId}
                        </span>
                      </div>

                      {/* Vote Score Pill */}
                      <div className="mt-1.5 flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 text-xs font-extrabold text-slate-200">
                        <Trophy className="w-3 h-3 text-slate-300" />
                        <span>{top2.voteCount}</span>
                      </div>

                      {/* Podium Stand (Silver Height) */}
                      <div className="w-full h-20 sm:h-24 mt-3 bg-gradient-to-b from-slate-400/30 to-slate-600/40 rounded-t-2xl border-t-2 border-l border-r border-slate-300/40 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-xl sm:text-2xl font-black text-slate-300/80">2nd</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-40 w-full flex items-center justify-center text-slate-600 text-xs italic">
                      Pending
                    </div>
                  )}
                </div>

                {/* 🥇 #1 Gold (Center, Elevated Tallest) */}
                <div className="flex flex-col items-center text-center -mt-6">
                  {top1 ? (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0, y: -10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center w-full"
                    >
                      {/* Floating Crown above 1st place */}
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        className="mb-1 text-amber-400"
                      >
                        <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]" />
                      </motion.div>

                      {/* Avatar with Gold Glowing Frame */}
                      <div className="relative mb-2">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 p-1 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center">
                          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-3xl sm:text-4xl">
                            {showRealNames ? '🌟' : top1.codename.avatar}
                          </div>
                        </div>
                        {/* Gold Medal Badge */}
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-white">
                          1
                        </div>
                      </div>

                      {/* Name & Dept */}
                      <div className="w-full mt-2.5 px-1">
                        <h4 className="font-extrabold text-sm sm:text-base text-amber-300 truncate">
                          {showRealNames ? top1.name : top1.codename.name}
                        </h4>
                        <span className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider block truncate">
                          {top1.officeId} • Leader
                        </span>
                      </div>

                      {/* Vote Score Pill */}
                      <div className="mt-1.5 flex items-center gap-1 bg-amber-400/20 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 text-xs sm:text-sm font-black text-amber-300 shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{top1.voteCount} votes</span>
                      </div>

                      {/* Podium Stand (Gold Tallest Height) */}
                      <div className="w-full h-28 sm:h-32 mt-3 bg-gradient-to-b from-amber-400/30 to-amber-600/40 rounded-t-2xl border-t-2 border-l border-r border-amber-300/50 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 opacity-50 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:8px_8px]"></div>
                        <span className="text-2xl sm:text-3xl font-black text-amber-300 relative z-10">1st</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-48 w-full flex items-center justify-center text-slate-600 text-xs italic">
                      No Votes Yet
                    </div>
                  )}
                </div>

                {/* 🥉 #3 Bronze (Right) */}
                <div className="flex flex-col items-center text-center">
                  {top3 ? (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="flex flex-col items-center w-full"
                    >
                      {/* Avatar with Bronze Frame */}
                      <div className="relative mb-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-600 to-yellow-800 p-0.5 shadow-lg flex items-center justify-center">
                          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
                            {showRealNames ? '👤' : top3.codename.avatar}
                          </div>
                        </div>
                        {/* Bronze Medal Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                          3
                        </div>
                      </div>

                      {/* Name & Dept */}
                      <div className="w-full mt-2 px-1">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {showRealNames ? top3.name : top3.codename.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                          {top3.officeId}
                        </span>
                      </div>

                      {/* Vote Score Pill */}
                      <div className="mt-1.5 flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 text-xs font-extrabold text-slate-200">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        <span>{top3.voteCount}</span>
                      </div>

                      {/* Podium Stand (Bronze Lowest Height) */}
                      <div className="w-full h-16 sm:h-20 mt-3 bg-gradient-to-b from-amber-800/30 to-amber-950/40 rounded-t-2xl border-t-2 border-l border-r border-amber-600/40 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-xl sm:text-2xl font-black text-amber-500/80">3rd</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-40 w-full flex items-center justify-center text-slate-600 text-xs italic">
                      Pending
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 📋 3.2 THE RANKINGS LIST (Rank 4 and below, matching game list design) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            {/* Search and Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Full Roster Rankings ({filteredRankings.length} Nominees)
                </h3>
              </div>

              {/* Fast Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[36px] bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* List with Animated Reordering */}
            <div className="space-y-2">
              <AnimatePresence>
                {filteredRankings.map((cand, idx) => {
                  const isTop3 = cand.rank <= 3;
                  const rankDisplay = cand.rank;

                  return (
                    <motion.div
                      key={cand.employeeId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 min-h-[64px] ${
                        cand.rank === 1 && cand.voteCount > 0
                          ? 'bg-amber-50/70 border-amber-300/80 shadow-xs'
                          : cand.rank === 2 && cand.voteCount > 0
                          ? 'bg-slate-50 border-slate-300'
                          : cand.rank === 3 && cand.voteCount > 0
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Left side: Rank number + Character Frame + Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Bold Rank Number (Game typography) */}
                        <div
                          className={`w-7 sm:w-8 font-black text-sm sm:text-base text-center shrink-0 ${
                            cand.rank === 1
                              ? 'text-amber-500 font-black text-lg'
                              : cand.rank === 2
                              ? 'text-slate-400 font-bold text-base'
                              : cand.rank === 3
                              ? 'text-amber-700 font-bold text-base'
                              : 'text-slate-400'
                          }`}
                        >
                          {rankDisplay}
                        </div>

                        {/* Framed Character Avatar with cute badge corner */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-2xs border ${
                              cand.rank === 1
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : cand.rank === 2
                                ? 'bg-slate-100 border-slate-300'
                                : cand.rank === 3
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            {showRealNames ? '👤' : cand.codename.avatar}
                          </div>

                          {/* Level Star Corner Badge */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[8px] flex items-center justify-center shadow-xs">
                            ⭐
                          </div>
                        </div>

                        {/* Candidate Identity */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {showRealNames ? cand.name : cand.codename.name}
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {cand.officeId}
                            </span>
                            {!showRealNames && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 shrink-0">
                                Codename
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {showRealNames ? cand.designation : `Anonymous Candidate • ${cand.officeId}`}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Trophy Score & Game Tier Ribbon */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Vote Score with Trophy */}
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 font-extrabold text-xs sm:text-sm text-slate-900">
                            <Trophy
                              className={`w-3.5 h-3.5 ${
                                cand.voteCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                              }`}
                            />
                            <span>{cand.voteCount}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {cand.percentage}%
                          </span>
                        </div>

                        {/* Game Status Tier Badge */}
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm shadow-2xs border ${
                            cand.rank === 1
                              ? 'bg-amber-100 border-amber-300 text-amber-700'
                              : cand.rank <= 3
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : cand.rank <= 6
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                          title={`Tier for Rank #${cand.rank}`}
                        >
                          {cand.rank === 1 ? '👑' : cand.rank <= 3 ? '🏅' : cand.rank <= 6 ? '⭐' : '☁️'}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredRankings.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No nominees found matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDIT LEDGER & REVOTE MANAGER (ADMIN ONLY) */}
      {adminViewMode === 'voter-ledger' && isAdmin && (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
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
                All Personnel ({ALL_PARTICIPANTS.length})
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

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
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
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(voteRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

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
